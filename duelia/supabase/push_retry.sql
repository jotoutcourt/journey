-- Notifications : environ 1 envoi sur 4 échouait (« Error in the HTTP2 framing layer » entre le serveur et Vercel).
-- Chaque notification passe maintenant par une file d'attente ; une tâche relance chaque minute celles qui ont échoué
-- (3 essais au maximum, pendant 15 minutes).

create table if not exists public.push_outbox (
  id bigserial primary key,
  player_id uuid not null,
  title text not null,
  body text not null,
  url text,
  request_id bigint,
  tries int not null default 0,
  done boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists push_outbox_pending on public.push_outbox (done, created_at);
alter table public.push_outbox enable row level security;
revoke all on public.push_outbox from anon, authenticated;

create or replace function public.push_send(p_id bigint) returns void
language plpgsql security definer set search_path = public, extensions as $$
declare o record; subs jsonb; secret text; rid bigint;
begin
  select * into o from push_outbox where id = p_id;
  if not found or o.done then return; end if;
  select coalesce(jsonb_agg(jsonb_build_object('endpoint', endpoint, 'keys', jsonb_build_object('p256dh', p256dh, 'auth', auth))), '[]'::jsonb)
    into subs from push_subscriptions where player_id = o.player_id;
  select value into secret from app_secrets where name = 'push_secret';
  if jsonb_array_length(subs) = 0 or secret is null then
    update push_outbox set done = true where id = p_id;
    return;
  end if;
  select net.http_post(
    url := 'https://duelia.vercel.app/api/push',
    body := jsonb_build_object('subscriptions', subs, 'title', o.title, 'body', o.body, 'url', o.url, 'badge', pending_for(o.player_id)),
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-push-secret', secret),
    timeout_milliseconds := 8000) into rid;
  update push_outbox set request_id = rid, tries = tries + 1 where id = p_id;
end $$;

create or replace function public.notify_player(p_player uuid, p_title text, p_body text, p_url text) returns void
language plpgsql security definer set search_path = public, extensions as $$
declare nid bigint;
begin
  if not exists (select 1 from push_subscriptions where player_id = p_player) then return; end if;
  insert into push_outbox (player_id, title, body, url) values (p_player, p_title, p_body, p_url) returning id into nid;
  perform push_send(nid);
exception when others then
  -- une notification ratée ne doit jamais bloquer le jeu
  return;
end $$;

-- Relance : réponse reçue avec succès → terminé ; échec (ou pas de réponse après 1 min) → nouvel essai
create or replace function public.retry_pushes() returns void
language plpgsql security definer set search_path = public, extensions as $$
declare o record; st int; err text; found_resp boolean;
begin
  for o in select * from push_outbox where not done and created_at > now() - interval '15 minutes' order by id loop
    select true, r.status_code, r.error_msg into found_resp, st, err from net._http_response r where r.id = o.request_id;
    if found_resp and st between 200 and 299 then
      update push_outbox set done = true where id = o.id;
    elsif o.tries >= 3 then
      update push_outbox set done = true where id = o.id;
    elsif found_resp or o.created_at < now() - interval '1 minute' then
      perform push_send(o.id);
    end if;
    found_resp := null;
  end loop;
  update push_outbox set done = true where not done and created_at <= now() - interval '15 minutes';
  delete from push_outbox where created_at < now() - interval '7 days';
end $$;

revoke all on function public.push_send(bigint), public.retry_pushes() from public, anon, authenticated;

select cron.unschedule('kraken-push-retry') where exists (select 1 from cron.job where jobname = 'kraken-push-retry');
select cron.schedule('kraken-push-retry', '* * * * *', 'select public.retry_pushes()');
