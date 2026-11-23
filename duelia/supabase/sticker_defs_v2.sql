-- Livre de stickers : les 17 premiers stickers
insert into public.sticker_defs (id, topic_id, name) values
  ('swiftie', 'taylor-swift', 'Kraken Swiftie'),
  ('chirurgien', 'c-greys', 'Kraken chirurgien'),
  ('tribut', 'hunger-games', 'Kraken tribut'),
  ('chef', 'ici-tout-commence', 'Kraken chef étoilé'),
  ('enchante', 'c-disney', 'Kraken enchanté'),
  ('erudit', 'culture-g', 'Kraken érudit'),
  ('artiste', 'art', 'Kraken de la Renaissance'),
  ('tour-eiffel', 'monuments', 'Kraken géant de Paris'),
  ('central-perk', 'c-friends', 'Kraken de Central Perk'),
  ('pionniere', 'petite-maison', 'Kraken de la prairie'),
  ('roi-animaux', 'animaux', 'Kraken roi des animaux'),
  ('girlband', 'pop-girlies', 'Kraken Pop Girlies'),
  ('wisteria', 'c-desperate', 'Kraken de Wisteria Lane'),
  ('tapis-rouge', 'cinema', 'Kraken du tapis rouge'),
  ('buteur', 'foot', 'Kraken buteur'),
  ('labo', 'sciences', 'Kraken de labo'),
  ('dictee', 'orthographe', 'Kraken de la dictée')
on conflict (id) do update set topic_id = excluded.topic_id, name = excluded.name;
