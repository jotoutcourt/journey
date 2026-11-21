-- Défi par lien = invitation : celui qui relève le défi devient ami avec celui qui l'a envoyé.
-- L'envoi du lien vaut accord du challenger ; le code ami voyage dans le lien.
-- Renvoie : unknown, self, already, added, limit
create or replace function public.befriend_by_link(p_code text) returns text
language plpgsql security definer set search_path = public as $$
declare pid uuid := current_player(); other uuid; me_name text;
begin
  if pid is null then raise exception 'aucun joueur'; end if;
  select id into other from players where friend_code = upper(regexp_replace(coalesce(p_code, ''), '[^A-Za-z0-9]', '', 'g'));
  if other is null then return 'unknown'; end if;
  if other = pid then return 'self'; end if;
  if are_friends(pid, other) then return 'already'; end if;
  if (select count(*) from friend_links where a = pid and created_at > now() - interval '1 day') >= 50 then return 'limit'; end if;
  -- une demande en attente dans un sens ou l'autre devient une amitié
  update friend_links set status = 'accepted' where (a = other and b = pid) or (a = pid and b = other);
  if not found then insert into friend_links (a, b, status) values (pid, other, 'accepted') on conflict (a, b) do update set status = 'accepted'; end if;
  select name into me_name from players where id = pid;
  perform notify_player(other, 'Nouvel ami', me_name || ' a relevé ton défi : vous êtes maintenant amis sur Kraken', '/#amis');
  return 'added';
end $$;
revoke all on function public.befriend_by_link(text) from public, anon;
grant execute on function public.befriend_by_link(text) to authenticated;
