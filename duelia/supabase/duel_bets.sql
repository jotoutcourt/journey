-- Duels en direct entre amis : chacun mise la même somme de lingots.
-- Les mises sont bloquées au lancement du duel (les deux joueurs doivent avoir assez de lingots),
-- et le serveur verse le pot au gagnant d'après le score qu'il calcule lui-même (égalité : chacun récupère sa mise).
-- Un joueur qui abandonne perd : au bout de 4 minutes, le duel est réglé avec les réponses enregistrées.

alter table public.live_invites add column if not exists stake int not null default 0 check (stake between 0 and 1000);
alter table public.matches add column if not exists stake int not null default 0 check (stake between 0 and 1000);
alter table public.matches add column if not exists settled_at timestamptz;
alter table public.wallet_log add column if not exists match_id uuid;
alter table public.wallet_log drop constraint if exists wallet_log_reason_check;
alter table public.wallet_log add constraint wallet_log_reason_check
  check (reason in ('butin', 'bonus_jour', 'parfait', 'achat', 'cadeau', 'mise', 'gain_duel', 'remboursement'));

-- Bloque la mise des deux joueurs, ou rien du tout si l'un n'a pas assez de lingots
create or replace function public.escrow_stakes(p_a uuid, p_b uuid, p_stake int, p_match uuid) returns boolean
language plpgsql security definer set search_path = public as $$
begin
  if p_stake <= 0 then return true; end if;
  if coalesce((select lingots from wallets where player_id = p_a for update), 0) < p_stake
     or coalesce((select lingots from wallets where player_id = p_b for update), 0) < p_stake then
    return false;
  end if;
  update wallets set lingots = lingots - p_stake, updated_at = now() where player_id in (p_a, p_b);
  insert into wallet_log (player_id, delta, reason, match_id) values (p_a, -p_stake, 'mise', p_match), (p_b, -p_stake, 'mise', p_match);
  return true;
end $$;

-- Règle un duel avec mise (une seule fois). Appelé par les joueurs à la fin, et par une tâche planifiée.
create or replace function public.settle_match(p_match uuid) returns json
language plpgsql security definer set search_path = public as $$
declare m record; n int; s1 int := 0; s2 int := 0; a record; pts int; done boolean; winner uuid;
begin
  select * into m from matches where id = p_match for update;
  if not found then return null; end if;
  n := jsonb_array_length(m.questions);
  for a in select * from match_answers where match_id = p_match loop
    if a.choice >= 0 and a.choice = (m.questions -> a.round ->> 'correct')::int then
      pts := greatest(2, ceil((10000 - a.t) / 1000.0)::int * 2) * (case when a.round = n - 1 then 2 else 1 end);
      if a.player_id = m.p1 then s1 := s1 + pts; else s2 := s2 + pts; end if;
    end if;
  end loop;
  done := (select count(*) from match_answers where match_id = p_match) >= 2 * n;
  winner := case when s1 > s2 then m.p1 when s2 > s1 then m.p2 end;
  if m.stake > 0 and m.settled_at is null and (done or m.created_at < now() - interval '4 minutes') then
    if winner is null then
      update wallets set lingots = lingots + m.stake, updated_at = now() where player_id in (m.p1, m.p2);
      insert into wallet_log (player_id, delta, reason, match_id) values (m.p1, m.stake, 'remboursement', p_match), (m.p2, m.stake, 'remboursement', p_match);
    else
      update wallets set lingots = lingots + 2 * m.stake, earned = earned + m.stake, updated_at = now() where player_id = winner;
      insert into wallet_log (player_id, delta, reason, match_id) values (winner, 2 * m.stake, 'gain_duel', p_match);
    end if;
    update matches set settled_at = now() where id = p_match;
    m.settled_at := now();
  end if;
  return json_build_object('stake', m.stake, 'settled', m.settled_at is not null, 'p1', s1, 'p2', s2,
    'winner', winner, 'me_won', winner = current_player(), 'draw', winner is null);
end $$;

-- Ce qu'un joueur voit de son duel avec mise : réglé ou non, et son gain
create or replace function public.my_match_bet(p_match uuid) returns json
language plpgsql security definer set search_path = public as $$
declare pid uuid := current_player(); r json;
begin
  if not exists (select 1 from matches where id = p_match and pid in (p1, p2)) then return null; end if;
  r := settle_match(p_match);
  return json_build_object('stake', (r ->> 'stake')::int, 'settled', (r ->> 'settled')::boolean,
    'won', (r ->> 'me_won')::boolean, 'draw', (r ->> 'draw')::boolean,
    'wallet', (select lingots from wallets where player_id = pid));
end $$;

-- Tâche planifiée : règle les duels avec mise abandonnés en cours de route
create or replace function public.settle_stale_matches() returns int
language plpgsql security definer set search_path = public as $$
declare m record; n int := 0;
begin
  for m in select id from matches where stake > 0 and settled_at is null and created_at < now() - interval '4 minutes' loop
    perform settle_match(m.id); n := n + 1;
  end loop;
  return n;
end $$;

