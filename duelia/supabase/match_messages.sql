-- Un seul petit message par joueur à la fin d'un duel en direct.
-- Entre amis : texte libre (140 caractères). Avec un inconnu trouvé en ligne : messages rapides uniquement.
alter table public.matches add column if not exists msg_p1 text check (char_length(msg_p1) <= 140);
alter table public.matches add column if not exists msg_p2 text check (char_length(msg_p2) <= 140);

create or replace function public.set_match_message(p_match uuid, p_msg text) returns void
language plpgsql security definer set search_path = public as $$
declare pid uuid := current_player(); m record; msg text := btrim(regexp_replace(coalesce(p_msg, ''), '\s+', ' ', 'g'));
  other uuid; me_name text;
  quick text[] := array['GG 👏', 'Revanche ? 😏', 'Trop facile 😎', 'J''ai eu chaud 😅', 'Celle-là était dure 🤯'];
begin
  if pid is null then raise exception 'aucun joueur'; end if;
  if char_length(msg) not between 1 and 140 then raise exception 'message invalide'; end if;
  select * into m from matches where id = p_match and pid in (p1, p2) for update;
  if not found then raise exception 'duel inconnu'; end if;
  other := case when m.p1 = pid then m.p2 else m.p1 end;
  if not are_friends(pid, other) and not (msg = any (quick)) then raise exception 'messages rapides seulement'; end if;
  -- un seul message : impossible de le modifier ensuite
  if (m.p1 = pid and m.msg_p1 is not null) or (m.p2 = pid and m.msg_p2 is not null) then raise exception 'déjà envoyé'; end if;
  if m.p1 = pid then update matches set msg_p1 = msg where id = p_match;
  else update matches set msg_p2 = msg where id = p_match; end if;
  select name into me_name from players where id = pid;
  perform notify_player(other, '💬 ' || me_name, msg, '/');
end $$;

create or replace function public.get_match_messages(p_match uuid) returns json
language sql stable security definer set search_path = public as $$
  select json_build_object(
    'mine', case when m.p1 = current_player() then m.msg_p1 else m.msg_p2 end,
    'theirs', case when m.p1 = current_player() then m.msg_p2 else m.msg_p1 end)
  from matches m where m.id = p_match and current_player() in (m.p1, m.p2)
$$;

revoke all on function public.set_match_message(uuid, text), public.get_match_messages(uuid) from public, anon;
grant execute on function public.set_match_message(uuid, text), public.get_match_messages(uuid) to authenticated;
