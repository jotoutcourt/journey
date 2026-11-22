-- Rappel quotidien (à la Duolingo) : vers 18h30, heure de Paris, une notification aux joueurs
-- qui n'ont pas encore ouvert Kraken de la journée. Un seul rappel par jour et par joueur,
-- et plus rien après 14 jours sans venir (on ne harcèle pas).

create table if not exists public.daily_reminders (
  player_id uuid not null references public.players (id) on delete cascade,
  day date not null,
  primary key (player_id, day)
);
alter table public.daily_reminders enable row level security;
revoke all on public.daily_reminders from anon, authenticated;

-- Messages du Kraken (titre, texte) : un différent chaque jour
create or replace function public.reminder_message(n int) returns text[] language sql immutable as $$
  select array[
    (array['🐙 Le Kraken compte ses lingots…', '🎁 Ton bonus du jour t''attend', '🫧 Tes bouteilles d''oxygène sont pleines',
           '😏 Le Kraken pense que tu as peur', '🐙 « Ciao les minables ! »', '💰 Ses tentacules s''ennuient', '🏴‍☠️ Le coffre est mal fermé…'])[1 + (n % 7)],
    (array['Il en a volé plein aujourd''hui. Viens lui en reprendre !', '+5 lingots sur ta première partie. Le Kraken espère que tu l''oublies…',
           'Le trésor ne va pas se voler tout seul. Une petite plongée ?', 'Prouve-lui le contraire : 8 questions, tout son or.',
           'Le Kraken se moque de toi depuis ce matin. Tu le laisses faire ?', 'Personne n''est venu le dépouiller aujourd''hui. À toi de jouer !',
           'Le Kraken fait la sieste. C''est le moment idéal pour un casse.'])[1 + (n % 7)]]
$$;

create or replace function public.send_daily_reminders() returns int
language plpgsql security definer set search_path = public as $$
declare r record; msg text[]; sent int := 0; today date := (now() at time zone 'Europe/Paris')::date;
begin
  -- seulement dans le créneau de 18h (heure de Paris, été comme hiver)
  if extract(hour from now() at time zone 'Europe/Paris') <> 18 then return 0; end if;
  for r in
    select distinct p.id
    from players p join push_subscriptions s on s.player_id = p.id
    where p.last_seen is not null
      and (p.last_seen at time zone 'Europe/Paris')::date < today   -- pas encore venu aujourd'hui
      and p.last_seen > now() - interval '14 days'                   -- encore un joueur actif
      and not exists (select 1 from daily_reminders d where d.player_id = p.id and d.day = today)
    limit 2000
  loop
    insert into daily_reminders (player_id, day) values (r.id, today) on conflict do nothing;
    msg := reminder_message((extract(doy from today)::int + abs(hashtext(r.id::text)) % 7));
    perform notify_player(r.id, msg[1], msg[2], '/');
    sent := sent + 1;
  end loop;
  delete from daily_reminders where day < today - 30;
  return sent;
end $$;
revoke all on function public.send_daily_reminders(), public.reminder_message(int) from public, anon, authenticated;

-- Toutes les heures à la 31e minute ; la fonction n'agit que dans le créneau de 18h (donc vers 18h31)
select cron.unschedule('kraken-daily-reminder') where exists (select 1 from cron.job where jobname = 'kraken-daily-reminder');
select cron.schedule('kraken-daily-reminder', '31 * * * *', 'select public.send_daily_reminders()');
