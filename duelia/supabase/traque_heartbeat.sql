-- Signal de présence : ajoute les invitations à « La Traque du Kraken ».
CREATE OR REPLACE FUNCTION public.heartbeat()
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare pid uuid := current_player();
begin
  if pid is null then return null; end if;
  update players set last_seen = now() where id = pid;
  return json_build_object(
    'invites', coalesce((select json_agg(json_build_object('id', i.id, 'from', player_card(i.from_player), 'topic_id', i.topic_id,
        'topic', i.topic, 'created_at', i.created_at, 'stake', i.stake) order by i.created_at desc)
      from live_invites i where i.to_player = pid and i.status = 'pending' and i.created_at > now() - interval '2 minutes'), '[]'::json),
    'duo_invites', duo_invites_for(pid),
    'party_invites', party_invites_for(pid),
    'traque_invites', traque_invites_for(pid),
    'friend_requests', (select count(*) from friend_links where b = pid and status = 'pending'),
    'pending_challenges', (select count(*) from friend_challenges where to_player = pid and status = 'pending' and created_at > now() - interval '7 days'));
end $function$
;