-- La vue d'un duel indique désormais la mise
create or replace function public.match_view(p_match uuid, p_me uuid) returns json
language sql stable security definer set search_path = public as $$
  select json_build_object(
    'id', m.id, 'topic_id', m.topic_id, 'questions', m.questions, 'stake', m.stake,
    'opponent', json_build_object('player_id', o.id, 'name', o.name, 'avatar', o.avatar, 'flag', o.flag, 'photo', o.photo))
  from matches m join players o on o.id = case when m.p1 = p_me then m.p2 else m.p1 end
  where m.id = p_match and p_me in (m.p1, m.p2)
$$;

-- Inviter avec une mise (0 = sans mise)
drop function if exists public.invite_live(uuid, text, jsonb, jsonb);
create or replace function public.invite_live(p_to uuid, p_topic_id text, p_topic jsonb, p_questions jsonb, p_stake int default 0) returns uuid
language plpgsql security definer set search_path = public as $$
declare pid uuid := current_player(); iid uuid; me_name text; other record; mid uuid; stake int := greatest(0, least(coalesce(p_stake, 0), 1000));
begin
  if pid is null or not are_friends(pid, p_to) then raise exception 'pas amis'; end if;
  if not valid_questions(p_questions) or not valid_topic_meta(p_topic) then raise exception 'invitation invalide'; end if;
  if stake > 0 and coalesce((select lingots from wallets where player_id = pid), 0) < stake then raise exception 'pas assez de lingots'; end if;
  perform pg_advisory_xact_lock(hashtext('live:' || least(pid, p_to)::text || greatest(pid, p_to)::text));
  delete from live_invites where created_at < now() - interval '1 day';
  update live_invites set status = 'cancelled' where from_player = pid and status = 'pending';

  -- invitations croisées : l'ami m'a déjà invité il y a moins de 2 minutes → on rejoint son duel (avec sa mise)
  select * into other from live_invites
    where from_player = p_to and to_player = pid and status = 'pending' and created_at > now() - interval '2 minutes'
    order by created_at desc limit 1 for update;
  if found then
    insert into matches (topic_id, p1, p2, questions, stake) values (other.topic_id, other.from_player, pid, other.questions, other.stake) returning id into mid;
    if escrow_stakes(other.from_player, pid, other.stake, mid) then
      update live_invites set status = 'accepted', match_id = mid where id = other.id;
      insert into live_invites (from_player, to_player, topic_id, topic, questions, status, match_id, stake)
        values (pid, p_to, other.topic_id, other.topic, other.questions, 'accepted', mid, other.stake)
        returning id into iid;
      return iid;
    end if;
    delete from matches where id = mid; -- pas assez de lingots pour sa mise : on envoie notre propre invitation
  end if;

  insert into live_invites (from_player, to_player, topic_id, topic, questions, stake) values (pid, p_to, p_topic_id, p_topic, p_questions, stake)
  returning id into iid;
  select name into me_name from players where id = pid;
  perform notify_player(p_to, 'Duel en direct !', me_name || ' t''attend sur « ' || (p_topic ->> 'name') || ' »'
    || case when stake > 0 then ' · mise : ' || stake || ' lingots' else '' end, '/#defis');
  return iid;
end $$;

create or replace function public.respond_live_invite(p_id uuid, p_accept boolean) returns json
language plpgsql security definer set search_path = public as $$
declare pid uuid := current_player(); i record; mid uuid;
begin
  select * into i from live_invites where id = p_id and to_player = pid for update;
  if not found then return null; end if;
  perform pg_advisory_xact_lock(hashtext('live:' || least(pid, i.from_player)::text || greatest(pid, i.from_player)::text));
  if i.status = 'accepted' and i.match_id is not null then return match_view(i.match_id, pid); end if;
  if i.status <> 'pending' or i.created_at < now() - interval '2 minutes' then return null; end if;
  if not p_accept then
    update live_invites set status = 'declined' where id = p_id;
    return null;
  end if;
  insert into matches (topic_id, p1, p2, questions, stake) values (i.topic_id, i.from_player, pid, i.questions, i.stake) returning id into mid;
  if not escrow_stakes(i.from_player, pid, i.stake, mid) then
    delete from matches where id = mid;
    raise exception 'pas assez de lingots';
  end if;
  update live_invites set status = 'accepted', match_id = mid where id = p_id;
  update live_invites set status = 'accepted', match_id = mid
    where from_player = pid and to_player = i.from_player and status = 'pending';
  return match_view(mid, pid);
end $$;

-- Les invitations reçues indiquent la mise
create or replace function public.heartbeat() returns json
language plpgsql security definer set search_path = public as $$
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
    'friend_requests', (select count(*) from friend_links where b = pid and status = 'pending'),
    'pending_challenges', (select count(*) from friend_challenges where to_player = pid and status = 'pending' and created_at > now() - interval '7 days'));
end $$;

revoke all on function public.escrow_stakes(uuid, uuid, int, uuid), public.settle_match(uuid), public.settle_stale_matches() from public, anon, authenticated;
revoke all on function public.invite_live(uuid, text, jsonb, jsonb, int), public.my_match_bet(uuid) from public, anon;
grant execute on function public.invite_live(uuid, text, jsonb, jsonb, int), public.my_match_bet(uuid) to authenticated;

-- Les vieux duels sont effacés au bout de 2 jours : on ne garde pas de mise en suspens
select cron.unschedule('kraken-settle-duels') where exists (select 1 from cron.job where jobname = 'kraken-settle-duels');
select cron.schedule('kraken-settle-duels', '*/5 * * * *', 'select public.settle_stale_matches()');
