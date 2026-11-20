-- Duelia : comptes joueurs, sauvegarde de la progression et classements réels.
-- Aucune table n'est accessible directement (RLS sans politique, droits retirés) :
-- tout passe par des fonctions qui n'agissent que pour le joueur connecté (auth.uid()).

create table if not exists public.players (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 18),
  avatar text not null default 'x' check (char_length(avatar) <= 40),
  flag text not null default '🇫🇷' check (char_length(flag) <= 8),
  bio text not null default '' check (char_length(bio) <= 150),
  photo text check (photo is null or (char_length(photo) <= 60000 and photo like 'data:image/jpeg;base64,%')),
  recovery_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.player_devices (
  uid uuid primary key references auth.users (id) on delete cascade,
  player_id uuid not null references public.players (id) on delete cascade,
  added_at timestamptz not null default now()
);

create table if not exists public.player_state (
  player_id uuid primary key references public.players (id) on delete cascade,
  data jsonb not null check (pg_column_size(data) < 1500000),
  updated_at timestamptz not null default now()
);

create table if not exists public.xp_events (
  id bigint generated always as identity primary key,
  player_id uuid not null references public.players (id) on delete cascade,
  topic_id text not null check (char_length(topic_id) between 1 and 60),
  xp int not null check (xp between 1 and 20000),
  at timestamptz not null default now()
);
create index if not exists xp_events_topic_at on public.xp_events (topic_id, at);
create index if not exists xp_events_player_at on public.xp_events (player_id, at);

alter table public.players enable row level security;
alter table public.player_devices enable row level security;
alter table public.player_state enable row level security;
alter table public.xp_events enable row level security;
revoke all on public.players, public.player_devices, public.player_state, public.xp_events from anon, authenticated;

-- Joueur rattaché à l'appareil connecté
create or replace function public.current_player() returns uuid
language sql stable security definer set search_path = public as $$
  select player_id from player_devices where uid = auth.uid()
$$;

create or replace function public.get_me() returns json
language sql stable security definer set search_path = public as $$
  select json_build_object('id', p.id, 'name', p.name, 'avatar', p.avatar, 'flag', p.flag, 'bio', p.bio,
                           'has_recovery', p.recovery_hash is not null)
  from players p where p.id = current_player()
$$;

-- Premier lancement : crée le joueur et le rattache à cet appareil (sans effet s'il existe déjà)
create or replace function public.create_player(p_name text, p_avatar text, p_flag text) returns uuid
language plpgsql security definer set search_path = public as $$
declare pid uuid;
begin
  if auth.uid() is null then raise exception 'non connecté'; end if;
  pid := current_player();
  if pid is not null then return pid; end if;
  insert into players (name, avatar, flag) values (p_name, coalesce(p_avatar, 'x'), coalesce(p_flag, '🇫🇷')) returning id into pid;
  insert into player_devices (uid, player_id) values (auth.uid(), pid);
  return pid;
end $$;

create or replace function public.update_profile(p_name text, p_avatar text, p_flag text, p_bio text, p_photo text) returns void
language plpgsql security definer set search_path = public as $$
begin
  update players set name = p_name, avatar = coalesce(p_avatar, avatar), flag = coalesce(p_flag, flag),
    bio = coalesce(p_bio, ''), photo = p_photo, updated_at = now()
  where id = current_player();
end $$;

create or replace function public.save_state(p_data jsonb) returns void
language plpgsql security definer set search_path = public as $$
declare pid uuid := current_player();
begin
  if pid is null then raise exception 'aucun joueur'; end if;
  insert into player_state (player_id, data, updated_at) values (pid, p_data, now())
  on conflict (player_id) do update set data = excluded.data, updated_at = now();
end $$;

create or replace function public.load_state() returns jsonb
language sql stable security definer set search_path = public as $$
  select data from player_state where player_id = current_player()
$$;

-- XP gagnée dans un thème. p_backfill : reprise de l'XP d'avant les comptes (une fois par thème,
-- datée d'il y a 60 jours pour ne compter que dans le classement « depuis toujours »).
create or replace function public.add_xp(p_topic text, p_xp int, p_backfill boolean default false) returns void
language plpgsql security definer set search_path = public as $$
declare pid uuid := current_player();
begin
  if pid is null or p_xp is null or p_xp < 1 then return; end if;
  if (select count(*) from xp_events where player_id = pid and at > now() - interval '1 hour') >= 120 then return; end if;
  if p_backfill then
    if exists (select 1 from xp_events where player_id = pid and topic_id = p_topic) then return; end if;
    insert into xp_events (player_id, topic_id, xp, at) values (pid, p_topic, least(p_xp, 20000), now() - interval '60 days');
  else
    insert into xp_events (player_id, topic_id, xp) values (pid, p_topic, least(p_xp, 800));
  end if;
end $$;

-- Code de connexion : affiché une seule fois, seule son empreinte est gardée. En créer un nouveau annule l'ancien.
create or replace function public.make_recovery_code() returns text
language plpgsql security definer set search_path = public, extensions as $$
declare pid uuid := current_player(); raw text;
begin
  if pid is null then raise exception 'aucun joueur'; end if;
  raw := upper(encode(gen_random_bytes(10), 'hex'));
  update players set recovery_hash = encode(digest(raw, 'sha256'), 'hex') where id = pid;
  return substr(raw, 1, 5) || '-' || substr(raw, 6, 5) || '-' || substr(raw, 11, 5) || '-' || substr(raw, 16, 5);
end $$;

-- Retrouver son compte sur un autre appareil avec le code
create or replace function public.recover(p_code text) returns uuid
language plpgsql security definer set search_path = public, extensions as $$
declare target uuid; norm text;
begin
  if auth.uid() is null then raise exception 'non connecté'; end if;
  norm := upper(regexp_replace(coalesce(p_code, ''), '[^0-9A-Fa-f]', '', 'g'));
  if char_length(norm) <> 20 then return null; end if;
  select id into target from players where recovery_hash = encode(digest(norm, 'sha256'), 'hex');
  if target is null then return null; end if;
  insert into player_devices (uid, player_id) values (auth.uid(), target)
  on conflict (uid) do update set player_id = excluded.player_id, added_at = now();
  return target;
end $$;

-- Classement réel d'un thème : semaine (depuis lundi), mois, ou depuis toujours
create or replace function public.get_leaderboard(p_topic text, p_period text)
returns table (player_id uuid, name text, avatar text, flag text, xp bigint)
language sql stable security definer set search_path = public as $$
  select p.id, p.name, p.avatar, p.flag, sum(e.xp)::bigint
  from xp_events e join players p on p.id = e.player_id
  where e.topic_id = p_topic
    and e.at >= case p_period when 'week' then date_trunc('week', now())
                              when 'month' then date_trunc('month', now())
                              else '-infinity'::timestamptz end
  group by p.id
  order by 5 desc
  limit 100
$$;

revoke all on function public.current_player(), public.get_me(), public.create_player(text, text, text),
  public.update_profile(text, text, text, text, text), public.save_state(jsonb), public.load_state(),
  public.add_xp(text, int, boolean), public.make_recovery_code(), public.recover(text),
  public.get_leaderboard(text, text) from public, anon;
grant execute on function public.get_me(), public.create_player(text, text, text),
  public.update_profile(text, text, text, text, text), public.save_state(jsonb), public.load_state(),
  public.add_xp(text, int, boolean), public.make_recovery_code(), public.recover(text),
  public.get_leaderboard(text, text) to authenticated;
