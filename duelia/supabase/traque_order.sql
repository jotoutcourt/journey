alter table public.traque_games add column if not exists turn_order jsonb;
create or replace function public.traque_order_roll(p_game uuid) returns json language plpgsql security definer set search_path = public as $$
declare s int := tq_my_seat(p_game); g traque_games;
begin
  select * into g from traque_games where id = p_game for update;
  if g.phase = 'order' and s is not null and not (g.data -> 'rolls' ? s::text) then
    update traque_games set data = jsonb_set(data, array['rolls', s::text], to_jsonb(1 + floor(random() * 6)::int)), version = version + 1 where id = p_game;
  end if;
  perform traque_tick(p_game);
  return traque_view(p_game, current_player());
end $$;
revoke all on function public.traque_order_roll(uuid) from public, anon;
grant execute on function public.traque_order_roll(uuid) to authenticated;
