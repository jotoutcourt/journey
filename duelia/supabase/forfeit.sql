-- Abandon = défaite, contre un ami : duel en direct et défi différé.
-- L'abandonneur est compté à 0 point, l'adversaire gagne (au moins 1 point), mise comprise.
alter table public.matches add column if not exists forfeit uuid;

create or replace function public.live_forfeit(p_match uuid) returns json language plpgsql security definer set search_path = public as $$
declare pid uuid := current_player();
begin
  update matches set forfeit = pid where id = p_match and pid in (p1, p2) and forfeit is null;
  return settle_match(p_match);
end $$;

create or replace function public.live_result(p_match uuid) returns json language plpgsql stable security definer set search_path = public as $$
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
  if m.forfeit = pid then mine := 0; theirs := greatest(theirs, 1);
  elsif m.forfeit is not null then theirs := 0; mine := greatest(mine, 1); end if;
  return json_build_object('me', mine, 'opp', theirs, 'forfeit', case when m.forfeit is null then null when m.forfeit = pid then 'me' else 'opp' end,
    'complete', m.forfeit is not null or (select count(*) from match_answers where match_id = p_match) = 2 * n);
end $$;

create or replace function public.settle_match(p_match uuid) returns json language plpgsql security definer set search_path = public as $$
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
  -- abandon : l'abandonneur perd
  if m.forfeit = m.p1 then s1 := 0; s2 := greatest(s2, 1); elsif m.forfeit = m.p2 then s2 := 0; s1 := greatest(s1, 1); end if;
  done := m.forfeit is not null or (select count(*) from match_answers where match_id = p_match) >= 2 * n;
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

-- défi différé : jouer (ou abandonner) le défi d'un ami
drop function if exists public.play_challenge(uuid, jsonb);
create or replace function public.play_challenge(p_id uuid, p_answers jsonb, p_forfeit boolean default false) returns json
language plpgsql security definer set search_path = public as $$
declare pid uuid := current_player(); c record; s int; me_name text; verdict text;
begin
  select * into c from friend_challenges where id = p_id and to_player = pid for update;
  if not found then raise exception 'défi inconnu'; end if;
  if c.status <> 'pending' or c.created_at < now() - interval '7 days' then raise exception 'défi terminé'; end if;
  if not valid_answers(p_answers, jsonb_array_length(c.questions)) then raise exception 'réponses invalides'; end if;
  s := score_answers(c.questions, p_answers);
  -- abandon : défaite garantie (score ramené sous celui de l'ami)
  if p_forfeit then s := least(s, greatest(c.from_score - 1, 0)); end if;
  update friend_challenges set to_answers = p_answers, to_score = s, status = 'done', answered_at = now() where id = p_id;
  select name into me_name from players where id = pid;
  verdict := case when p_forfeit then 'Abandon : tu as gagné' when c.from_score > s then 'Tu as gagné' when c.from_score < s then 'Tu as perdu' else 'Égalité' end;
  perform notify_player(c.from_player, me_name || (case when p_forfeit then ' a abandonné ton défi' else ' a joué ton défi' end),
    verdict || ' ' || c.from_score || '–' || s || ' sur « ' || (c.topic ->> 'name') || ' »', '/#defis');
  return json_build_object('my_score', s, 'their_score', c.from_score, 'their_msg', c.from_msg, 'forfeit', p_forfeit);
end $$;

revoke all on function public.play_challenge(uuid, jsonb, boolean), public.live_forfeit(uuid) from public, anon;
grant execute on function public.play_challenge(uuid, jsonb, boolean), public.live_forfeit(uuid), public.live_result(uuid) to authenticated;
