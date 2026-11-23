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
