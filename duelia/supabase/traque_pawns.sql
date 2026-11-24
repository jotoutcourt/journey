-- Chasse au Kraken : chaque joueur choisit sa figurine (pion). Les robots en reçoivent une au hasard.
alter table public.traque_players add column if not exists pawn text;

create or replace function public.set_traque_pawn(p_game uuid, p_pawn text) returns void language plpgsql security definer set search_path = public as $$
begin
  if p_pawn !~ '^[a-z0-9-]{1,30}$' then raise exception 'pion invalide'; end if;
  update traque_players set pawn = p_pawn, updated_at = now()
  where game_id = p_game and player_id = current_player() and status = 'joined'
    and exists (select 1 from traque_games where id = p_game and status = 'lobby');
  update traque_games set version = version + 1 where id = p_game;
end $$;
revoke all on function public.set_traque_pawn(uuid, text) from public, anon;
grant execute on function public.set_traque_pawn(uuid, text) to authenticated;

-- Figurines : les 4 premières sont offertes, les autres s'achètent en lingots (une fois pour toutes)
create table if not exists public.pawn_unlocks (
  player_id uuid not null references public.players (id) on delete cascade,
  pawn_id text not null check (pawn_id ~ '^[a-z0-9-]{1,30}$'),
  created_at timestamptz not null default now(),
  primary key (player_id, pawn_id)
);
alter table public.pawn_unlocks enable row level security;
revoke all on public.pawn_unlocks from anon, authenticated;

create or replace function public.pawn_price(p_pawn text) returns int language sql immutable as $$
  select case when p_pawn in ('stitch', 'gilet', 'araignee', 'sorcier') then 0 else 30 end
$$;

create or replace function public.my_pawns() returns json language sql security definer set search_path = public as $$
  select coalesce(json_agg(pawn_id), '[]'::json) from pawn_unlocks where player_id = current_player()
$$;

create or replace function public.buy_pawn(p_pawn text) returns json language plpgsql security definer set search_path = public as $$
declare pid uuid := current_player(); price int := pawn_price(p_pawn);
begin
  if pid is null then raise exception 'aucun joueur'; end if;
  if p_pawn !~ '^[a-z0-9-]{1,30}$' then raise exception 'pion invalide'; end if;
  if price > 0 and not exists (select 1 from pawn_unlocks where player_id = pid and pawn_id = p_pawn) then
    if coalesce((select lingots from wallets where player_id = pid for update), 0) < price then raise exception 'pas assez de lingots'; end if;
    perform wallet_credit(pid, -price, 'achat', null);
    insert into pawn_unlocks (player_id, pawn_id) values (pid, p_pawn);
  end if;
  return json_build_object('pawns', my_pawns(), 'wallet', get_wallet());
end $$;

create or replace function public.set_traque_pawn(p_game uuid, p_pawn text) returns void language plpgsql security definer set search_path = public as $$
begin
  if p_pawn !~ '^[a-z0-9-]{1,30}$' then raise exception 'pion invalide'; end if;
  if pawn_price(p_pawn) > 0 and not exists (select 1 from pawn_unlocks where player_id = current_player() and pawn_id = p_pawn) then
    raise exception 'figurine à acheter';
  end if;
  update traque_players set pawn = p_pawn, updated_at = now()
  where game_id = p_game and player_id = current_player() and status = 'joined'
    and exists (select 1 from traque_games where id = p_game and status = 'lobby');
  update traque_games set version = version + 1 where id = p_game;
end $$;
revoke all on function public.pawn_price(text) from public, anon;
revoke all on function public.my_pawns(), public.buy_pawn(text) from public, anon;
grant execute on function public.my_pawns(), public.buy_pawn(text), public.pawn_price(text) to authenticated;
