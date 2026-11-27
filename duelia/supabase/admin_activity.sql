-- Historique caché pour le créateur de l'appli : tout ce qui se passe sur Kraken, du plus récent au plus ancien.
-- Réservé aux comptes de Jo (vérifié par le serveur). Les messages privés n'y figurent pas.
create or replace function public.is_app_admin() returns boolean language sql stable security definer set search_path = public as $$
  select current_player() in ('a74d38cf-ebaf-4ba7-a7ec-af1563a1ac93'::uuid, 'ed308d75-6cfb-4dd2-8bbe-b3b7601fb5b3'::uuid, '33ed08ee-e548-4969-988a-e4ab3b5e4d43'::uuid)
$$;

create or replace function public.admin_activity(p_days int default 7) returns json
language plpgsql stable security definer set search_path = public as $$
declare since timestamptz := now() - make_interval(days => greatest(1, least(coalesce(p_days, 7), 90)));
begin
  if not is_app_admin() then raise exception 'réservé'; end if;
  return json_build_object(
    'stats', json_build_object(
      'players', (select count(*) from players),
      'new', (select count(*) from players where created_at >= since),
      'today', (select count(*) from players where last_seen > now() - interval '24 hours'),
      'online', (select count(*) from players where last_seen > now() - interval '5 minutes'),
      'push', (select count(*) from push_subscriptions)),
    'events', coalesce((select json_agg(e order by e.at desc) from (
      select * from (
        select p.created_at at, 'compte' k, '👤' i, 'Nouveau compte : ' || p.name t from players p where p.created_at >= since
        union all
        select f.created_at, 'social', '🤝', a.name || case when f.status = 'accepted' then ' et ' || b.name || ' sont devenus amis' else ' a demandé ' || b.name || ' en ami' end
          from friend_links f join players a on a.id = f.a join players b on b.id = f.b where f.created_at >= since
        union all
        select m.created_at, 'duel', '⚡', 'Duel en direct : ' || a.name || ' vs ' || b.name || ' · ' || m.topic_id
            || case when m.forfeit is not null then ' (abandon de ' || (select name from players where id = m.forfeit) || ')' else '' end
          from matches m join players a on a.id = m.p1 join players b on b.id = m.p2 where m.created_at >= since
        union all
        select c.created_at, 'duel', '📨', a.name || ' a défié ' || b.name || ' · ' || c.topic_id
            || case when c.status = 'done' or c.to_score is not null then ' → ' || coalesce(c.from_score, 0) || ' à ' || coalesce(c.to_score, 0) else '' end
          from friend_challenges c join players a on a.id = c.from_player join players b on b.id = c.to_player where c.created_at >= since
        union all
        select g.created_at, 'chasse', '🐙', coalesce((select name from players where id = g.host), '?') || ' a lancé une Chasse au Kraken ('
            || (select count(*) from traque_players tp where tp.game_id = g.id and tp.status in ('joined', 'bot', 'left')) || ' joueurs)'
            || case when g.status = 'done' then ' · terminée' else '' end
          from traque_games g where g.created_at >= since
        union all
        select d.created_at, 'jeu', '🕳️', 'Les Trappes du Kraken : ' || a.name || coalesce(' & ' || b.name, ' (solo)')
          from duo_games d join players a on a.id = d.a left join players b on b.id = d.b where d.created_at >= since
        union all
        select u.created_at, 'achat', '🎁', p.name || ' a obtenu le pion « ' || u.pawn_id || ' »'
          from pawn_unlocks u join players p on p.id = u.player_id where u.created_at >= since
        union all
        select u.created_at, 'achat', '🔓', p.name || ' a débloqué le thème ' || u.topic_id
          from topic_unlocks u join players p on p.id = u.player_id where u.created_at >= since and u.how = 'achat'
        union all
        select l.created_at, 'achat', '💰', p.name || case when l.delta >= 0 then ' a reçu ' || l.delta else ' a dépensé ' || -l.delta end || ' lingots (' || l.reason || ')'
          from wallet_log l join players p on p.id = l.player_id where l.created_at >= since and l.reason in ('cadeau', 'achat') and l.delta <> 0
        union all
        select s.created_at, 'compte', '🔔', p.name || ' a activé les notifications'
          from push_subscriptions s join players p on p.id = s.player_id where s.created_at >= since
        union all
        select r.created_at, 'theme', '💡', p.name || ' a demandé le thème « ' || r.name || ' »'
          from topic_requests r join players p on p.id = r.player_id where r.created_at >= since
        union all
        select t.created_at, 'theme', '✍️', p.name || ' a créé le thème « ' || coalesce(t.meta ->> 'name', '?') || ' » (' || t.n_questions || ' questions)'
          from shared_topics t join players p on p.id = t.owner where t.created_at >= since

      ) x order by at desc limit 400
    ) e), '[]'::json));
end $$;

revoke all on function public.admin_activity(int), public.is_app_admin() from public, anon;
grant execute on function public.admin_activity(int), public.is_app_admin() to authenticated;
