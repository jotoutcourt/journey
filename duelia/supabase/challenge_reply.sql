-- Défi différé : le joueur qui relève le défi reçoit le message de l'expéditeur à jour, pour pouvoir lui répondre.
CREATE OR REPLACE FUNCTION public.play_challenge(p_id uuid, p_answers jsonb)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare pid uuid := current_player(); c record; s int; me_name text; verdict text;
begin
  select * into c from friend_challenges where id = p_id and to_player = pid for update;
  if not found then raise exception 'défi inconnu'; end if;
  if c.status <> 'pending' or c.created_at < now() - interval '7 days' then raise exception 'défi terminé'; end if;
  if not valid_answers(p_answers, jsonb_array_length(c.questions)) then raise exception 'réponses invalides'; end if;
  s := score_answers(c.questions, p_answers);
  update friend_challenges set to_answers = p_answers, to_score = s, status = 'done', answered_at = now() where id = p_id;
  select name into me_name from players where id = pid;
  verdict := case when c.from_score > s then 'Tu as gagné' when c.from_score < s then 'Tu as perdu' else 'Égalité' end;
  perform notify_player(c.from_player, me_name || ' a joué ton défi',
    verdict || ' ' || c.from_score || '–' || s || ' sur « ' || (c.topic ->> 'name') || ' »', '/#defis');
  return json_build_object('my_score', s, 'their_score', c.from_score, 'their_msg', c.from_msg);
end $function$
;
