-- Chat entre amis (messages privés) : texte ou invitation à jouer. Tables fermées, tout passe par des fonctions.
create table if not exists public.chat_messages (
  id bigserial primary key,
  sender uuid not null references public.players (id) on delete cascade,
  recipient uuid not null references public.players (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 1000),
  kind text not null default 'text' check (kind in ('text', 'invite')),
  payload jsonb,
  created_at timestamptz not null default now(),
  check (sender <> recipient)
);
create index if not exists chat_pair on public.chat_messages (least(sender, recipient), greatest(sender, recipient), id desc);
create index if not exists chat_to on public.chat_messages (recipient, id desc);
alter table public.chat_messages enable row level security;
revoke all on public.chat_messages from anon, authenticated;

-- dernier message lu, par conversation
create table if not exists public.chat_reads (
  player_id uuid not null references public.players (id) on delete cascade,
  peer_id uuid not null references public.players (id) on delete cascade,
  last_read bigint not null default 0,
  primary key (player_id, peer_id)
);
alter table public.chat_reads enable row level security;
revoke all on public.chat_reads from anon, authenticated;

-- nombre total de messages non lus (pastille de l'onglet)
create or replace function public.chat_unread_for(p uuid) returns int language sql stable security definer set search_path = public as $$
  select count(*)::int from chat_messages m
  where m.recipient = p and m.id > coalesce((select last_read from chat_reads r where r.player_id = p and r.peer_id = m.sender), 0)
    and are_friends(p, m.sender)
$$;

-- liste des conversations : tous les amis, ceux avec des messages récents en premier
create or replace function public.chat_list() returns json language sql stable security definer set search_path = public as $$
  with me as (select current_player() pid),
  fr as (select case when f.a = me.pid then f.b else f.a end peer from friend_links f, me where f.status = 'accepted' and me.pid in (f.a, f.b)),
  last as (
    select distinct on (fr.peer) fr.peer, m.id, m.body, m.kind, m.payload, m.sender, m.created_at
    from fr join chat_messages m on (m.sender = fr.peer and m.recipient = (select pid from me)) or (m.recipient = fr.peer and m.sender = (select pid from me))
    order by fr.peer, m.id desc)
  select coalesce(json_agg(json_build_object(
      'peer', player_card(fr.peer),
      'last', case when l.id is null then null else json_build_object('body', l.body, 'kind', l.kind, 'payload', l.payload, 'mine', l.sender = (select pid from me), 'at', l.created_at) end,
      'unread', (select count(*) from chat_messages m where m.sender = fr.peer and m.recipient = (select pid from me) and m.kind <> 'event'
                 and m.id > coalesce((select last_read from chat_reads r where r.player_id = (select pid from me) and r.peer_id = fr.peer), 0))
    ) order by l.id desc nulls last), '[]'::json)
  from fr left join last l on l.peer = fr.peer
$$;

-- fil d'une conversation (50 derniers messages, ou plus anciens que p_before) ; marque comme lu
create or replace function public.chat_thread(p_peer uuid, p_before bigint default null) returns json language plpgsql security definer set search_path = public as $$
declare pid uuid := current_player(); top bigint;
begin
  if pid is null or not are_friends(pid, p_peer) then raise exception 'pas ami'; end if;
  select max(id) into top from chat_messages where sender = p_peer and recipient = pid;
  if top is not null and p_before is null then
    insert into chat_reads (player_id, peer_id, last_read) values (pid, p_peer, top)
    on conflict (player_id, peer_id) do update set last_read = greatest(chat_reads.last_read, excluded.last_read);
  end if;
  return json_build_object(
    'peer', player_card(p_peer),
    -- jusqu'où l'ami a lu mes messages (pour « Vu »)
    'seen', coalesce((select last_read from chat_reads where player_id = p_peer and peer_id = pid), 0),
    'messages', coalesce((select json_agg(x order by x.id) from (
      select id, sender = pid as mine, body, kind, payload, created_at from chat_messages
      where ((sender = pid and recipient = p_peer) or (sender = p_peer and recipient = pid)) and (p_before is null or id < p_before)
      order by id desc limit 50) x), '[]'::json));
end $$;

-- envoi : seulement entre amis, 20 messages par minute au plus ; notification (regroupée si l'ami a déjà des non-lus récents)
create or replace function public.chat_send(p_peer uuid, p_body text, p_kind text default 'text', p_payload jsonb default null) returns json language plpgsql security definer set search_path = public as $$
declare pid uuid := current_player(); b text := btrim(coalesce(p_body, '')); me_name text; nid bigint;
begin
  if pid is null or not are_friends(pid, p_peer) then raise exception 'pas ami'; end if;
  if b = '' or char_length(b) > 1000 then raise exception 'message vide ou trop long'; end if;
  if p_kind not in ('text', 'invite') then raise exception 'type inconnu'; end if;
  if (select count(*) from chat_messages where sender = pid and created_at > now() - interval '1 minute') >= 20 then raise exception 'doucement'; end if;
  if p_payload is not null and pg_column_size(p_payload) > 500 then raise exception 'invitation invalide'; end if;
  -- pas de notification si l'ami a déjà un message non lu de moi depuis moins de 2 minutes (on ne l'inonde pas)
  if not exists (select 1 from chat_messages m where m.sender = pid and m.recipient = p_peer and m.created_at > now() - interval '2 minutes'
      and m.id > coalesce((select last_read from chat_reads r where r.player_id = p_peer and r.peer_id = pid), 0)) then
    select name into me_name from players where id = pid;
    perform notify_player(p_peer, '💬 ' || coalesce(me_name, 'Un ami'), left(b, 120), '/#chat=' || pid);
  end if;
  insert into chat_messages (sender, recipient, body, kind, payload) values (pid, p_peer, b, p_kind, p_payload) returning id into nid;
  -- mes propres messages comptent comme lus de mon côté
  return chat_thread(p_peer);
end $$;

-- marquer une conversation lue (sans recharger le fil)
create or replace function public.chat_unread() returns int language sql stable security definer set search_path = public as $$
  select chat_unread_for(current_player())
$$;

revoke all on function public.chat_unread_for(uuid) from public, anon, authenticated;
revoke all on function public.chat_list(), public.chat_thread(uuid, bigint), public.chat_send(uuid, text, text, jsonb), public.chat_unread() from public, anon;
grant execute on function public.chat_list(), public.chat_thread(uuid, bigint), public.chat_send(uuid, text, text, jsonb), public.chat_unread() to authenticated;

-- la pastille du chat arrive avec le battement de présence (toutes les 5 s)
create or replace function public.heartbeat() returns json language plpgsql security definer set search_path = public as $$
declare pid uuid := current_player();
begin
  if pid is null then return null; end if;
  update players set last_seen = now() where id = pid;
  return json_build_object(
    'invites', coalesce((select json_agg(json_build_object('id', i.id, 'from', player_card(i.from_player), 'topic_id', i.topic_id,
        'topic', i.topic, 'created_at', i.created_at, 'stake', i.stake) order by i.created_at desc)
      from live_invites i where i.to_player = pid and i.status = 'pending' and i.created_at > now() - interval '2 minutes'), '[]'::json),
    'duo_invites', duo_invites_for(pid),
    'party_invites', party_invites_for(pid),
    'traque_invites', traque_invites_for(pid),
    'friend_requests', (select count(*) from friend_links where b = pid and status = 'pending'),
    'pending_challenges', (select count(*) from friend_challenges where to_player = pid and status = 'pending' and created_at > now() - interval '7 days'),
    'chat_unread', chat_unread_for(pid));
end $$;

-- ===== Actualité commune dans le chat : défis lancés, relevés, refusés, résultats vus =====
alter table public.chat_messages drop constraint if exists chat_messages_kind_check;
alter table public.chat_messages add constraint chat_messages_kind_check check (kind in ('text', 'invite', 'event'));

create or replace function public.chat_event(p_actor uuid, p_other uuid, p_body text, p_payload jsonb) returns void language sql security definer set search_path = public as $$
  insert into chat_messages (sender, recipient, body, kind, payload)
  select p_actor, p_other, p_body, 'event', p_payload where p_actor <> p_other and are_friends(p_actor, p_other)
$$;

create or replace function public.tq_chat_challenge() returns trigger language plpgsql security definer set search_path = public as $$
declare t text := coalesce(new.topic ->> 'name', new.topic_id);
begin
  if tg_op = 'INSERT' then
    perform chat_event(new.from_player, new.to_player, 'Défi lancé en ' || t, jsonb_build_object('ev', 'challenge', 'topic', t, 'cid', new.id));
  elsif new.status is distinct from old.status and new.status = 'done' then
    perform chat_event(new.to_player, new.from_player, 'Défi relevé en ' || t, jsonb_build_object('ev', 'played', 'topic', t, 'cid', new.id, 'from', new.from_score, 'to', new.to_score));
  elsif new.status is distinct from old.status and new.status = 'declined' then
    perform chat_event(new.to_player, new.from_player, 'Défi refusé en ' || t, jsonb_build_object('ev', 'declined', 'topic', t, 'cid', new.id));
  end if;
  return new;
exception when others then return new; -- l'actualité ne doit jamais bloquer un défi
end $$;
drop trigger if exists chat_challenge_events on public.friend_challenges;
create trigger chat_challenge_events after insert or update of status on public.friend_challenges
  for each row execute function public.tq_chat_challenge();

-- « X vient de voir le résultat » (une seule fois par défi)
create or replace function public.chat_result_seen(p_challenge uuid) returns void language plpgsql security definer set search_path = public as $$
declare pid uuid := current_player(); c friend_challenges;
begin
  select * into c from friend_challenges where id = p_challenge and status = 'done' and pid in (from_player, to_player);
  if not found then return; end if;
  if exists (select 1 from chat_messages where kind = 'event' and sender = pid and payload ->> 'ev' = 'seen' and payload ->> 'cid' = p_challenge::text) then return; end if;
  perform chat_event(pid, case when pid = c.from_player then c.to_player else c.from_player end, 'Résultat vu',
    jsonb_build_object('ev', 'seen', 'topic', coalesce(c.topic ->> 'name', c.topic_id), 'cid', c.id));
end $$;

-- l'actualité ne compte pas dans les non-lus (elle a déjà ses propres notifications)
create or replace function public.chat_unread_for(p uuid) returns int language sql stable security definer set search_path = public as $$
  select count(*)::int from chat_messages m
  where m.recipient = p and m.kind <> 'event' and m.id > coalesce((select last_read from chat_reads r where r.player_id = p and r.peer_id = m.sender), 0)
    and are_friends(p, m.sender)
$$;

revoke all on function public.chat_event(uuid, uuid, text, jsonb), public.tq_chat_challenge() from public, anon, authenticated;
revoke all on function public.chat_result_seen(uuid) from public, anon;
grant execute on function public.chat_result_seen(uuid) to authenticated;

-- ===== Actualité : duels en direct entre amis (compte rendu à la fin, ou à l'abandon) =====
alter table public.matches add column if not exists chat_done boolean not null default false;

create or replace function public.chat_match_event(p_match uuid) returns void language plpgsql security definer set search_path = public as $$
declare m record; n int; s1 int := 0; s2 int := 0; a record; pts int; t text;
begin
  select * into m from matches where id = p_match for update;
  if not found or m.chat_done or not are_friends(m.p1, m.p2) then return; end if;
  n := jsonb_array_length(m.questions);
  -- duel incomplet (quelqu'un est parti, chrono écoulé) : on clôt au bout de 4 minutes avec les points marqués
  if m.forfeit is null and (select count(*) from match_answers where match_id = p_match) < 2 * n and m.created_at > now() - interval '4 minutes' then return; end if;
  for a in select * from match_answers where match_id = p_match loop
    if a.choice >= 0 and a.choice = (m.questions -> a.round ->> 'correct')::int then
      pts := greatest(2, ceil((10000 - a.t) / 1000.0)::int * 2) * (case when a.round = n - 1 then 2 else 1 end);
      if a.player_id = m.p1 then s1 := s1 + pts; else s2 := s2 + pts; end if;
    end if;
  end loop;
  if m.forfeit = m.p1 then s1 := 0; s2 := greatest(s2, 1); elsif m.forfeit = m.p2 then s2 := 0; s1 := greatest(s1, 1); end if;
  select coalesce(i.topic ->> 'name', m.topic_id) into t from live_invites i where i.match_id = p_match limit 1;
  update matches set chat_done = true where id = p_match;
  perform chat_event(m.p1, m.p2, 'Duel en direct', jsonb_build_object('ev', 'live', 'topic', coalesce(t, m.topic_id), 'a', s1, 'b', s2,
    'forfeit', case when m.forfeit = m.p1 then 'a' when m.forfeit = m.p2 then 'b' end));
end $$;

create or replace function public.tq_chat_match() returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform chat_match_event(new.match_id);
  return new;
exception when others then return new;
end $$;
drop trigger if exists chat_match_events on public.match_answers;
create trigger chat_match_events after insert on public.match_answers for each row execute function public.tq_chat_match();

create or replace function public.tq_chat_forfeit() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.forfeit is not null and old.forfeit is null then perform chat_match_event(new.id); end if;
  return new;
exception when others then return new;
end $$;
drop trigger if exists chat_forfeit_events on public.matches;
create trigger chat_forfeit_events after update of forfeit on public.matches for each row execute function public.tq_chat_forfeit();

revoke all on function public.chat_match_event(uuid), public.tq_chat_match(), public.tq_chat_forfeit() from public, anon, authenticated;

-- toutes les minutes : compte rendu des duels en direct restés incomplets
create or replace function public.chat_close_stale_matches() returns int language plpgsql security definer set search_path = public as $$
declare r record; n int := 0;
begin
  for r in select id from matches where not chat_done and created_at between now() - interval '2 days' and now() - interval '4 minutes' loop
    perform chat_match_event(r.id); n := n + 1;
  end loop;
  return n;
end $$;
revoke all on function public.chat_close_stale_matches() from public, anon, authenticated;
select cron.unschedule('kraken-chat-matches') where exists (select 1 from cron.job where jobname = 'kraken-chat-matches');
select cron.schedule('kraken-chat-matches', '* * * * *', 'select public.chat_close_stale_matches()');
