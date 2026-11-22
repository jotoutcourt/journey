-- L'Appât du Kraken : explication de la bonne réponse à la révélation, qui dure 8 s pour avoir le temps de la lire
create or replace function public.duo_const(k text) returns int language sql immutable as $$
  select case k when 'start' then 20 when 'place' then 45 when 'first' then 52 when 'reveal' then 8 end
$$;

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
    'id', g.id, 'status', st, 'host', me_a, 'solo', g.solo, 'created_at', g.created_at, 'round', g.round, 'rounds', jsonb_array_length(g.questions),
    'voice_id', room, 'voice_host', room_a = pid,
    'phase', g.phase, 'left_ms', greatest(0, floor(extract(epoch from (g.deadline - now())) * 1000))::int,
    'bank', g.bank, 'start', duo_const('start'), 'placement', g.placement, 'version', g.version,
    'ready_me', case when me_a then g.ready_a else g.ready_b end,
    'ready_partner', case when me_a then g.ready_b else g.ready_a end,
    'last_by_me', g.last_by = pid, 'left_by_me', g.left_by = pid,
    'partner', case when g.b is not null then player_card(case when me_a then g.b else g.a end) end,
    'question', case when st in ('playing', 'done') then json_build_object('q', q ->> 'q', 'options', q -> 'options', 'topic', q -> 'topic',
      'correct', case when g.phase = 'reveal' or g.status = 'done' then (q ->> 'correct')::int end,
      'expl', case when g.phase = 'reveal' or g.status = 'done' then q ->> 'expl' end) end,
    'history', g.history,
    'reward', case when g.status = 'done' then (select coalesce(json_agg(json_build_object('reason', reason, 'delta', delta)) filter (where delta <> 0), '[]'::json)
      from wallet_log where game_id = g.id and player_id = pid) end,
    'wallet', case when g.status = 'done' then (select lingots from wallets where player_id = pid) end);
end $$;
