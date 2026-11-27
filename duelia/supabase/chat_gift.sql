-- Commande secrète du créateur dans le chat : « /lingots 50 » offre 50 lingots à l'ami de la conversation.
-- La commande n'est jamais enregistrée : l'ami voit seulement « 🎁 Cadeau du développeur : +50 lingots ».
-- Pour tout autre joueur, le message part comme un texte normal (la commande reste secrète).
create or replace function public.chat_send(p_peer uuid, p_body text, p_kind text default 'text', p_payload jsonb default null)
returns json language plpgsql security definer set search_path = public as $$
declare pid uuid := current_player(); b text := btrim(coalesce(p_body, '')); me_name text; nid bigint; m text[]; n int;
begin
  if pid is null or not are_friends(pid, p_peer) then raise exception 'pas ami'; end if;
  if b = '' or char_length(b) > 1000 then raise exception 'message vide ou trop long'; end if;
  if p_kind not in ('text', 'invite') then raise exception 'type inconnu'; end if;
  -- commande secrète du créateur
  m := regexp_match(b, '^/(?:lingots|don)\s+(\d{1,5})$', 'i');
  if m is not null and p_kind = 'text' and is_app_admin() then
    n := m[1]::int;
    if n < 1 or n > 10000 then raise exception 'montant invalide (1 à 10 000)'; end if;
    perform wallet_credit(p_peer, n, 'cadeau', null);
    insert into chat_messages (sender, recipient, body, kind, payload)
      values (pid, p_peer, '🎁 Cadeau du développeur : +' || n || ' lingots', 'event', jsonb_build_object('ev', 'gift', 'n', n));
    perform notify_player(p_peer, '🎁 Cadeau du développeur', '+' || n || ' lingots viennent d''arriver dans ton trésor !', '/#chat=' || pid);
    return chat_thread(p_peer);
  end if;
  if (select count(*) from chat_messages where sender = pid and created_at > now() - interval '1 minute') >= 20 then raise exception 'doucement'; end if;
  if p_payload is not null and pg_column_size(p_payload) > 500 then raise exception 'invitation invalide'; end if;
  -- pas de notification si l'ami a déjà un message non lu de moi depuis moins de 2 minutes (on ne l'inonde pas)
  if not exists (select 1 from chat_messages cm where cm.sender = pid and cm.recipient = p_peer and cm.created_at > now() - interval '2 minutes'
      and cm.id > coalesce((select last_read from chat_reads r where r.player_id = p_peer and r.peer_id = pid), 0)) then
    select name into me_name from players where id = pid;
    perform notify_player(p_peer, '💬 ' || coalesce(me_name, 'Un ami'), left(b, 120), '/#chat=' || pid);
  end if;
  insert into chat_messages (sender, recipient, body, kind, payload) values (pid, p_peer, b, p_kind, p_payload) returning id into nid;
  return chat_thread(p_peer);
end $$;
