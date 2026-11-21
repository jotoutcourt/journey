-- Duelia : amis, défis directs entre amis (différés ou en direct), notifications et thèmes partagés.
-- Comme le reste : tables fermées, tout passe par des fonctions qui n'agissent que pour le joueur connecté.

create extension if not exists pg_net;

-- ===================== Amis =====================
alter table public.players add column if not exists friend_code text unique;
alter table public.players add column if not exists last_seen timestamptz;

create table if not exists public.friend_links (
  a uuid not null references public.players (id) on delete cascade, -- celui qui a demandé
  b uuid not null references public.players (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at timestamptz not null default now(),
  primary key (a, b),
  check (a <> b)
);
create index if not exists friend_links_b on public.friend_links (b);
alter table public.friend_links enable row level security;
revoke all on public.friend_links from anon, authenticated;

create or replace function public.are_friends(x uuid, y uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from friend_links where status = 'accepted' and ((a = x and b = y) or (a = y and b = x)))
$$;

-- Code ami de 8 caractères, créé à la première demande
create or replace function public.my_friend_code() returns text
language plpgsql security definer set search_path = public, extensions as $$
declare pid uuid := current_player(); code text; alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; b bytea; i int;
begin
  if pid is null then raise exception 'aucun joueur'; end if;
  select friend_code into code from players where id = pid;
  if code is not null then return code; end if;
  loop
    b := gen_random_bytes(8); code := '';
    for i in 0..7 loop code := code || substr(alphabet, 1 + (get_byte(b, i) % 32), 1); end loop;
    begin
      update players set friend_code = code where id = pid;
      return code;
    exception when unique_violation then
    end;
  end loop;
end $$;

create or replace function public.player_card(p uuid) returns json
language sql stable security definer set search_path = public as $$
  select json_build_object('player_id', id, 'name', name, 'avatar', avatar, 'flag', flag, 'photo', photo, 'bio', bio,
    'online', coalesce(last_seen > now() - interval '70 seconds', false),
    'last_seen', last_seen)
  from players where id = p
$$;

-- Amis, demandes reçues et envoyées
create or replace function public.get_friends() returns json
language plpgsql stable security definer set search_path = public as $$
declare pid uuid := current_player();
begin
  if pid is null then return null; end if;
  return json_build_object(
    'friends', coalesce((select json_agg(player_card(case when a = pid then b else a end))
      from friend_links where status = 'accepted' and pid in (a, b)), '[]'::json),
    'incoming', coalesce((select json_agg(player_card(a)) from friend_links where status = 'pending' and b = pid), '[]'::json),
    'outgoing', coalesce((select json_agg(player_card(b)) from friend_links where status = 'pending' and a = pid), '[]'::json));
end $$;

-- Ajouter un ami avec son code. Renvoie : unknown, self, already, requested, accepted, limit
create or replace function public.add_friend(p_code text) returns text
language plpgsql security definer set search_path = public as $$
declare pid uuid := current_player(); other uuid; me_name text;
begin
  if pid is null then raise exception 'aucun joueur'; end if;
  select id into other from players where friend_code = upper(regexp_replace(coalesce(p_code, ''), '[^A-Za-z0-9]', '', 'g'));
  if other is null then return 'unknown'; end if;
  if other = pid then return 'self'; end if;
  if are_friends(pid, other) then return 'already'; end if;
  -- il m'avait déjà demandé : on devient amis
  if exists (select 1 from friend_links where a = other and b = pid) then
    update friend_links set status = 'accepted' where a = other and b = pid;
    select name into me_name from players where id = pid;
    perform notify_player(other, 'Nouvel ami', me_name || ' a accepté ta demande d''ami', '/#amis');
    return 'accepted';
  end if;
  if (select count(*) from friend_links where a = pid and created_at > now() - interval '1 day') >= 50 then return 'limit'; end if;
  insert into friend_links (a, b) values (pid, other) on conflict do nothing;
  select name into me_name from players where id = pid;
  perform notify_player(other, 'Demande d''ami', me_name || ' veut devenir ton ami sur Duelia', '/#amis');
  return 'requested';
end $$;

create or replace function public.respond_friend(p_player uuid, p_accept boolean) returns void
language plpgsql security definer set search_path = public as $$
declare pid uuid := current_player(); me_name text;
begin
  if p_accept then
    update friend_links set status = 'accepted' where a = p_player and b = pid and status = 'pending';
    if found then
      select name into me_name from players where id = pid;
      perform notify_player(p_player, 'Nouvel ami', me_name || ' a accepté ta demande d''ami', '/#amis');
    end if;
  else
    delete from friend_links where a = p_player and b = pid and status = 'pending';
  end if;
end $$;

-- Retirer un ami, ou annuler une demande envoyée
create or replace function public.remove_friend(p_player uuid) returns void
language sql security definer set search_path = public as $$
  delete from friend_links where (a = current_player() and b = p_player) or (a = p_player and b = current_player())
$$;

-- ===================== Score calculé par le serveur =====================
-- questions : [{ correct, ... }], answers : [[choix, temps_ms], ...] ; dernière question ×2
create or replace function public.score_answers(p_questions jsonb, p_answers jsonb) returns int
language sql immutable set search_path = public as $$
  select coalesce(sum(
    case when (a.v ->> 0)::int >= 0 and (a.v ->> 0)::int = (p_questions -> (a.i - 1)::int ->> 'correct')::int
      then greatest(2, ceil((10000 - greatest(300, least(10000, (a.v ->> 1)::int))) / 1000.0)::int * 2)
           * (case when a.i = jsonb_array_length(p_questions) then 2 else 1 end)
      else 0 end), 0)::int
  from jsonb_array_elements(p_answers) with ordinality as a(v, i)
$$;

create or replace function public.valid_answers(p_answers jsonb, n int) returns boolean
language sql immutable as $$
  select jsonb_typeof(p_answers) = 'array' and jsonb_array_length(p_answers) = n
    and not exists (select 1 from jsonb_array_elements(p_answers) v
      where jsonb_typeof(v) <> 'array' or jsonb_typeof(v -> 0) <> 'number' or jsonb_typeof(v -> 1) <> 'number'
        or (v ->> 0)::int not between -1 and 3)
$$;

create or replace function public.valid_questions(p jsonb) returns boolean
language sql immutable as $$
  select jsonb_typeof(p) = 'array' and jsonb_array_length(p) between 3 and 10 and pg_column_size(p) < 30000
    and not exists (select 1 from jsonb_array_elements(p) q
      where jsonb_typeof(q -> 'options') <> 'array' or jsonb_array_length(q -> 'options') <> 4
        or (q ->> 'correct')::int not between 0 and 3 or char_length(q ->> 'q') not between 1 and 300)
$$;

create or replace function public.valid_topic_meta(p jsonb) returns boolean
language sql immutable as $$
  select jsonb_typeof(p) = 'object' and pg_column_size(p) < 2000 and char_length(coalesce(p ->> 'name', '')) between 1 and 60
$$;

-- ===================== Défis différés entre amis =====================
create table if not exists public.friend_challenges (
  id uuid primary key default gen_random_uuid(),
  from_player uuid not null references public.players (id) on delete cascade,
  to_player uuid not null references public.players (id) on delete cascade,
  topic_id text not null check (char_length(topic_id) between 1 and 60),
  topic jsonb not null,
  questions jsonb not null,
  from_answers jsonb not null,
  to_answers jsonb,
  from_score int not null,
  to_score int,
  status text not null default 'pending' check (status in ('pending', 'done', 'declined', 'cancelled')),
  created_at timestamptz not null default now(),
  answered_at timestamptz
);
create index if not exists friend_challenges_to on public.friend_challenges (to_player, created_at);
create index if not exists friend_challenges_from on public.friend_challenges (from_player, created_at);
alter table public.friend_challenges enable row level security;
revoke all on public.friend_challenges from anon, authenticated;

-- Le challenger a joué ses questions : le défi part chez son ami
create or replace function public.send_challenge(p_to uuid, p_topic_id text, p_topic jsonb, p_questions jsonb, p_answers jsonb) returns uuid
language plpgsql security definer set search_path = public as $$
declare pid uuid := current_player(); cid uuid; me_name text;
begin
  if pid is null or not are_friends(pid, p_to) then raise exception 'pas amis'; end if;
  if not valid_questions(p_questions) or not valid_answers(p_answers, jsonb_array_length(p_questions)) or not valid_topic_meta(p_topic) then
    raise exception 'défi invalide';
  end if;
  if (select count(*) from friend_challenges where from_player = pid and created_at > now() - interval '1 day') >= 100 then
    raise exception 'trop de défis aujourd''hui';
  end if;
  insert into friend_challenges (from_player, to_player, topic_id, topic, questions, from_answers, from_score)
  values (pid, p_to, p_topic_id, p_topic, p_questions, p_answers, score_answers(p_questions, p_answers)) returning id into cid;
  select name into me_name from players where id = pid;
  perform notify_player(p_to, 'Nouveau défi !', me_name || ' te défie sur « ' || (p_topic ->> 'name') || ' »', '/#defis');
  return cid;
end $$;

-- Mes défis des 30 derniers jours (envoyés et reçus). Le score du challenger n'est dévoilé qu'une fois le défi joué.
create or replace function public.get_challenges() returns json
language plpgsql stable security definer set search_path = public as $$
declare pid uuid := current_player();
begin
  if pid is null then return '[]'::json; end if;
  return coalesce((select json_agg(json_build_object(
      'id', c.id, 'dir', case when c.from_player = pid then 'out' else 'in' end,
      'opponent', player_card(case when c.from_player = pid then c.to_player else c.from_player end),
      'topic_id', c.topic_id, 'topic', c.topic, 'questions', c.questions,
      'status', case when c.status = 'pending' and c.created_at < now() - interval '7 days' then 'expired' else c.status end,
      'created_at', c.created_at, 'answered_at', c.answered_at,
      'from_answers', c.from_answers,
      'to_answers', case when c.status = 'done' then c.to_answers end,
      'my_score', case when c.from_player = pid then c.from_score else c.to_score end,
      'their_score', case when c.status <> 'done' then null when c.from_player = pid then c.to_score else c.from_score end
    ) order by c.created_at desc)
    from friend_challenges c
    where pid in (c.from_player, c.to_player) and c.created_at > now() - interval '30 days'), '[]'::json);
end $$;

-- L'ami joue le défi : le serveur calcule les deux scores
create or replace function public.play_challenge(p_id uuid, p_answers jsonb) returns json
language plpgsql security definer set search_path = public as $$
declare pid uuid := current_player(); c record; s int; me_name text; verdict text;
begin
  select * into c from friend_challenges where id = p_id and to_player = pid for update;
  if not found then raise exception 'défi inconnu'; end if;
  if c.status <> 'pending' or c.created_at < now() - interval '7 days' then raise exception 'défi terminé'; end if;
  if not valid_answers(p_answers, jsonb_array_length(c.questions)) then raise exception 'réponses invalides'; end if;
  s := score_answers(c.questions, p_answers);
  update friend_challenges set to_answers = p_answers, to_score = s, status = 'done', answered_at = now() where id = p_id;
  select name into me_name from players where id = pid;
  verdict := case when c.from_score > s then 'Tu as gagné' when c.from_score < s then 'Tu as perdu' else 'Égalité' end;
  perform notify_player(c.from_player, me_name || ' a joué ton défi',
    verdict || ' ' || c.from_score || '–' || s || ' sur « ' || (c.topic ->> 'name') || ' »', '/#defis');
  return json_build_object('my_score', s, 'their_score', c.from_score);
end $$;

create or replace function public.decline_challenge(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare c record; me_name text;
begin
  update friend_challenges set status = 'declined' where id = p_id and to_player = current_player() and status = 'pending'
  returning * into c;
  if found then
    select name into me_name from players where id = c.to_player;
    perform notify_player(c.from_player, 'Défi refusé', me_name || ' a refusé ton défi sur « ' || (c.topic ->> 'name') || ' »', '/#defis');
  end if;
end $$;

create or replace function public.cancel_challenge(p_id uuid) returns void
language sql security definer set search_path = public as $$
  update friend_challenges set status = 'cancelled' where id = p_id and from_player = current_player() and status = 'pending'
$$;

-- ===================== Défis en direct entre amis =====================
create table if not exists public.live_invites (
  id uuid primary key default gen_random_uuid(),
  from_player uuid not null references public.players (id) on delete cascade,
  to_player uuid not null references public.players (id) on delete cascade,
  topic_id text not null check (char_length(topic_id) between 1 and 60),
  topic jsonb not null,
  questions jsonb not null,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined', 'cancelled')),
  match_id uuid references public.matches (id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists live_invites_to on public.live_invites (to_player, created_at);
alter table public.live_invites enable row level security;
revoke all on public.live_invites from anon, authenticated;

-- Une invitation est valable 60 secondes
create or replace function public.invite_live(p_to uuid, p_topic_id text, p_topic jsonb, p_questions jsonb) returns uuid
language plpgsql security definer set search_path = public as $$
declare pid uuid := current_player(); iid uuid; me_name text;
begin
  if pid is null or not are_friends(pid, p_to) then raise exception 'pas amis'; end if;
  if not valid_questions(p_questions) or not valid_topic_meta(p_topic) then raise exception 'invitation invalide'; end if;
  delete from live_invites where created_at < now() - interval '1 day';
  update live_invites set status = 'cancelled' where from_player = pid and status = 'pending';
  insert into live_invites (from_player, to_player, topic_id, topic, questions) values (pid, p_to, p_topic_id, p_topic, p_questions)
  returning id into iid;
  select name into me_name from players where id = pid;
  perform notify_player(p_to, 'Duel en direct !', me_name || ' t''attend sur « ' || (p_topic ->> 'name') || ' »', '/#defis');
  return iid;
end $$;

-- Côté challenger : l'ami a-t-il répondu ?
create or replace function public.get_live_invite(p_id uuid) returns json
language plpgsql stable security definer set search_path = public as $$
declare pid uuid := current_player(); i record;
begin
  select * into i from live_invites where id = p_id and from_player = pid;
  if not found then return null; end if;
  return json_build_object('status', case when i.status = 'pending' and i.created_at < now() - interval '60 seconds' then 'expired' else i.status end,
    'match', case when i.match_id is not null then match_view(i.match_id, pid) end);
end $$;

create or replace function public.cancel_live_invite(p_id uuid) returns void
language sql security definer set search_path = public as $$
  update live_invites set status = 'cancelled' where id = p_id and from_player = current_player() and status = 'pending'
$$;

-- Côté ami : accepter crée le duel (mêmes tables que les duels en direct entre inconnus)
create or replace function public.respond_live_invite(p_id uuid, p_accept boolean) returns json
language plpgsql security definer set search_path = public as $$
declare pid uuid := current_player(); i record; mid uuid;
begin
  select * into i from live_invites where id = p_id and to_player = pid for update;
  if not found or i.status <> 'pending' or i.created_at < now() - interval '60 seconds' then return null; end if;
  if not p_accept then
    update live_invites set status = 'declined' where id = p_id;
    return null;
  end if;
  insert into matches (topic_id, p1, p2, questions) values (i.topic_id, i.from_player, pid, i.questions) returning id into mid;
  update live_invites set status = 'accepted', match_id = mid where id = p_id;
  return match_view(mid, pid);
end $$;

-- Présence (toutes les 30 s quand l'appli est ouverte) + invitations en direct en attente
create or replace function public.heartbeat() returns json
language plpgsql security definer set search_path = public as $$
declare pid uuid := current_player();
begin
  if pid is null then return null; end if;
  update players set last_seen = now() where id = pid;
  return json_build_object(
    'invites', coalesce((select json_agg(json_build_object('id', i.id, 'from', player_card(i.from_player), 'topic_id', i.topic_id,
        'topic', i.topic, 'created_at', i.created_at) order by i.created_at desc)
      from live_invites i where i.to_player = pid and i.status = 'pending' and i.created_at > now() - interval '60 seconds'), '[]'::json),
    'friend_requests', (select count(*) from friend_links where b = pid and status = 'pending'),
    'pending_challenges', (select count(*) from friend_challenges where to_player = pid and status = 'pending' and created_at > now() - interval '7 days'));
end $$;

-- ===================== Notifications (Web Push) =====================
create table if not exists public.push_subscriptions (
  endpoint text primary key check (char_length(endpoint) between 10 and 1000 and endpoint like 'https://%'),
  player_id uuid not null references public.players (id) on delete cascade,
  p256dh text not null check (char_length(p256dh) <= 200),
  auth text not null check (char_length(auth) <= 100),
  created_at timestamptz not null default now()
);
create index if not exists push_subscriptions_player on public.push_subscriptions (player_id);
alter table public.push_subscriptions enable row level security;
revoke all on public.push_subscriptions from anon, authenticated;

-- Secrets du serveur (lisibles par personne depuis l'appli)
create table if not exists public.app_secrets (name text primary key, value text not null);
alter table public.app_secrets enable row level security;
revoke all on public.app_secrets from anon, authenticated;

create or replace function public.save_push_subscription(p_endpoint text, p_p256dh text, p_auth text) returns void
language plpgsql security definer set search_path = public as $$
declare pid uuid := current_player();
begin
  if pid is null then raise exception 'aucun joueur'; end if;
  if (select count(*) from push_subscriptions where player_id = pid) >= 10 then
    delete from push_subscriptions where endpoint = (select endpoint from push_subscriptions where player_id = pid order by created_at limit 1);
  end if;
  insert into push_subscriptions (endpoint, player_id, p256dh, auth) values (p_endpoint, pid, p_p256dh, p_auth)
  on conflict (endpoint) do update set player_id = pid, p256dh = excluded.p256dh, auth = excluded.auth;
end $$;

create or replace function public.delete_push_subscription(p_endpoint text) returns void
language sql security definer set search_path = public as $$
  delete from push_subscriptions where endpoint = p_endpoint and player_id = current_player()
$$;

-- Envoie une notification à tous les appareils d'un joueur (appel asynchrone à la fonction Vercel)
create or replace function public.notify_player(p_player uuid, p_title text, p_body text, p_url text) returns void
language plpgsql security definer set search_path = public, extensions as $$
declare subs jsonb; secret text;
begin
  select coalesce(jsonb_agg(jsonb_build_object('endpoint', endpoint, 'keys', jsonb_build_object('p256dh', p256dh, 'auth', auth))), '[]'::jsonb)
    into subs from push_subscriptions where player_id = p_player;
  if jsonb_array_length(subs) = 0 then return; end if;
  select value into secret from app_secrets where name = 'push_secret';
  if secret is null then return; end if;
  perform net.http_post(
    url := 'https://duelia.vercel.app/api/push',
    body := jsonb_build_object('subscriptions', subs, 'title', p_title, 'body', p_body, 'url', p_url),
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-push-secret', secret),
    timeout_milliseconds := 8000);
exception when others then
  -- une notification ratée ne doit jamais bloquer le jeu
  return;
end $$;

-- La fonction Vercel signale les abonnements expirés pour qu'on les retire
create or replace function public.prune_push(p_secret text, p_endpoints text[]) returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_secret is null or p_secret <> (select value from app_secrets where name = 'push_secret') then return; end if;
  delete from push_subscriptions where endpoint = any (p_endpoints);
end $$;

-- ===================== Thèmes partagés =====================
create table if not exists public.shared_topics (
  id text primary key check (id ~ '^p-[a-z0-9]{8}$'),
  owner uuid not null references public.players (id) on delete cascade,
  meta jsonb not null,          -- name, icon, color, category, tagline, ladder
  questions jsonb not null,     -- [{ q, a: [bonne, fausse, fausse, fausse] }]
  n_questions int not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists shared_topics_updated on public.shared_topics (updated_at desc);
alter table public.shared_topics enable row level security;
revoke all on public.shared_topics from anon, authenticated;

create or replace function public.valid_bank(p jsonb) returns boolean
language sql immutable as $$
  select jsonb_typeof(p) = 'array' and jsonb_array_length(p) between 7 and 500 and pg_column_size(p) < 400000
    and not exists (select 1 from jsonb_array_elements(p) q
      where char_length(coalesce(q ->> 'q', '')) not between 1 and 300
        or jsonb_typeof(q -> 'a') <> 'array' or jsonb_array_length(q -> 'a') <> 4)
$$;

-- Publier (ou mettre à jour) un thème. Renvoie son identifiant public p-xxxxxxxx.
create or replace function public.publish_topic(p_id text, p_meta jsonb, p_questions jsonb) returns text
language plpgsql security definer set search_path = public, extensions as $$
declare pid uuid := current_player(); nid text;
begin
  if pid is null then raise exception 'aucun joueur'; end if;
  if not valid_topic_meta(p_meta) or not valid_bank(p_questions) then raise exception 'thème invalide'; end if;
  if p_id is not null then
    update shared_topics set meta = p_meta, questions = p_questions, n_questions = jsonb_array_length(p_questions), updated_at = now()
      where id = p_id and owner = pid;
    if found then return p_id; end if;
  end if;
  if (select count(*) from shared_topics where owner = pid) >= 30 then raise exception 'trop de thèmes publiés'; end if;
  nid := 'p-' || substr(encode(gen_random_bytes(8), 'hex'), 1, 8);
  insert into shared_topics (id, owner, meta, questions, n_questions) values (nid, pid, p_meta, p_questions, jsonb_array_length(p_questions));
  return nid;
end $$;

create or replace function public.unpublish_topic(p_id text) returns void
language sql security definer set search_path = public as $$
  delete from shared_topics where id = p_id and owner = current_player()
$$;

-- Liste des thèmes publiés (recherche facultative), du plus joué au moins joué
create or replace function public.list_shared_topics(p_query text default null) returns json
language sql stable security definer set search_path = public as $$
  select coalesce(json_agg(x order by x.players desc, x.updated_at desc), '[]'::json) from (
    select t.id, t.meta, t.n_questions, t.updated_at, p.name as by_name, t.owner = current_player() as mine,
      (select count(distinct e.player_id) from xp_events e where e.topic_id = t.id) as players
    from shared_topics t join players p on p.id = t.owner
    where p_query is null or p_query = '' or (t.meta ->> 'name') ilike '%' || p_query || '%' or (t.meta ->> 'category') ilike '%' || p_query || '%'
    order by 7 desc, t.updated_at desc limit 60) x
$$;

create or replace function public.get_shared_topic(p_id text) returns json
language sql stable security definer set search_path = public as $$
  select json_build_object('id', t.id, 'meta', t.meta, 'questions', t.questions, 'updated_at', t.updated_at,
    'by_name', p.name, 'mine', t.owner = current_player())
  from shared_topics t join players p on p.id = t.owner where t.id = p_id
$$;

-- ===================== Droits =====================
revoke all on function public.are_friends(uuid, uuid), public.player_card(uuid), public.notify_player(uuid, text, text, text),
  public.score_answers(jsonb, jsonb), public.valid_answers(jsonb, int), public.valid_questions(jsonb),
  public.valid_topic_meta(jsonb), public.valid_bank(jsonb) from public, anon, authenticated;
revoke all on function public.my_friend_code(), public.get_friends(), public.add_friend(text), public.respond_friend(uuid, boolean),
  public.remove_friend(uuid), public.send_challenge(uuid, text, jsonb, jsonb, jsonb), public.get_challenges(),
  public.play_challenge(uuid, jsonb), public.decline_challenge(uuid), public.cancel_challenge(uuid),
  public.invite_live(uuid, text, jsonb, jsonb), public.get_live_invite(uuid), public.cancel_live_invite(uuid),
  public.respond_live_invite(uuid, boolean), public.heartbeat(), public.save_push_subscription(text, text, text),
  public.delete_push_subscription(text), public.publish_topic(text, jsonb, jsonb), public.unpublish_topic(text),
  public.list_shared_topics(text), public.get_shared_topic(text), public.prune_push(text, text[]) from public, anon;
grant execute on function public.my_friend_code(), public.get_friends(), public.add_friend(text), public.respond_friend(uuid, boolean),
  public.remove_friend(uuid), public.send_challenge(uuid, text, jsonb, jsonb, jsonb), public.get_challenges(),
  public.play_challenge(uuid, jsonb), public.decline_challenge(uuid), public.cancel_challenge(uuid),
  public.invite_live(uuid, text, jsonb, jsonb), public.get_live_invite(uuid), public.cancel_live_invite(uuid),
  public.respond_live_invite(uuid, boolean), public.heartbeat(), public.save_push_subscription(text, text, text),
  public.delete_push_subscription(text), public.publish_topic(text, jsonb, jsonb), public.unpublish_topic(text),
  public.list_shared_topics(text), public.get_shared_topic(text) to authenticated;
grant execute on function public.prune_push(text, text[]) to anon, authenticated;
