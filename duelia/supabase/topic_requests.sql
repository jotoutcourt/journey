-- Demandes de thèmes : un joueur propose un sujet, les autres peuvent soutenir la demande.
create table if not exists public.topic_requests (
  id bigint generated always as identity primary key,
  player_id uuid not null references public.players (id) on delete cascade,
  name text not null check (char_length(name) between 2 and 60),
  details text not null default '' check (char_length(details) <= 300),
  status text not null default 'open' check (status in ('open', 'done', 'rejected')),
  created_at timestamptz not null default now()
);
create table if not exists public.topic_request_votes (
  request_id bigint not null references public.topic_requests (id) on delete cascade,
  player_id uuid not null references public.players (id) on delete cascade,
  primary key (request_id, player_id)
);
alter table public.topic_requests enable row level security;
alter table public.topic_request_votes enable row level security;
revoke all on public.topic_requests, public.topic_request_votes from anon, authenticated;

-- Nouvelle demande. Si le même sujet a déjà été demandé, on soutient la demande existante.
-- Renvoie 'created', 'voted' (sujet existant soutenu) ou 'limit'
create or replace function public.request_topic(p_name text, p_details text) returns text
language plpgsql security definer set search_path = public as $$
declare pid uuid := current_player(); n text := btrim(coalesce(p_name, '')); rid bigint;
begin
  if pid is null then raise exception 'aucun joueur'; end if;
  if char_length(n) < 2 then raise exception 'nom trop court'; end if;
  select id into rid from topic_requests where lower(name) = lower(n) and status = 'open' limit 1;
  if rid is not null then
    insert into topic_request_votes (request_id, player_id) values (rid, pid) on conflict do nothing;
    return 'voted';
  end if;
  if (select count(*) from topic_requests where player_id = pid and created_at > now() - interval '1 day') >= 10 then return 'limit'; end if;
  insert into topic_requests (player_id, name, details) values (pid, left(n, 60), left(btrim(coalesce(p_details, '')), 300)) returning id into rid;
  insert into topic_request_votes (request_id, player_id) values (rid, pid);
  return 'created';
end $$;

create or replace function public.vote_topic_request(p_id bigint) returns void
language sql security definer set search_path = public as $$
  insert into topic_request_votes (request_id, player_id)
  select p_id, current_player() where current_player() is not null and exists (select 1 from topic_requests where id = p_id and status = 'open')
  on conflict do nothing
$$;

-- Les demandes ouvertes les plus soutenues
create or replace function public.list_topic_requests() returns json
language sql stable security definer set search_path = public as $$
  select coalesce(json_agg(x order by x.votes desc, x.created_at desc), '[]'::json) from (
    select r.id, r.name, r.details, r.created_at, p.name as by_name,
      (select count(*) from topic_request_votes v where v.request_id = r.id) as votes,
      exists (select 1 from topic_request_votes v where v.request_id = r.id and v.player_id = current_player()) as voted
    from topic_requests r join players p on p.id = r.player_id
    where r.status = 'open'
    order by 6 desc, r.created_at desc limit 30) x
$$;

revoke all on function public.request_topic(text, text), public.vote_topic_request(bigint), public.list_topic_requests() from public, anon;
grant execute on function public.request_topic(text, text), public.vote_topic_request(bigint), public.list_topic_requests() to authenticated;
