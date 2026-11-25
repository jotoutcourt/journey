-- « La Traque du Kraken » : jeu de plateau en direct, de 2 à 4 joueurs (humains ou robots).
-- Plateau de 80 cases en spirale vers l'antre du Kraken. Le serveur est seul maître du jeu :
-- il tire les dés, choisit les questions, mesure les temps de réponse, fait jouer les robots et applique les effets.
-- Chaque appel (vue ou action) fait avancer la partie (traque_tick) : pas besoin de tâche planifiée.

alter table public.wallet_log drop constraint if exists wallet_log_reason_check;
alter table public.wallet_log add constraint wallet_log_reason_check check (reason in
  ('butin', 'bonus_jour', 'parfait', 'achat', 'cadeau', 'mise', 'gain_duel', 'remboursement', 'mission', 'traque'));

create table if not exists public.traque_games (
  id uuid primary key default gen_random_uuid(),
  host uuid not null references public.players (id) on delete cascade,
  status text not null default 'lobby' check (status in ('lobby', 'playing', 'paused', 'done', 'cancelled')),
  board jsonb not null default '[]'::jsonb,      -- [{t: type, topic?: id}]
  topics jsonb not null default '{}'::jsonb,     -- id -> {name, icon, color}
  general jsonb not null default '[]'::jsonb,    -- ids des thèmes « généraux »
  pool jsonb not null default '{}'::jsonb,       -- id -> [{q, o:[4], c}]
  used jsonb not null default '{}'::jsonb,       -- id -> [indices déjà posés]
  turn int not null default 0,
  round int not null default 0,
  phase text not null default 'lobby',
  data jsonb not null default '{}'::jsonb,
  deadline timestamptz,
  treasure int not null default 0,
  winner int,
  log jsonb not null default '[]'::jsonb,
  version int not null default 0,
  started_at timestamptz,
  created_at timestamptz not null default now()
);
create table if not exists public.traque_players (
  game_id uuid not null references public.traque_games (id) on delete cascade,
  seat int not null check (seat between 0 and 7),
  player_id uuid references public.players (id) on delete cascade,
  bot text check (bot in ('facile', 'moyen', 'expert')),
  name text not null,
  avatar text,
  photo text,
  status text not null default 'invited' check (status in ('invited', 'joined', 'declined', 'left', 'bot')),
  topics jsonb not null default '[]'::jsonb,
  pos int not null default 0,
  pearls int not null default 0,
  items jsonb not null default '[]'::jsonb,
  skip int not null default 0,
  reward int not null default 0,
  updated_at timestamptz not null default now(),
  primary key (game_id, seat)
);
alter table public.traque_players add column if not exists bubble boolean not null default false;
-- questions des spécialités, envoyées par chaque joueur (l'hôte ne les voit pas)
alter table public.traque_players add column if not exists pool jsonb;
-- dévoré par le requin : fantôme (ne peut plus gagner, hante les autres)
alter table public.traque_players add column if not exists ghost boolean not null default false;
create index if not exists traque_players_player on public.traque_players (player_id, status);
alter table public.traque_games enable row level security;
alter table public.traque_players enable row level security;
revoke all on public.traque_games, public.traque_players from anon, authenticated;

-- Réglages
create or replace function public.tq_const(k text) returns int language sql immutable as $$
  select case k
    when 'cells' then 83 when 'answer' then 12 when 'hard' then 9 when 'reveal' then 4 when 'roll' then 30
    when 'show' then 5 when 'event' then 5 when 'shop_max' then 3 end
$$;
create or replace function public.tq_item_cost(k text) returns int language sql immutable as $$
  select case k when 'double' then 6 when 'ancre' then 5 when 'joker' then 4 when 'vol' then 5 when 'echange' then 8 when 'harpon' then 7 end
$$;

-- Journal (30 derniers événements)
create or replace function public.tq_log(p_game uuid, p_text text) returns void language sql as $$
  update traque_games set log = (select coalesce(jsonb_agg(x), '[]'::jsonb) from (
      select x from jsonb_array_elements(log || jsonb_build_array(jsonb_build_object('t', p_text, 'at', extract(epoch from now())))) x
      offset greatest(0, jsonb_array_length(log) + 1 - 30)) s)
  where id = p_game
$$;

-- Tire une question d'un thème (sans répétition tant que possible)
create or replace function public.tq_pick(p_game uuid, p_topic text) returns jsonb language plpgsql as $$
declare g traque_games; n int; usd int[]; free int[]; qi int;
begin
  select * into g from traque_games where id = p_game;
  n := jsonb_array_length(coalesce(g.pool -> p_topic, '[]'::jsonb));
  if n = 0 then
    -- thème sans questions : un thème général au hasard
    p_topic := g.general ->> floor(random() * jsonb_array_length(g.general))::int;
    n := jsonb_array_length(coalesce(g.pool -> p_topic, '[]'::jsonb));
  end if;
  select coalesce(array_agg(v::int), '{}') into usd from jsonb_array_elements_text(coalesce(g.used -> p_topic, '[]'::jsonb)) v;
  select coalesce(array_agg(i), '{}') into free from generate_series(0, n - 1) i where not (i = any(usd));
  if cardinality(free) = 0 then free := array(select generate_series(0, n - 1)); usd := '{}'; end if;
  qi := free[1 + floor(random() * cardinality(free))::int];
  update traque_games set used = jsonb_set(used, array[p_topic], to_jsonb(usd || qi)) where id = p_game;
  return jsonb_build_object('topic', p_topic, 'qi', qi);
end $$;

create or replace function public.tq_general(p_game uuid) returns text language sql as $$
  select general ->> floor(random() * jsonb_array_length(general))::int from traque_games where id = p_game
$$;

-- Lance une série de questions (kind : solo | duel | truce | final)
create or replace function public.tq_quiz(p_game uuid, p_kind text, p_seats int[], p_topics text[], p_ctx jsonb, p_hard boolean default false) returns void
language plpgsql as $$
declare items jsonb := '[]'::jsonb; t text;
begin
  foreach t in array p_topics loop items := items || jsonb_build_array(tq_pick(p_game, t)); end loop;
  -- d'abord un écran « prépare-toi » : on voit ce qui arrive, chacun dit qu'il est prêt (12 s max)
  update traque_games set phase = 'intro',
    data = jsonb_build_object('kind', p_kind, 'seats', to_jsonb(p_seats), 'items', items, 'idx', 0, 'reveal', false,
      'ans', '{}'::jsonb, 'jokers', '{}'::jsonb, 'ctx', p_ctx, 'hard', p_hard, 'ready', '[]'::jsonb),
    deadline = now() + interval '12 seconds',
    version = version + 1
  where id = p_game;
end $$;

-- Affiche un événement quelques secondes, puis passe au joueur suivant
create or replace function public.tq_event(p_game uuid, p_text text, p_fx jsonb default '{}'::jsonb) returns void language plpgsql as $$
begin
  perform tq_log(p_game, p_text);
  update traque_games set phase = 'event', data = jsonb_build_object('text', p_text, 'fx', p_fx),
    deadline = now() + make_interval(secs => tq_const('event')), version = version + 1 where id = p_game;
end $$;

-- Déplacement « bonus » (sans effet de case, sauf l'antre)
create or replace function public.tq_shift(p_game uuid, p_seat int, p_delta int) returns int language plpgsql as $$
declare np int;
begin
  update traque_players set pos = greatest(0, least(tq_const('cells') - 1, pos + p_delta)), updated_at = now()
  where game_id = p_game and seat = p_seat returning pos into np;
  if p_delta < 0 then perform tq_stat(p_game, p_seat, 'back', -p_delta); end if;
  return np;
end $$;

create or replace function public.tq_name(p_game uuid, p_seat int) returns text language sql as $$
  select name from traque_players where game_id = p_game and seat = p_seat
$$;

-- Combat final contre le Kraken : 5 questions, au moins une dans chaque spécialité
create or replace function public.tq_final(p_game uuid, p_seat int) returns void language plpgsql as $$
declare tps text[];
begin
  select coalesce(array_agg(x ->> 'id'), '{}') into tps from traque_players, jsonb_array_elements(topics) x where game_id = p_game and seat = p_seat;
  while cardinality(tps) < 5 loop tps := tps || tq_general(p_game); end loop;
  perform tq_log(p_game, '🐙 ' || tq_name(p_game, p_seat) || ' entre dans l''antre du Kraken !');
  perform tq_quiz(p_game, 'final', array[p_seat], tps[1:5], '{}'::jsonb, false);
end $$;

-- Effet de la case où le joueur vient d'arriver au dé
create or replace function public.tq_land(p_game uuid, p_seat int) returns void language plpgsql as $$
declare g traque_games; me traque_players; cell jsonb; typ text; other int; owner int; topic text; n int; ev text; r float; tps text[];
begin
  select * into g from traque_games where id = p_game;
  select * into me from traque_players where game_id = p_game and seat = p_seat;
  if me.pos >= tq_const('cells') - 1 then perform tq_final(p_game, p_seat); return; end if;
  cell := g.board -> me.pos; typ := cell ->> 't'; topic := cell ->> 'topic';
  -- Deux joueurs sur la même case : duel
  select seat into other from traque_players where game_id = p_game and seat <> p_seat and pos = me.pos and me.pos > 0
    and status in ('joined', 'bot', 'left') and not ghost order by random() limit 1;
  if other is not null then
    perform tq_log(p_game, '⚔️ ' || me.name || ' rejoint ' || tq_name(p_game, other) || ' : duel !');
    perform tq_quiz(p_game, 'duel', array[p_seat, other],
      array[coalesce(topic, tq_general(p_game)), coalesce(topic, tq_general(p_game)), coalesce(topic, tq_general(p_game))],
      jsonb_build_object('a', p_seat, 'b', other, 'topic', topic));
    return;
  end if;
  if typ = 'general' then
    perform tq_quiz(p_game, 'solo', array[p_seat], array[topic], jsonb_build_object('reason', 'general'));
  elsif typ = 'spec' then
    if exists (select 1 from jsonb_array_elements(me.topics) x where x ->> 'id' = topic) then
      perform tq_quiz(p_game, 'solo', array[p_seat], array[topic], jsonb_build_object('reason', 'own'), true);
    else
      select seat into owner from traque_players p, jsonb_array_elements(p.topics) x
        where p.game_id = p_game and p.seat <> p_seat and x ->> 'id' = topic order by random() limit 1;
      if owner is null then
        perform tq_quiz(p_game, 'solo', array[p_seat], array[topic], jsonb_build_object('reason', 'general'));
      else
        perform tq_log(p_game, '⚔️ ' || me.name || ' entre sur le territoire de ' || tq_name(p_game, owner) || ' : duel !');
        perform tq_quiz(p_game, 'duel', array[p_seat, owner], array[topic, topic, topic], jsonb_build_object('a', p_seat, 'b', owner, 'topic', topic));
      end if;
    end if;
  elsif typ = 'shortcut' then
    perform tq_quiz(p_game, 'solo', array[p_seat], array[coalesce(topic, tq_general(p_game))], jsonb_build_object('reason', 'shortcut'), true);
  elsif typ = 'truce' then
    perform tq_log(p_game, '🤝 Trêve ! Tout le monde remplit le trésor ensemble.');
    perform tq_quiz(p_game, 'truce', (select array_agg(seat order by seat) from traque_players where game_id = p_game and status in ('joined', 'bot', 'left')),
      array[tq_general(p_game), tq_general(p_game), tq_general(p_game), tq_general(p_game), tq_general(p_game)], jsonb_build_object('t0', g.treasure));
  elsif typ = 'chest' then
    n := 3 + floor(random() * 5)::int;
    update traque_players set pearls = pearls + n where game_id = p_game and seat = p_seat;
    perform tq_stat(p_game, p_seat, 'chest', n);
    perform tq_event(p_game, '💰 ' || me.name || ' trouve un coffre : +' || n || ' perles', jsonb_build_object('pearls', n, 'seat', p_seat));
  elsif typ = 'current' then
    n := case when random() < 0.5 then 2 else -2 end;
    perform tq_shift(p_game, p_seat, n);
    perform tq_event(p_game, '🌊 Un courant emporte ' || me.name || (case when n > 0 then ' de 2 cases en avant' else ' de 2 cases en arrière' end),
      jsonb_build_object('move', n, 'seat', p_seat));
  elsif typ = 'tentacle' then
    r := random();
    if r < 0.3 then
      update traque_players set pos = greatest(0, pos - 2) where game_id = p_game and seat <> p_seat;
      ev := '🐙 Un tentacule balaie le plateau : tous les autres reculent de 2 cases !';
    elsif r < 0.55 then
      select seat into other from traque_players where game_id = p_game and seat <> p_seat and status in ('joined', 'bot', 'left') and not ghost order by random() limit 1;
      if other is not null then
        update traque_players t set pos = case when t.seat = p_seat then o.pos else me.pos end
        from (select pos from traque_players where game_id = p_game and seat = other) o
        where t.game_id = p_game and t.seat in (p_seat, other);
        ev := '🐙 Un tentacule échange ' || me.name || ' et ' || tq_name(p_game, other) || ' !';
      else ev := '🐙 Le tentacule rate sa cible.'; end if;
    elsif r < 0.8 then
      update traque_players set skip = skip + 1 where game_id = p_game and seat = p_seat;
      ev := '🐙 Un tentacule attrape ' || me.name || ' : il passe son prochain tour.';
    else
      perform tq_shift(p_game, p_seat, 3);
      ev := '🐙 Le Kraken éternue : ' || me.name || ' est projeté de 3 cases en avant !';
    end if;
    perform tq_event(p_game, ev, jsonb_build_object('tentacle', true));
  elsif typ = 'shark' then
    if me.items ? 'harpon' then
      update traque_players set items = items - (select (ord - 1)::int from jsonb_array_elements_text(items) with ordinality e(v, ord) where v = 'harpon' order by ord limit 1),
        pearls = pearls + 3 where game_id = p_game and seat = p_seat;
      perform tq_event(p_game, '🔱 ' || me.name || ' repousse le requin d''un coup de harpon : +3 perles !', jsonb_build_object('harpon', true, 'seat', p_seat));
    else
      -- 2 questions difficiles dans les spécialités des adversaires : une seule bonne réponse suffit
      select array_agg(t) into tps from (select x ->> 'id' t from traque_players p, jsonb_array_elements(p.topics) x
        where p.game_id = p_game and p.seat <> p_seat and x ? 'id' and g.pool ? (x ->> 'id') order by random() limit 2) z;
      while coalesce(cardinality(tps), 0) < 2 loop tps := coalesce(tps, '{}'::text[]) || tq_general(p_game); end loop;
      perform tq_log(p_game, '🦈 Un requin fonce sur ' || me.name || ' !');
      perform tq_quiz(p_game, 'solo', array[p_seat], tps, jsonb_build_object('reason', 'shark'), true);
    end if;
  elsif typ = 'crab' then
    -- Crabe farceur : échange de place avec un joueur tiré au hasard
    select seat into other from traque_players where game_id = p_game and seat <> p_seat and status in ('joined', 'bot', 'left') and not ghost order by random() limit 1;
    if other is not null then
      update traque_players t set pos = case when t.seat = p_seat then o.pos else me.pos end
      from (select pos from traque_players where game_id = p_game and seat = other) o
      where t.game_id = p_game and t.seat in (p_seat, other);
      update traque_games set board = jsonb_set(board, array[me.pos::text], jsonb_build_object('t', 'general', 'topic', tq_general(p_game))) where id = p_game;
      perform tq_event(p_game, '🦀 Le crabe farceur pince ' || me.name || ' et l''échange de place avec ' || tq_name(p_game, other) || ' !', jsonb_build_object('crab', true, 'seat', p_seat, 'other', other));
    else perform tq_event(p_game, '🦀 Le crabe farceur cherche quelqu''un à pincer… personne !', '{}'::jsonb); end if;
  elsif typ = 'bubble' then
    update traque_players set bubble = true where game_id = p_game and seat = p_seat;
    perform tq_event(p_game, '🫧 ' || me.name || ' est pris dans une bulle : son prochain dé comptera double, sans arrêt en boutique !', jsonb_build_object('bubble', true, 'seat', p_seat));
  elsif typ = 'puffer' then
    -- Poisson-ballon (une seule fois) : +2 perles pour les autres, -2 pour le joueur
    update traque_players set pearls = pearls + 2 where game_id = p_game and seat <> p_seat and status in ('joined', 'bot', 'left');
    update traque_players set pearls = greatest(0, pearls - 2) where game_id = p_game and seat = p_seat;
    update traque_games set board = jsonb_set(board, array[me.pos::text], jsonb_build_object('t', 'general', 'topic', tq_general(p_game))) where id = p_game;
    perform tq_event(p_game, '🐡 Le poisson-ballon explose ! Tout le monde gagne 2 perles… sauf ' || me.name || ', qui en perd 2.', jsonb_build_object('puffer', true, 'seat', p_seat));
  elsif typ = 'whirl' then
    -- Tourbillon (une seule fois) : tous les pions sont mélangés
    with a as (select seat, pos, row_number() over (order by seat) rn from traque_players where game_id = p_game and status in ('joined', 'bot', 'left') and not ghost),
         b as (select pos, row_number() over (order by random()) rn from a)
    update traque_players t set pos = b.pos from a join b using (rn) where t.game_id = p_game and t.seat = a.seat;
    update traque_games set board = jsonb_set(board, array[me.pos::text], jsonb_build_object('t', 'general', 'topic', tq_general(p_game))) where id = p_game;
    perform tq_event(p_game, '🌀 ' || me.name || ' déclenche un tourbillon : tous les pions sont mélangés !', jsonb_build_object('whirl', true));
  elsif typ = 'cursed' then
    -- Coffre maudit : 3 coffres fermés, à choisir
    update traque_games set phase = 'pick',
      data = jsonb_build_object('seat', p_seat, 'cell', me.pos, 'box', (select jsonb_agg(x order by random()) from unnest(array['pearls', 'item', 'tentacle']) x)),
      deadline = now() + make_interval(secs => case when me.bot is not null or me.status = 'left' then 2 else 15 end), version = version + 1
    where id = p_game;
    perform tq_log(p_game, '🎁 ' || me.name || ' tombe sur le coffre maudit : trois coffres, un seul choix…');
  else
    perform tq_event(p_game, me.name || ' se repose.', '{}'::jsonb);
  end if;
end $$;

-- Ouverture d'un des 3 coffres maudits
create or replace function public.tq_cursed_open(p_game uuid, p_choice int) returns void language plpgsql as $$
declare g traque_games; s int; nm text; what text; it text; bag int;
begin
  select * into g from traque_games where id = p_game;
  if g.phase <> 'pick' then return; end if;
  s := (g.data ->> 'seat')::int; nm := tq_name(p_game, s);
  what := g.data -> 'box' ->> least(2, greatest(0, p_choice));
  if what = 'pearls' then
    update traque_players set pearls = pearls + 6 where game_id = p_game and seat = s;
    perform tq_event(p_game, '🎁 ' || nm || ' ouvre le bon coffre : +6 perles !', jsonb_build_object('cursed', p_choice, 'box', g.data -> 'box', 'seat', s));
  elsif what = 'item' then
    select jsonb_array_length(items) into bag from traque_players where game_id = p_game and seat = s;
    it := (array['double', 'ancre', 'joker', 'vol', 'echange', 'harpon'])[1 + floor(random() * 6)::int];
    if bag < 3 then
      update traque_players set items = items || to_jsonb(it) where game_id = p_game and seat = s;
      perform tq_event(p_game, '🎁 ' || nm || ' trouve un objet dans le coffre : ' || case it when 'double' then 'le double dé' when 'ancre' then 'l''ancre' when 'joker' then 'le joker 50/50' when 'vol' then 'le vol' when 'harpon' then 'le harpon' else 'l''échange' end || ' !', jsonb_build_object('cursed', p_choice, 'box', g.data -> 'box', 'seat', s, 'item', it));
    else
      update traque_players set pearls = pearls + 4 where game_id = p_game and seat = s;
      perform tq_event(p_game, '🎁 Un objet dans le coffre, mais le sac de ' || nm || ' est plein : +4 perles à la place.', jsonb_build_object('cursed', p_choice, 'box', g.data -> 'box', 'seat', s));
    end if;
  else
    perform tq_shift(p_game, s, -3);
    perform tq_event(p_game, '🐙 Coffre maudit ! Un tentacule en jaillit et entraîne ' || nm || ' 3 cases en arrière.', jsonb_build_object('cursed', p_choice, 'box', g.data -> 'box', 'seat', s, 'tentacle', true));
  end if;
end $$;

create or replace function public.traque_cursed(p_game uuid, p_choice int) returns json language plpgsql security definer set search_path = public as $$
declare s int := tq_my_seat(p_game); g traque_games;
begin
  select * into g from traque_games where id = p_game for update;
  if g.phase = 'pick' and (g.data ->> 'seat')::int = s then perform tq_cursed_open(p_game, p_choice); end if;
  perform traque_tick(p_game);
  return traque_view(p_game, current_player());
end $$;

-- Joueur suivant (en sautant ceux qui sont bloqués)
create or replace function public.tq_next(p_game uuid) returns void language plpgsql as $$
declare g traque_games; nxt int; s record; tries int := 0;
begin
  select * into g from traque_games where id = p_game;
  nxt := g.turn;
  loop
    tries := tries + 1;
    select seat into nxt from traque_players where game_id = p_game and status in ('joined', 'bot', 'left') and seat > nxt order by seat limit 1;
    if nxt is null then
      select seat into nxt from traque_players where game_id = p_game and status in ('joined', 'bot', 'left') order by seat limit 1;
      update traque_games set round = round + 1 where id = p_game;
    end if;
    select * into s from traque_players where game_id = p_game and seat = nxt;
    if s.skip > 0 and tries < 8 then
      update traque_players set skip = skip - 1 where game_id = p_game and seat = nxt;
      perform tq_log(p_game, '⚓ ' || s.name || ' est bloqué et passe son tour.');
    else exit; end if;
  end loop;
  update traque_games set turn = nxt, phase = case when s.ghost then 'haunt' else 'roll' end,
    data = case when s.ghost then jsonb_build_object('seat', nxt) else '{}'::jsonb end,
    deadline = now() + make_interval(secs => case when s.bot is not null or s.status = 'left' then 2 else tq_const('roll') end),
    version = version + 1 where id = p_game;
  perform tq_pause_check(p_game);
end $$;

-- Le fantôme hante un joueur : il lance le dé, la cible recule d'autant
create or replace function public.tq_haunt(p_game uuid, p_target int) returns void language plpgsql as $$
declare g traque_games; s int; tg int; d int;
begin
  select * into g from traque_games where id = p_game;
  if g.phase <> 'haunt' then return; end if;
  s := (g.data ->> 'seat')::int;
  select seat into tg from traque_players where game_id = p_game and seat = p_target and seat <> s and not ghost and status in ('joined', 'bot', 'left');
  if tg is null then
    select seat into tg from traque_players where game_id = p_game and seat <> s and not ghost and status in ('joined', 'bot', 'left') order by pos desc limit 1;
  end if;
  if tg is null then perform tq_event(p_game, '👻 ' || tq_name(p_game, s) || ' erre sur le plateau… personne à hanter.', '{}'::jsonb); return; end if;
  d := 1 + floor(random() * 6)::int;
  perform tq_shift(p_game, tg, -d);
  perform tq_event(p_game, '👻 ' || tq_name(p_game, s) || ' hante ' || tq_name(p_game, tg) || ' : 🎲 ' || d || ', il recule de ' || d || ' case' || case when d > 1 then 's' else '' end || ' !',
    jsonb_build_object('haunt', true, 'dice', d, 'seat', tg, 'by', s));
end $$;

create or replace function public.traque_haunt(p_game uuid, p_target int) returns json language plpgsql security definer set search_path = public as $$
declare s int := tq_my_seat(p_game); g traque_games;
begin
  select * into g from traque_games where id = p_game for update;
  if g.phase = 'haunt' and (g.data ->> 'seat')::int = s then perform tq_haunt(p_game, p_target); end if;
  perform traque_tick(p_game);
  return traque_view(p_game, current_player());
end $$;

-- Annonce d'un objet utilisé, affichée en grand à tous les joueurs (en plus du journal)
create or replace function public.tq_flash(p_game uuid, p_k text, p_by int, p_to int, p_text text) returns void language plpgsql as $$
begin
  perform tq_log(p_game, p_text);
  update traque_games set data = data || jsonb_build_object('flash', jsonb_build_object('k', p_k, 'by', p_by, 'to', p_to, 't', p_text, 'id', gen_random_uuid())),
    version = version + 1 where id = p_game;
end $$;

-- Lancer de dé du joueur actif
create or replace function public.tq_roll(p_game uuid) returns void language plpgsql as $$
declare g traque_games; me traque_players; d1 int; d2 int := 0; tot int; np int; shop int;
begin
  select * into g from traque_games where id = p_game;
  if g.phase <> 'roll' then return; end if;
  select * into me from traque_players where game_id = p_game and seat = g.turn;
  d1 := 1 + floor(random() * 6)::int;
  if coalesce((g.data ->> 'double')::boolean, false) then d2 := 1 + floor(random() * 6)::int; end if;
  tot := d1 + d2;
  if me.bubble then tot := tot * 2; update traque_players set bubble = false where game_id = p_game and seat = g.turn; end if;
  np := least(tq_const('cells') - 1, me.pos + tot);
  if not me.bubble then
    select min(i) into shop from generate_series(me.pos + 1, np) i where g.board -> i ->> 't' = 'shop';
  end if;
  update traque_players set pos = coalesce(shop, np), updated_at = now() where game_id = p_game and seat = g.turn;
  perform tq_log(p_game, '🎲 ' || me.name || ' fait ' || tot || case when d2 > 0 then ' (' || d1 || ' + ' || d2 || ')' else '' end || case when me.bubble then ' : la bulle double le dé ! 🫧' else '' end);
  update traque_games set phase = 'show', data = jsonb_build_object('dice', jsonb_build_array(d1) || case when d2 > 0 then jsonb_build_array(d2) else '[]'::jsonb end,
    'from', me.pos, 'to', coalesce(shop, np), 'seat', g.turn) || case when g.data ? 'flash' then jsonb_build_object('flash', g.data -> 'flash') else '{}'::jsonb end || case when shop is not null then jsonb_build_object('shop', shop, 'rest', np - shop) else '{}'::jsonb end,
    deadline = now() + make_interval(secs => tq_const('show')), version = version + 1 where id = p_game;
end $$;

-- Fin de partie : le vainqueur rafle le trésor, les autres convertissent leurs perles (10 perles = 1 lingot)
create or replace function public.tq_finish(p_game uuid, p_winner int) returns void language plpgsql as $$
declare g traque_games; p record; amount int;
begin
  select * into g from traque_games where id = p_game;
  for p in select * from traque_players where game_id = p_game loop
    amount := case when p.seat = p_winner then g.treasure + p.pearls / 10 else p.pearls / 10 end;
    update traque_players set reward = amount where game_id = p_game and seat = p.seat;
    if p.player_id is not null and p.bot is null and amount > 0 then perform wallet_credit(p.player_id, amount, 'traque', null); end if;
  end loop;
  perform tq_log(p_game, '🏆 ' || tq_name(p_game, p_winner) || ' a tué le Kraken et vole le trésor de ' || g.treasure || ' lingots !');
  update traque_games set status = 'done', phase = 'done', winner = p_winner, deadline = null, version = version + 1 where id = p_game;
end $$;

-- Fin d'une série de questions : on applique le résultat
create or replace function public.tq_quiz_done(p_game uuid) returns void language plpgsql as $$
declare g traque_games; d jsonb; kind text; s int; ok int; okb int; ta int; tb int; a int; b int; win int; lose int; n int; i int; seat_ int; nm text; reason text;
begin
  select * into g from traque_games where id = p_game;
  d := g.data; kind := d ->> 'kind';
  if kind = 'solo' then
    s := (d -> 'seats' ->> 0)::int; nm := tq_name(p_game, s); reason := d -> 'ctx' ->> 'reason';
    ok := case when (d -> 'ans' -> s::text -> 0 ->> 0)::int = (g.pool -> (d -> 'items' -> 0 ->> 'topic') -> ((d -> 'items' -> 0 ->> 'qi')::int) ->> 'c')::int then 1 else 0 end;
    if reason = 'general' then
      if ok = 1 then update traque_players set pearls = pearls + 2 where game_id = p_game and seat = s;
        perform tq_event(p_game, '✅ ' || nm || ' répond juste : +2 perles', jsonb_build_object('pearls', 2, 'seat', s));
      else perform tq_shift(p_game, s, -1);
        perform tq_event(p_game, '❌ ' || nm || ' se trompe et recule d''une case', jsonb_build_object('move', -1, 'seat', s)); end if;
    elsif reason = 'own' then
      if ok = 1 then update traque_players set pearls = pearls + 3 where game_id = p_game and seat = s;
        if tq_shift(p_game, s, 3) >= tq_const('cells') - 1 then perform tq_final(p_game, s); return; end if;
        perform tq_event(p_game, '⭐ ' || nm || ' brille dans sa spécialité : +3 cases et +3 perles', jsonb_build_object('move', 3, 'seat', s));
      else perform tq_event(p_game, '😬 ' || nm || ' rate une question de sa propre spécialité…', '{}'::jsonb); end if;
    elsif reason = 'shark' then
      ok := 0;
      for i in 0 .. jsonb_array_length(d -> 'items') - 1 loop
        if (d -> 'ans' -> s::text -> i ->> 0)::int = (g.pool -> (d -> 'items' -> i ->> 'topic') -> ((d -> 'items' -> i ->> 'qi')::int) ->> 'c')::int then ok := ok + 1; end if;
      end loop;
      if ok >= 1 then
        perform tq_stat(p_game, s, 'shark_ok');
        perform tq_event(p_game, '🦈 ' || nm || ' échappe au requin (' || ok || '/2) !', jsonb_build_object('shark', 'escape', 'seat', s));
      else
        update traque_players set ghost = true, bubble = false, skip = 0 where game_id = p_game and seat = s;
        perform tq_stat(p_game, s, 'eaten');
        if not exists (select 1 from traque_players where game_id = p_game and not ghost and status in ('joined', 'bot', 'left')) then
          -- plus personne en vie : le Kraken garde son trésor, chacun convertit ses perles
          update traque_players set reward = pearls / 10 where game_id = p_game;
          perform wallet_credit(player_id, pearls / 10, 'traque', null) from traque_players where game_id = p_game and player_id is not null and bot is null and pearls >= 10;
          perform tq_log(p_game, '🦈 Le requin dévore ' || nm || '… plus personne ne peut battre le Kraken !');
          update traque_games set status = 'done', phase = 'done', winner = null, deadline = null, version = version + 1 where id = p_game;
          return;
        end if;
        perform tq_event(p_game, '🦈 Le requin dévore ' || nm || ' ! Il devient un fantôme 👻 : il ne peut plus gagner, mais il hantera les autres.', jsonb_build_object('shark', 'eaten', 'seat', s));
      end if;
    elsif reason = 'shortcut' then
      if ok = 1 then
        if tq_shift(p_game, s, 5) >= tq_const('cells') - 1 then perform tq_final(p_game, s); return; end if;
        perform tq_event(p_game, '🚪 ' || nm || ' emprunte le raccourci : +5 cases !', jsonb_build_object('move', 5, 'seat', s));
      else perform tq_event(p_game, '🚪 Raccourci raté pour ' || nm || '.', '{}'::jsonb); end if;
    end if;
  elsif kind = 'duel' then
    a := (d -> 'ctx' ->> 'a')::int; b := (d -> 'ctx' ->> 'b')::int; ok := 0; okb := 0; ta := 0; tb := 0;
    for i in 0 .. jsonb_array_length(d -> 'items') - 1 loop
      n := (g.pool -> (d -> 'items' -> i ->> 'topic') -> ((d -> 'items' -> i ->> 'qi')::int) ->> 'c')::int;
      -- départage : seul le temps des BONNES réponses compte
      if (d -> 'ans' -> a::text -> i ->> 0)::int = n then ok := ok + 1; ta := ta + coalesce((d -> 'ans' -> a::text -> i ->> 1)::int, 15000); end if;
      if (d -> 'ans' -> b::text -> i ->> 0)::int = n then okb := okb + 1; tb := tb + coalesce((d -> 'ans' -> b::text -> i ->> 1)::int, 15000); end if;
    end loop;
    if ok = okb and (ok = 0 or ta = tb) then
      perform tq_event(p_game, '🤝 Match nul ' || ok || '–' || okb || ' entre ' || tq_name(p_game, a) || ' et ' || tq_name(p_game, b) || ' : personne ne bouge.', '{}'::jsonb);
      return;
    end if;
    if ok > okb or (ok = okb and ta < tb) then win := a; lose := b; else win := b; lose := a; end if;
    update traque_players set pearls = pearls + 3 where game_id = p_game and seat = win;
    perform tq_stat(p_game, win, 'duel_won'); perform tq_stat(p_game, lose, 'duel_lost');
    perform tq_log(p_game, '⚔️ ' || tq_name(p_game, win) || ' gagne le duel ' || greatest(ok, okb) || '–' || least(ok, okb) || case when ok = okb then ' au temps' else '' end || ' (+3 perles)');
    update traque_games set phase = 'duelroll', data = jsonb_build_object('winner', win, 'loser', lose, 'score', jsonb_build_array(greatest(ok, okb), least(ok, okb)), 'tie', ok = okb, 'a', a, 'b', b),
      deadline = now() + make_interval(secs => case when (select bot is not null or status = 'left' from traque_players where game_id = p_game and seat = win) then 4 else 17 end),
      version = version + 1 where id = p_game;
  elsif kind = 'truce' then
    n := g.treasure - coalesce((d -> 'ctx' ->> 't0')::int, g.treasure);
    perform tq_event(p_game, '🤝 Fin de la trêve : +' || n || ' lingot' || case when n > 1 then 's' else '' end || ' récolté' || case when n > 1 then 's' else '' end || ' ! Le trésor contient ' || g.treasure || ' lingots.',
      jsonb_build_object('treasure', g.treasure, 'gold', n));
  elsif kind = 'final' then
    s := (d -> 'seats' ->> 0)::int; ok := 0;
    for i in 0 .. jsonb_array_length(d -> 'items') - 1 loop
      if (d -> 'ans' -> s::text -> i ->> 0)::int = (g.pool -> (d -> 'items' -> i ->> 'topic') -> ((d -> 'items' -> i ->> 'qi')::int) ->> 'c')::int then ok := ok + 1; end if;
    end loop;
    if ok >= 4 then perform tq_finish(p_game, s);
    else
      perform tq_shift(p_game, s, -6);
      perform tq_event(p_game, '🐙 Le Kraken recrache ' || tq_name(p_game, s) || ' (' || ok || '/5) : 6 cases en arrière !', jsonb_build_object('move', -6, 'seat', s));
    end if;
  end if;
end $$;

-- Réponse d'un siège à la question en cours (temps mesuré par le serveur)
create or replace function public.tq_put_answer(p_game uuid, p_seat int, p_choice int) returns void language plpgsql as $$
declare g traque_games; d jsonb; idx int; t int;
begin
  select * into g from traque_games where id = p_game;
  d := g.data; idx := (d ->> 'idx')::int;
  if g.phase <> 'quiz' or (d ->> 'reveal')::boolean or not (to_jsonb(p_seat) <@ (d -> 'seats')) then return; end if;
  if d -> 'ans' -> p_seat::text -> idx is not null and jsonb_typeof(d -> 'ans' -> p_seat::text -> idx) = 'array' then return; end if;
  t := greatest(300, floor((extract(epoch from now()) - (d ->> 'opened')::numeric) * 1000)::int);
  d := jsonb_set(d, array['ans', p_seat::text], coalesce(d -> 'ans' -> p_seat::text, '[]'::jsonb));
  while jsonb_array_length(d -> 'ans' -> p_seat::text) < idx loop
    d := jsonb_set(d, array['ans', p_seat::text], (d -> 'ans' -> p_seat::text) || 'null'::jsonb);
  end loop;
  d := jsonb_set(d, array['ans', p_seat::text], (d -> 'ans' -> p_seat::text) || jsonb_build_array(jsonb_build_array(p_choice, t)));
  update traque_games set data = d, version = version + 1 where id = p_game;
end $$;

-- Prix d'un objet dans une boutique (le joueur tombé pile dessus a son premier achat à moitié prix)
create or replace function public.tq_shop_price(p_game uuid, p_item text) returns int language sql as $$
  select case when coalesce((g.data ->> 'discount')::boolean, false) then ceil((tq_item_cost(p_item) + (g.board -> (g.data ->> 'cell')::int ->> 'k')::int) / 2.0)::int
    else tq_item_cost(p_item) + (g.board -> (g.data ->> 'cell')::int ->> 'k')::int end
  from traque_games g where g.id = p_game
$$;

create or replace function public.tq_shop_buy(p_game uuid, p_seat int, p_item text) returns void language plpgsql as $$
declare g traque_games; me traque_players; price int;
begin
  select * into g from traque_games where id = p_game;
  if g.phase <> 'shop' or (g.data ->> 'seat')::int <> p_seat then raise exception 'pas de boutique ici'; end if;
  if not ((g.board -> (g.data ->> 'cell')::int -> 'items') ? p_item) then raise exception 'objet absent de cette boutique'; end if;
  select * into me from traque_players where game_id = p_game and seat = p_seat;
  price := tq_shop_price(p_game, p_item);
  if me.pearls < price then raise exception 'pas assez de perles'; end if;
  if jsonb_array_length(me.items) >= tq_const('shop_max') then raise exception 'sac plein (3 objets)'; end if;
  update traque_players set pearls = pearls - price, items = items || to_jsonb(p_item) where game_id = p_game and seat = p_seat;
  update traque_games set data = data || '{"discount": false}'::jsonb, version = version + 1 where id = p_game;
end $$;

-- Sortie de la boutique : on termine le déplacement avec les cases restantes
create or replace function public.tq_shop_leave(p_game uuid) returns void language plpgsql as $$
declare g traque_games; s int; rest int; np int;
begin
  select * into g from traque_games where id = p_game;
  if g.phase <> 'shop' then return; end if;
  s := (g.data ->> 'seat')::int; rest := (g.data ->> 'rest')::int;
  if rest > 0 then
    np := tq_shift(p_game, s, rest);
    update traque_games set phase = 'show', data = jsonb_build_object('dice', '[]'::jsonb, 'from', (g.data ->> 'cell')::int, 'to', np, 'seat', s),
      deadline = now() + make_interval(secs => 2), version = version + 1 where id = p_game;
  else
    perform tq_event(p_game, '🏪 ' || tq_name(p_game, s) || ' sort de la boutique.', '{}'::jsonb);
  end if;
end $$;

-- Fait avancer la partie : délais écoulés, robots, enchaînements
create or replace function public.traque_tick(p_game uuid) returns void language plpgsql as $$
declare g traque_games; d jsonb; s record; idx int; all_in boolean; n int; c int; ok int; lvl float; steps int := 0; item jsonb; leader record; due boolean;
begin
  loop
    steps := steps + 1; exit when steps > 12;
    select * into g from traque_games where id = p_game for update;
    exit when not found or g.status <> 'playing';
    d := g.data; due := g.deadline is not null and now() >= g.deadline;

    if g.phase = 'roll' then
      select * into s from traque_players where game_id = p_game and seat = g.turn;
      if s.bot is not null and now() >= g.deadline - interval '1 second' then
        -- petite stratégie des robots : bloquer ou rattraper le meneur
        select * into leader from traque_players where game_id = p_game and seat <> s.seat and status in ('joined', 'bot', 'left') and not ghost order by pos desc limit 1;
        if leader.seat is not null and leader.pos - s.pos >= 12 and s.items ? 'echange' and random() < 0.6 then
          update traque_players set items = items - (select (ord - 1)::int from jsonb_array_elements_text(items) with ordinality e(v, ord) where v = 'echange' order by ord limit 1) where game_id = p_game and seat = s.seat;
          update traque_players t set pos = case when t.seat = s.seat then leader.pos else s.pos end where t.game_id = p_game and t.seat in (s.seat, leader.seat);
          perform tq_flash(p_game, 'echange', s.seat, leader.seat, '🔄 ' || s.name || ' échange sa place avec ' || leader.name || ' !');
        elsif leader.seat is not null and leader.pos > s.pos and s.items ? 'ancre' and random() < 0.5 then
          update traque_players set items = items - (select (ord - 1)::int from jsonb_array_elements_text(items) with ordinality e(v, ord) where v = 'ancre' order by ord limit 1) where game_id = p_game and seat = s.seat;
          update traque_players set skip = skip + 1 where game_id = p_game and seat = leader.seat;
          perform tq_flash(p_game, 'ancre', s.seat, leader.seat, '⚓ ' || s.name || ' jette une ancre sur ' || leader.name || ' : tour suivant passé !');
        elsif s.items ? 'double' and random() < 0.6 then
          update traque_players set items = items - (select (ord - 1)::int from jsonb_array_elements_text(items) with ordinality e(v, ord) where v = 'double' order by ord limit 1) where game_id = p_game and seat = s.seat;
          update traque_games set data = data || '{"double": true}'::jsonb where id = p_game;
          perform tq_flash(p_game, 'double', s.seat, null, '🎲 ' || s.name || ' sort le double dé !');
        end if;
        perform tq_roll(p_game);
      elsif due then perform tq_roll(p_game);
      else exit; end if;

    elsif g.phase = 'show' then
      exit when not due;
      if d ? 'shop' then
        select * into s from traque_players where game_id = p_game and seat = (d ->> 'seat')::int;
        perform tq_log(p_game, '🏪 ' || s.name || ' s''arrête à la boutique' || case when (d ->> 'rest')::int = 0 then ' (pile dessus : un objet à moitié prix !)' else '' end);
        update traque_games set phase = 'shop', data = jsonb_build_object('seat', s.seat, 'cell', (d ->> 'shop')::int, 'rest', (d ->> 'rest')::int,
            'discount', (d ->> 'rest')::int = 0),
          deadline = now() + make_interval(secs => case when s.bot is not null or s.status = 'left' then 2 else 15 end), version = version + 1 where id = p_game;
      else
        perform tq_land(p_game, (d ->> 'seat')::int);
      end if;

    elsif g.phase = 'shop' then
      select * into s from traque_players where game_id = p_game and seat = (d ->> 'seat')::int;
      if s.bot is not null and now() >= g.deadline - interval '1 second' then
        -- le robot achète ce qu'il peut, en commençant par les objets les plus utiles
        for item in select x from jsonb_array_elements(g.board -> (d ->> 'cell')::int -> 'items') x
          order by array_position(array['"harpon"', '"echange"', '"ancre"', '"double"', '"vol"', '"joker"'], x::text) loop
          begin perform tq_shop_buy(p_game, s.seat, item #>> '{}'); exception when others then null; end;
        end loop;
        perform tq_shop_leave(p_game);
      elsif due then perform tq_shop_leave(p_game);
      else exit; end if;

    elsif g.phase = 'haunt' then
      select * into s from traque_players where game_id = p_game and seat = (d ->> 'seat')::int;
      -- robot ou temps écoulé : on hante le joueur en tête
      if (s.bot is not null and now() >= g.deadline - interval '1 second') or due then perform tq_haunt(p_game, -1);
      else exit; end if;

    elsif g.phase = 'pick' then
      select * into s from traque_players where game_id = p_game and seat = (d ->> 'seat')::int;
      if (s.bot is not null and now() >= g.deadline - interval '1 second') or due then perform tq_cursed_open(p_game, floor(random() * 3)::int);
      else exit; end if;

    elsif g.phase = 'event' then
      exit when not due;
      perform tq_next(p_game);

    elsif g.phase = 'duelroll' then
      select * into s from traque_players where game_id = p_game and seat = (d ->> 'winner')::int;
      exit when not due and not (s.bot is not null and now() >= g.deadline - interval '1 second');
      n := 1 + floor(random() * 6)::int;
      perform tq_shift(p_game, (d ->> 'loser')::int, -n);
      perform tq_event(p_game, '🎲 ' || s.name || ' fait ' || n || ' : ' || tq_name(p_game, (d ->> 'loser')::int) || ' recule de ' || n || ' cases !',
        jsonb_build_object('dice', jsonb_build_array(n), 'move', -n, 'seat', (d ->> 'loser')::int, 'by', (d ->> 'winner')::int, 'duel', true));

    elsif g.phase = 'intro' then
      select bool_and(to_jsonb(seat) <@ (d -> 'ready') or bot is not null or status <> 'joined') into all_in
        from traque_players where game_id = p_game and to_jsonb(seat) <@ (d -> 'seats');
      -- tout le monde prêt (petite pause pour lire), ou délai écoulé
      exit when not (due or (coalesce(all_in, true) and now() >= g.deadline - interval '9 seconds'));
      update traque_games set phase = 'quiz', data = data || jsonb_build_object('opened', extract(epoch from now())),
        deadline = now() + make_interval(secs => case when (d ->> 'hard')::boolean then tq_const('hard') else tq_const('answer') end),
        version = version + 1 where id = p_game;

    elsif g.phase = 'quiz' then
      idx := (d ->> 'idx')::int;
      if not (d ->> 'reveal')::boolean then
        -- les robots répondent après un petit temps de réflexion
        for s in select * from traque_players where game_id = p_game and to_jsonb(seat) <@ (d -> 'seats') and (bot is not null) loop
          if d -> 'ans' -> s.seat::text -> idx is null and extract(epoch from now()) - (d ->> 'opened')::numeric >= 2 + (abs(hashtext(p_game::text || s.seat || '-' || idx)) % 5) then
            c := (g.pool -> (d -> 'items' -> idx ->> 'topic') -> ((d -> 'items' -> idx ->> 'qi')::int) ->> 'c')::int;
            lvl := case s.bot when 'facile' then 0.45 when 'moyen' then 0.65 else 0.85 end;
            perform tq_put_answer(p_game, s.seat, case when random() < lvl then c else (c + 1 + floor(random() * 3)::int) % 4 end);
            select * into g from traque_games where id = p_game; d := g.data;
          end if;
        end loop;
        select bool_and(d -> 'ans' -> seat::text -> idx is not null) into all_in from traque_players
          where game_id = p_game and to_jsonb(seat) <@ (d -> 'seats') and status in ('joined', 'bot');
        if coalesce(all_in, true) or due then
          -- révélation ; pendant une trêve, chaque bonne réponse remplit le trésor
          if d ->> 'kind' = 'truce' then
            c := (g.pool -> (d -> 'items' -> idx ->> 'topic') -> ((d -> 'items' -> idx ->> 'qi')::int) ->> 'c')::int;
            select count(*) filter (where (d -> 'ans' -> seat::text -> idx ->> 0)::int = c), count(*) into ok, n
              from traque_players where game_id = p_game and to_jsonb(seat) <@ (d -> 'seats');
            update traque_games set treasure = treasure + ok + case when ok = n and n > 0 then 2 else 0 end where id = p_game;
          end if;
          c := (g.pool -> (d -> 'items' -> idx ->> 'topic') -> ((d -> 'items' -> idx ->> 'qi')::int) ->> 'c')::int;
          update traque_players set stats = jsonb_set(jsonb_set(coalesce(stats, '{}'::jsonb), '{ok}', to_jsonb(coalesce((stats ->> 'ok')::int, 0)
              + case when (d -> 'ans' -> seat::text -> idx ->> 0)::int = c then 1 else 0 end)),
              '{ko}', to_jsonb(coalesce((stats ->> 'ko')::int, 0) + case when (d -> 'ans' -> seat::text -> idx ->> 0)::int is distinct from c then 1 else 0 end))
            where game_id = p_game and to_jsonb(seat) <@ (d -> 'seats');
          update traque_games set data = jsonb_set(data, '{reveal}', 'true'), deadline = now() + make_interval(secs => tq_const('reveal')), version = version + 1 where id = p_game;
        else exit; end if;
      else
        exit when not due;
        if idx + 1 < jsonb_array_length(d -> 'items') then
          update traque_games set data = data || jsonb_build_object('idx', idx + 1, 'reveal', false, 'opened', extract(epoch from now())),
            deadline = now() + make_interval(secs => case when (d ->> 'hard')::boolean then tq_const('hard') else tq_const('answer') end),
            version = version + 1 where id = p_game;
        else perform tq_quiz_done(p_game); end if;
      end if;
    else exit; end if;
  end loop;
end $$;

-- Vue d'une partie pour un joueur (la bonne réponse n'est donnée qu'à la révélation)
create or replace function public.traque_view(p_game uuid, p_pid uuid) returns json language plpgsql as $$
declare g traque_games; d jsonb; me int; idx int; it jsonb; q jsonb;
begin
  select * into g from traque_games where id = p_game;
  if not found then return null; end if;
  select seat into me from traque_players where game_id = p_game and player_id = p_pid;
  if me is null and g.host <> p_pid then return null; end if;
  d := g.data;
  if g.phase = 'intro' then
    d := d - 'items' || jsonb_build_object('count', jsonb_array_length(g.data -> 'items'), 'topic', g.data -> 'items' -> 0 ->> 'topic',
      'left_ms', greatest(0, floor(extract(epoch from (g.deadline - now())) * 1000))::int);
  elsif g.phase = 'quiz' then
    idx := (d ->> 'idx')::int; it := d -> 'items' -> idx;
    q := g.pool -> (it ->> 'topic') -> ((it ->> 'qi')::int);
    d := d - 'items' || jsonb_build_object(
      'count', jsonb_array_length(g.data -> 'items'),
      'topic', it ->> 'topic',
      'q', q ->> 'q', 'o', q -> 'o',
      'c', case when (d ->> 'reveal')::boolean then q -> 'c' end,
      'removed', d -> 'jokers' -> (me::text || ':' || idx),
      -- pendant la question, on ne voit que qui a répondu, pas quoi
      'ans', case when (d ->> 'reveal')::boolean then d -> 'ans'
        else (select coalesce(jsonb_object_agg(k, case when k = me::text then v else to_jsonb(array(select case when e = 'null'::jsonb then null else 'x' end from jsonb_array_elements(v) e)) end), '{}'::jsonb)
              from jsonb_each(d -> 'ans') kv(k, v)) end,
      'left_ms', greatest(0, floor(extract(epoch from (g.deadline - now())) * 1000))::int);
  else
    if g.phase = 'pick' then d := d - 'box'; end if;
    d := d || jsonb_build_object('left_ms', case when g.deadline is null then null else greatest(0, floor(extract(epoch from (g.deadline - now())) * 1000))::int end);
  end if;
  return json_build_object(
    'id', g.id, 'status', g.status, 'host', g.host = p_pid, 'me', me, 'turn', g.turn, 'round', g.round, 'phase', g.phase, 'data', d,
    'treasure', g.treasure, 'winner', g.winner, 'board', g.board, 'topics', g.topics, 'log', g.log, 'version', g.version,
    'pause', g.pause, 'back', g.back, 'paused_at', g.paused_at,
    'reacts', (select coalesce(json_agg(json_build_object('id', id, 'seat', seat, 'e', emoji) order by id), '[]'::json)
      from traque_reactions where game_id = p_game and at > now() - interval '4 seconds'),
    'players', (select coalesce(json_agg(json_build_object('seat', seat, 'name', name, 'avatar', avatar, 'photo', photo, 'status', status, 'bot', bot,
        'player_id', player_id, 'pawn', pawn,
        -- au salon, les spécialités des adversaires restent secrètes (on ne voit que leur nombre)
        'topics', case when g.status = 'lobby' and seat is distinct from me and player_id is not null then (select coalesce(jsonb_agg('{}'::jsonb), '[]'::jsonb) from jsonb_array_elements(topics)) else topics end, 'pos', pos, 'pearls', pearls, 'items', items, 'skip', skip, 'bubble', bubble, 'ghost', ghost, 'stats', stats, 'reward', reward,
        'online', case when player_id is null then true else (select last_seen > now() - interval '70 seconds' from players where id = player_id) end) order by seat), '[]'::json)
      from traque_players where game_id = p_game and status <> 'declined'));
end $$;

create or replace function public.get_traque(p_game uuid) returns json language plpgsql security definer set search_path = public as $$
declare pid uuid := current_player();
begin
  if pid is null then return null; end if;
  perform tq_pause_expire(p_game);
  perform traque_tick(p_game);
  update players set last_seen = now() where id = pid;
  return traque_view(p_game, pid);
end $$;

-- ===== Salon =====
create or replace function public.create_traque() returns uuid language plpgsql security definer set search_path = public as $$
declare pid uuid := current_player(); gid uuid; me players;
begin
  if pid is null then raise exception 'aucun joueur'; end if;
  delete from traque_games where (created_at < now() - interval '2 days' and status <> 'paused') or (status = 'paused' and paused_at < now() - interval '30 days');
  update traque_games set status = 'cancelled' where host = pid and status = 'lobby';
  select * into me from players where id = pid;
  insert into traque_games (host) values (pid) returning id into gid;
  insert into traque_players (game_id, seat, player_id, name, avatar, photo, status) values (gid, 0, pid, me.name, me.avatar, me.photo, 'joined');
  return gid;
end $$;

create or replace function public.tq_free_seat(p_game uuid) returns int language sql as $$
  select min(s) from generate_series(0, 7) s where not exists (select 1 from traque_players where game_id = p_game and seat = s and status in ('invited', 'joined', 'bot'))
$$;

create or replace function public.invite_traque(p_game uuid, p_friend uuid) returns void language plpgsql security definer set search_path = public as $$
declare pid uuid := current_player(); s int; f players; me_name text;
begin
  if not exists (select 1 from traque_games where id = p_game and host = pid and status = 'lobby') then raise exception 'salon introuvable'; end if;
  if not are_friends(pid, p_friend) then raise exception 'pas amis'; end if;
  if exists (select 1 from traque_players where game_id = p_game and player_id = p_friend and status in ('invited', 'joined')) then return; end if;
  s := tq_free_seat(p_game);
  if s is null then raise exception 'salon complet'; end if;
  delete from traque_players where game_id = p_game and (seat = s or player_id = p_friend);
  select * into f from players where id = p_friend;
  insert into traque_players (game_id, seat, player_id, name, avatar, photo, status) values (p_game, s, p_friend, f.name, f.avatar, f.photo, 'invited');
  select name into me_name from players where id = pid;
  perform notify_player(p_friend, '🐙 La Chasse au Kraken', me_name || ' t''invite à chasser le Kraken en direct !', '/');
end $$;

create or replace function public.add_traque_bot(p_game uuid, p_level text, p_topics jsonb) returns void language plpgsql security definer set search_path = public as $$
declare pid uuid := current_player(); s int; names text[] := array['Capitaine Crochet-Moule', 'Barbe-Corail', 'Mousse Pétoncle', 'Amiral Calamar', 'Lady Méduse', 'Le Vieux Homard'];
begin
  if not exists (select 1 from traque_games where id = p_game and host = pid and status = 'lobby') then raise exception 'salon introuvable'; end if;
  if p_level not in ('facile', 'moyen', 'expert') or jsonb_typeof(p_topics) <> 'array' or jsonb_array_length(p_topics) <> 3 then raise exception 'robot invalide'; end if;
  s := tq_free_seat(p_game);
  if s is null then raise exception 'salon complet'; end if;
  delete from traque_players where game_id = p_game and seat = s;
  insert into traque_players (game_id, seat, bot, name, avatar, status, topics, pawn)
  values (p_game, s, p_level, names[1 + floor(random() * array_length(names, 1))::int] || ' (' || p_level || ')', 'robot-' || s, 'bot', p_topics,
    (array['stitch', 'araignee', 'pirate', 'dino', 'gilet', 'sorcier', 'reine-neiges', 'liberte', 'astronaute', 'fantome', 'dormeur', 'eclair', 'heros', 'ane', 'retro', 'seigneur'])[1 + floor(random() * 16)::int]);
end $$;

create or replace function public.remove_traque_seat(p_game uuid, p_seat int) returns void language plpgsql security definer set search_path = public as $$
declare pid uuid := current_player();
begin
  if not exists (select 1 from traque_games where id = p_game and host = pid and status = 'lobby') then raise exception 'salon introuvable'; end if;
  delete from traque_players where game_id = p_game and seat = p_seat and seat <> 0;
end $$;

create or replace function public.respond_traque(p_game uuid, p_accept boolean) returns json language plpgsql security definer set search_path = public as $$
declare pid uuid := current_player();
begin
  update traque_players set status = case when p_accept then 'joined' else 'declined' end, updated_at = now()
  where game_id = p_game and player_id = pid and status = 'invited'
    and exists (select 1 from traque_games where id = p_game and status = 'lobby' and created_at > now() - interval '30 minutes');
  if not found or not p_accept then return null; end if;
  return traque_view(p_game, pid);
end $$;

drop function if exists public.set_traque_topics(uuid, jsonb);
create or replace function public.set_traque_topics(p_game uuid, p_topics jsonb, p_pool jsonb default null) returns void language plpgsql security definer set search_path = public as $$
declare pid uuid := current_player(); k text;
begin
  if jsonb_typeof(p_topics) <> 'array' or jsonb_array_length(p_topics) <> 3 or pg_column_size(p_topics) > 1500 then raise exception 'choisis 3 thèmes'; end if;
  if p_pool is not null then
    if pg_column_size(p_pool) > 200000 or jsonb_typeof(p_pool) <> 'object' then raise exception 'questions invalides'; end if;
    for k in select jsonb_object_keys(p_pool) loop
      if not exists (select 1 from jsonb_array_elements(p_topics) x where x ->> 'id' = k) then raise exception 'questions invalides'; end if;
    end loop;
  end if;
  update traque_players set topics = p_topics, pool = p_pool, updated_at = now()
  where game_id = p_game and player_id = pid and status = 'joined' and exists (select 1 from traque_games where id = p_game and status = 'lobby');
end $$;

create or replace function public.leave_traque(p_game uuid) returns void language plpgsql security definer set search_path = public as $$
declare pid uuid := current_player(); g traque_games;
begin
  select * into g from traque_games where id = p_game;
  if not found then return; end if;
  if g.status = 'lobby' then
    if g.host = pid then update traque_games set status = 'cancelled' where id = p_game;
    else delete from traque_players where game_id = p_game and player_id = pid; end if;
  else
    update traque_players set status = 'left' where game_id = p_game and player_id = pid and status = 'joined';
    -- plus aucun humain : la partie s'arrête
    if not exists (select 1 from traque_players where game_id = p_game and status = 'joined') then
      update traque_games set status = 'cancelled', phase = 'done' where id = p_game and status = 'playing';
    end if;
  end if;
end $$;

-- Lancement : l'hôte envoie les questions des thèmes du plateau ; le serveur construit le plateau
create or replace function public.start_traque(p_game uuid, p_topics jsonb, p_general jsonb, p_pool jsonb) returns json language plpgsql security definer set search_path = public as $$
declare pid uuid := current_player(); specs text[]; gen text[]; cells jsonb := '[]'::jsonb; types text[]; i int; t text; k text; n int;
  mp jsonb := p_pool; mt jsonb := p_topics; r record;
begin
  -- on complète avec les questions et les fiches des spécialités envoyées par chaque joueur (secrètes pour l'hôte)
  for r in select pool, topics from traque_players where game_id = p_game and status in ('joined', 'bot') loop
    if jsonb_typeof(r.pool) = 'object' then mp := r.pool || mp; end if;
    mt := coalesce((select jsonb_object_agg(x ->> 'id', x) from jsonb_array_elements(r.topics) x where x ? 'id'), '{}'::jsonb) || mt;
  end loop;
  if not exists (select 1 from traque_games where id = p_game and host = pid and status = 'lobby') then raise exception 'salon introuvable'; end if;
  delete from traque_players where game_id = p_game and status in ('invited', 'declined');
  if (select count(*) from traque_players where game_id = p_game and status in ('joined', 'bot')) < 2 then raise exception 'il faut au moins 2 joueurs (ou robots)'; end if;
  if exists (select 1 from traque_players where game_id = p_game and status = 'joined' and jsonb_array_length(topics) <> 3) then raise exception 'tout le monde doit choisir 3 thèmes'; end if;
  if pg_column_size(mp) > 1200000 or jsonb_typeof(mp) <> 'object' then raise exception 'questions invalides'; end if;
  for k in select jsonb_object_keys(mp) loop
    if exists (select 1 from jsonb_array_elements(mp -> k) q where jsonb_array_length(q -> 'o') <> 4 or (q ->> 'c')::int not between 0 and 3
      or char_length(q ->> 'q') > 400) then raise exception 'question invalide'; end if;
  end loop;
  select array_agg(distinct x ->> 'id') into specs from traque_players p, jsonb_array_elements(p.topics) x where p.game_id = p_game and p.status in ('joined', 'bot');
  -- thèmes généraux : l'hôte propose une liste mélangée ; on retire toutes les spécialités des joueurs et on en garde 8
  select array_agg(v order by o) into gen from jsonb_array_elements_text(p_general) with ordinality e(v, o) where v <> all (coalesce(specs, '{}'::text[]));
  gen := gen[1:8];
  if coalesce(cardinality(gen), 0) < 3 then raise exception 'thèmes généraux manquants'; end if;
  -- 81 cases entre le départ (0) et l'antre (82), posées sur les emplacements de l'illustration du plateau
  types := array_fill('general'::text, array[81]);
  -- cases spéciales : 16 spécialités, 8 trêves, 6 coffres, 5 courants, 5 tentacules, 4 raccourcis
  for i in 1 .. 16 loop types[i] := 'spec'; end loop;
  for i in 17 .. 24 loop types[i] := 'truce'; end loop;
  for i in 25 .. 30 loop types[i] := 'chest'; end loop;
  for i in 31 .. 35 loop types[i] := 'current'; end loop;
  for i in 36 .. 40 loop types[i] := 'tentacle'; end loop;
  for i in 41 .. 44 loop types[i] := 'shortcut'; end loop;
  select array_agg(x order by random()) into types from unnest(types) x;
  cells := jsonb_build_array(jsonb_build_object('t', 'start'));
  n := 0;
  for i in 1 .. 81 loop
    t := types[i];
    if t = 'spec' then
      cells := cells || jsonb_build_array(jsonb_build_object('t', 'spec', 'topic', specs[1 + (n % cardinality(specs))])); n := n + 1;
    elsif t in ('general', 'shortcut') then
      cells := cells || jsonb_build_array(jsonb_build_object('t', t, 'topic', gen[1 + floor(random() * cardinality(gen))::int]));
    else cells := cells || jsonb_build_array(jsonb_build_object('t', t)); end if;
  end loop;
  cells := cells || jsonb_build_array(jsonb_build_object('t', 'lair'));
  -- 1 requin, dans le dernier tiers du plateau
  select gs.x into n from generate_series(55, 78) gs(x) where cells -> gs.x ->> 't' = 'general' and gs.x <> 37 order by random() limit 1;
  if n is not null then cells := jsonb_set(cells, array[n::text], jsonb_build_object('t', 'shark')); end if;
  -- cases loufoques, placées à des endroits stratégiques (une seule fois chacune) :
  -- poisson-ballon au milieu (tout le monde a des perles), crabe dans le dernier tiers (un échange renverse la course),
  -- tourbillon tout près de l'antre (chaos maximal) ; 2 coffres maudits et 2 ou 3 bulles au hasard
  select gs.x into n from generate_series(30, 42) gs(x) where cells -> gs.x ->> 't' = 'general' and gs.x not in (9, 37) order by random() limit 1;
  if n is not null then cells := jsonb_set(cells, array[n::text], jsonb_build_object('t', 'puffer')); end if;
  select gs.x into n from generate_series(60, 68) gs(x) where cells -> gs.x ->> 't' = 'general' order by random() limit 1;
  if n is not null then cells := jsonb_set(cells, array[n::text], jsonb_build_object('t', 'crab')); end if;
  select gs.x into n from generate_series(70, 77) gs(x) where cells -> gs.x ->> 't' = 'general' order by random() limit 1;
  if n is not null then cells := jsonb_set(cells, array[n::text], jsonb_build_object('t', 'whirl')); end if;
  for n in select gs.x from generate_series(15, 75) gs(x) where cells -> gs.x ->> 't' = 'general' and gs.x not in (9, 37) order by random() limit 2 loop
    cells := jsonb_set(cells, array[n::text], jsonb_build_object('t', 'cursed'));
  end loop;
  for n in select gs.x from generate_series(8, 70) gs(x) where cells -> gs.x ->> 't' = 'general' and gs.x not in (9, 37) order by random() limit (2 + floor(random() * 2)::int) loop
    cells := jsonb_set(cells, array[n::text], jsonb_build_object('t', 'bubble'));
  end loop;
  -- 2 boutiques, devant les deux cabanes du plateau : 3 objets tirés au hasard chacune, la seconde plus chère
  for i in 0 .. 1 loop
    cells := jsonb_set(cells, array[(array[9, 37])[i + 1]::text], jsonb_build_object('t', 'shop', 'k', i * 2,
      'items', (select jsonb_agg(x) from (select x from unnest(array['double', 'ancre', 'joker', 'vol', 'echange', 'harpon']) x order by random() limit 3) z)));
  end loop;
  update traque_games set status = 'playing', board = cells, topics = mt, general = to_jsonb(gen), pool = mp, used = '{}'::jsonb,
    started_at = now(), turn = -1, round = 1, treasure = 0, phase = 'event', data = jsonb_build_object('text', '🐙 La chasse commence ! Le trésor du Kraken est vide…', 'reveal', to_jsonb(gen)),
    deadline = now() + interval '13 seconds', version = version + 1
  where id = p_game;
  update traque_players set pos = 0, pearls = 5, items = '[]'::jsonb, skip = 0 where game_id = p_game;
  perform tq_log(p_game, '🐙 La chasse commence !');
  return traque_view(p_game, pid);
end $$;

-- ===== Actions en jeu =====
create or replace function public.tq_my_seat(p_game uuid) returns int language sql stable security definer set search_path = public as $$
  select seat from traque_players where game_id = p_game and player_id = current_player() and status = 'joined'
$$;

create or replace function public.traque_roll(p_game uuid) returns json language plpgsql security definer set search_path = public as $$
declare s int := tq_my_seat(p_game); g traque_games;
begin
  perform traque_tick(p_game);
  select * into g from traque_games where id = p_game for update;
  if g.phase = 'roll' and g.turn = s then perform tq_roll(p_game);
  elsif g.phase = 'duelroll' and (g.data ->> 'winner')::int = s then
    update traque_games set deadline = now() where id = p_game;
  end if;
  perform traque_tick(p_game);
  return traque_view(p_game, current_player());
end $$;

create or replace function public.traque_buy(p_game uuid, p_item text) returns json language plpgsql security definer set search_path = public as $$
declare s int := tq_my_seat(p_game);
begin
  perform 1 from traque_games where id = p_game for update;
  perform tq_shop_buy(p_game, s, p_item);
  return traque_view(p_game, current_player());
end $$;

create or replace function public.traque_shop_leave(p_game uuid) returns json language plpgsql security definer set search_path = public as $$
declare s int := tq_my_seat(p_game); g traque_games;
begin
  select * into g from traque_games where id = p_game for update;
  if g.phase = 'shop' and (g.data ->> 'seat')::int = s then perform tq_shop_leave(p_game); end if;
  perform traque_tick(p_game);
  return traque_view(p_game, current_player());
end $$;

create or replace function public.traque_use(p_game uuid, p_item text, p_target int default null) returns json language plpgsql security definer set search_path = public as $$
declare s int := tq_my_seat(p_game); g traque_games; me traque_players; tg traque_players; idx int; d jsonb; c int; wrong int[]; amount int;
begin
  select * into g from traque_games where id = p_game for update;
  select * into me from traque_players where game_id = p_game and seat = s;
  if g.status <> 'playing' or not (me.items ? p_item) then raise exception 'objet indisponible'; end if;
  if p_item = 'harpon' then raise exception 'le harpon s''utilise tout seul face au requin'; end if;
  if me.ghost then raise exception 'un fantôme ne peut plus utiliser d''objets'; end if;
  if p_item = 'joker' then
    d := g.data; idx := (d ->> 'idx')::int;
    if g.phase <> 'quiz' or (d ->> 'reveal')::boolean or not (to_jsonb(s) <@ (d -> 'seats')) or d ->> 'kind' = 'truce' then raise exception 'pas maintenant'; end if;
    c := (g.pool -> (d -> 'items' -> idx ->> 'topic') -> ((d -> 'items' -> idx ->> 'qi')::int) ->> 'c')::int;
    select array_agg(x) into wrong from (select x from generate_series(0, 3) x where x <> c order by random() limit 2) z;
    update traque_games set data = jsonb_set(data, array['jokers', s::text || ':' || idx], to_jsonb(wrong)), version = version + 1 where id = p_game;
  else
    if g.phase <> 'roll' or g.turn <> s then raise exception 'seulement pendant ton tour, avant le dé'; end if;
    if p_item = 'double' then
      update traque_games set data = data || '{"double": true}'::jsonb where id = p_game;
      perform tq_flash(p_game, 'double', s, null, '🎲 ' || me.name || ' sort le double dé !');
    else
      select * into tg from traque_players where game_id = p_game and seat = p_target and seat <> s and status in ('joined', 'bot', 'left') and not ghost;
      if not found then raise exception 'choisis un adversaire'; end if;
      if p_item = 'ancre' then
        update traque_players set skip = skip + 1 where game_id = p_game and seat = p_target;
        perform tq_flash(p_game, 'ancre', s, p_target, '⚓ ' || me.name || ' jette une ancre sur ' || tg.name || ' : tour suivant passé !');
      elsif p_item = 'vol' then
        amount := least(5, tg.pearls);
        update traque_players set pearls = pearls - amount where game_id = p_game and seat = p_target;
        update traque_players set pearls = pearls + amount where game_id = p_game and seat = s;
        perform tq_stat(p_game, s, 'stolen', amount); perform tq_stat(p_game, p_target, 'robbed', amount);
        perform tq_flash(p_game, 'vol', s, p_target, '🪝 ' || me.name || ' vole ' || amount || ' perle' || case when amount > 1 then 's' else '' end || ' à ' || tg.name || ' !');
      elsif p_item = 'echange' then
        update traque_players t set pos = case when t.seat = s then tg.pos else me.pos end where t.game_id = p_game and t.seat in (s, p_target);
        perform tq_flash(p_game, 'echange', s, p_target, '🔄 ' || me.name || ' échange sa place avec ' || tg.name || ' !');
      end if;
    end if;
  end if;
  -- retire un exemplaire de l'objet du sac
  update traque_players set items = items - (select (ord - 1)::int from jsonb_array_elements_text(items) with ordinality e(v, ord) where v = p_item order by ord limit 1)
  where game_id = p_game and seat = s;
  update traque_games set version = version + 1 where id = p_game;
  return traque_view(p_game, current_player());
end $$;

create or replace function public.traque_ready(p_game uuid) returns json language plpgsql security definer set search_path = public as $$
declare s int := tq_my_seat(p_game); g traque_games;
begin
  select * into g from traque_games where id = p_game for update;
  if g.phase = 'intro' and to_jsonb(s) <@ (g.data -> 'seats') and not (to_jsonb(s) <@ (g.data -> 'ready')) then
    update traque_games set data = jsonb_set(data, '{ready}', (data -> 'ready') || to_jsonb(s)), version = version + 1 where id = p_game;
  end if;
  perform traque_tick(p_game);
  return traque_view(p_game, current_player());
end $$;

create or replace function public.traque_answer(p_game uuid, p_idx int, p_choice int) returns json language plpgsql security definer set search_path = public as $$
declare s int := tq_my_seat(p_game); g traque_games;
begin
  select * into g from traque_games where id = p_game for update;
  if s is not null and g.phase = 'quiz' and (g.data ->> 'idx')::int = p_idx and p_choice between 0 and 3 then
    perform tq_put_answer(p_game, s, p_choice);
  end if;
  perform traque_tick(p_game);
  return traque_view(p_game, current_player());
end $$;

-- Invitations en attente (pour le bandeau d'invitation)
create or replace function public.traque_invites_for(p uuid) returns json language sql stable security definer set search_path = public as $$
  select coalesce(json_agg(json_build_object('id', g.id, 'from', player_card(g.host), 'created_at', g.created_at) order by g.created_at desc), '[]'::json)
  from traque_players tp join traque_games g on g.id = tp.game_id
  where tp.player_id = p and tp.status = 'invited' and g.status = 'lobby' and g.created_at > now() - interval '30 minutes'
$$;

-- Ma partie en cours (pour y revenir après avoir quitté l'appli)
create or replace function public.my_traque() returns uuid language sql stable security definer set search_path = public as $$
  select g.id from traque_games g join traque_players p on p.game_id = g.id
  where p.player_id = current_player() and p.status = 'joined' and g.status in ('lobby', 'playing') and g.created_at > now() - interval '6 hours'
  order by g.created_at desc limit 1
$$;

revoke all on function public.get_traque(uuid), public.create_traque(), public.invite_traque(uuid, uuid), public.add_traque_bot(uuid, text, jsonb),
  public.remove_traque_seat(uuid, int), public.respond_traque(uuid, boolean), public.set_traque_topics(uuid, jsonb, jsonb), public.leave_traque(uuid),
  public.start_traque(uuid, jsonb, jsonb, jsonb), public.traque_roll(uuid), public.traque_buy(uuid, text), public.traque_use(uuid, text, int),
  public.traque_answer(uuid, int, int), public.my_traque(), public.traque_shop_leave(uuid), public.traque_ready(uuid) from public, anon;
grant execute on function public.get_traque(uuid), public.create_traque(), public.invite_traque(uuid, uuid), public.add_traque_bot(uuid, text, jsonb),
  public.remove_traque_seat(uuid, int), public.respond_traque(uuid, boolean), public.set_traque_topics(uuid, jsonb, jsonb), public.leave_traque(uuid),
  public.start_traque(uuid, jsonb, jsonb, jsonb), public.traque_roll(uuid), public.traque_buy(uuid, text), public.traque_use(uuid, text, int),
  public.traque_answer(uuid, int, int), public.my_traque(), public.traque_shop_leave(uuid), public.traque_ready(uuid), public.traque_cursed(uuid, int), public.traque_haunt(uuid, int) to authenticated;
revoke all on function public.traque_tick(uuid), public.traque_view(uuid, uuid), public.tq_quiz(uuid, text, int[], text[], jsonb, boolean),
  public.tq_land(uuid, int), public.tq_next(uuid), public.tq_roll(uuid), public.tq_finish(uuid, int), public.tq_quiz_done(uuid),
  public.tq_put_answer(uuid, int, int), public.tq_pick(uuid, text), public.tq_event(uuid, text, jsonb), public.tq_shift(uuid, int, int),
  public.tq_final(uuid, int), public.tq_log(uuid, text), public.tq_general(uuid), public.tq_name(uuid, int), public.tq_free_seat(uuid),
  public.traque_invites_for(uuid), public.tq_shop_buy(uuid, int, text), public.tq_shop_leave(uuid), public.tq_shop_price(uuid, text), public.tq_flash(uuid, text, int, int, text), public.tq_cursed_open(uuid, int), public.tq_haunt(uuid, int) from public, anon, authenticated;
