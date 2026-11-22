-- Butin à deux : la cagnotte finale est partagée entre les deux joueurs (moitié chacun, arrondie au supérieur).
-- Le bonus « casse parfait » (+10 chacun) reste calculé sur la cagnotte entière.
drop function if exists public.butin_reward(uuid, uuid, int);
create or replace function public.butin_reward(p_game uuid, p_player uuid, p_bank int, p_full int default null) returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_player is null or exists (select 1 from wallet_log where game_id = p_game and player_id = p_player) then return; end if;
  -- garde-fou : au plus 40 parties payées par jour et par joueur
  if (select count(distinct game_id) from wallet_log where player_id = p_player and reason = 'butin' and paris_day(created_at) = paris_day(now())) >= 40 then return; end if;
  if not exists (select 1 from wallet_log where player_id = p_player and reason = 'bonus_jour' and paris_day(created_at) = paris_day(now())) then
    perform wallet_credit(p_player, 5, 'bonus_jour', p_game);
  end if;
  perform wallet_credit(p_player, p_bank, 'butin', p_game);
  if coalesce(p_full, p_bank) >= duo_const('start') then perform wallet_credit(p_player, 10, 'parfait', p_game); end if;
  -- trace de la partie même à 0 lingot (évite un double paiement)
  if p_bank = 0 then insert into wallet_log (player_id, delta, reason, game_id) values (p_player, 0, 'butin', p_game); end if;
end $$;
revoke all on function public.butin_reward(uuid, uuid, int, int) from public, anon, authenticated;

CREATE OR REPLACE FUNCTION public.duo_advance(p_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare g duo_games; kept int; correct int; n int; lo uuid; hi uuid; used int; allin boolean; bonus int := 0;
begin
  select * into g from duo_games where id = p_id for update;
  if not found or g.status <> 'playing' then return; end if;
  n := jsonb_array_length(g.questions);
  if g.phase = 'place' and (now() >= g.deadline or (g.ready_a and (g.b is null or g.ready_b))) then
    correct := (g.questions -> g.round ->> 'correct')::int;
    kept := coalesce((g.placement ->> correct)::int, 0);
    select count(*) filter (where (v #>> '{}')::int > 0) into used from jsonb_array_elements(g.placement) v;
    allin := g.bank > 0 and used = 1 and duo_open(g) >= 3
      and (select coalesce(sum((v #>> '{}')::int), 0) from jsonb_array_elements(g.placement) v) = g.bank;
    if allin and kept = g.bank then bonus := duo_const('allin'); end if;
    update duo_games set
      history = history || jsonb_build_array(jsonb_build_object('placement', placement, 'correct', correct, 'before', bank,
        'kept', kept + bonus, 'allin', allin, 'bonus', bonus,
        'joker', case when joker_round = round then joker_option end)),
      bank = kept + bonus, phase = 'reveal', ready_a = false, ready_b = false,
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
      -- à deux, la cagnotte se partage (arrondi au lingot supérieur) ; seul, on garde tout
      perform butin_reward(p_id, g.a, case when g.b is null then g.bank else ceil(g.bank / 2.0)::int end, g.bank);
      perform butin_reward(p_id, g.b, ceil(g.bank / 2.0)::int, g.bank);
    else
      update duo_games set round = round + 1, phase = 'place', placement = duo_zeros(questions, round + 1),
        ready_a = false, ready_b = false, last_by = null,
        deadline = now() + make_interval(secs => duo_const('place')), version = version + 1
      where id = p_id;
    end if;
  end if;
end $function$;
