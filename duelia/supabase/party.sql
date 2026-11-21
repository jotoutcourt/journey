-- Duel quiz à plusieurs (2 à 4 joueurs), en direct, chacun pour soi.
-- Le serveur fixe le calendrier de la partie (compte à rebours, puis 10 s de réponse + 4 s de révélation par question)
-- et calcule lui-même le temps de réponse et les points : personne ne peut tricher sur sa vitesse.

create table if not exists public.parties (
  id uuid primary key default gen_random_uuid(),
  host uuid not null references public.players (id) on delete cascade,
  topic_id text not null check (char_length(topic_id) between 1 and 60),
  topic jsonb not null,
  questions jsonb not null,
  status text not null default 'lobby' check (status in ('lobby', 'playing', 'done', 'cancelled')),
  started_at timestamptz,
  created_at timestamptz not null default now()
);
create table if not exists public.party_players (
  party_id uuid not null references public.parties (id) on delete cascade,
  player_id uuid not null references public.players (id) on delete cascade,
  status text not null default 'invited' check (status in ('invited', 'joined', 'declined', 'left')),
  updated_at timestamptz not null default now(),
  primary key (party_id, player_id)
);
create index if not exists party_players_player on public.party_players (player_id, status);
create table if not exists public.party_answers (
  party_id uuid not null references public.parties (id) on delete cascade,
  player_id uuid not null references public.players (id) on delete cascade,
  round int not null check (round between 0 and 9),
  choice int not null check (choice between -1 and 3),
  t int not null,
  pts int not null,
  primary key (party_id, player_id, round)
);
alter table public.parties enable row level security;
alter table public.party_players enable row level security;
alter table public.party_answers enable row level security;
revoke all on public.parties, public.party_players, public.party_answers from anon, authenticated;

-- Calendrier (en secondes)
create or replace function public.party_const(k text) returns int language sql immutable as $$
  select case k when 'countdown' then 5 when 'answer' then 10 when 'reveal' then 4 when 'max' then 4 end
$$;

-- Où en est la partie : manche courante, phase ('countdown' | 'answer' | 'reveal' | 'done'), ms écoulées dans la phase
create or replace function public.party_clock(p parties) returns json language plpgsql stable as $$
declare n int := jsonb_array_length(p.questions); el numeric; per int := party_const('answer') + party_const('reveal'); r int; inr numeric;
begin
  if p.status <> 'playing' then return json_build_object('round', 0, 'phase', p.status); end if;
  el := extract(epoch from (now() - p.started_at)) - party_const('countdown');
  if el < 0 then return json_build_object('round', 0, 'phase', 'countdown', 'left_ms', floor(-el * 1000)::int); end if;
  r := floor(el / per)::int;
  if r >= n then return json_build_object('round', n - 1, 'phase', 'done'); end if;
  inr := el - r * per;
  if inr < party_const('answer') then return json_build_object('round', r, 'phase', 'answer', 'left_ms', floor((party_const('answer') - inr) * 1000)::int, 't_ms', floor(inr * 1000)::int); end if;
  return json_build_object('round', r, 'phase', 'reveal', 'left_ms', floor((per - inr) * 1000)::int);
end $$;

