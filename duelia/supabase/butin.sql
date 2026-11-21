-- « Le Butin » : mode coopératif à deux, chacun sur son téléphone.
-- Le duo partage un trésor (des lingots). À chaque question, il répartit ses lingots sur les réponses
-- (au moins une réponse doit rester vide) ; ceux posés sur les mauvaises réponses sont engloutis.
-- La partie vit sur le serveur : les deux téléphones l'interrogent toutes les fractions de seconde,
-- et chaque appel fait avancer la partie si un délai est écoulé (pas de tâche planifiée nécessaire).

create table if not exists public.duo_games (
  id uuid primary key default gen_random_uuid(),
  a uuid not null references public.players (id) on delete cascade, -- celui qui invite
  b uuid not null references public.players (id) on delete cascade,
  status text not null default 'invited' check (status in ('invited', 'playing', 'done', 'declined', 'cancelled', 'left')),
  questions jsonb not null,
  round int not null default 0,
  phase text not null default 'place' check (phase in ('place', 'reveal')),
  deadline timestamptz,
  bank int not null default 20,
  placement jsonb not null default '[]'::jsonb,
  ready_a boolean not null default false,
  ready_b boolean not null default false,
  last_by uuid,
  left_by uuid,
  version int not null default 0,
  history jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  check (a <> b)
);
create index if not exists duo_games_b on public.duo_games (b, status, created_at);
create index if not exists duo_games_a on public.duo_games (a, status, created_at);
alter table public.duo_games enable row level security;
revoke all on public.duo_games from anon, authenticated;

-- Meilleur butin de chaque duo (paire rangée : p1 < p2)
create table if not exists public.duo_scores (
  p1 uuid not null references public.players (id) on delete cascade,
  p2 uuid not null references public.players (id) on delete cascade,
  best int not null default 0,
  games int not null default 0,
  updated_at timestamptz not null default now(),
  primary key (p1, p2),
  check (p1 < p2)
);
alter table public.duo_scores enable row level security;
revoke all on public.duo_scores from anon, authenticated;

-- Réglages
create or replace function public.duo_const(k text) returns int language sql immutable as $$
  select case k when 'start' then 20 when 'place' then 45 when 'first' then 52 when 'reveal' then 5 end
$$;

-- Questions valides : 6 à 10 manches, 2 à 4 réponses distinctes, une bonne réponse
create or replace function public.valid_duo_questions(q jsonb) returns boolean
language plpgsql immutable as $$
declare x jsonb; n int;
begin
  if jsonb_typeof(q) <> 'array' or jsonb_array_length(q) not between 6 and 10 then return false; end if;
  for x in select * from jsonb_array_elements(q) loop
    if jsonb_typeof(x -> 'options') <> 'array' then return false; end if;
    n := jsonb_array_length(x -> 'options');
    if n not between 2 and 4 then return false; end if;
    if char_length(coalesce(x ->> 'q', '')) not between 3 and 200 then return false; end if;
    if (select count(distinct v) from jsonb_array_elements_text(x -> 'options') v where char_length(v) between 1 and 80) <> n then return false; end if;
    if jsonb_typeof(x -> 'correct') <> 'number' or (x ->> 'correct')::int not between 0 and n - 1 then return false; end if;
    if x ? 'topic' and (jsonb_typeof(x -> 'topic') <> 'object' or char_length(coalesce(x -> 'topic' ->> 'name', '')) > 40) then return false; end if;
  end loop;
  return true;
end $$;

-- Répartition à zéro pour une manche
create or replace function public.duo_zeros(q jsonb, r int) returns jsonb language sql immutable as $$
  select coalesce(jsonb_agg(0), '[]'::jsonb) from generate_series(1, jsonb_array_length(q -> r -> 'options'))
$$;

