-- « Rejouer ensemble » garde la même conversation vocale : les parties suivantes réutilisent
-- le canal de la première (voice_id), si les deux joueurs y étaient.
alter table public.duo_games add column if not exists voice_id uuid references public.duo_games (id) on delete set null;

create or replace function public.invite_duo(p_to uuid, p_questions jsonb, p_voice uuid) returns uuid
language plpgsql security definer set search_path = public as $$
declare pid uuid := current_player(); gid uuid; me_name text; room uuid;
begin
  if pid is null or not are_friends(pid, p_to) then raise exception 'pas amis'; end if;
  if not valid_duo_questions(p_questions) then raise exception 'questions invalides'; end if;
  -- le canal vocal n'est repris que s'il réunissait exactement ces deux joueurs
  select coalesce(voice_id, id) into room from duo_games where id = p_voice and ((a = pid and b = p_to) or (a = p_to and b = pid));
  delete from duo_games where created_at < now() - interval '3 days' and id not in (select voice_id from duo_games where voice_id is not null and created_at > now() - interval '3 days');
  update duo_games set status = 'cancelled' where a = pid and status = 'invited';
  insert into duo_games (a, b, questions, bank, placement, voice_id) values (pid, p_to, p_questions, duo_const('start'), duo_zeros(p_questions, 0), room)
  returning id into gid;
  select name into me_name from players where id = pid;
  perform notify_player(p_to, 'Le Butin 💰', me_name || ' t''invite à voler le trésor du Kraken', '/');
  return gid;
end $$;
revoke all on function public.invite_duo(uuid, jsonb, uuid) from public, anon;
grant execute on function public.invite_duo(uuid, jsonb, uuid) to authenticated;

-- La vue d'une partie indique son canal vocal, et qui l'a ouvert (pour la négociation)
create or replace function public.duo_view(p_id uuid, pid uuid) returns json
language plpgsql stable security definer set search_path = public as $$
declare g duo_games; me_a boolean; q jsonb; st text; room uuid; room_a uuid;
begin
  select * into g from duo_games where id = p_id and pid in (a, b);
  if not found then return null; end if;
  me_a := g.a = pid;
  room := coalesce(g.voice_id, g.id);
  select a into room_a from duo_games where id = room;
  st := case when g.status = 'invited' and g.created_at < now() - interval '60 seconds' then 'expired' else g.status end;
  q := g.questions -> g.round;
  return json_build_object(
    'id', g.id, 'status', st, 'host', me_a, 'created_at', g.created_at, 'round', g.round, 'rounds', jsonb_array_length(g.questions),
    'voice_id', room, 'voice_host', room_a = pid,
    'phase', g.phase, 'left_ms', greatest(0, floor(extract(epoch from (g.deadline - now())) * 1000))::int,
    'bank', g.bank, 'start', duo_const('start'), 'placement', g.placement, 'version', g.version,
    'ready_me', case when me_a then g.ready_a else g.ready_b end,
    'ready_partner', case when me_a then g.ready_b else g.ready_a end,
    'last_by_me', g.last_by = pid, 'left_by_me', g.left_by = pid,
    'partner', player_card(case when me_a then g.b else g.a end),
    'question', case when st in ('playing', 'done') then json_build_object('q', q ->> 'q', 'options', q -> 'options', 'topic', q -> 'topic',
      'correct', case when g.phase = 'reveal' or g.status = 'done' then (q ->> 'correct')::int end) end,
    'history', g.history);
end $$;

-- Le canal vocal reste utilisable tant que la première partie existe (même terminée ou quittée)
create or replace function public.duo_signal(p_game uuid, p_kind text, p_payload jsonb) returns void
language plpgsql security definer set search_path = public as $$
declare pid uuid := current_player();
begin
  if pid is null or not exists (select 1 from duo_games where id = p_game and pid in (a, b) and status in ('invited', 'playing', 'done', 'left')) then
    raise exception 'pas dans la partie';
  end if;
  if octet_length(p_payload::text) > 12000 then raise exception 'message trop long'; end if;
  if (select count(*) from duo_signals where game_id = p_game and from_player = pid and created_at > now() - interval '1 hour') >= 600 then raise exception 'trop de messages'; end if;
  insert into duo_signals (game_id, from_player, kind, payload) values (p_game, pid, p_kind, coalesce(p_payload, '{}'::jsonb));
end $$;
