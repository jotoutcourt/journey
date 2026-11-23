-- Missions quotidiennes : 3 par jour (une facile, une moyenne, une difficile), tirées au hasard pour chaque joueur
-- et renouvelées à minuit (heure de Paris). La progression est calculée côté serveur à partir de ce que le
-- joueur a réellement joué ; la récompense (lingots) ne peut être récupérée qu'une fois.

alter table public.wallet_log drop constraint if exists wallet_log_reason_check;
alter table public.wallet_log add constraint wallet_log_reason_check check (reason in
  ('butin', 'bonus_jour', 'parfait', 'achat', 'cadeau', 'mise', 'gain_duel', 'remboursement', 'mission'));

create table if not exists public.mission_claims (
  player_id uuid not null references public.players (id) on delete cascade,
  day date not null,
  code text not null,
  reward int not null,
  claimed_at timestamptz not null default now(),
  primary key (player_id, day, code)
);
alter table public.mission_claims enable row level security;
revoke all on public.mission_claims from anon, authenticated;

-- Catalogue : code, palier (1 facile, 2 moyen, 3 difficile), objectif, récompense, intitulé
create or replace function public.mission_catalog()
returns table (code text, tier int, target int, reward int, label text, icon text)
language sql immutable as $$
  values
    ('duels_2',     1, 2,   2,  'Joue 2 duels', '⚔️'),
    ('xp_150',      1, 150, 2,  'Gagne 150 XP', '⭐'),
    ('kraken_1',    1, 1,   2,  'Joue une partie de L''Appât du Kraken', '🐙'),
    ('win_2',       2, 2,   4, 'Gagne 2 duels', '🏆'),
    ('topics_2',    2, 2,   4, 'Joue dans 2 thèmes différents', '🎲'),
    ('challenge_1', 2, 1,   4, 'Envoie un défi à un ami', '💌'),
    ('win_4',       3, 4,   6, 'Gagne 4 duels', '👑'),
    ('duels_6',     3, 6,   6, 'Joue 6 duels', '🔥'),
    ('xp_600',      3, 600, 6, 'Gagne 600 XP', '🌟'),
    ('live_1',      3, 1,   6, 'Joue un duel en direct contre un vrai joueur', '📡')
$$;

create or replace function public.mission_progress(p_player uuid, p_code text, p_day date) returns int
language sql stable security definer set search_path = public as $$
  select case p_code
    when 'duels_2' then (select count(*) from game_results where player_id = p_player and paris_day(at) = p_day)
    when 'duels_6' then (select count(*) from game_results where player_id = p_player and paris_day(at) = p_day)
    when 'win_2' then (select count(*) from game_results where player_id = p_player and outcome = 2 and paris_day(at) = p_day)
    when 'win_4' then (select count(*) from game_results where player_id = p_player and outcome = 2 and paris_day(at) = p_day)
    when 'topics_2' then (select count(distinct topic_id) from game_results where player_id = p_player and paris_day(at) = p_day)
    when 'xp_150' then (select coalesce(sum(xp), 0) from xp_events where player_id = p_player and paris_day(at) = p_day)
    when 'xp_600' then (select coalesce(sum(xp), 0) from xp_events where player_id = p_player and paris_day(at) = p_day)
    when 'kraken_1' then (select count(*) from duo_games where p_player in (a, b) and status = 'done' and paris_day(created_at) = p_day)
    when 'challenge_1' then (select count(*) from friend_challenges where from_player = p_player and paris_day(created_at) = p_day)
    when 'live_1' then (select count(*) from matches where p_player in (p1, p2) and paris_day(created_at) = p_day)
    else 0 end::int
$$;

-- Les 3 missions du jour d'un joueur : une par palier, choisie de façon stable pour la journée
create or replace function public.missions_of(p_player uuid, p_day date)
returns table (code text, tier int, target int, reward int, label text, icon text)
language sql stable as $$
  select distinct on (c.tier) c.*
  from mission_catalog() c
  order by c.tier, md5(p_player::text || p_day::text || c.code)
$$;

create or replace function public.get_missions() returns json
language plpgsql stable security definer set search_path = public as $$
declare pid uuid := current_player(); d date := paris_day(now());
begin
  if pid is null then return null; end if;
  return json_build_object(
    'day', d,
    'reset_at', ((d + 1)::timestamp at time zone 'Europe/Paris'),
    'missions', (select json_agg(json_build_object(
        'code', m.code, 'label', m.label, 'icon', m.icon, 'target', m.target, 'reward', m.reward,
        'progress', least(m.target, mission_progress(pid, m.code, d)),
        'claimed', exists (select 1 from mission_claims c where c.player_id = pid and c.day = d and c.code = m.code))
      order by m.tier) from missions_of(pid, d) m));
end $$;

create or replace function public.claim_mission(p_code text) returns json
language plpgsql security definer set search_path = public as $$
declare pid uuid := current_player(); d date := paris_day(now()); m record;
begin
  if pid is null then raise exception 'aucun joueur'; end if;
  select * into m from missions_of(pid, d) where code = p_code;
  if not found then raise exception 'mission inconnue'; end if;
  if mission_progress(pid, m.code, d) < m.target then raise exception 'mission pas terminée'; end if;
  insert into mission_claims (player_id, day, code, reward) values (pid, d, m.code, m.reward)
  on conflict do nothing;
  if found then perform wallet_credit(pid, m.reward, 'mission', null); end if;
  return json_build_object('lingots', (select lingots from wallets where player_id = pid), 'reward', m.reward);
end $$;

revoke all on function public.mission_progress(uuid, text, date), public.missions_of(uuid, date) from public, anon, authenticated;
revoke all on function public.get_missions(), public.claim_mission(text) from public, anon;
grant execute on function public.get_missions(), public.claim_mission(text) to authenticated;
