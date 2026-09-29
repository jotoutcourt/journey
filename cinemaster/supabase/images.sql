-- ═══════════════════════════════════════════════════════════════════════════
-- PopCard : images des cartes et des boosters, visibles par tous les joueurs
-- À coller une fois dans Supabase → SQL Editor → New query → Run
-- (après schema.sql).
-- ═══════════════════════════════════════════════════════════════════════════

-- Administrateurs : les comptes qui peuvent déposer les images.
create table if not exists public.admins (
  user_id uuid primary key references auth.users on delete cascade
);
alter table public.admins enable row level security;
-- (aucune règle : la table n'est lisible que par le serveur)

create or replace function public.is_admin()
returns boolean language sql security definer set search_path = public stable as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;
grant execute on function public.is_admin() to anon, authenticated;

-- Index des images : clé de la carte (ex. « rachel-green-full ») → fichier.
create table if not exists public.card_images (
  key text primary key,
  path text not null,
  updated_at timestamptz not null default now()
);
alter table public.card_images enable row level security;

drop policy if exists "images visibles de tous" on public.card_images;
create policy "images visibles de tous" on public.card_images for select to anon, authenticated using (true);
drop policy if exists "images gérées par l'admin" on public.card_images;
create policy "images gérées par l'admin" on public.card_images for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Espace de fichiers public « card-images »
insert into storage.buckets (id, name, public)
values ('card-images', 'card-images', true)
on conflict (id) do update set public = true;

-- (remplacer un fichier demande aussi de pouvoir lister l'espace)
drop policy if exists "popcard lecture" on storage.objects;
create policy "popcard lecture" on storage.objects for select to anon, authenticated
  using (bucket_id = 'card-images');
drop policy if exists "popcard admin ajoute" on storage.objects;
create policy "popcard admin ajoute" on storage.objects for insert to authenticated
  with check (bucket_id = 'card-images' and public.is_admin());
drop policy if exists "popcard admin modifie" on storage.objects;
create policy "popcard admin modifie" on storage.objects for update to authenticated
  using (bucket_id = 'card-images' and public.is_admin());
drop policy if exists "popcard admin supprime" on storage.objects;
create policy "popcard admin supprime" on storage.objects for delete to authenticated
  using (bucket_id = 'card-images' and public.is_admin());

-- ─── À faire une fois, APRÈS t'être connecté(e) une première fois dans
-- l'appli avec ton e-mail : remplace l'adresse puis exécute cette ligne.
-- insert into public.admins (user_id) select id from auth.users where email = 'ton@email.fr';
