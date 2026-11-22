-- Notifications : chaque appareil se réinscrit à chaque ouverture de l'appli (date de dernier passage gardée),
-- et chaque joueur peut s'envoyer une notification de test.
alter table public.push_subscriptions add column if not exists updated_at timestamptz not null default now();

create or replace function public.save_push_subscription(p_endpoint text, p_p256dh text, p_auth text) returns void
language plpgsql security definer set search_path = public as $$
declare pid uuid := current_player();
begin
  if pid is null then raise exception 'aucun joueur'; end if;
  if char_length(p_endpoint) > 1000 or p_endpoint !~ '^https://' then raise exception 'abonnement invalide'; end if;
  if not exists (select 1 from push_subscriptions where endpoint = p_endpoint)
     and (select count(*) from push_subscriptions where player_id = pid) >= 10 then
    delete from push_subscriptions where endpoint = (select endpoint from push_subscriptions where player_id = pid order by updated_at limit 1);
  end if;
  insert into push_subscriptions (endpoint, player_id, p256dh, auth) values (p_endpoint, pid, p_p256dh, p_auth)
  on conflict (endpoint) do update set player_id = pid, p256dh = excluded.p256dh, auth = excluded.auth, updated_at = now();
end $$;

-- Notification de test vers ses propres appareils (au plus une par minute)
create table if not exists public.push_tests (player_id uuid primary key references public.players (id) on delete cascade, at timestamptz not null);
alter table public.push_tests enable row level security;
revoke all on public.push_tests from anon, authenticated;

create or replace function public.test_push() returns int
language plpgsql security definer set search_path = public as $$
declare pid uuid := current_player(); n int;
begin
  if pid is null then return 0; end if;
  if exists (select 1 from push_tests where player_id = pid and at > now() - interval '1 minute') then return -1; end if;
  insert into push_tests values (pid, now()) on conflict (player_id) do update set at = now();
  select count(*) into n from push_subscriptions where player_id = pid;
  perform notify_player(pid, 'Test Kraken 🐙', 'Les notifications marchent sur ce téléphone !', '/');
  return n;
end $$;
revoke all on function public.test_push() from public, anon;
grant execute on function public.test_push() to authenticated;
