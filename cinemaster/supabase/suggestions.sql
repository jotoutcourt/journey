-- ═══════════════════════════════════════════════════════════════════════════
-- PopCard : les joueurs proposent le prochain univers (film ou série) et votent
-- À coller une fois dans Supabase → SQL Editor → New query → Run
-- (après schema.sql et images.sql).
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists public.universe_suggestions (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 2 and 100),
  title_key text not null unique,           -- titre simplifié : évite les doublons
  kind text not null check (kind in ('Film', 'Série')),
  status text not null default 'open' check (status in ('open', 'added')),
  created_by uuid references auth.users on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.suggestion_votes (
  suggestion_id uuid not null references public.universe_suggestions on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  created_at timestamptz not null default now(),
  primary key (suggestion_id, user_id)
);

-- Fiche IMDb choisie dans la recherche : identifiant (tt…), années, affiche
alter table public.universe_suggestions add column if not exists imdb_id text unique
  check (imdb_id ~ '^tt[0-9]{5,10}$');
alter table public.universe_suggestions add column if not exists year text
  check (char_length(year) <= 12);
alter table public.universe_suggestions add column if not exists poster text
  check (poster ~ '^https://m\.media-amazon\.com/' and char_length(poster) <= 400);

-- Tout passe par les fonctions ci-dessous (aucun accès direct aux tables).
alter table public.universe_suggestions enable row level security;
alter table public.suggestion_votes enable row level security;

-- Titre simplifié : minuscules, sans accents ni ponctuation
create or replace function public.suggestion_key(t text)
returns text language sql immutable as $$
  select trim(both '-' from regexp_replace(lower(translate(t,
    'ÀÁÂÃÄÅàáâãäåÈÉÊËèéêëÌÍÎÏìíîïÒÓÔÕÖòóôõöÙÚÛÜùúûüÇçÑñ',
    'AAAAAAaaaaaaEEEEeeeeIIIIiiiiOOOOOoooooUUUUuuuuCcNn')), '[^a-z0-9]+', '-', 'g'));
$$;

-- Liste classée par votes (visible de tous, même sans compte)
drop function if exists public.list_suggestions();
create or replace function public.list_suggestions()
returns table (id uuid, title text, kind text, status text, imdb_id text, year text, poster text,
               votes bigint, voted boolean, mine boolean, created_at timestamptz)
language sql security definer set search_path = public stable as $$
  select s.id, s.title, s.kind, s.status, s.imdb_id, s.year, s.poster,
    count(v.user_id) as votes,
    coalesce(bool_or(v.user_id = auth.uid()), false) as voted,
    coalesce(s.created_by = auth.uid(), false) as mine,
    s.created_at
  from public.universe_suggestions s
  left join public.suggestion_votes v on v.suggestion_id = s.id
  group by s.id
  order by (s.status = 'added'), count(v.user_id) desc, s.created_at asc
  limit 200;
$$;

-- Proposer un titre (ou voter pour lui s'il est déjà proposé).
-- Choisi dans la recherche IMDb : les doublons sont repérés par la fiche
-- IMDb (pas de souci de faute de frappe) ; sinon par le titre simplifié.
drop function if exists public.propose_suggestion(text, text);
create or replace function public.propose_suggestion(p_title text, p_kind text,
  p_imdb text default null, p_year text default null, p_poster text default null)
returns uuid language plpgsql security definer set search_path = public as $$
declare k text; sid uuid; recent int;
begin
  if auth.uid() is null then raise exception 'connexion requise'; end if;
  p_title := trim(regexp_replace(p_title, '\s+', ' ', 'g'));
  k := public.suggestion_key(p_title);
  if char_length(k) < 2 then raise exception 'titre trop court'; end if;
  if p_imdb is not null then
    select id into sid from public.universe_suggestions where imdb_id = p_imdb;
    k := p_imdb;      -- deux œuvres du même nom restent distinctes
  else
    select id into sid from public.universe_suggestions where title_key = k;
  end if;
  if sid is null then
    select count(*) into recent from public.universe_suggestions
      where created_by = auth.uid() and created_at > now() - interval '1 day';
    if recent >= 5 then raise exception 'limite de propositions atteinte pour aujourd''hui'; end if;
    insert into public.universe_suggestions (title, title_key, kind, imdb_id, year, poster, created_by)
      values (p_title, k, p_kind, p_imdb, nullif(p_year, ''), p_poster, auth.uid()) returning id into sid;
  end if;
  insert into public.suggestion_votes (suggestion_id, user_id) values (sid, auth.uid())
    on conflict do nothing;
  return sid;
end $$;

-- Voter / retirer son vote ; renvoie vrai si le joueur vote désormais
create or replace function public.toggle_vote(p_id uuid)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'connexion requise'; end if;
  if not exists (select 1 from public.universe_suggestions where id = p_id) then
    raise exception 'proposition introuvable';
  end if;
  delete from public.suggestion_votes where suggestion_id = p_id and user_id = auth.uid();
  if found then return false; end if;
  insert into public.suggestion_votes (suggestion_id, user_id) values (p_id, auth.uid());
  return true;
end $$;

-- Admin : marquer « ajouté au jeu » (ou revenir en arrière), supprimer
create or replace function public.set_suggestion_status(p_id uuid, p_status text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'réservé à l''admin'; end if;
  update public.universe_suggestions set status = p_status where id = p_id;
end $$;

create or replace function public.delete_suggestion(p_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'réservé à l''admin'; end if;
  delete from public.universe_suggestions where id = p_id;
end $$;

grant execute on function public.list_suggestions() to anon, authenticated;
grant execute on function public.propose_suggestion(text, text, text, text, text), public.toggle_vote(uuid),
  public.set_suggestion_status(uuid, text), public.delete_suggestion(uuid) to authenticated;
