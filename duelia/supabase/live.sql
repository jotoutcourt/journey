-- Duelia : duels en direct entre vrais joueurs (salle d'attente + réponses échangées par le serveur).
-- Aucune table accessible directement : tout passe par des fonctions liées au joueur connecté.

create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  topic_id text not null check (char_length(topic_id) between 1 and 60),
  p1 uuid not null references public.players (id) on delete cascade,
  p2 uuid not null references public.players (id) on delete cascade,
  questions jsonb not null check (jsonb_typeof(questions) = 'array' and jsonb_array_length(questions) between 3 and 10 and pg_column_size(questions) < 30000),
  created_at timestamptz not null default now()
);

create table if not exists public.match_answers (
  match_id uuid not null references public.matches (id) on delete cascade,
  player_id uuid not null references public.players (id) on delete cascade,
  round int not null check (round between 0 and 9),
  choice int not null check (choice between -1 and 3),
  t int not null check (t between 0 and 10000),
  at timestamptz not null default now(),
  primary key (match_id, player_id, round)
);

create table if not exists public.match_queue (
  player_id uuid primary key references public.players (id) on delete cascade,
  topic_id text not null check (char_length(topic_id) between 1 and 60),
  questions jsonb not null check (jsonb_typeof(questions) = 'array' and jsonb_array_length(questions) between 3 and 10 and pg_column_size(questions) < 30000),
  joined_at timestamptz not null default now(),
  match_id uuid references public.matches (id) on delete set null
);
create index if not exists match_queue_topic on public.match_queue (topic_id, joined_at);

alter table public.matches enable row level security;
alter table public.match_answers enable row level security;
alter table public.match_queue enable row level security;
revoke all on public.matches, public.match_answers, public.match_queue from anon, authenticated;

-- Description d'un duel vue par l'un des deux joueurs
create or replace function public.match_view(p_match uuid, p_me uuid) returns json
language sql stable security definer set search_path = public as $$
  select json_build_object(
    'id', m.id, 'topic_id', m.topic_id, 'questions', m.questions,
    'opponent', json_build_object('player_id', o.id, 'name', o.name, 'avatar', o.avatar, 'flag', o.flag, 'photo', o.photo))
  from matches m join players o on o.id = case when m.p1 = p_me then m.p2 else m.p1 end
  where m.id = p_match and p_me in (m.p1, m.p2)
$$;

-- Chercher un adversaire sur un thème : à appeler toutes les ~1,5 s pendant l'attente.
-- Renvoie le duel dès qu'il existe, sinon null (le joueur reste dans la salle d'attente).
create or replace function public.find_live_match(p_topic text, p_questions jsonb) returns json
language plpgsql security definer set search_path = public as $$
declare pid uuid := current_player(); mid uuid; w record;
begin
  if pid is null then raise exception 'aucun joueur'; end if;
  -- les joueurs qui ne cherchent plus depuis 10 s quittent la salle
  delete from match_queue where match_id is null and joined_at < now() - interval '10 seconds';
  -- quelqu'un m'a déjà trouvé ?
  select match_id into mid from match_queue where player_id = pid and match_id is not null;
  if mid is not null then
    delete from match_queue where player_id = pid;
    return match_view(mid, pid);
  end if;
  -- un adversaire attend-il sur ce thème ?
  select * into w from match_queue
    where topic_id = p_topic and match_id is null and player_id <> pid
    order by joined_at limit 1 for update skip locked;
  if found then
    insert into matches (topic_id, p1, p2, questions) values (p_topic, w.player_id, pid, w.questions) returning id into mid;
    update match_queue set match_id = mid where player_id = w.player_id;
    delete from match_queue where player_id = pid;
    return match_view(mid, pid);
  end if;
  -- sinon on attend (et on signale qu'on est toujours là)
  insert into match_queue (player_id, topic_id, questions, joined_at) values (pid, p_topic, p_questions, now())
  on conflict (player_id) do update set topic_id = excluded.topic_id, questions = excluded.questions, joined_at = now(), match_id = null;
  return null;
end $$;

create or replace function public.leave_live_queue() returns void
language sql security definer set search_path = public as $$
  delete from match_queue where player_id = current_player() and match_id is null
$$;

-- Envoyer sa réponse à une question (une seule fois par question)
create or replace function public.send_live_answer(p_match uuid, p_round int, p_choice int, p_t int) returns void
language plpgsql security definer set search_path = public as $$
declare pid uuid := current_player();
begin
  if not exists (select 1 from matches where id = p_match and pid in (p1, p2)) then raise exception 'duel inconnu'; end if;
  insert into match_answers (match_id, player_id, round, choice, t)
  values (p_match, pid, p_round, p_choice, greatest(0, least(10000, p_t)))
  on conflict do nothing;
end $$;

-- Réponses de l'adversaire déjà reçues
create or replace function public.get_live_answers(p_match uuid) returns json
language sql stable security definer set search_path = public as $$
  select coalesce(json_agg(json_build_object('round', a.round, 'choice', a.choice, 't', a.t) order by a.round), '[]'::json)
  from match_answers a join matches m on m.id = a.match_id
  where a.match_id = p_match and current_player() in (m.p1, m.p2) and a.player_id <> current_player()
$$;

revoke all on function public.match_view(uuid, uuid), public.find_live_match(text, jsonb), public.leave_live_queue(),
  public.send_live_answer(uuid, int, int, int), public.get_live_answers(uuid) from public, anon;
grant execute on function public.find_live_match(text, jsonb), public.leave_live_queue(),
  public.send_live_answer(uuid, int, int, int), public.get_live_answers(uuid) to authenticated;
