-- Chasse au Kraken : « Reprendre plus tard ».
-- Pause votée par tous les joueurs humains (seulement en début de tour), chronos gelés,
-- reprise quand tout le monde est revenu (ou l'hôte relance, les absents sont joués par des robots).
-- Une partie en pause depuis plus de 7 jours est close : chacun convertit ses perles, le trésor reste au Kraken.
alter table public.traque_games add column if not exists pause jsonb;          -- vote en cours : {by, yes: [sièges]}
alter table public.traque_games add column if not exists paused_at timestamptz;
alter table public.traque_games add column if not exists back jsonb;           -- sièges revenus pour la reprise
alter table public.traque_games drop constraint if exists traque_games_status_check;
alter table public.traque_games add constraint traque_games_status_check check (status in ('lobby', 'playing', 'paused', 'done', 'cancelled'));

-- Demande de pause (pendant la phase « lancer le dé », jamais en pleine question)
create or replace function public.traque_pause_ask(p_game uuid) returns json language plpgsql security definer set search_path = public as $$
declare s int := tq_my_seat(p_game); g traque_games;
begin
  select * into g from traque_games where id = p_game for update;
  if g.status <> 'playing' or g.phase <> 'roll' then raise exception 'on ne peut mettre en pause qu''entre deux tours'; end if;
  if g.pause is null then
    update traque_games set pause = jsonb_build_object('by', s, 'yes', jsonb_build_array(s)),
      deadline = greatest(deadline, now() + interval '25 seconds'), version = version + 1 where id = p_game;
    perform tq_log(p_game, '⏸️ ' || tq_name(p_game, s) || ' propose de reprendre la partie plus tard.');
    perform tq_pause_check(p_game);
  end if;
  return traque_view(p_game, current_player());
end $$;

-- Vote : oui ou non
create or replace function public.traque_pause_vote(p_game uuid, p_yes boolean) returns json language plpgsql security definer set search_path = public as $$
declare s int := tq_my_seat(p_game); g traque_games;
begin
  select * into g from traque_games where id = p_game for update;
  if g.pause is not null and g.status = 'playing' then
    if p_yes then
      update traque_games set pause = jsonb_set(pause, '{yes}', (pause -> 'yes') || to_jsonb(s)), version = version + 1 where id = p_game;
      perform tq_pause_check(p_game);
    else
      update traque_games set pause = null, version = version + 1 where id = p_game;
      perform tq_log(p_game, '▶️ ' || tq_name(p_game, s) || ' veut continuer : la partie continue.');
    end if;
  end if;
  return traque_view(p_game, current_player());
end $$;

-- Tous les humains encore là ont dit oui : on met en pause
create or replace function public.tq_pause_check(p_game uuid) returns void language plpgsql as $$
declare g traque_games;
begin
  select * into g from traque_games where id = p_game;
  if g.pause is null or g.status <> 'playing' or g.phase <> 'roll' then return; end if;
  if exists (select 1 from traque_players where game_id = p_game and status = 'joined' and not ((g.pause -> 'yes') @> to_jsonb(seat))) then return; end if;
  update traque_games set status = 'paused', phase = 'paused', pause = null, paused_at = now(), back = '[]'::jsonb, deadline = null,
    data = '{}'::jsonb, version = version + 1 where id = p_game;
  perform tq_log(p_game, '⏸️ Partie mise en pause : à reprendre plus tard (7 jours max).');
end $$;

-- Retour d'un joueur sur une partie en pause ; quand tout le monde est là, la chasse reprend
create or replace function public.traque_back(p_game uuid) returns json language plpgsql security definer set search_path = public as $$
declare s int := tq_my_seat(p_game); g traque_games; pid uuid := current_player(); p record; me_name text;
begin
  select * into g from traque_games where id = p_game for update;
  if g.status = 'paused' and s is not null and not (coalesce(g.back, '[]'::jsonb) @> to_jsonb(s)) then
    update traque_games set back = coalesce(back, '[]'::jsonb) || to_jsonb(s), version = version + 1 where id = p_game;
    -- le premier revenu prévient les autres
    if jsonb_array_length(coalesce(g.back, '[]'::jsonb)) = 0 then
      select name into me_name from players where id = pid;
      for p in select player_id from traque_players where game_id = p_game and status = 'joined' and player_id <> pid loop
        perform notify_player(p.player_id, '🐙 La Chasse reprend !', coalesce(me_name, 'Un joueur') || ' est de retour sur votre partie en pause. On reprend ?', '/');
      end loop;
    end if;
    perform tq_resume_check(p_game, false);
  end if;
  return traque_view(p_game, pid);
end $$;

-- Reprise : tout le monde est revenu, ou l'hôte force (les absents sont joués par des robots)
create or replace function public.tq_resume_check(p_game uuid, p_force boolean) returns void language plpgsql as $$
declare g traque_games; s traque_players;
begin
  select * into g from traque_games where id = p_game;
  if g.status <> 'paused' then return; end if;
  if not p_force and exists (select 1 from traque_players where game_id = p_game and status = 'joined' and not (coalesce(g.back, '[]'::jsonb) @> to_jsonb(seat))) then return; end if;
  if p_force then
    update traque_players set status = 'left' where game_id = p_game and status = 'joined' and not (coalesce(g.back, '[]'::jsonb) @> to_jsonb(seat));
  end if;
  select * into s from traque_players where game_id = p_game and seat = g.turn;
  update traque_games set status = 'playing', phase = case when s.ghost then 'haunt' else 'roll' end,
    data = case when s.ghost then jsonb_build_object('seat', g.turn) else '{}'::jsonb end,
    deadline = now() + make_interval(secs => case when s.bot is not null or s.status = 'left' then 3 else tq_const('roll') end),
    paused_at = null, back = null, version = version + 1 where id = p_game;
  perform tq_log(p_game, '▶️ La chasse reprend !');
end $$;

create or replace function public.traque_resume_now(p_game uuid) returns json language plpgsql security definer set search_path = public as $$
declare pid uuid := current_player();
begin
  perform 1 from traque_games where id = p_game and host = pid and status = 'paused' for update;
  if found then perform tq_resume_check(p_game, true); end if;
  return traque_view(p_game, pid);
end $$;

-- Pause trop longue (7 jours) : la partie est close, chacun garde ses perles converties
create or replace function public.tq_pause_expire(p_game uuid) returns void language plpgsql as $$
begin
  if not exists (select 1 from traque_games where id = p_game and status = 'paused' and paused_at < now() - interval '7 days') then return; end if;
  update traque_players set reward = pearls / 10 where game_id = p_game;
  perform wallet_credit(player_id, pearls / 10, 'traque', null) from traque_players where game_id = p_game and player_id is not null and bot is null and pearls >= 10;
  perform tq_log(p_game, '⌛ Pause de plus de 7 jours : le Kraken garde son trésor.');
  update traque_games set status = 'done', phase = 'done', winner = null, paused_at = null, version = version + 1 where id = p_game;
end $$;

-- La partie en pause reste proposée sur l'accueil (7 jours)
create or replace function public.my_traque() returns uuid language sql stable security definer set search_path = public as $$
  select g.id from traque_games g join traque_players p on p.game_id = g.id
  where p.player_id = current_player() and p.status = 'joined'
    and ((g.status in ('lobby', 'playing') and g.created_at > now() - interval '6 hours') or (g.status = 'paused' and g.paused_at > now() - interval '7 days'))
  order by (g.status = 'paused'), g.created_at desc limit 1
$$;

revoke all on function public.tq_pause_check(uuid), public.tq_resume_check(uuid, boolean), public.tq_pause_expire(uuid) from public, anon, authenticated;
revoke all on function public.traque_pause_ask(uuid), public.traque_pause_vote(uuid, boolean), public.traque_back(uuid), public.traque_resume_now(uuid) from public, anon;
grant execute on function public.traque_pause_ask(uuid), public.traque_pause_vote(uuid, boolean), public.traque_back(uuid), public.traque_resume_now(uuid) to authenticated;
