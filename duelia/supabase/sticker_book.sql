-- Livre de stickers : chaque joueur colle ses stickers (débloqués au niveau 15 d'un thème) où il veut sur les pages.
-- Une fois collé, un sticker ne bouge plus, comme un vrai autocollant.

create table if not exists public.sticker_defs (
  id text primary key,
  topic_id text not null,
  name text not null
);
alter table public.sticker_defs enable row level security;
revoke all on public.sticker_defs from anon, authenticated;
insert into public.sticker_defs (id, topic_id, name) values
  ('swiftie', 'taylor-swift', 'Kraken Swiftie'),
  ('chirurgien', 'c-greys', 'Kraken chirurgien')
on conflict (id) do update set topic_id = excluded.topic_id, name = excluded.name;

create table if not exists public.sticker_book (
  player_id uuid not null references public.players (id) on delete cascade,
  sticker_id text not null references public.sticker_defs (id),
  page int not null check (page between 0 and 19),
  x real not null check (x between 0 and 1),
  y real not null check (y between 0 and 1),
  rot real not null default 0 check (rot between -30 and 30),
  placed_at timestamptz not null default now(),
  primary key (player_id, sticker_id)
);
alter table public.sticker_book enable row level security;
revoke all on public.sticker_book from anon, authenticated;

-- Niveau 15 d'un thème = 6 860 XP (même calcul que l'appli)
create or replace function public.sticker_unlocked(p_player uuid, p_sticker text) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select sum(e.xp) from xp_events e join sticker_defs d on d.topic_id = e.topic_id
    where e.player_id = p_player and d.id = p_sticker), 0) >= 6860
$$;

-- Livre d'un joueur (soi-même ou un ami) : stickers collés et stickers débloqués pas encore collés
create or replace function public.get_sticker_book(p_player uuid default null) returns json
language plpgsql stable security definer set search_path = public as $$
declare pid uuid := current_player(); who uuid := coalesce(p_player, current_player());
begin
  if pid is null or (who <> pid and not are_friends(pid, who)) then return null; end if;
  return json_build_object(
    'placed', coalesce((select json_agg(json_build_object('id', sticker_id, 'page', page, 'x', x, 'y', y, 'rot', rot) order by placed_at)
      from sticker_book where player_id = who), '[]'::json),
    'unlocked', coalesce((select json_agg(d.id) from sticker_defs d where sticker_unlocked(who, d.id)), '[]'::json));
end $$;

create or replace function public.place_sticker(p_sticker text, p_page int, p_x real, p_y real, p_rot real) returns boolean
language plpgsql security definer set search_path = public as $$
declare pid uuid := current_player();
begin
  if pid is null then raise exception 'aucun joueur'; end if;
  if not sticker_unlocked(pid, p_sticker) then raise exception 'sticker pas encore débloqué'; end if;
  insert into sticker_book (player_id, sticker_id, page, x, y, rot)
  values (pid, p_sticker, greatest(0, least(19, p_page)), greatest(0, least(1, p_x)), greatest(0, least(1, p_y)), greatest(-30, least(30, p_rot)))
  on conflict do nothing; -- déjà collé : il ne bouge plus
  return true;
end $$;

revoke all on function public.sticker_unlocked(uuid, text) from public, anon, authenticated;
revoke all on function public.get_sticker_book(uuid), public.place_sticker(text, int, real, real, real) from public, anon;
grant execute on function public.get_sticker_book(uuid), public.place_sticker(text, int, real, real, real) to authenticated;
