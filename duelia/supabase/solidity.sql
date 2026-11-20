-- Solidité : limites anti-triche sur l'XP et score des duels en direct calculé par le serveur.

-- XP : au plus 520 par envoi (le maximum d'un duel), 15 000 par jour et par thème, 120 envois par heure.
create or replace function public.add_xp(p_topic text, p_xp int, p_backfill boolean default false) returns void
language plpgsql security definer set search_path = public as $$
declare pid uuid := current_player(); today int;
begin
  if pid is null or p_xp is null or p_xp < 1 or char_length(p_topic) not between 1 and 60 then return; end if;
  if (select count(*) from xp_events where player_id = pid and at > now() - interval '1 hour') >= 120 then return; end if;
  if p_backfill then
    if exists (select 1 from xp_events where player_id = pid and topic_id = p_topic) then return; end if;
    insert into xp_events (player_id, topic_id, xp, at) values (pid, p_topic, least(p_xp, 20000), now() - interval '60 days');
    return;
  end if;
  select coalesce(sum(xp), 0) into today from xp_events
    where player_id = pid and topic_id = p_topic and at > now() - interval '1 day';
  if today >= 15000 then return; end if;
  insert into xp_events (player_id, topic_id, xp) values (pid, p_topic, least(p_xp, 520, 15000 - today));
end $$;

-- Duel en direct : un temps de réponse sous 0,3 s est impossible pour un humain, on le ramène à 0,3 s.
create or replace function public.send_live_answer(p_match uuid, p_round int, p_choice int, p_t int) returns void
language plpgsql security definer set search_path = public as $$
declare pid uuid := current_player(); m record;
begin
  select * into m from matches where id = p_match and pid in (p1, p2);
  if not found then raise exception 'duel inconnu'; end if;
  if p_round < 0 or p_round >= jsonb_array_length(m.questions) then raise exception 'question inconnue'; end if;
  -- une réponse ne peut pas arriver avant le début possible de la question (intro + annonces + questions précédentes)
  if now() < m.created_at + make_interval(secs => 3 + p_round * 3) then raise exception 'trop tôt'; end if;
  insert into match_answers (match_id, player_id, round, choice, t)
  values (p_match, pid, p_round, p_choice, greatest(300, least(10000, p_t)))
  on conflict do nothing;
end $$;

-- Score officiel d'un duel en direct, calculé à partir des réponses enregistrées (dernière question ×2)
create or replace function public.live_result(p_match uuid) returns json
language plpgsql stable security definer set search_path = public as $$
declare pid uuid := current_player(); m record; n int; mine int := 0; theirs int := 0; a record; pts int;
begin
  select * into m from matches where id = p_match and pid in (p1, p2);
  if not found then return null; end if;
  n := jsonb_array_length(m.questions);
  for a in select * from match_answers where match_id = p_match loop
    if a.choice >= 0 and a.choice = (m.questions -> a.round ->> 'correct')::int then
      pts := greatest(2, ceil((10000 - a.t) / 1000.0)::int * 2) * (case when a.round = n - 1 then 2 else 1 end);
      if a.player_id = pid then mine := mine + pts; else theirs := theirs + pts; end if;
    end if;
  end loop;
  return json_build_object('me', mine, 'opp', theirs,
    'complete', (select count(*) from match_answers where match_id = p_match) = 2 * n);
end $$;

revoke all on function public.live_result(uuid) from public, anon;
grant execute on function public.live_result(uuid) to authenticated;

-- Ménage : les duels en direct de plus de 2 jours sont effacés (appelé à chaque recherche)
create or replace function public.find_live_match(p_topic text, p_questions jsonb) returns json
language plpgsql security definer set search_path = public as $$
declare pid uuid := current_player(); mid uuid; w record;
begin
  if pid is null then raise exception 'aucun joueur'; end if;
  delete from matches where created_at < now() - interval '2 days';
  delete from match_queue where match_id is null and joined_at < now() - interval '10 seconds';
  select match_id into mid from match_queue where player_id = pid and match_id is not null;
  if mid is not null then
    delete from match_queue where player_id = pid;
    return match_view(mid, pid);
  end if;
  select * into w from match_queue
    where topic_id = p_topic and match_id is null and player_id <> pid
    order by joined_at limit 1 for update skip locked;
  if found then
    insert into matches (topic_id, p1, p2, questions) values (p_topic, w.player_id, pid, w.questions) returning id into mid;
    update match_queue set match_id = mid where player_id = w.player_id;
    delete from match_queue where player_id = pid;
    return match_view(mid, pid);
  end if;
  insert into match_queue (player_id, topic_id, questions, joined_at) values (pid, p_topic, p_questions, now())
  on conflict (player_id) do update set topic_id = excluded.topic_id, questions = excluded.questions, joined_at = now(), match_id = null;
  return null;
end $$;
