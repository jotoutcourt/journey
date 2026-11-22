-- Duels en direct : deux amis qui se lancent une invitation (ou une revanche) en même temps
-- doivent se retrouver dans le MÊME duel, et pas dans deux duels différents.

create or replace function public.invite_live(p_to uuid, p_topic_id text, p_topic jsonb, p_questions jsonb) returns uuid
language plpgsql security definer set search_path = public as $$
declare pid uuid := current_player(); iid uuid; me_name text; other record; mid uuid;
begin
  if pid is null or not are_friends(pid, p_to) then raise exception 'pas amis'; end if;
  if not valid_questions(p_questions) or not valid_topic_meta(p_topic) then raise exception 'invitation invalide'; end if;
  -- un seul passage à la fois pour une même paire de joueurs (deux clics simultanés)
  perform pg_advisory_xact_lock(hashtext('live:' || least(pid, p_to)::text || greatest(pid, p_to)::text));
  delete from live_invites where created_at < now() - interval '1 day';
  update live_invites set status = 'cancelled' where from_player = pid and status = 'pending';

  -- invitations croisées : l'ami m'a déjà invité il y a moins de 2 minutes → on rejoint son duel
  select * into other from live_invites
    where from_player = p_to and to_player = pid and status = 'pending' and created_at > now() - interval '2 minutes'
    order by created_at desc limit 1 for update;
  if found then
    insert into matches (topic_id, p1, p2, questions) values (other.topic_id, other.from_player, pid, other.questions) returning id into mid;
    update live_invites set status = 'accepted', match_id = mid where id = other.id;
    insert into live_invites (from_player, to_player, topic_id, topic, questions, status, match_id)
      values (pid, p_to, other.topic_id, other.topic, other.questions, 'accepted', mid)
      returning id into iid;
    return iid;
  end if;

  insert into live_invites (from_player, to_player, topic_id, topic, questions) values (pid, p_to, p_topic_id, p_topic, p_questions)
  returning id into iid;
  select name into me_name from players where id = pid;
  perform notify_player(p_to, 'Duel en direct !', me_name || ' t''attend sur « ' || (p_topic ->> 'name') || ' »', '/#defis');
  return iid;
end $$;

-- Accepter une invitation : si j'avais moi-même invité cette personne entre-temps, mon invitation
-- rejoint le même duel (au lieu de rester en attente et d'en créer un second).
create or replace function public.respond_live_invite(p_id uuid, p_accept boolean) returns json
language plpgsql security definer set search_path = public as $$
declare pid uuid := current_player(); i record; mid uuid;
begin
  select * into i from live_invites where id = p_id and to_player = pid for update;
  if not found then return null; end if;
  perform pg_advisory_xact_lock(hashtext('live:' || least(pid, i.from_player)::text || greatest(pid, i.from_player)::text));
  -- l'invitation a pu être acceptée entre-temps par une invitation croisée : on rejoint ce duel
  if i.status = 'accepted' and i.match_id is not null then return match_view(i.match_id, pid); end if;
  if i.status <> 'pending' or i.created_at < now() - interval '2 minutes' then return null; end if;
  if not p_accept then
    update live_invites set status = 'declined' where id = p_id;
    return null;
  end if;
  insert into matches (topic_id, p1, p2, questions) values (i.topic_id, i.from_player, pid, i.questions) returning id into mid;
  update live_invites set status = 'accepted', match_id = mid where id = p_id;
  update live_invites set status = 'accepted', match_id = mid
    where from_player = pid and to_player = i.from_player and status = 'pending';
  return match_view(mid, pid);
end $$;
