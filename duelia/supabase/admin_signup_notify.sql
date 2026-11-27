-- Notification au créateur de l'appli à chaque nouvelle inscription (et à personne d'autre)
create or replace function public.tg_notify_admin_signup() returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform notify_player('a74d38cf-eaaf-4ba7-a7ec-af1563a1ac93'::uuid, '🆕 Nouvel inscrit',
    coalesce(nullif(new.name, ''), 'Un joueur') || ' vient de rejoindre Kraken (' || (select count(*) from players) || ' joueurs)', '/');
  return new;
exception when others then return new; -- une notification ratée ne bloque jamais l'inscription
end $$;
drop trigger if exists notify_admin_signup on public.players;
create trigger notify_admin_signup after insert on public.players for each row execute function public.tg_notify_admin_signup();
