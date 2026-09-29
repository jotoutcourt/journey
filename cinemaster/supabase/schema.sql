-- ═══════════════════════════════════════════════════════════════════════════
-- PopCard : comptes, sauvegarde en ligne et échanges entre amis
-- À coller une fois dans Supabase → SQL Editor → New query → Run.
-- ═══════════════════════════════════════════════════════════════════════════

-- Profils : un pseudo par compte (unique, sans tenir compte des majuscules)
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  pseudo text not null check (char_length(pseudo) between 2 and 20 and pseudo ~ '^[A-Za-z0-9_.-]+$'),
  created_at timestamptz not null default now()
);
create unique index if not exists profiles_pseudo_lower on public.profiles (lower(pseudo));

-- Sauvegarde de la collection (le même format que dans le navigateur)
create table if not exists public.saves (
  user_id uuid primary key references auth.users on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

-- Échanges : je donne une carte (en double chez moi), et je peux demander
-- en retour une carte que l'autre a en double. Sans demande = cadeau.
create table if not exists public.trades (
  id uuid primary key default gen_random_uuid(),
  from_user uuid not null references auth.users on delete cascade,
  to_user uuid not null references auth.users on delete cascade,
  give_card text not null,
  want_card text,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined', 'cancelled')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  check (from_user <> to_user)
);
create index if not exists trades_to on public.trades (to_user, status);
create index if not exists trades_from on public.trades (from_user, status);

-- Cartes à livrer : ce qu'un échange rapporte (ou rend) à un joueur ;
-- son appli les récupère et les ajoute à sa collection.
create table if not exists public.deliveries (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users on delete cascade,
  card_id text not null,
  qty int not null default 1,
  reason text,
  created_at timestamptz not null default now()
);
create index if not exists deliveries_user on public.deliveries (user_id);

-- ─── Droits (Row Level Security) ──────────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.saves enable row level security;
alter table public.trades enable row level security;
alter table public.deliveries enable row level security;

drop policy if exists "profils visibles des joueurs" on public.profiles;
create policy "profils visibles des joueurs" on public.profiles for select to authenticated using (true);
drop policy if exists "mon profil" on public.profiles;
create policy "mon profil" on public.profiles for insert to authenticated with check (id = auth.uid());
drop policy if exists "modifier mon profil" on public.profiles;
create policy "modifier mon profil" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "ma sauvegarde" on public.saves;
create policy "ma sauvegarde" on public.saves for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "mes échanges" on public.trades;
create policy "mes échanges" on public.trades for select to authenticated using (from_user = auth.uid() or to_user = auth.uid());
drop policy if exists "proposer un échange" on public.trades;
create policy "proposer un échange" on public.trades for insert to authenticated
  with check (from_user = auth.uid() and status = 'pending');

drop policy if exists "mes livraisons" on public.deliveries;
create policy "mes livraisons" on public.deliveries for select to authenticated using (user_id = auth.uid());
drop policy if exists "récupérer mes livraisons" on public.deliveries;
create policy "récupérer mes livraisons" on public.deliveries for delete to authenticated using (user_id = auth.uid());

-- ─── Actions sur un échange (vérifiées côté serveur) ─────────────────────
-- Le donneur a déjà retiré sa carte de sa collection en proposant.

-- Accepter : le destinataire reçoit la carte (son appli l'ajoute) ; le
-- donneur reçoit la carte demandée par une livraison.
create or replace function public.accept_trade(trade_id uuid)
returns public.trades language plpgsql security definer set search_path = public as $$
declare t public.trades;
begin
  update public.trades set status = 'accepted', resolved_at = now()
    where id = trade_id and to_user = auth.uid() and status = 'pending'
    returning * into t;
  if t.id is null then raise exception 'échange introuvable ou déjà traité'; end if;
  if t.want_card is not null then
    insert into public.deliveries (user_id, card_id, qty, reason) values (t.from_user, t.want_card, 1, 'échange accepté');
  end if;
  return t;
end $$;

-- Refuser : la carte proposée retourne au donneur.
create or replace function public.decline_trade(trade_id uuid)
returns public.trades language plpgsql security definer set search_path = public as $$
declare t public.trades;
begin
  update public.trades set status = 'declined', resolved_at = now()
    where id = trade_id and to_user = auth.uid() and status = 'pending'
    returning * into t;
  if t.id is null then raise exception 'échange introuvable ou déjà traité'; end if;
  insert into public.deliveries (user_id, card_id, qty, reason) values (t.from_user, t.give_card, 1, 'échange refusé');
  return t;
end $$;

-- Annuler (par le donneur) : son appli remet la carte dans sa collection.
create or replace function public.cancel_trade(trade_id uuid)
returns public.trades language plpgsql security definer set search_path = public as $$
declare t public.trades;
begin
  update public.trades set status = 'cancelled', resolved_at = now()
    where id = trade_id and from_user = auth.uid() and status = 'pending'
    returning * into t;
  if t.id is null then raise exception 'échange introuvable ou déjà traité'; end if;
  return t;
end $$;

-- Doublons d'un ami (pour choisir quoi lui demander) : seulement les
-- identifiants des cartes qu'il a en au moins deux exemplaires.
create or replace function public.duplicates_of(friend uuid)
returns setof text language sql security definer set search_path = public stable as $$
  select key from public.saves s, jsonb_each_text(s.data -> 'owned')
  where s.user_id = friend and value::int >= 2 and auth.uid() is not null;
$$;

grant execute on function public.accept_trade(uuid), public.decline_trade(uuid),
  public.cancel_trade(uuid), public.duplicates_of(uuid) to authenticated;

-- Propositions d'échange reçues en direct dans l'appli
do $$ begin
  alter publication supabase_realtime add table public.trades;
exception when duplicate_object then null; when undefined_object then null;
end $$;
