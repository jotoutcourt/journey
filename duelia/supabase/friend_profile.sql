-- Profil d'un ami : carte, XP totale, thèmes favoris, bilan des défis entre nous, record du Kraken à deux.
-- Réservé aux amis (are_friends) : on ne peut pas consulter n'importe qui.
create or replace function public.get_friend_profile(p_friend uuid) returns json
language plpgsql stable security definer set search_path = public as $$
declare pid uuid := current_player(); lo uuid; hi uuid;
begin
  if pid is null or not are_friends(pid, p_friend) then return null; end if;
  lo := least(pid, p_friend); hi := greatest(pid, p_friend);
  return json_build_object(
    'card', player_card(p_friend),
    'since', (select created_at from players where id = p_friend),
    'xp', (select coalesce(sum(xp), 0) from xp_events where player_id = p_friend),
    'top', (select coalesce(json_agg(json_build_object('topic_id', topic_id, 'xp', s) order by s desc), '[]'::json)
            from (select topic_id, sum(xp) s from xp_events where player_id = p_friend group by topic_id order by s desc limit 4) t),
    'kraken', json_build_object(
      'games', (select count(*) from duo_games where (a = p_friend or b = p_friend) and status = 'done'),
      'earned', coalesce((select earned from wallets where player_id = p_friend), 0)),
    'duo', (select json_build_object('best', best, 'games', games) from duo_scores where p1 = lo and p2 = hi),
    'h2h', (select json_build_object(
        'me', count(*) filter (where (from_player = pid and from_score > to_score) or (to_player = pid and to_score > from_score)),
        'them', count(*) filter (where (from_player = p_friend and from_score > to_score) or (to_player = p_friend and to_score > from_score)),
        'draws', count(*) filter (where from_score = to_score))
      from friend_challenges where status = 'done' and to_score is not null
        and ((from_player = pid and to_player = p_friend) or (from_player = p_friend and to_player = pid))));
end $$;
revoke all on function public.get_friend_profile(uuid) from public, anon;
grant execute on function public.get_friend_profile(uuid) to authenticated;
