-- Bouton « Suivant » pendant la révélation : en solo on passe tout de suite ; à deux, quand les deux ont appuyé.
-- La révélation dure au plus 15 s si personne n'appuie.
create or replace function public.duo_const(k text) returns int language sql immutable as $$
  select case k when 'start' then 20 when 'place' then 45 when 'first' then 52 when 'reveal' then 15 end
$$;

create or replace function public.duo_advance(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare g duo_games; kept int; correct int; n int; lo uuid; hi uuid;
begin
  select * into g from duo_games where id = p_id for update;
  if not found or g.status <> 'playing' then return; end if;
  n := jsonb_array_length(g.questions);
  if g.phase = 'place' and (now() >= g.deadline or (g.ready_a and (g.b is null or g.ready_b))) then
    correct := (g.questions -> g.round ->> 'correct')::int;
    kept := coalesce((g.placement ->> correct)::int, 0);
    update duo_games set
      history = history || jsonb_build_array(jsonb_build_object('placement', placement, 'correct', correct, 'before', bank, 'kept', kept)),
      bank = kept, phase = 'reveal', ready_a = false, ready_b = false,
      deadline = now() + make_interval(secs => duo_const('reveal')), version = version + 1
    where id = p_id;
  elsif g.phase = 'reveal' and (now() >= g.deadline or (g.ready_a and (g.b is null or g.ready_b))) then
    if g.bank <= 0 or g.round + 1 >= n then
      update duo_games set status = 'done', version = version + 1 where id = p_id;
      if g.b is not null then
        lo := least(g.a, g.b); hi := greatest(g.a, g.b);
        insert into duo_scores (p1, p2, best, games) values (lo, hi, g.bank, 1)
        on conflict (p1, p2) do update set best = greatest(duo_scores.best, excluded.best), games = duo_scores.games + 1, updated_at = now();
      end if;
      perform butin_reward(p_id, g.a, g.bank);
      perform butin_reward(p_id, g.b, g.bank);
    else
      update duo_games set round = round + 1, phase = 'place', placement = duo_zeros(questions, round + 1),
        ready_a = false, ready_b = false, last_by = null,
        deadline = now() + make_interval(secs => duo_const('place')), version = version + 1
      where id = p_id;
    end if;
  end if;
end $$;

create or replace function public.duo_next(p_id uuid, p_round int) returns json
language plpgsql security definer set search_path = public as $$
declare pid uuid := current_player();
begin
  update duo_games set ready_a = case when a = pid then true else ready_a end,
    ready_b = case when b = pid then true else ready_b end, version = version + 1
  where id = p_id and pid in (a, b) and status = 'playing' and phase = 'reveal' and round = p_round;
  perform duo_advance(p_id);
  return duo_view(p_id, pid);
end $$;
revoke all on function public.duo_next(uuid, int) from public, anon;
grant execute on function public.duo_next(uuid, int) to authenticated;
