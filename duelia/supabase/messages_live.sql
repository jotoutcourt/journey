-- 1) Petit message entre joueurs après un défi différé (140 caractères, un par joueur et par défi)
alter table public.friend_challenges add column if not exists from_msg text check (char_length(from_msg) <= 140);
alter table public.friend_challenges add column if not exists to_msg text check (char_length(to_msg) <= 140);

create or replace function public.set_challenge_message(p_id uuid, p_msg text) returns void
language plpgsql security definer set search_path = public as $$
declare pid uuid := current_player(); c record; msg text := btrim(regexp_replace(coalesce(p_msg, ''), '\s+', ' ', 'g')); me_name text; other uuid;
begin
  if pid is null then raise exception 'aucun joueur'; end if;
  if char_length(msg) not between 1 and 140 then raise exception 'message invalide'; end if;
  select * into c from friend_challenges where id = p_id and pid in (from_player, to_player) for update;
  if not found then raise exception 'défi inconnu'; end if;
  if c.from_player = pid then
    update friend_challenges set from_msg = msg where id = p_id; other := c.to_player;
  else
    -- celui qui reçoit le défi écrit après avoir joué
    if c.status <> 'done' then raise exception 'joue d''abord le défi'; end if;
    update friend_challenges set to_msg = msg where id = p_id; other := c.from_player;
  end if;
  select name into me_name from players where id = pid;
  perform notify_player(other, '💬 ' || me_name, msg, '/#defis');
end $$;
revoke all on function public.set_challenge_message(uuid, text) from public, anon;
grant execute on function public.set_challenge_message(uuid, text) to authenticated;

create or replace function public.get_challenges() returns json
language plpgsql stable security definer set search_path = public as $$
declare pid uuid := current_player();
begin
  if pid is null then return '[]'::json; end if;
  return coalesce((select json_agg(json_build_object(
      'id', c.id, 'dir', case when c.from_player = pid then 'out' else 'in' end,
      'opponent', player_card(case when c.from_player = pid then c.to_player else c.from_player end),
      'topic_id', c.topic_id, 'topic', c.topic, 'questions', c.questions,
      'status', case when c.status = 'pending' and c.created_at < now() - interval '7 days' then 'expired' else c.status end,
      'created_at', c.created_at, 'answered_at', c.answered_at,
      'from_answers', c.from_answers,
      'to_answers', case when c.status = 'done' then c.to_answers end,
      'my_score', case when c.from_player = pid then c.from_score else c.to_score end,
      'their_score', case when c.status <> 'done' then null when c.from_player = pid then c.to_score else c.from_score end,
      'my_msg', case when c.from_player = pid then c.from_msg else c.to_msg end,
      'their_msg', case when c.from_player = pid then c.to_msg else c.from_msg end
    ) order by c.created_at desc)
    from friend_challenges c
    where pid in (c.from_player, c.to_player) and c.created_at > now() - interval '30 days'), '[]'::json);
end $$;

-- 2) Duel en direct demandé à un ami hors ligne : il reçoit une notification et a 2 minutes pour arriver
create or replace function public.get_live_invite(p_id uuid) returns json
language plpgsql stable security definer set search_path = public as $$
declare pid uuid := current_player(); i record;
begin
  select * into i from live_invites where id = p_id and from_player = pid;
  if not found then return null; end if;
  return json_build_object('status', case when i.status = 'pending' and i.created_at < now() - interval '2 minutes' then 'expired' else i.status end,
    'match', case when i.match_id is not null then match_view(i.match_id, pid) end);
end $$;

create or replace function public.respond_live_invite(p_id uuid, p_accept boolean) returns json
language plpgsql security definer set search_path = public as $$
declare pid uuid := current_player(); i record; mid uuid;
begin
  select * into i from live_invites where id = p_id and to_player = pid for update;
  if not found or i.status <> 'pending' or i.created_at < now() - interval '2 minutes' then return null; end if;
  if not p_accept then
    update live_invites set status = 'declined' where id = p_id;
    return null;
  end if;
  insert into matches (topic_id, p1, p2, questions) values (i.topic_id, i.from_player, pid, i.questions) returning id into mid;
  update live_invites set status = 'accepted', match_id = mid where id = p_id;
  return match_view(mid, pid);
end $$;

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
    'friend_requests', (select count(*) from friend_links where b = pid and status = 'pending'),
    'pending_challenges', (select count(*) from friend_challenges where to_player = pid and status = 'pending' and created_at > now() - interval '7 days'));
end $$;
