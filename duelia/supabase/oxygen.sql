-- Bouteilles d'oxygène 🫧 : une par partie du Butin (solo ou à deux, chaque joueur paie la sienne).
-- 5 au maximum, 1 regagnée toutes les 30 minutes, recharge complète contre 15 lingots. Tenu par le serveur.
create table if not exists public.oxygen (
  player_id uuid primary key references public.players (id) on delete cascade,
  bottles int not null default 5 check (bottles between 0 and 5),
  since timestamptz not null default now() -- début du chrono de la prochaine bouteille
);
alter table public.oxygen enable row level security;
revoke all on public.oxygen from anon, authenticated;

create or replace function public.oxy_const(k text) returns int language sql immutable as $$
  select case k when 'max' then 5 when 'regen' then 1800 when 'refill' then 15 end
$$;

-- Met à jour la réserve selon le temps écoulé et la renvoie
create or replace function public.oxy_sync(pid uuid) returns oxygen
language plpgsql security definer set search_path = public as $$
declare o oxygen; gained int; mx int := oxy_const('max');
begin
  insert into oxygen (player_id) values (pid) on conflict do nothing;
  select * into o from oxygen where player_id = pid for update;
  if o.bottles >= mx then return o; end if;
  gained := floor(extract(epoch from (now() - o.since)) / oxy_const('regen'))::int;
  if gained > 0 then
    o.bottles := least(mx, o.bottles + gained);
    o.since := case when o.bottles >= mx then now() else o.since + make_interval(secs => gained * oxy_const('regen')) end;
    update oxygen set bottles = o.bottles, since = o.since where player_id = pid;
  end if;
  return o;
end $$;

-- Prend une bouteille ; faux s'il n'y en a plus
create or replace function public.oxy_take(pid uuid) returns boolean
language plpgsql security definer set search_path = public as $$
declare o oxygen;
begin
  o := oxy_sync(pid);
  if o.bottles < 1 then return false; end if;
  update oxygen set bottles = bottles - 1, since = case when o.bottles >= oxy_const('max') then now() else since end where player_id = pid;
  return true;
end $$;

create or replace function public.oxy_view(pid uuid) returns json
language plpgsql security definer set search_path = public as $$
declare o oxygen;
begin
  o := oxy_sync(pid);
  return json_build_object('bottles', o.bottles, 'max', oxy_const('max'), 'refill', oxy_const('refill'),
    'next_ms', case when o.bottles >= oxy_const('max') then null
      else greatest(0, floor((oxy_const('regen') - extract(epoch from (now() - o.since))) * 1000))::int end);
end $$;

-- Recharge complète contre des lingots
create or replace function public.refill_oxygen() returns json
language plpgsql security definer set search_path = public as $$
declare pid uuid := current_player(); o oxygen; cost int := oxy_const('refill');
begin
  if pid is null then raise exception 'aucun joueur'; end if;
  o := oxy_sync(pid);
  if o.bottles >= oxy_const('max') then raise exception 'déjà plein'; end if;
  if coalesce((select lingots from wallets where player_id = pid), 0) < cost then raise exception 'pas assez de lingots'; end if;
  perform wallet_credit(pid, -cost, 'achat', null);
  update oxygen set bottles = oxy_const('max'), since = now() where player_id = pid;
  return get_wallet();
end $$;

-- Le porte-monnaie renvoie aussi l'oxygène
create or replace function public.get_wallet() returns json
language plpgsql security definer set search_path = public as $$
declare pid uuid := current_player();
begin
  if pid is null then return null; end if;
  return json_build_object(
    'lingots', coalesce((select lingots from wallets where player_id = pid), 0),
    'earned', coalesce((select earned from wallets where player_id = pid), 0),
    'daily_bonus', not exists (select 1 from wallet_log where player_id = pid and reason = 'bonus_jour' and paris_day(created_at) = paris_day(now())),
    'oxygen', oxy_view(pid));
end $$;

-- Solo : une bouteille par partie
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
  values (pid, null, true, p_questions, duo_const('start'), duo_zeros(p_questions, 0), 'playing', now() + make_interval(secs => duo_const('place')))
  returning id into gid;
  return gid;
end $$;

-- À deux : il faut de l'oxygène pour inviter, et chacun paie sa bouteille quand la partie démarre
create or replace function public.invite_duo(p_to uuid, p_questions jsonb, p_voice uuid) returns uuid
language plpgsql security definer set search_path = public as $$
declare pid uuid := current_player(); gid uuid; me_name text; room uuid;
begin
  if pid is null or not are_friends(pid, p_to) then raise exception 'pas amis'; end if;
  if not valid_duo_questions(p_questions) then raise exception 'questions invalides'; end if;
  if (oxy_sync(pid)).bottles < 1 then raise exception 'plus d''oxygène'; end if;
  select coalesce(voice_id, id) into room from duo_games where id = p_voice and ((a = pid and b = p_to) or (a = p_to and b = pid));
  delete from duo_games where created_at < now() - interval '3 days' and id not in (select voice_id from duo_games where voice_id is not null and created_at > now() - interval '3 days');
  update duo_games set status = 'cancelled' where a = pid and status = 'invited';
  insert into duo_games (a, b, questions, bank, placement, voice_id) values (pid, p_to, p_questions, duo_const('start'), duo_zeros(p_questions, 0), room)
  returning id into gid;
  select name into me_name from players where id = pid;
  perform notify_player(p_to, 'Le Butin 💰', me_name || ' t''invite à voler le trésor du Kraken', '/');
  return gid;
end $$;

create or replace function public.respond_duo(p_id uuid, p_accept boolean) returns json
language plpgsql security definer set search_path = public as $$
declare pid uuid := current_player(); g duo_games;
begin
  select * into g from duo_games where id = p_id and b = pid for update;
  if not found or g.status <> 'invited' or g.created_at < now() - interval '60 seconds' then return null; end if;
  if not p_accept then
    update duo_games set status = 'declined' where id = p_id;
    return null;
  end if;
  if (oxy_sync(pid)).bottles < 1 then raise exception 'plus d''oxygène'; end if;
  if not oxy_take(g.a) then
    update duo_games set status = 'cancelled' where id = p_id;
    raise exception 'ton coéquipier n''a plus d''oxygène';
  end if;
  perform oxy_take(pid);
  update duo_games set status = 'playing', round = 0, phase = 'place',
    deadline = now() + make_interval(secs => duo_const('first')), version = version + 1 where id = p_id;
  return duo_view(p_id, pid);
end $$;

revoke all on function public.oxy_const(text), public.oxy_sync(uuid), public.oxy_take(uuid), public.oxy_view(uuid) from public, anon, authenticated;
revoke all on function public.refill_oxygen() from public, anon;
grant execute on function public.refill_oxygen() to authenticated;
