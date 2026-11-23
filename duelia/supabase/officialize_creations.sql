-- Callie & Arizona, La Villa, Gossip Girl et Pop des années 2000 deviennent des thèmes officiels (à débloquer).
-- Ceux qui y avaient déjà joué les gardent gratuitement.
insert into public.topic_unlocks (player_id, topic_id, how)
select distinct x.player_id, x.topic_id, 'ancien' from public.xp_events x
where x.topic_id in ('c-calzona', 'c-villa', 'c-gossip', 'c-pop2000')
on conflict do nothing;
