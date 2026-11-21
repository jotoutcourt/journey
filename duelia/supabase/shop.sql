-- Boutique de thèmes : 5 thèmes gratuits, les autres se débloquent avec des lingots (vérifié par le serveur).
-- Les thèmes déjà joués (XP sur le serveur) restent débloqués ; les joueurs d'avant la boutique peuvent aussi
-- garder les thèmes qu'ils suivaient.
create table if not exists public.topic_unlocks (
  player_id uuid not null references public.players (id) on delete cascade,
  topic_id text not null check (char_length(topic_id) between 1 and 60),
  how text not null default 'achat' check (how in ('achat', 'ancien')),
  created_at timestamptz not null default now(),
  primary key (player_id, topic_id)
);
alter table public.topic_unlocks enable row level security;
revoke all on public.topic_unlocks from anon, authenticated;

-- Prix d'un thème (0 = gratuit pour tous)
create or replace function public.topic_price(p_topic text) returns int language sql immutable as $$
  select case
    when p_topic in ('culture-g', 'histoire', 'capitales', 'cinema', 'musique') then 0
    when p_topic = 'pokemon' or p_topic like 'c-%' then 60
    else 40 end
$$;

-- Date d'ouverture de la boutique : les comptes plus anciens gardent leurs thèmes suivis
create or replace function public.shop_opening() returns timestamptz language sql immutable as $$
  select '2026-11-22 02:00:00+01'::timestamptz
$$;

create or replace function public.get_unlocks() returns json
language plpgsql security definer set search_path = public as $$
declare pid uuid := current_player();
begin
  if pid is null then return null; end if;
  -- thèmes déjà joués : débloqués d'office
  insert into topic_unlocks (player_id, topic_id, how)
  select distinct pid, topic_id, 'ancien' from xp_events where player_id = pid and topic_price(topic_id) > 0
  on conflict do nothing;
  return json_build_object(
    'topics', coalesce((select json_agg(topic_id) from topic_unlocks where player_id = pid), '[]'::json),
    'veteran', (select created_at < shop_opening() from players where id = pid));
end $$;

-- Anciens joueurs : garder les thèmes suivis avant l'ouverture de la boutique (une seule fois)
create or replace function public.claim_topics(p_topics jsonb) returns json
language plpgsql security definer set search_path = public as $$
declare pid uuid := current_player();
begin
  if pid is null then return null; end if;
  if (select created_at >= shop_opening() from players where id = pid) or now() > shop_opening() + interval '30 days' then return get_unlocks(); end if;
  if jsonb_typeof(p_topics) <> 'array' or jsonb_array_length(p_topics) > 60 then raise exception 'liste invalide'; end if;
  insert into topic_unlocks (player_id, topic_id, how)
  select pid, left(t, 60), 'ancien' from jsonb_array_elements_text(p_topics) t where char_length(t) between 1 and 60 and topic_price(t) > 0
  on conflict do nothing;
  return get_unlocks();
end $$;

-- Acheter un thème
create or replace function public.unlock_topic(p_topic text) returns json
language plpgsql security definer set search_path = public as $$
declare pid uuid := current_player(); price int := topic_price(p_topic);
begin
  if pid is null then raise exception 'aucun joueur'; end if;
  if price = 0 or exists (select 1 from topic_unlocks where player_id = pid and topic_id = p_topic) then return json_build_object('unlocks', get_unlocks(), 'wallet', get_wallet()); end if;
  if coalesce((select lingots from wallets where player_id = pid for update), 0) < price then raise exception 'pas assez de lingots'; end if;
  perform wallet_credit(pid, -price, 'achat', null);
  insert into topic_unlocks (player_id, topic_id, how) values (pid, p_topic, 'achat');
  return json_build_object('unlocks', get_unlocks(), 'wallet', get_wallet());
end $$;

revoke all on function public.topic_price(text), public.shop_opening() from public, anon;
grant execute on function public.topic_price(text) to authenticated;
revoke all on function public.get_unlocks(), public.claim_topics(jsonb), public.unlock_topic(text) from public, anon;
grant execute on function public.get_unlocks(), public.claim_topics(jsonb), public.unlock_topic(text) to authenticated;
