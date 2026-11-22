-- Classements v2 : on récompense le niveau, pas seulement le temps de jeu.
--  · Semaine / Mois : total des 10 meilleures parties de la période (points de partie = score du duel + 40 victoire / 20 nul).
--  · Depuis toujours : cote de niveau par thème (façon Elo, départ 1000), classé après 5 parties.
-- Quand le serveur connaît la partie (duel en direct, défi entre amis), il recalcule lui-même les scores
-- et prend la cote réelle de l'adversaire ; sinon (duel contre l'IA) les valeurs envoyées sont bornées.

create table if not exists public.ratings (
  player_id uuid not null references public.players (id) on delete cascade,
  topic_id text not null check (char_length(topic_id) between 1 and 60),
  rating int not null default 1000,
  games int not null default 0,
  updated_at timestamptz not null default now(),
  primary key (player_id, topic_id)
);
alter table public.ratings enable row level security;

create table if not exists public.game_results (
  id bigint generated always as identity primary key,
  player_id uuid not null references public.players (id) on delete cascade,
  topic_id text not null check (char_length(topic_id) between 1 and 60),
  pts int not null check (pts between 0 and 200),
  outcome smallint not null check (outcome in (0, 1, 2)), -- 0 défaite, 1 nul, 2 victoire
  rating_after int not null,
  ref text, -- 'm:<duel en direct>' ou 'c:<défi>' : une seule fois par partie
  at timestamptz not null default now()
);
alter table public.game_results enable row level security;
create unique index if not exists game_results_ref on public.game_results (player_id, ref) where ref is not null;
create index if not exists game_results_topic_at on public.game_results (topic_id, at);
create index if not exists game_results_player_at on public.game_results (player_id, at);

-- Enregistre une partie et renvoie la nouvelle cote : { rating, games, pts }
create or replace function public.record_game(p_topic text, p_my int, p_opp int, p_opp_rating int,
  p_match uuid default null, p_challenge uuid default null) returns json
language plpgsql security definer set search_path = public as $$
declare
  pid uuid := current_player(); my int := p_my; opp int := p_opp; opp_r int := p_opp_rating;
  other uuid; v_ref text; r record; e float; s float; k int; delta int; pts int; oc smallint; m record; c record;
begin
  if pid is null or char_length(p_topic) not between 1 and 60 then return null; end if;
  if (select count(*) from game_results where player_id = pid and at > now() - interval '1 hour') >= 60 then return null; end if;

  if p_match is not null then
    select * into m from matches where id = p_match and pid in (p1, p2) and topic_id = p_topic;
    if not found then return null; end if;
    select (x ->> 'me')::int, (x ->> 'opp')::int into my, opp from (select live_result(p_match)::jsonb as x) q;
    other := case when m.p1 = pid then m.p2 else m.p1 end;
    v_ref := 'm:' || p_match;
  elsif p_challenge is not null then
    select * into c from friend_challenges where id = p_challenge and pid in (from_player, to_player) and status = 'done' and topic_id = p_topic;
    if not found then return null; end if;
    if c.from_player = pid then my := c.from_score; opp := c.to_score; other := c.to_player;
    else my := c.to_score; opp := c.from_score; other := c.from_player; end if;
    v_ref := 'c:' || p_challenge;
  end if;

  if v_ref is not null and exists (select 1 from game_results g where g.player_id = pid and g.ref = v_ref) then
    select rating, games into r from ratings where player_id = pid and topic_id = p_topic;
    return json_build_object('rating', coalesce(r.rating, 1000), 'games', coalesce(r.games, 0), 'dup', true);
  end if;

  my := greatest(0, least(coalesce(my, 0), 160));
  opp := greatest(0, least(coalesce(opp, 0), 160));
  if other is not null then
    select rating into opp_r from ratings where player_id = other and topic_id = p_topic;
    opp_r := coalesce(opp_r, 1000);
  else
    opp_r := greatest(700, least(coalesce(opp_r, 1000), 1750));
  end if;

  oc := case when my > opp then 2 when my = opp then 1 else 0 end;
  pts := my + case oc when 2 then 40 when 1 then 20 else 0 end;

  insert into ratings (player_id, topic_id) values (pid, p_topic) on conflict do nothing;
  select rating, games into r from ratings where player_id = pid and topic_id = p_topic for update;
  e := 1.0 / (1 + power(10, (opp_r - r.rating) / 400.0));
  s := oc / 2.0;
  k := case when r.games < 10 then 40 else 24 end;
  delta := round(k * (s - e));
  update ratings set rating = greatest(100, r.rating + delta), games = r.games + 1, updated_at = now()
    where player_id = pid and topic_id = p_topic;
  insert into game_results (player_id, topic_id, pts, outcome, rating_after, ref)
    values (pid, p_topic, pts, oc, greatest(100, r.rating + delta), v_ref);
  return json_build_object('rating', greatest(100, r.rating + delta), 'games', r.games + 1, 'pts', pts);
end $$;

-- Classement d'un thème. Même forme qu'avant (colonne xp = valeur classée), plus le nombre de parties.
drop function if exists public.get_leaderboard(text, text);
create or replace function public.get_leaderboard(p_topic text, p_period text)
returns table (player_id uuid, name text, avatar text, flag text, xp bigint, games int)
language sql stable security definer set search_path = public as $$
  select * from (
    select p.id, p.name, p.avatar, p.flag, rt.rating::bigint, rt.games
    from ratings rt join players p on p.id = rt.player_id
    where p_period = 'all' and rt.topic_id = p_topic and rt.games >= 5
    union all
    select p.id, p.name, p.avatar, p.flag, sum(g.pts)::bigint, count(*)::int
    from (
      select gr.player_id, gr.pts, row_number() over (partition by gr.player_id order by gr.pts desc) as n
      from game_results gr
      where p_period in ('week', 'month') and gr.topic_id = p_topic
        and gr.at >= case p_period when 'week' then date_trunc('week', now()) else date_trunc('month', now()) end
    ) g join players p on p.id = g.player_id
    where g.n <= 10
    group by p.id
  ) b
  order by 5 desc
  limit 100
$$;

-- Ma cote sur chaque thème (pour remettre l'appareil d'accord avec le serveur)
create or replace function public.my_ratings() returns json
language sql stable security definer set search_path = public as $$
  select coalesce(json_object_agg(topic_id, json_build_object('rating', rating, 'games', games)), '{}'::json)
  from ratings where player_id = current_player()
$$;

revoke all on function public.record_game(text, int, int, int, uuid, uuid), public.get_leaderboard(text, text), public.my_ratings() from public, anon;
grant execute on function public.record_game(text, int, int, int, uuid, uuid), public.get_leaderboard(text, text), public.my_ratings() to authenticated;
