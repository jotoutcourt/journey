-- Liens courts pour les défis : le contenu du défi est gardé sur le serveur, le lien ne porte qu'un code
-- de 10 caractères (les applis de messagerie coupaient les longs liens). Conservés 30 jours.
create table if not exists public.short_links (
  id text primary key check (id ~ '^[A-Za-z0-9]{10}$'),
  payload text not null check (char_length(payload) between 10 and 8000 and payload ~ '^[dr]\.[A-Za-z0-9_-]+$'),
  created_at timestamptz not null default now()
);
alter table public.short_links enable row level security;
revoke all on public.short_links from anon, authenticated;

create or replace function public.put_short_link(p_payload text) returns text
language plpgsql security definer set search_path = public, extensions as $$
declare code text; alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789'; b bytea; i int;
begin
  delete from short_links where created_at < now() - interval '30 days';
  -- même contenu déjà enregistré : même code
  select id into code from short_links where payload = p_payload limit 1;
  if code is not null then return code; end if;
  loop
    b := gen_random_bytes(10); code := '';
    for i in 0..9 loop code := code || substr(alphabet, 1 + (get_byte(b, i) % length(alphabet)), 1); end loop;
    begin
      insert into short_links (id, payload) values (code, p_payload);
      return code;
    exception when unique_violation then -- très improbable : on retire un code
    end;
  end loop;
end $$;

create or replace function public.get_short_link(p_id text) returns text
language sql stable security definer set search_path = public as $$
  select payload from short_links where id = p_id
$$;

revoke all on function public.put_short_link(text), public.get_short_link(text) from public;
grant execute on function public.put_short_link(text), public.get_short_link(text) to anon, authenticated;
