-- Duels en direct : +2 lingots au gagnant (en plus du pot s'il y a une mise)
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
  if m.settled_at is null and (done or m.created_at < now() - interval '4 minutes') then
    -- bonus de victoire : +2 lingots au gagnant de tout duel en direct (avec ou sans mise)
    if winner is not null and exists (select 1 from players where id = winner) then
      insert into wallets (player_id, lingots, earned) values (winner, 2, 2)
        on conflict (player_id) do update set lingots = wallets.lingots + 2, earned = wallets.earned + 2, updated_at = now();
      insert into wallet_log (player_id, delta, reason, match_id) values (winner, 2, 'gain_duel', p_match);
    end if;
    if coalesce(m.stake, 0) = 0 then null;
    elsif winner is null then
      update wallets set lingots = lingots + m.stake, updated_at = now() where player_id in (m.p1, m.p2);
      insert into wallet_log (player_id, delta, reason, match_id) values (m.p1, m.stake, 'remboursement', p_match), (m.p2, m.stake, 'remboursement', p_match);
    else
      update wallets set lingots = lingots + 2 * m.stake, earned = earned + m.stake, updated_at = now() where player_id = winner;
      insert into wallet_log (player_id, delta, reason, match_id) values (winner, 2 * m.stake, 'gain_duel', p_match);
    end if;
    update matches set settled_at = now() where id = p_match;
    m.settled_at := now();
  end if;
  return json_build_object('stake', m.stake, 'bonus', 2, 'settled', m.settled_at is not null, 'p1', s1, 'p2', s2,
    'winner', winner, 'me_won', winner = current_player(), 'draw', winner is null);
end $$;

create or replace function public.settle_stale_matches() returns int
language plpgsql security definer set search_path = public as $$
declare m record; n int := 0;
begin
  for m in select id from matches where settled_at is null and created_at < now() - interval '4 minutes' and created_at > now() - interval '2 days' loop
    perform settle_match(m.id); n := n + 1;
  end loop;
  return n;
end $$;

-- les anciens duels sans mise ne rapportent pas de bonus rétroactif
update matches set settled_at = now() where settled_at is null and created_at < now() - interval '4 minutes';
