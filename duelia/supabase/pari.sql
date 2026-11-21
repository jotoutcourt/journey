-- Le Pari : score de la partie du jour (une seule partie comptée par jour et par joueur) et classement.
create table if not exists public.pari_scores (
  player_id uuid not null references public.players (id) on delete cascade,
  day date not null,
  score int not null check (score between 0 and 2048000),
  created_at timestamptz not null default now(),
  primary key (player_id, day)
);
create index if not exists pari_scores_day on public.pari_scores (day, score desc);
alter table public.pari_scores enable row level security;
revoke all on public.pari_scores from anon, authenticated;

-- Enregistre la partie du jour (la première seulement). Le jour doit être aujourd'hui, à un jour près (fuseaux horaires).
create or replace function public.submit_pari(p_day date, p_score int) returns void
language plpgsql security definer set search_path = public as $$
declare pid uuid := current_player();
begin
  if pid is null or p_day is null or abs(p_day - current_date) > 1 then return; end if;
  insert into pari_scores (player_id, day, score) values (pid, p_day, greatest(0, least(2048000, p_score)))
  on conflict do nothing;
end $$;

-- Classement d'un jour : les 20 meilleurs + ma place
create or replace function public.get_pari_board(p_day date) returns json
language sql stable security definer set search_path = public as $$
  with ranked as (
    select s.player_id, s.score, p.name, p.avatar, p.flag, p.photo,
      rank() over (order by s.score desc, s.created_at) as rank
    from pari_scores s join players p on p.id = s.player_id where s.day = p_day)
  select json_build_object(
    'top', coalesce((select json_agg(json_build_object('rank', rank, 'name', name, 'avatar', avatar, 'flag', flag, 'photo', photo, 'score', score, 'me', player_id = current_player()) order by rank) from (select * from ranked order by rank limit 20) t), '[]'::json),
    'me', (select json_build_object('rank', rank, 'score', score) from ranked where player_id = current_player()),
    'count', (select count(*) from ranked))
$$;

revoke all on function public.submit_pari(date, int), public.get_pari_board(date) from public, anon;
grant execute on function public.submit_pari(date, int), public.get_pari_board(date) to authenticated;
