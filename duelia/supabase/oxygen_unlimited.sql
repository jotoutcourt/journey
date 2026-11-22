-- Oxygène illimité pour certains comptes (tests de l'équipe)
alter table public.oxygen add column if not exists unlimited boolean not null default false;

create or replace function public.oxy_take(pid uuid) returns boolean
language plpgsql security definer set search_path = public as $$
declare o oxygen;
begin
  o := oxy_sync(pid);
  if o.unlimited then return true; end if;
  if o.bottles < 1 then return false; end if;
  update oxygen set bottles = bottles - 1, since = case when o.bottles >= oxy_const('max') then now() else since end where player_id = pid;
  return true;
end $$;

create or replace function public.oxy_view(pid uuid) returns json
language plpgsql security definer set search_path = public as $$
declare o oxygen;
begin
  o := oxy_sync(pid);
  return json_build_object('bottles', case when o.unlimited then oxy_const('max') else o.bottles end, 'max', oxy_const('max'), 'refill', oxy_const('refill'),
    'unlimited', o.unlimited,
    'next_ms', case when o.unlimited or o.bottles >= oxy_const('max') then null
      else greatest(0, floor((oxy_const('regen') - extract(epoch from (now() - o.since))) * 1000))::int end);
end $$;

insert into oxygen (player_id, bottles, unlimited) values
  ('a74d38cf-eaaf-4ba7-a7ec-af1563a1ac93', 5, true), ('ed308d75-6cfb-4dd2-8bbe-b3b7601fb5b3', 5, true)
on conflict (player_id) do update set bottles = 5, unlimited = true, since = now();