-- Fait avancer la partie si un délai est écoulé (ou si les deux joueurs ont validé)
create or replace function public.duo_advance(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare g duo_games; kept int; correct int; n int; lo uuid; hi uuid;
begin
  select * into g from duo_games where id = p_id for update;
  if not found or g.status <> 'playing' then return; end if;
  n := jsonb_array_length(g.questions);
  if g.phase = 'place' and (now() >= g.deadline or (g.ready_a and g.ready_b)) then
    correct := (g.questions -> g.round ->> 'correct')::int;
    kept := coalesce((g.placement ->> correct)::int, 0);
    update duo_games set
      history = history || jsonb_build_array(jsonb_build_object('placement', placement, 'correct', correct, 'before', bank, 'kept', kept)),
      bank = kept, phase = 'reveal', deadline = now() + make_interval(secs => duo_const('reveal')), version = version + 1
    where id = p_id;
  elsif g.phase = 'reveal' and now() >= g.deadline then
    if g.bank <= 0 or g.round + 1 >= n then
      update duo_games set status = 'done', version = version + 1 where id = p_id;
      lo := least(g.a, g.b); hi := greatest(g.a, g.b);
      insert into duo_scores (p1, p2, best, games) values (lo, hi, g.bank, 1)
      on conflict (p1, p2) do update set best = greatest(duo_scores.best, excluded.best), games = duo_scores.games + 1, updated_at = now();
    else
      update duo_games set round = round + 1, phase = 'place', placement = duo_zeros(questions, round + 1),
        ready_a = false, ready_b = false, last_by = null,
        deadline = now() + make_interval(secs => duo_const('place')), version = version + 1
      where id = p_id;
    end if;
  end if;
end $$;

-- Ce que voit un joueur (la bonne réponse n'est donnée qu'au moment de la révélation)
create or replace function public.duo_view(p_id uuid, pid uuid) returns json
language plpgsql stable security definer set search_path = public as $$
declare g duo_games; me_a boolean; q jsonb; st text;
begin
  select * into g from duo_games where id = p_id and pid in (a, b);
  if not found then return null; end if;
  me_a := g.a = pid;
  st := case when g.status = 'invited' and g.created_at < now() - interval '60 seconds' then 'expired' else g.status end;
  q := g.questions -> g.round;
  return json_build_object(
    'id', g.id, 'status', st, 'host', me_a, 'created_at', g.created_at, 'round', g.round, 'rounds', jsonb_array_length(g.questions),
    'phase', g.phase, 'left_ms', greatest(0, floor(extract(epoch from (g.deadline - now())) * 1000))::int,
    'bank', g.bank, 'start', duo_const('start'), 'placement', g.placement, 'version', g.version,
    'ready_me', case when me_a then g.ready_a else g.ready_b end,
    'ready_partner', case when me_a then g.ready_b else g.ready_a end,
    'last_by_me', g.last_by = pid, 'left_by_me', g.left_by = pid,
    'partner', player_card(case when me_a then g.b else g.a end),
    'question', case when st in ('playing', 'done') then json_build_object('q', q ->> 'q', 'options', q -> 'options', 'topic', q -> 'topic',
      'correct', case when g.phase = 'reveal' or g.status = 'done' then (q ->> 'correct')::int end) end,
    'history', g.history);
end $$;

-- Inviter un ami (les questions sont préparées par l'appli de celui qui invite)
create or replace function public.invite_duo(p_to uuid, p_questions jsonb) returns uuid
language plpgsql security definer set search_path = public as $$
declare pid uuid := current_player(); gid uuid; me_name text;
begin
  if pid is null or not are_friends(pid, p_to) then raise exception 'pas amis'; end if;
  if not valid_duo_questions(p_questions) then raise exception 'questions invalides'; end if;
  delete from duo_games where created_at < now() - interval '3 days';
  update duo_games set status = 'cancelled' where a = pid and status = 'invited';
  insert into duo_games (a, b, questions, bank, placement) values (pid, p_to, p_questions, duo_const('start'), duo_zeros(p_questions, 0))
  returning id into gid;
  select name into me_name from players where id = pid;
  perform notify_player(p_to, 'Le Butin 💰', me_name || ' t''invite à chasser le trésor à deux', '/');
  return gid;
end $$;

create or replace function public.respond_duo(p_id uuid, p_accept boolean) returns json
language plpgsql security definer set search_path = public as $$
declare pid uuid := current_player(); g duo_games;
begin
  select * into g from duo_games where id = p_id and b = pid for update;
  if not found or g.status <> 'invited' or g.created_at < now() - interval '60 seconds' then return null; end if;
  if not p_accept then
    update duo_games set status = 'declined' where id = p_id;
    return null;
  end if;
  update duo_games set status = 'playing', round = 0, phase = 'place',
    deadline = now() + make_interval(secs => duo_const('first')), version = version + 1 where id = p_id;
  return duo_view(p_id, pid);
end $$;

create or replace function public.get_duo(p_id uuid) returns json
language plpgsql security definer set search_path = public as $$
declare pid uuid := current_player();
begin
  if pid is null then return null; end if;
  if exists (select 1 from duo_games where id = p_id and pid in (a, b) and status = 'playing') then perform duo_advance(p_id); end if;
  return duo_view(p_id, pid);
end $$;

-- Déplacer les lingots : la répartition entière est envoyée ; changer annule les « prêt »
create or replace function public.duo_place(p_id uuid, p_round int, p_placement jsonb) returns json
language plpgsql security definer set search_path = public as $$
declare pid uuid := current_player(); g duo_games; n int; total int; used int;
begin
  perform duo_advance(p_id);
  select * into g from duo_games where id = p_id and pid in (a, b) for update;
  if not found then return null; end if;
  if g.status = 'playing' and g.phase = 'place' and g.round = p_round and jsonb_typeof(p_placement) = 'array' then
    n := jsonb_array_length(g.questions -> g.round -> 'options');
    if jsonb_array_length(p_placement) = n
      and not exists (select 1 from jsonb_array_elements(p_placement) v where jsonb_typeof(v) <> 'number' or (v #>> '{}')::numeric <> floor((v #>> '{}')::numeric) or (v #>> '{}')::int < 0) then
      select coalesce(sum((v #>> '{}')::int), 0), count(*) filter (where (v #>> '{}')::int > 0) into total, used from jsonb_array_elements(p_placement) v;
      if total <= g.bank and used < n then
        update duo_games set placement = p_placement, ready_a = false, ready_b = false, last_by = pid, version = version + 1 where id = p_id;
      end if;
    end if;
  end if;
  return duo_view(p_id, pid);
end $$;

-- « Prêt » : quand les deux le sont, la réponse est révélée sans attendre la fin du chrono
create or replace function public.duo_ready(p_id uuid, p_round int, p_ready boolean) returns json
language plpgsql security definer set search_path = public as $$
declare pid uuid := current_player();
begin
  update duo_games set ready_a = case when a = pid then p_ready else ready_a end,
    ready_b = case when b = pid then p_ready else ready_b end, version = version + 1
  where id = p_id and pid in (a, b) and status = 'playing' and phase = 'place' and round = p_round;
  perform duo_advance(p_id);
  return duo_view(p_id, pid);
end $$;

-- Annuler une invitation, ou quitter une partie en cours
create or replace function public.leave_duo(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare pid uuid := current_player();
begin
  update duo_games set status = case when status = 'invited' then 'cancelled' else 'left' end, left_by = pid, version = version + 1
  where id = p_id and pid in (a, b) and status in ('invited', 'playing');
end $$;

-- Invitations reçues (pour la bannière), valables 60 s
create or replace function public.duo_invites_for(pid uuid) returns json
language sql stable security definer set search_path = public as $$
  select coalesce(json_agg(json_build_object('id', g.id, 'from', player_card(g.a), 'created_at', g.created_at) order by g.created_at desc), '[]'::json)
  from duo_games g where g.b = pid and g.status = 'invited' and g.created_at > now() - interval '60 seconds'
$$;

-- Classement des duos : les 20 meilleurs butins, et ceux du joueur
create or replace function public.get_duo_board() returns json
language plpgsql stable security definer set search_path = public as $$
declare pid uuid := current_player();
begin
  return json_build_object(
    'top', coalesce((select json_agg(x) from (select json_build_object('a', player_card(p1), 'b', player_card(p2), 'best', best, 'games', games, 'mine', pid in (p1, p2)) x
      from duo_scores where best > 0 order by best desc, updated_at limit 20) t), '[]'::json),
    'mine', coalesce((select json_agg(x) from (select json_build_object('partner', player_card(case when p1 = pid then p2 else p1 end), 'best', best, 'games', games) x
      from duo_scores where pid in (p1, p2) order by best desc limit 10) t), '[]'::json));
end $$;

-- Présence : on ajoute les invitations au Butin à la réponse existante
create or replace function public.heartbeat() returns json
language plpgsql security definer set search_path = public as $$
declare pid uuid := current_player();
begin
  if pid is null then return null; end if;
  update players set last_seen = now() where id = pid;
  return json_build_object(
    'invites', coalesce((select json_agg(json_build_object('id', i.id, 'from', player_card(i.from_player), 'topic_id', i.topic_id,
        'topic', i.topic, 'created_at', i.created_at) order by i.created_at desc)
      from live_invites i where i.to_player = pid and i.status = 'pending' and i.created_at > now() - interval '60 seconds'), '[]'::json),
    'duo_invites', duo_invites_for(pid),
    'friend_requests', (select count(*) from friend_links where b = pid and status = 'pending'),
    'pending_challenges', (select count(*) from friend_challenges where to_player = pid and status = 'pending' and created_at > now() - interval '7 days'));
end $$;

revoke all on function public.duo_const(text), public.valid_duo_questions(jsonb), public.duo_zeros(jsonb, int), public.duo_advance(uuid),
  public.duo_view(uuid, uuid), public.duo_invites_for(uuid) from public, anon, authenticated;
revoke all on function public.invite_duo(uuid, jsonb), public.respond_duo(uuid, boolean), public.get_duo(uuid),
  public.duo_place(uuid, int, jsonb), public.duo_ready(uuid, int, boolean), public.leave_duo(uuid), public.get_duo_board() from public, anon;
grant execute on function public.invite_duo(uuid, jsonb), public.respond_duo(uuid, boolean), public.get_duo(uuid),
  public.duo_place(uuid, int, jsonb), public.duo_ready(uuid, int, boolean), public.leave_duo(uuid), public.get_duo_board() to authenticated;
