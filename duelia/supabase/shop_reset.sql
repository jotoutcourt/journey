-- Remise à zéro : plus aucun thème débloqué d'office. Chaque joueur (ancien ou nouveau) choisit ses 5 thèmes
-- au prochain lancement, puis achète les autres avec ses lingots. Les thèmes déjà joués ne sont plus offerts.
delete from public.topic_unlocks;

create or replace function public.get_unlocks() returns json
language plpgsql security definer set search_path = public as $$
declare pid uuid := current_player();
begin
  if pid is null then return null; end if;
  return json_build_object(
    'topics', coalesce((select json_agg(topic_id) from topic_unlocks where player_id = pid), '[]'::json),
    'veteran', false,
    'needs_pick', not exists (select 1 from topic_unlocks where player_id = pid and how = 'depart'));
end $$;

-- l'ancienne récupération des thèmes suivis n'a plus lieu d'être
create or replace function public.claim_topics(p_topics jsonb) returns json
language sql security definer set search_path = public as $$ select get_unlocks() $$;
