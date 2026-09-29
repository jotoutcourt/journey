-- ═══════════════════════════════════════════════════════════════════════════
-- PopCard : notifications « Tes boosters sont prêts ! »
-- À coller une fois dans Supabase → SQL Editor → New query → Run,
-- APRÈS avoir créé la fonction « push-boosters » (voir supabase/functions).
--
-- Chaque appareil qui active les notifications enregistre ici son
-- abonnement et l'heure à laquelle sa réserve de boosters sera pleine.
-- Toutes les 5 minutes, la fonction push-boosters envoie la notification
-- aux appareils dont l'heure est passée.
-- Pas besoin de compte : l'adresse d'abonnement (endpoint) sert de clé.
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists public.push_subs (
  endpoint    text primary key check (char_length(endpoint) between 10 and 1000),
  sub         jsonb not null,
  full_at     timestamptz,           -- réserve pleine à cette heure (null : rien à annoncer)
  notified_at timestamptz,           -- déjà prévenu pour ce full_at
  created_at  timestamptz not null default now()
);
create index if not exists push_subs_due on public.push_subs (full_at) where notified_at is null;

-- Aucun accès direct : tout passe par les fonctions ci-dessous
alter table public.push_subs enable row level security;

-- Enregistre l'abonnement d'un appareil et l'heure où sa réserve sera
-- pleine (renvoyé à chaque changement : booster ouvert…)
create or replace function public.save_push(p_sub jsonb, p_full_at timestamptz)
returns void language plpgsql security definer set search_path = public as $$
declare ep text := p_sub->>'endpoint';
begin
  if ep is null or ep !~ '^https://' or pg_column_size(p_sub) > 4000 then
    raise exception 'abonnement invalide';
  end if;
  insert into push_subs (endpoint, sub, full_at, notified_at)
  values (ep, p_sub, p_full_at, null)
  on conflict (endpoint) do update
    set sub = excluded.sub, full_at = excluded.full_at, notified_at = null;
end $$;

create or replace function public.delete_push(p_endpoint text)
returns void language sql security definer set search_path = public as $$
  delete from push_subs where endpoint = p_endpoint;
$$;

revoke all on function public.save_push(jsonb, timestamptz) from public;
revoke all on function public.delete_push(text) from public;
grant execute on function public.save_push(jsonb, timestamptz) to anon, authenticated;
grant execute on function public.delete_push(text) to anon, authenticated;

-- ─── Réveil toutes les 5 minutes ─────────────────────────────────────────
create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net;

select cron.unschedule(jobid) from cron.job where jobname = 'popcard-push';
select cron.schedule(
  'popcard-push',
  '*/5 * * * *',
  $$ select net.http_post(
       url := 'https://rzebzydhthxyixkshewk.supabase.co/functions/v1/push-boosters',
       headers := '{"Content-Type": "application/json"}'::jsonb,
       body := '{}'::jsonb
     ) $$
);
