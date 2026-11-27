-- Signalement rapide d'une question erronée par un joueur ; listé dans l'historique caché du créateur.
create table if not exists public.question_reports (
  id bigint generated always as identity primary key,
  player_id uuid references public.players (id) on delete set null,
  topic text check (char_length(topic) <= 80),
  question text not null check (char_length(question) between 1 and 600),
  answer text check (char_length(answer) <= 200),
  reason text not null check (reason in ('reponse', 'formulation', 'doublon', 'autre')),
  done boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.question_reports enable row level security;
revoke all on public.question_reports from anon, authenticated;

create or replace function public.report_question(p_topic text, p_question text, p_answer text, p_reason text) returns boolean
language plpgsql security definer set search_path = public as $$
declare pid uuid := current_player();
begin
  if pid is null then raise exception 'aucun joueur'; end if;
  if (select count(*) from question_reports where player_id = pid and created_at > now() - interval '1 hour') >= 30 then raise exception 'doucement'; end if;
  -- un même joueur ne signale pas deux fois la même question
  if exists (select 1 from question_reports where player_id = pid and question = left(p_question, 600) and not done) then return true; end if;
  insert into question_reports (player_id, topic, question, answer, reason)
    values (pid, left(p_topic, 80), left(p_question, 600), left(p_answer, 200), coalesce(nullif(p_reason, ''), 'autre'));
  return true;
end $$;
revoke all on function public.report_question(text, text, text, text) from public, anon;
grant execute on function public.report_question(text, text, text, text) to authenticated;

-- Liste pour le créateur (avec le nombre de joueurs qui ont signalé la même question) et marquage « corrigé »
create or replace function public.admin_reports() returns json language plpgsql stable security definer set search_path = public as $$
begin
  if not is_app_admin() then raise exception 'réservé'; end if;
  return coalesce((select json_agg(r order by r.last desc) from (
    select question, max(topic) topic, max(answer) answer, array_agg(distinct reason) reasons, count(*) n,
      string_agg(distinct p.name, ', ') who, max(q.created_at) last, array_agg(q.id) ids
    from question_reports q left join players p on p.id = q.player_id where not q.done
    group by question) r), '[]'::json);
end $$;
create or replace function public.admin_report_done(p_ids bigint[]) returns boolean language plpgsql security definer set search_path = public as $$
begin
  if not is_app_admin() then raise exception 'réservé'; end if;
  update question_reports set done = true where id = any(p_ids);
  return true;
end $$;
revoke all on function public.admin_reports(), public.admin_report_done(bigint[]) from public, anon;
grant execute on function public.admin_reports(), public.admin_report_done(bigint[]) to authenticated;
