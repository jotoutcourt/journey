-- Étape 1 du Butin « jeu principal » : partie solo contre le Kraken + porte-monnaie de lingots (sur le serveur).
-- Une partie solo est une partie du Butin sans coéquipier (b vide) : mêmes règles, même arbitrage.

alter table public.duo_games alter column b drop not null;
alter table public.duo_games add column if not exists solo boolean not null default false;

-- Porte-monnaie : solde + journal de chaque gain ou dépense
create table if not exists public.wallets (
  player_id uuid primary key references public.players (id) on delete cascade,
  lingots int not null default 0 check (lingots >= 0),
  earned int not null default 0,
  updated_at timestamptz not null default now()
);
create table if not exists public.wallet_log (
  id bigserial primary key,
  player_id uuid not null references public.players (id) on delete cascade,
  delta int not null,
  reason text not null check (reason in ('butin', 'bonus_jour', 'parfait', 'achat', 'cadeau')),
  game_id uuid references public.duo_games (id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists wallet_log_player on public.wallet_log (player_id, created_at);
alter table public.wallets enable row level security;
alter table public.wallet_log enable row level security;
revoke all on public.wallets, public.wallet_log from anon, authenticated;

create or replace function public.paris_day(t timestamptz) returns date language sql immutable as $$
  select (t at time zone 'Europe/Paris')::date
$$;

create or replace function public.wallet_credit(p_player uuid, p_delta int, p_reason text, p_game uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_delta = 0 then return; end if;
  insert into wallets (player_id, lingots, earned) values (p_player, greatest(0, p_delta), greatest(0, p_delta))
  on conflict (player_id) do update set lingots = greatest(0, wallets.lingots + p_delta),
    earned = wallets.earned + greatest(0, p_delta), updated_at = now();
  insert into wallet_log (player_id, delta, reason, game_id) values (p_player, p_delta, p_reason, p_game);
end $$;

-- Fin de partie : chaque joueur gagne les lingots sauvés, + 5 pour la première partie du jour, + 10 si tout est sauvé
create or replace function public.butin_reward(p_game uuid, p_player uuid, p_bank int) returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_player is null or exists (select 1 from wallet_log where game_id = p_game and player_id = p_player) then return; end if;
  -- garde-fou : au plus 40 parties payées par jour et par joueur
  if (select count(distinct game_id) from wallet_log where player_id = p_player and reason = 'butin' and paris_day(created_at) = paris_day(now())) >= 40 then return; end if;
  if not exists (select 1 from wallet_log where player_id = p_player and reason = 'bonus_jour' and paris_day(created_at) = paris_day(now())) then
    perform wallet_credit(p_player, 5, 'bonus_jour', p_game);
  end if;
  perform wallet_credit(p_player, p_bank, 'butin', p_game);
  if p_bank >= duo_const('start') then perform wallet_credit(p_player, 10, 'parfait', p_game); end if;
  -- trace de la partie même à 0 lingot (évite un double paiement)
  if p_bank = 0 then insert into wallet_log (player_id, delta, reason, game_id) values (p_player, 0, 'butin', p_game); end if;
end $$;

create or replace function public.duo_advance(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare g duo_games; kept int; correct int; n int; lo uuid; hi uuid;
begin
  select * into g from duo_games where id = p_id for update;
  if not found or g.status <> 'playing' then return; end if;
  n := jsonb_array_length(g.questions);
  if g.phase = 'place' and (now() >= g.deadline or (g.ready_a and (g.b is null or g.ready_b))) then
    correct := (g.questions -> g.round ->> 'correct')::int;
    kept := coalesce((g.placement ->> correct)::int, 0);
    update duo_games set
      history = history || jsonb_build_array(jsonb_build_object('placement', placement, 'correct', correct, 'before', bank, 'kept', kept)),
      bank = kept, phase = 'reveal', deadline = now() + make_interval(secs => duo_const('reveal')), version = version + 1
    where id = p_id;
  elsif g.phase = 'reveal' and now() >= g.deadline then
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
    'question', case when st in ('playing', 'done') then json_build_object('q', q ->> 'q', 'options', q -> 'options', 'topic', q -> 'topic',
      'correct', case when g.phase = 'reveal' or g.status = 'done' then (q ->> 'correct')::int end) end,
    'history', g.history,
    'reward', case when g.status = 'done' then (select coalesce(json_agg(json_build_object('reason', reason, 'delta', delta)) filter (where delta <> 0), '[]'::json)
      from wallet_log where game_id = g.id and player_id = pid) end,
    'wallet', case when g.status = 'done' then (select lingots from wallets where player_id = pid) end);
end $$;

-- Lancer une partie solo
create or replace function public.start_solo_butin(p_questions jsonb) returns uuid
language plpgsql security definer set search_path = public as $$
declare pid uuid := current_player(); gid uuid;
begin
  if pid is null then raise exception 'aucun joueur'; end if;
  if not valid_duo_questions(p_questions) then raise exception 'questions invalides'; end if;
  if (select count(*) from duo_games where a = pid and solo and created_at > now() - interval '1 day') >= 60 then raise exception 'trop de parties aujourd''hui'; end if;
  update duo_games set status = 'left', left_by = pid where a = pid and solo and status = 'playing';
  insert into duo_games (a, b, solo, questions, bank, placement, status, deadline)
  values (pid, null, true, p_questions, duo_const('start'), duo_zeros(p_questions, 0), 'playing', now() + make_interval(secs => duo_const('place')))
  returning id into gid;
  return gid;
end $$;

-- Solde et bonus du jour encore disponible
create or replace function public.get_wallet() returns json
language plpgsql stable security definer set search_path = public as $$
declare pid uuid := current_player();
begin
  if pid is null then return null; end if;
  return json_build_object(
    'lingots', coalesce((select lingots from wallets where player_id = pid), 0),
    'earned', coalesce((select earned from wallets where player_id = pid), 0),
    'daily_bonus', not exists (select 1 from wallet_log where player_id = pid and reason = 'bonus_jour' and paris_day(created_at) = paris_day(now())));
end $$;

revoke all on function public.paris_day(timestamptz), public.wallet_credit(uuid, int, text, uuid), public.butin_reward(uuid, uuid, int) from public, anon, authenticated;
revoke all on function public.start_solo_butin(jsonb), public.get_wallet() from public, anon;
grant execute on function public.start_solo_butin(jsonb), public.get_wallet() to authenticated;
