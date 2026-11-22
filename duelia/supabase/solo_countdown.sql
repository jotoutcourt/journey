-- La première question du solo laisse le temps du décompte (3, 2, 1, GO)
create or replace function public.start_solo_butin(p_questions jsonb) returns uuid
language plpgsql security definer set search_path = public as $$
declare pid uuid := current_player(); gid uuid;
begin
  if pid is null then raise exception 'aucun joueur'; end if;
  if not valid_duo_questions(p_questions) then raise exception 'questions invalides'; end if;
  if (select count(*) from duo_games where a = pid and solo and created_at > now() - interval '1 day') >= 60 then raise exception 'trop de parties aujourd''hui'; end if;
  if not oxy_take(pid) then raise exception 'plus d''oxygène'; end if;
  update duo_games set status = 'left', left_by = pid where a = pid and solo and status = 'playing';
  insert into duo_games (a, b, solo, questions, bank, placement, status, deadline)
  values (pid, null, true, p_questions, duo_const('start'), duo_zeros(p_questions, 0), 'playing', now() + make_interval(secs => duo_const('first')))
  returning id into gid;
  return gid;
end $$;
