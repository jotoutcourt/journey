-- Annonce des nouveaux thèmes : une notification envoyée à tous les téléphones abonnés, à l'heure de sortie.
-- Pour annoncer un thème : insérer une ligne (titre, texte, heure). La tâche planifiée l'envoie une seule fois.

create table if not exists public.topic_announcements (
  topic_id text primary key check (char_length(topic_id) between 1 and 60),
  title text not null check (char_length(title) between 1 and 80),
  body text not null check (char_length(body) between 1 and 200),
  release_at timestamptz not null default now(),
  sent_at timestamptz,
  sent_to int
);
alter table public.topic_announcements enable row level security;
revoke all on public.topic_announcements from anon, authenticated;

-- Envoie les annonces arrivées à échéance (par lots de 10 abonnements, la taille acceptée par /api/push)
create or replace function public.send_topic_announcements() returns int
language plpgsql security definer set search_path = public, extensions as $$
declare a record; secret text; batch jsonb; n int := 0; total int;
begin
  select value into secret from app_secrets where name = 'push_secret';
  if secret is null then return 0; end if;
  for a in select * from topic_announcements where sent_at is null and release_at <= now() order by release_at for update skip locked loop
    total := 0;
    for batch in
      select jsonb_agg(jsonb_build_object('endpoint', endpoint, 'keys', jsonb_build_object('p256dh', p256dh, 'auth', auth)))
      from (select endpoint, p256dh, auth, (row_number() over (order by endpoint) - 1) / 10 as grp from push_subscriptions) s
      group by grp
    loop
      begin
        perform net.http_post(
          url := 'https://duelia.vercel.app/api/push',
          body := jsonb_build_object('subscriptions', batch, 'title', a.title, 'body', a.body, 'url', '/#theme=' || a.topic_id),
          headers := jsonb_build_object('Content-Type', 'application/json', 'x-push-secret', secret),
          timeout_milliseconds := 8000);
        total := total + jsonb_array_length(batch);
      exception when others then null; -- un lot raté ne bloque pas les autres
      end;
    end loop;
    update topic_announcements set sent_at = now(), sent_to = total where topic_id = a.topic_id;
    n := n + 1;
  end loop;
  return n;
end $$;
revoke all on function public.send_topic_announcements() from public, anon, authenticated;

-- Vérification toutes les 5 minutes
select cron.unschedule('kraken-topic-announcements') where exists (select 1 from cron.job where jobname = 'kraken-topic-announcements');
select cron.schedule('kraken-topic-announcements', '*/5 * * * *', 'select public.send_topic_announcements()');
