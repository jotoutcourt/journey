-- Chasse au Kraken : réactions rapides (émojis) et statistiques de partie (récap de fin).
alter table public.traque_players add column if not exists stats jsonb not null default '{}'::jsonb;

create table if not exists public.traque_reactions (
  id bigserial primary key,
  game_id uuid not null references public.traque_games (id) on delete cascade,
  seat int not null,
  emoji text not null check (char_length(emoji) between 1 and 8),
  at timestamptz not null default now()
);
create index if not exists traque_reactions_game on public.traque_reactions (game_id, at);
alter table public.traque_reactions enable row level security;
revoke all on public.traque_reactions from anon, authenticated;

-- compteur d'une statistique (duels gagnés, bonnes réponses, cases perdues…)
create or replace function public.tq_stat(p_game uuid, p_seat int, p_key text, p_n int default 1) returns void language sql as $$
  update traque_players set stats = jsonb_set(coalesce(stats, '{}'::jsonb), array[p_key], to_jsonb(coalesce((stats ->> p_key)::int, 0) + p_n))
  where game_id = p_game and seat = p_seat
$$;

-- réaction : un des émojis proposés, au plus une toutes les 0,7 s par joueur
create or replace function public.traque_react(p_game uuid, p_emoji text) returns void language plpgsql security definer set search_path = public as $$
declare s int := tq_my_seat(p_game);
begin
  if s is null or p_emoji not in ('😂', '😱', '🔥', '👏', '😡', '🫡', '💀', '🐙') then return; end if;
  if exists (select 1 from traque_reactions where game_id = p_game and seat = s and at > now() - interval '700 milliseconds') then return; end if;
  insert into traque_reactions (game_id, seat, emoji) values (p_game, s, p_emoji);
  delete from traque_reactions where game_id = p_game and at < now() - interval '1 minute';
  update traque_games set version = version + 1 where id = p_game;
end $$;

revoke all on function public.tq_stat(uuid, int, text, int) from public, anon, authenticated;
revoke all on function public.traque_react(uuid, text) from public, anon;
grant execute on function public.traque_react(uuid, text) to authenticated;
