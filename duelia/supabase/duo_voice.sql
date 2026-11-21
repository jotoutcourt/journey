-- Voix dans « Le Butin » : la conversation passe directement d'un téléphone à l'autre (WebRTC).
-- Le serveur ne sert qu'à faire se rencontrer les deux téléphones (offre, réponse, adresses réseau) :
-- aucun son ne passe ni n'est stocké ici. Les messages sont effacés avec la partie.
create table if not exists public.duo_signals (
  seq bigserial primary key,
  game_id uuid not null references public.duo_games (id) on delete cascade,
  from_player uuid not null references public.players (id) on delete cascade,
  kind text not null check (kind in ('offer', 'answer', 'ice', 'bye', 'mic')),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists duo_signals_game on public.duo_signals (game_id, seq);
alter table public.duo_signals enable row level security;
revoke all on public.duo_signals from anon, authenticated;

create or replace function public.duo_signal(p_game uuid, p_kind text, p_payload jsonb) returns void
language plpgsql security definer set search_path = public as $$
declare pid uuid := current_player();
begin
  if pid is null or not exists (select 1 from duo_games where id = p_game and pid in (a, b) and status in ('invited', 'playing', 'done')) then
    raise exception 'pas dans la partie';
  end if;
  if octet_length(p_payload::text) > 12000 then raise exception 'message trop long'; end if;
  if (select count(*) from duo_signals where game_id = p_game and from_player = pid) >= 400 then raise exception 'trop de messages'; end if;
  insert into duo_signals (game_id, from_player, kind, payload) values (p_game, pid, p_kind, coalesce(p_payload, '{}'::jsonb));
end $$;

-- Messages de l'autre joueur arrivés depuis le dernier numéro lu
create or replace function public.duo_signals_since(p_game uuid, p_after bigint) returns json
language plpgsql stable security definer set search_path = public as $$
declare pid uuid := current_player();
begin
  if pid is null or not exists (select 1 from duo_games where id = p_game and pid in (a, b)) then return '[]'::json; end if;
  return coalesce((select json_agg(json_build_object('seq', seq, 'kind', kind, 'payload', payload) order by seq)
    from duo_signals where game_id = p_game and from_player <> pid and seq > coalesce(p_after, 0)), '[]'::json);
end $$;

revoke all on function public.duo_signal(uuid, text, jsonb), public.duo_signals_since(uuid, bigint) from public, anon;
grant execute on function public.duo_signal(uuid, text, jsonb), public.duo_signals_since(uuid, bigint) to authenticated;
