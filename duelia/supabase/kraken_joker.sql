-- L'Appât du Kraken : « quitte ou double » récompensé et joker.
-- 1) Quitte ou double : tout le butin posé sur une seule caisse (alors qu'au moins 3 caisses étaient ouvertes)
--    et c'est la bonne → le Kraken, beau joueur, ajoute 10 lingots.
-- 2) Joker (une fois par partie, partagé en duo) : le serveur retire une mauvaise réponse de la question en cours.

alter table public.duo_games add column if not exists joker_round int;
alter table public.duo_games add column if not exists joker_option int;

create or replace function public.duo_const(k text) returns int language sql immutable as $$
  select case k when 'start' then 20 when 'place' then 45 when 'first' then 52 when 'reveal' then 15 when 'allin' then 10 end
$$;

-- Nombre de caisses encore ouvertes à la manche courante (le joker en ferme une)
create or replace function public.duo_open(g duo_games) returns int language sql stable as $$
  select jsonb_array_length(g.questions -> g.round -> 'options') - case when g.joker_round = g.round then 1 else 0 end
$$;

create or replace function public.duo_advance(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare g duo_games; kept int; correct int; n int; lo uuid; hi uuid; used int; allin boolean; bonus int := 0;
begin
  select * into g from duo_games where id = p_id for update;
  if not found or g.status <> 'playing' then return; end if;
  n := jsonb_array_length(g.questions);
  if g.phase = 'place' and (now() >= g.deadline or (g.ready_a and (g.b is null or g.ready_b))) then
    correct := (g.questions -> g.round ->> 'correct')::int;
    kept := coalesce((g.placement ->> correct)::int, 0);
    select count(*) filter (where (v #>> '{}')::int > 0) into used from jsonb_array_elements(g.placement) v;
    allin := g.bank > 0 and used = 1 and duo_open(g) >= 3
      and (select coalesce(sum((v #>> '{}')::int), 0) from jsonb_array_elements(g.placement) v) = g.bank;
    if allin and kept = g.bank then bonus := duo_const('allin'); end if;
    update duo_games set
      history = history || jsonb_build_array(jsonb_build_object('placement', placement, 'correct', correct, 'before', bank,
        'kept', kept + bonus, 'allin', allin, 'bonus', bonus,
        'joker', case when joker_round = round then joker_option end)),
      bank = kept + bonus, phase = 'reveal', ready_a = false, ready_b = false,
      deadline = now() + make_interval(secs => duo_const('reveal')), version = version + 1
    where id = p_id;
  elsif g.phase = 'reveal' and (now() >= g.deadline or (g.ready_a and (g.b is null or g.ready_b))) then
    if g.bank <= 0 or g.round + 1 >= n then
      update duo_games set status = 'done', version = version + 1 where id = p_id;
      if g.b is not null then
        lo := least(g.a, g.b); hi := greatest(g.a, g.b);
        insert into duo_scores (p1, p2, best, games) values (lo, hi, g.bank, 1)
        on conflict (p1, p2) do update set best = greatest(duo_scores.best, excluded.best), games = duo_scores.games + 1, updated_at = now();
      end if;
      perform butin_reward(p_id, g.a, g.bank);
      perform butin_reward(p_id, g.b, g.bank);
    else
      update duo_games set round = round + 1, phase = 'place', placement = duo_zeros(questions, round + 1),
        ready_a = false, ready_b = false, last_by = null,
        deadline = now() + make_interval(secs => duo_const('place')), version = version + 1
      where id = p_id;
    end if;
  end if;
end $$;

-- Placement : rien sur la caisse retirée par le joker, et au moins une caisse ouverte laissée vide
create or replace function public.duo_place(p_id uuid, p_round integer, p_placement jsonb) returns json
language plpgsql security definer set search_path = public as $$
declare pid uuid := current_player(); g duo_games; n int; total int; used int;
begin
  perform duo_advance(p_id);
  select * into g from duo_games where id = p_id and pid in (a, b) for update;
  if not found then return null; end if;
  if g.status = 'playing' and g.phase = 'place' and g.round = p_round and jsonb_typeof(p_placement) = 'array' then
    n := jsonb_array_length(g.questions -> g.round -> 'options');
    if jsonb_array_length(p_placement) = n
      and not exists (select 1 from jsonb_array_elements(p_placement) v where jsonb_typeof(v) <> 'number' or (v #>> '{}')::numeric <> floor((v #>> '{}')::numeric) or (v #>> '{}')::int < 0)
      and not (g.joker_round = g.round and coalesce((p_placement ->> g.joker_option)::int, 0) > 0) then
      select coalesce(sum((v #>> '{}')::int), 0), count(*) filter (where (v #>> '{}')::int > 0) into total, used from jsonb_array_elements(p_placement) v;
      if total <= g.bank and used < duo_open(g) then
        update duo_games set placement = p_placement, ready_a = false, ready_b = false, last_by = pid, version = version + 1 where id = p_id;
      end if;
    end if;
  end if;
  return duo_view(p_id, pid);
end $$;

-- Joker : une mauvaise réponse tirée au hasard disparaît (ses lingots reviennent au butin libre)
create or replace function public.duo_joker(p_id uuid, p_round int) returns json
language plpgsql security definer set search_path = public as $$
declare pid uuid := current_player(); g duo_games; n int; correct int; pick int; pl jsonb; used int;
begin
  perform duo_advance(p_id);
  select * into g from duo_games where id = p_id and pid in (a, b) for update;
  if not found then return null; end if;
  n := jsonb_array_length(g.questions -> g.round -> 'options');
  if g.status = 'playing' and g.phase = 'place' and g.round = p_round and g.joker_round is null and n >= 3 then
    correct := (g.questions -> g.round ->> 'correct')::int;
    select i into pick from generate_series(0, n - 1) i where i <> correct order by random() limit 1;
    pl := jsonb_set(g.placement, array[pick::text], '0'::jsonb);
    -- s'il ne reste plus de caisse ouverte vide, on vide la plus petite pour respecter la règle
    select count(*) filter (where (v #>> '{}')::int > 0) into used from jsonb_array_elements(pl) v;
    if used >= n - 1 then
      select jsonb_set(pl, array[(k - 1)::text], '0'::jsonb) into pl
      from jsonb_array_elements(pl) with ordinality e(v, k)
      where (v #>> '{}')::int > 0 order by (v #>> '{}')::int, k limit 1;
    end if;
    update duo_games set joker_round = g.round, joker_option = pick, placement = pl, ready_a = false, ready_b = false,
      last_by = pid, version = version + 1 where id = p_id;
  end if;
  return duo_view(p_id, pid);
end $$;
revoke all on function public.duo_joker(uuid, int) from public, anon;
grant execute on function public.duo_joker(uuid, int) to authenticated;
revoke all on function public.duo_open(duo_games) from public, anon, authenticated;

-- Vue : état du joker
create or replace function public.duo_view(p_id uuid, pid uuid) returns json
language plpgsql stable security definer set search_path = public as $$
declare g duo_games; me_a boolean; q jsonb; st text; room uuid; room_a uuid;
begin
  select * into g from duo_games where id = p_id and pid in (a, b);
  if not found then return null; end if;
  me_a := g.a = pid;
  room := coalesce(g.voice_id, g.id);
  select a into room_a from duo_games where id = room;
  st := case when g.status = 'invited' and g.created_at < now() - interval '60 seconds' then 'expired' else g.status end;
  q := g.questions -> g.round;
  return json_build_object(
    'id', g.id, 'status', st, 'host', me_a, 'solo', g.solo, 'created_at', g.created_at, 'round', g.round, 'rounds', jsonb_array_length(g.questions),
    'voice_id', room, 'voice_host', room_a = pid,
    'phase', g.phase, 'left_ms', greatest(0, floor(extract(epoch from (g.deadline - now())) * 1000))::int,
    'bank', g.bank, 'start', duo_const('start'), 'placement', g.placement, 'version', g.version,
    'ready_me', case when me_a then g.ready_a else g.ready_b end,
    'ready_partner', case when me_a then g.ready_b else g.ready_a end,
    'last_by_me', g.last_by = pid, 'left_by_me', g.left_by = pid,
    'partner', case when g.b is not null then player_card(case when me_a then g.b else g.a end) end,
    'joker', json_build_object('used', g.joker_round is not null, 'round', g.joker_round, 'option', g.joker_option),
    'question', case when st in ('playing', 'done') then json_build_object('q', q ->> 'q', 'options', q -> 'options', 'topic', q -> 'topic',
      'correct', case when g.phase = 'reveal' or g.status = 'done' then (q ->> 'correct')::int end,
      'expl', case when g.phase = 'reveal' or g.status = 'done' then q ->> 'expl' end) end,
    'history', g.history,
    'reward', case when g.status = 'done' then (select coalesce(json_agg(json_build_object('reason', reason, 'delta', delta)) filter (where delta <> 0), '[]'::json)
      from wallet_log where game_id = g.id and player_id = pid) end,
    'wallet', case when g.status = 'done' then (select lingots from wallets where player_id = pid) end);
end $$;
