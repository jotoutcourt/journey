-- Duelia : résultats des défis par lien.
-- La table n'est lisible ni modifiable directement par personne (RLS sans politique, droits retirés).
-- On n'y accède que par deux fonctions contrôlées.

create table if not exists public.link_results (
  id bigint generated always as identity primary key,
  challenge_id text not null check (char_length(challenge_id) between 4 and 60),
  from_name text not null check (char_length(from_name) between 1 and 18),
  from_avatar text check (char_length(from_avatar) <= 40),
  from_flag text check (char_length(from_flag) <= 8),
  answers jsonb not null check (jsonb_typeof(answers) = 'array' and jsonb_array_length(answers) between 3 and 10),
  created_at timestamptz not null default now()
);
create index if not exists link_results_challenge_idx on public.link_results (challenge_id);
alter table public.link_results enable row level security;
revoke all on public.link_results from anon, authenticated;

-- L'ami envoie ses réponses (au plus 20 résultats par défi, et un seul par pseudo)
create or replace function public.submit_link_result(p_challenge text, p_name text, p_avatar text, p_flag text, p_answers jsonb)
returns void language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from link_results where challenge_id = p_challenge) >= 20 then return; end if;
  if exists (select 1 from link_results where challenge_id = p_challenge and from_name = p_name) then return; end if;
  insert into link_results (challenge_id, from_name, from_avatar, from_flag, answers)
  values (p_challenge, p_name, p_avatar, p_flag, p_answers);
end $$;

-- Le challenger relit les résultats de ses propres défis (il faut connaître leur code)
create or replace function public.get_link_results(p_ids text[])
returns table (challenge_id text, from_name text, from_avatar text, from_flag text, answers jsonb, created_at timestamptz)
language sql stable security definer set search_path = public as $$
  select r.challenge_id, r.from_name, r.from_avatar, r.from_flag, r.answers, r.created_at
  from link_results r
  where r.challenge_id = any (p_ids[1:50])
  order by r.created_at
$$;

revoke all on function public.submit_link_result(text, text, text, text, jsonb) from public;
revoke all on function public.get_link_results(text[]) from public;
grant execute on function public.submit_link_result(text, text, text, text, jsonb) to anon, authenticated;
grant execute on function public.get_link_results(text[]) to anon, authenticated;
