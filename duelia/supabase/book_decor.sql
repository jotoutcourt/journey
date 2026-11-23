-- Décors du livre de stickers : gratuits, à volonté, posés où le joueur veut (et retirables).
create table if not exists public.book_decor (
  id bigserial primary key,
  player_id uuid not null references public.players (id) on delete cascade,
  deco text not null check (deco ~ '^[a-z0-9-]{1,30}$'),
  page int not null check (page between 0 and 19),
  x real not null check (x between 0 and 1),
  y real not null check (y between 0 and 1),
  rot real not null default 0 check (rot between -180 and 180),
  size real not null default 0.3 check (size between 0.1 and 0.7),
  created_at timestamptz not null default now()
);
create index if not exists book_decor_player on public.book_decor (player_id, page);
alter table public.book_decor enable row level security;
revoke all on public.book_decor from anon, authenticated;

create or replace function public.place_decor(p_deco text, p_page int, p_x real, p_y real, p_rot real, p_size real) returns bigint
language plpgsql security definer set search_path = public as $$
declare pid uuid := current_player(); nid bigint;
begin
  if pid is null then raise exception 'aucun joueur'; end if;
  if p_deco not in ('etoiles-rouges','appareil-photo','smiley','etoiles','nuage','soleil','washi','bisou','tulipes',
    'boule-disco','couronne','coeur-fleche','cachet-coeur','chat','avion','van',
    'arc-en-ciel','grenouille','chat-rieur','telephone','monstre-vert','piments','mygale','monstre-bleu','alien','dino','lettres','ticket','fantome','bulles') then raise exception 'décor inconnu'; end if;
  if (select count(*) from book_decor where player_id = pid and page = p_page) >= 40 then raise exception 'page pleine'; end if;
  insert into book_decor (player_id, deco, page, x, y, rot, size)
  values (pid, p_deco, greatest(0, least(19, p_page)), greatest(0, least(1, p_x)), greatest(0, least(1, p_y)),
    greatest(-180, least(180, p_rot)), greatest(0.1, least(0.7, p_size)))
  returning id into nid;
  return nid;
end $$;

create or replace function public.remove_decor(p_id bigint) returns boolean
language plpgsql security definer set search_path = public as $$
begin
  delete from book_decor where id = p_id and player_id = current_player();
  return found;
end $$;

-- Le livre renvoie maintenant aussi les décors
create or replace function public.get_sticker_book(p_player uuid default null) returns json
language plpgsql stable security definer set search_path = public as $$
declare pid uuid := current_player(); who uuid := coalesce(p_player, current_player());
begin
  if pid is null or (who <> pid and not are_friends(pid, who)) then return null; end if;
  return json_build_object(
    'placed', coalesce((select json_agg(json_build_object('id', sticker_id, 'page', page, 'x', x, 'y', y, 'rot', rot) order by placed_at)
      from sticker_book where player_id = who), '[]'::json),
    'unlocked', coalesce((select json_agg(d.id) from sticker_defs d where sticker_unlocked(who, d.id)), '[]'::json),
    'decor', coalesce((select json_agg(json_build_object('id', id, 'deco', deco, 'page', page, 'x', x, 'y', y, 'rot', rot, 'size', size) order by id)
      from book_decor where player_id = who), '[]'::json));
end $$;

revoke all on function public.place_decor(text, int, real, real, real, real), public.remove_decor(bigint) from public, anon;
grant execute on function public.place_decor(text, int, real, real, real, real), public.remove_decor(bigint) to authenticated;
