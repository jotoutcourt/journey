-- Pastille sur l'icône de l'appli : chaque notification transporte le nombre de choses qui attendent le joueur
-- (défis reçus pas encore joués, demandes d'amis, invitations en direct en cours).
create or replace function public.pending_for(p uuid) returns int language sql stable security definer set search_path = public as $$
  select (select count(*) from friend_challenges where to_player = p and status = 'pending' and created_at > now() - interval '7 days')::int
       + (select count(*) from friend_links where b = p and status = 'pending')::int
       + (select count(*) from live_invites where to_player = p and status = 'pending' and created_at > now() - interval '2 minutes')::int
$$;
revoke all on function public.pending_for(uuid) from public, anon, authenticated;

create or replace function public.notify_player(p_player uuid, p_title text, p_body text, p_url text) returns void
language plpgsql security definer set search_path = public, extensions as $$
declare subs jsonb; secret text;
begin
  select coalesce(jsonb_agg(jsonb_build_object('endpoint', endpoint, 'keys', jsonb_build_object('p256dh', p256dh, 'auth', auth))), '[]'::jsonb)
    into subs from push_subscriptions where player_id = p_player;
  if jsonb_array_length(subs) = 0 then return; end if;
  select value into secret from app_secrets where name = 'push_secret';
  if secret is null then return; end if;
  perform net.http_post(
    url := 'https://duelia.vercel.app/api/push',
    body := jsonb_build_object('subscriptions', subs, 'title', p_title, 'body', p_body, 'url', p_url, 'badge', pending_for(p_player)),
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-push-secret', secret),
    timeout_milliseconds := 8000);
exception when others then
  -- une notification ratée ne doit jamais bloquer le jeu
  return;
end $$;
