-- Les nouveaux joueurs choisissent eux-mêmes leurs 5 thèmes gratuits au premier lancement.
-- Les comptes d'avant la boutique gardent les 5 anciens thèmes gratuits.
alter table public.topic_unlocks drop constraint if exists topic_unlocks_how_check;
alter table public.topic_unlocks add constraint topic_unlocks_how_check check (how in ('achat', 'ancien', 'depart'));

create or replace function public.topic_price(p_topic text) returns int language sql immutable as $$
  select case when p_topic = 'pokemon' or p_topic like 'c-%' then 60 else 40 end
$$;

create or replace function public.get_unlocks() returns json
language plpgsql security definer set search_path = public as $$
declare pid uuid := current_player(); vet boolean;
begin
  if pid is null then return null; end if;
  select created_at < shop_opening() into vet from players where id = pid;
  insert into topic_unlocks (player_id, topic_id, how)
  select distinct pid, topic_id, 'ancien' from xp_events where player_id = pid
  on conflict do nothing;
  if vet then
    insert into topic_unlocks (player_id, topic_id, how)
    select pid, t, 'ancien' from unnest(array['culture-g', 'histoire', 'capitales', 'cinema', 'musique']) t
    on conflict do nothing;
  end if;
  return json_build_object(
    'topics', coalesce((select json_agg(topic_id) from topic_unlocks where player_id = pid), '[]'::json),
    'veteran', vet,
    'needs_pick', not vet and not exists (select 1 from topic_unlocks where player_id = pid and how = 'depart'));
end $$;

-- Choix des 5 thèmes de départ (une seule fois)
create or replace function public.pick_starter_topics(p_topics jsonb) returns json
language plpgsql security definer set search_path = public as $$
declare pid uuid := current_player();
begin
  if pid is null then raise exception 'aucun joueur'; end if;
  if exists (select 1 from topic_unlocks where player_id = pid and how = 'depart') then return get_unlocks(); end if;
  if jsonb_typeof(p_topics) <> 'array' or jsonb_array_length(p_topics) <> 5
    or (select count(distinct t) from jsonb_array_elements_text(p_topics) t where char_length(t) between 1 and 60) <> 5 then
    raise exception 'il faut choisir 5 thèmes';
  end if;
  insert into topic_unlocks (player_id, topic_id, how)
  select pid, t, 'depart' from jsonb_array_elements_text(p_topics) t
  on conflict (player_id, topic_id) do update set how = 'depart';
  return get_unlocks();
end $$;
revoke all on function public.pick_starter_topics(jsonb) from public, anon;
grant execute on function public.pick_starter_topics(jsonb) to authenticated;

-- Ouverture effective de la boutique : comptes créés avant = anciens joueurs
create or replace function public.shop_opening() returns timestamptz language sql immutable as $$
  select '2026-11-21 23:49:00+00'::timestamptz
$$;
