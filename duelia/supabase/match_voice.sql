-- Voix pendant un duel en direct entre amis : même principe que la Chasse (WebRTC, le serveur ne relaie que la mise en relation).
create table if not exists public.match_signals (
  seq bigserial primary key,
  match_id uuid not null references public.matches (id) on delete cascade,
  from_player uuid not null references public.players (id) on delete cascade,
  to_player uuid not null references public.players (id) on delete cascade,
  kind text not null check (kind in ('offer', 'answer', 'ice', 'bye', 'mic', 'react')),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists match_signals_to on public.match_signals (match_id, to_player, seq);
alter table public.match_signals enable row level security;
revoke all on public.match_signals from anon, authenticated;

create or replace function public.match_signal(p_match uuid, p_to uuid, p_kind text, p_payload jsonb) returns void
language plpgsql security definer set search_path = public as $$
declare pid uuid := current_player(); m record;
begin
  select * into m from matches where id = p_match;
  if pid is null or not found or pid not in (m.p1, m.p2) or p_to not in (m.p1, m.p2) or p_to = pid or not are_friends(m.p1, m.p2) then
    raise exception 'pas dans ce duel';
  end if;
  if octet_length(p_payload::text) > 12000 then raise exception 'message trop long'; end if;
  if (select count(*) from match_signals where match_id = p_match and from_player = pid) >= 800 then raise exception 'trop de messages'; end if;
  insert into match_signals (match_id, from_player, to_player, kind, payload) values (p_match, pid, p_to, p_kind, coalesce(p_payload, '{}'::jsonb));
end $$;

create or replace function public.match_signals_since(p_match uuid, p_after bigint) returns json
language plpgsql stable security definer set search_path = public as $$
declare pid uuid := current_player();
begin
  if pid is null then return '[]'::json; end if;
  return coalesce((select json_agg(json_build_object('seq', seq, 'from', from_player, 'kind', kind, 'payload', payload) order by seq)
    from match_signals where match_id = p_match and to_player = pid and seq > coalesce(p_after, 0)), '[]'::json);
end $$;

revoke all on function public.match_signal(uuid, uuid, text, jsonb), public.match_signals_since(uuid, bigint) from public, anon;
grant execute on function public.match_signal(uuid, uuid, text, jsonb), public.match_signals_since(uuid, bigint) to authenticated;

-- réactions flottantes pendant le duel (émojis) : même canal
alter table public.match_signals drop constraint if exists match_signals_kind_check;
alter table public.match_signals add constraint match_signals_kind_check check (kind in ('offer', 'answer', 'ice', 'bye', 'mic', 'react'));
