-- Voix dans « La Traque du Kraken » : chaque téléphone se relie directement à chacun des autres (WebRTC, jusqu'à 4).
-- Le serveur ne fait que transmettre les messages de mise en relation ; aucun son ne passe ici.
create table if not exists public.traque_signals (
  seq bigserial primary key,
  game_id uuid not null references public.traque_games (id) on delete cascade,
  from_player uuid not null references public.players (id) on delete cascade,
  to_player uuid not null references public.players (id) on delete cascade,
  kind text not null check (kind in ('offer', 'answer', 'ice', 'bye', 'mic')),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists traque_signals_to on public.traque_signals (game_id, to_player, seq);
alter table public.traque_signals enable row level security;
revoke all on public.traque_signals from anon, authenticated;

create or replace function public.traque_signal(p_game uuid, p_to uuid, p_kind text, p_payload jsonb) returns void
language plpgsql security definer set search_path = public as $$
declare pid uuid := current_player();
begin
  if pid is null or not exists (select 1 from traque_players where game_id = p_game and player_id = pid and status = 'joined')
    or not exists (select 1 from traque_players where game_id = p_game and player_id = p_to and status in ('joined', 'left')) then
    raise exception 'pas dans la partie';
  end if;
  if octet_length(p_payload::text) > 12000 then raise exception 'message trop long'; end if;
  if (select count(*) from traque_signals where game_id = p_game and from_player = pid) >= 1500 then raise exception 'trop de messages'; end if;
  insert into traque_signals (game_id, from_player, to_player, kind, payload) values (p_game, pid, p_to, p_kind, coalesce(p_payload, '{}'::jsonb));
end $$;

create or replace function public.traque_signals_since(p_game uuid, p_after bigint) returns json
language plpgsql stable security definer set search_path = public as $$
declare pid uuid := current_player();
begin
  if pid is null then return '[]'::json; end if;
  return coalesce((select json_agg(json_build_object('seq', seq, 'from', from_player, 'kind', kind, 'payload', payload) order by seq)
    from traque_signals where game_id = p_game and to_player = pid and seq > coalesce(p_after, 0)), '[]'::json);
end $$;

revoke all on function public.traque_signal(uuid, uuid, text, jsonb), public.traque_signals_since(uuid, bigint) from public, anon;
grant execute on function public.traque_signal(uuid, uuid, text, jsonb), public.traque_signals_since(uuid, bigint) to authenticated;