create or replace function public.party_view(p_id uuid, pid uuid) returns json
language plpgsql security definer set search_path = public as $$
declare p parties; clk json; cur int; ph text; n int;
begin
  select * into p from parties where id = p_id;
  if not found or not exists (select 1 from party_players where party_id = p_id and player_id = pid) then return null; end if;
  clk := party_clock(p);
  ph := clk ->> 'phase'; cur := (clk ->> 'round')::int; n := jsonb_array_length(p.questions);
  if ph = 'done' and p.status = 'playing' then update parties set status = 'done' where id = p_id; p.status := 'done'; end if;
  return json_build_object(
    'id', p.id, 'status', p.status, 'host', p.host = pid, 'topic_id', p.topic_id, 'topic', p.topic, 'clock', clk, 'rounds', n,
    'players', (select coalesce(json_agg(json_build_object('card', player_card(pp.player_id), 'status', pp.status, 'me', pp.player_id = pid,
        'is_host', pp.player_id = p.host,
        'score', (select coalesce(sum(a.pts), 0) from party_answers a where a.party_id = p_id and a.player_id = pp.player_id
                  and (a.round < cur or ph in ('reveal', 'done'))),
        'answered', exists (select 1 from party_answers a where a.party_id = p_id and a.player_id = pp.player_id and a.round = cur))
      order by pp.player_id = p.host desc, pp.updated_at), '[]'::json)
      from party_players pp where pp.party_id = p_id and pp.status in ('invited', 'joined', 'left')),
    -- questions : la bonne réponse n'est donnée qu'une fois la manche révélée
    'question', case when p.status in ('playing', 'done') and ph <> 'countdown' then json_build_object(
        'q', p.questions -> cur ->> 'q', 'options', p.questions -> cur -> 'options',
        'correct', case when ph in ('reveal', 'done') then (p.questions -> cur ->> 'correct')::int end) end,
    'answers', case when ph in ('reveal', 'done') then (select coalesce(json_agg(json_build_object('player_id', a.player_id, 'choice', a.choice, 'pts', a.pts, 't', a.t)), '[]'::json)
        from party_answers a where a.party_id = p_id and a.round = cur) end,
    'mine', (select json_build_object('choice', a.choice, 'pts', case when ph in ('reveal', 'done') then a.pts end) from party_answers a
        where a.party_id = p_id and a.player_id = pid and a.round = cur));
end $$;

-- Créer le salon (l'hôte y est déjà)
create or replace function public.create_party(p_topic_id text, p_topic jsonb, p_questions jsonb) returns uuid
language plpgsql security definer set search_path = public as $$
declare pid uuid := current_player(); gid uuid;
begin
  if pid is null then raise exception 'aucun joueur'; end if;
  if not valid_questions(p_questions) or not valid_topic_meta(p_topic) then raise exception 'partie invalide'; end if;
  delete from parties where created_at < now() - interval '2 days';
  update parties set status = 'cancelled' where host = pid and status = 'lobby';
  insert into parties (host, topic_id, topic, questions) values (pid, p_topic_id, p_topic, p_questions) returning id into gid;
  insert into party_players (party_id, player_id, status) values (gid, pid, 'joined');
  return gid;
end $$;

create or replace function public.invite_to_party(p_party uuid, p_friend uuid) returns void
language plpgsql security definer set search_path = public as $$
declare pid uuid := current_player(); p parties; me_name text;
begin
  select * into p from parties where id = p_party and host = pid and status = 'lobby';
  if not found then raise exception 'salon introuvable'; end if;
  if not are_friends(pid, p_friend) then raise exception 'pas amis'; end if;
  if (select count(*) from party_players where party_id = p_party and status in ('invited', 'joined')) >= party_const('max') then raise exception 'salon complet'; end if;
  insert into party_players (party_id, player_id, status) values (p_party, p_friend, 'invited')
  on conflict (party_id, player_id) do update set status = 'invited', updated_at = now();
  select name into me_name from players where id = pid;
  perform notify_player(p_friend, 'Partie à plusieurs ⚡', me_name || ' t''invite à un quiz en direct sur « ' || (p.topic ->> 'name') || ' »', '/');
end $$;

create or replace function public.respond_party(p_party uuid, p_accept boolean) returns json
language plpgsql security definer set search_path = public as $$
declare pid uuid := current_player();
begin
  update party_players set status = case when p_accept then 'joined' else 'declined' end, updated_at = now()
  where party_id = p_party and player_id = pid and status = 'invited'
    and exists (select 1 from parties where id = p_party and status = 'lobby' and created_at > now() - interval '15 minutes');
  if not found or not p_accept then return null; end if;
  return party_view(p_party, pid);
end $$;

create or replace function public.start_party(p_party uuid) returns json
language plpgsql security definer set search_path = public as $$
declare pid uuid := current_player();
begin
  if (select count(*) from party_players where party_id = p_party and status = 'joined') < 2 then raise exception 'il faut au moins 2 joueurs'; end if;
  update parties set status = 'playing', started_at = now() where id = p_party and host = pid and status = 'lobby';
  if not found then raise exception 'salon introuvable'; end if;
  delete from party_players where party_id = p_party and status in ('invited', 'declined');
  return party_view(p_party, pid);
end $$;

create or replace function public.get_party(p_id uuid) returns json
language plpgsql security definer set search_path = public as $$
begin
  return party_view(p_id, current_player());
end $$;

-- Réponse : le serveur mesure lui-même le temps écoulé depuis le début de la manche
create or replace function public.party_answer(p_party uuid, p_round int, p_choice int) returns json
language plpgsql security definer set search_path = public as $$
declare pid uuid := current_player(); p parties; clk json; t int; ok boolean; mult int; pts int;
begin
  select * into p from parties where id = p_party and status = 'playing';
  if not found or not exists (select 1 from party_players where party_id = p_party and player_id = pid and status = 'joined') then return null; end if;
  clk := party_clock(p);
  if clk ->> 'phase' <> 'answer' or (clk ->> 'round')::int <> p_round or p_choice not between 0 and 3 then return party_view(p_party, pid); end if;
  t := greatest(300, (clk ->> 't_ms')::int);
  ok := p_choice = (p.questions -> p_round ->> 'correct')::int;
  mult := case when p_round = jsonb_array_length(p.questions) - 1 then 2 else 1 end;
  pts := case when ok then greatest(2, ceil((party_const('answer') * 1000 - t) / 1000.0)::int * 2) * mult else 0 end;
  insert into party_answers (party_id, player_id, round, choice, t, pts) values (p_party, pid, p_round, p_choice, t, pts)
  on conflict do nothing;
  return party_view(p_party, pid);
end $$;

create or replace function public.leave_party(p_party uuid) returns void
language plpgsql security definer set search_path = public as $$
declare pid uuid := current_player();
begin
  update party_players set status = 'left', updated_at = now() where party_id = p_party and player_id = pid;
  update parties set status = 'cancelled' where id = p_party and host = pid and status = 'lobby';
end $$;

-- Invitations reçues (pour la bannière)
create or replace function public.party_invites_for(pid uuid) returns json
language sql stable security definer set search_path = public as $$
  select coalesce(json_agg(json_build_object('id', p.id, 'from', player_card(p.host), 'topic_id', p.topic_id, 'topic', p.topic) order by p.created_at desc), '[]'::json)
  from party_players pp join parties p on p.id = pp.party_id
  where pp.player_id = pid and pp.status = 'invited' and p.status = 'lobby' and p.created_at > now() - interval '15 minutes'
$$;

create or replace function public.heartbeat() returns json
language plpgsql security definer set search_path = public as $$
declare pid uuid := current_player();
begin
  if pid is null then return null; end if;
  update players set last_seen = now() where id = pid;
  return json_build_object(
    'invites', coalesce((select json_agg(json_build_object('id', i.id, 'from', player_card(i.from_player), 'topic_id', i.topic_id,
        'topic', i.topic, 'created_at', i.created_at) order by i.created_at desc)
      from live_invites i where i.to_player = pid and i.status = 'pending' and i.created_at > now() - interval '2 minutes'), '[]'::json),
    'duo_invites', duo_invites_for(pid),
    'party_invites', party_invites_for(pid),
    'friend_requests', (select count(*) from friend_links where b = pid and status = 'pending'),
    'pending_challenges', (select count(*) from friend_challenges where to_player = pid and status = 'pending' and created_at > now() - interval '7 days'));
end $$;

revoke all on function public.party_const(text), public.party_clock(parties), public.party_view(uuid, uuid), public.party_invites_for(uuid) from public, anon, authenticated;
revoke all on function public.create_party(text, jsonb, jsonb), public.invite_to_party(uuid, uuid), public.respond_party(uuid, boolean),
  public.start_party(uuid), public.get_party(uuid), public.party_answer(uuid, int, int), public.leave_party(uuid) from public, anon;
grant execute on function public.create_party(text, jsonb, jsonb), public.invite_to_party(uuid, uuid), public.respond_party(uuid, boolean),
  public.start_party(uuid), public.get_party(uuid), public.party_answer(uuid, int, int), public.leave_party(uuid) to authenticated;
