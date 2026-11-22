import x_culture_g from './extra/culture-g.js'
import x_capitales from './extra/capitales.js'
import x_cinema from './extra/cinema.js'
import x_sciences from './extra/sciences.js'
import x_histoire from './extra/histoire.js'
import x_musique from './extra/musique.js'
import x_foot from './extra/foot.js'
import x_jeux_video from './extra/jeux-video.js'
import x_animaux from './extra/animaux.js'
import x_gastronomie from './extra/gastronomie.js'
import x_expressions from './extra/expressions.js'
import x_mythologie from './extra/mythologie.js'
import x_france from './extra/france.js'
import x_drapeaux from './extra/drapeaux.js'
import x_corps from './extra/corps.js'
import x_litterature from './extra/litterature.js'
import x_art from './extra/art.js'
import x_inventions from './extra/inventions.js'
import x_sports from './extra/sports.js'
import x_monuments from './extra/monuments.js'
import x_anglais from './extra/anglais.js'
import x_orthographe from './extra/orthographe.js'
import x_quel_animal from './extra/quel-animal.js'
import x_voitures from './extra/voitures.js'
import x_hunger from './extra/hunger-games.js'
import x_popgirlies from './extra/pop-girlies.js'
import x_petitemaison from './extra/petite-maison.js'
import x_dessins_animes from './extra/dessins-animes.js'
import x_c_series_cultes from './extra/c-series-cultes.js'
import x_c_espace from './extra/c-espace.js'
import x_c_calzona from './extra/c-calzona.js'
import x_c_desperate from './extra/c-desperate.js'
import x_c_disney from './extra/c-disney.js'
import x_c_villa from './extra/c-villa.js'
import x_c_eras from './extra/c-eras.js'
import x_greys from './extra/c-greys.js'
import x_friends from './extra/c-friends.js'
import x_potter from './extra/c-potter.js'
import x_gossip from './extra/c-gossip.js'
import x_pop2000 from './extra/c-pop2000.js'

// Banque de thèmes officiels. Chaque question : [énoncé, bonne réponse, leurre, leurre, leurre].
// Les réponses sont mélangées au moment du duel.

export const CATEGORIES = [
  'Culture', 'Géographie', 'Cinéma & TV', 'Sciences', 'Histoire',
  'Musique', 'Sport', 'Jeux vidéo', 'Nature', 'Cuisine', 'Langue',
]

const EXTRA = {
  'culture-g': x_culture_g,
  'capitales': x_capitales,
  'cinema': x_cinema,
  'sciences': x_sciences,
  'histoire': x_histoire,
  'musique': x_musique,
  'foot': x_foot,
  'jeux-video': x_jeux_video,
  'animaux': x_animaux,
  'gastronomie': x_gastronomie,
  'expressions': x_expressions,
  'mythologie': x_mythologie,
  'france': x_france,
  'drapeaux': x_drapeaux,
  'corps': x_corps,
  'litterature': x_litterature,
  'art': x_art,
  'inventions': x_inventions,
  'sports': x_sports,
  'monuments': x_monuments,
  'anglais': x_anglais,
  'orthographe': x_orthographe,
  'quel-animal': x_quel_animal,
  'voitures': x_voitures,
  'hunger-games': x_hunger,
  'pop-girlies': x_popgirlies,
  'petite-maison': x_petitemaison,
  'dessins-animes': x_dessins_animes,
  'c-series-cultes': x_c_series_cultes,
  'c-espace': x_c_espace,
  'c-calzona': x_c_calzona,
  'c-desperate': x_c_desperate,
  'c-disney': x_c_disney,
  'c-villa': x_c_villa,
  'c-eras': x_c_eras,
  'c-greys': x_greys,
  'c-friends': x_friends,
  'c-potter': x_potter,
  'c-gossip': x_gossip,
  'c-pop2000': x_pop2000,
}

// Fusionne les questions de base et les supplémentaires, sans doublon d'énoncé.
const merge = (id, base) => {
  const seen = new Set()
  return [...base, ...(EXTRA[id] || [])].filter(([q]) => !seen.has(q) && seen.add(q)).map(([q, ...a]) => ({ q, a }))
}

const T = (id, name, icon, color, category, tagline, followers, questions) => ({
  id, name, icon, color, category, tagline, followers, by: 'Kraken', official: true,
  questions: merge(id, questions),
})

export const OFFICIAL_TOPICS = [
  T('culture-g', 'Culture générale', '🧠', '#ffb648', 'Culture', 'Un peu de tout, beaucoup de réflexes', 48210, [
    ['Combien de côtés a un hexagone ?', '6', '5', '7', '8'],
    ['Quelle est la planète la plus proche du Soleil ?', 'Mercure', 'Vénus', 'Mars', 'Terre'],
    ['Qui a peint « La Joconde » ?', 'Léonard de Vinci', 'Michel-Ange', 'Raphaël', 'Botticelli'],
    ['Combien de joueurs par équipe sur un terrain de football ?', '11', '10', '9', '12'],
    ['Quelle est la langue officielle du Brésil ?', 'Le portugais', "L'espagnol", 'Le brésilien', "L'anglais"],
    ['Quel est le plus grand océan du monde ?', 'Le Pacifique', "L'Atlantique", "L'Indien", "L'Arctique"],
    ["En quelle année l'homme a-t-il marché sur la Lune pour la première fois ?", '1969', '1965', '1972', '1959'],
    ['Combien de minutes compte une journée ?', '1 440', '1 240', '1 600', '1 800'],
    ['Quel métal a pour symbole chimique « Au » ?', "L'or", "L'argent", "L'aluminium", 'Le cuivre'],
    ['Qui a écrit « Les Misérables » ?', 'Victor Hugo', 'Émile Zola', 'Honoré de Balzac', 'Gustave Flaubert'],
    ["Quelle est la capitale de l'Australie ?", 'Canberra', 'Sydney', 'Melbourne', 'Perth'],
    ['Combien de cordes a un violon ?', '4', '5', '6', '3'],
    ["Quel est l'animal terrestre le plus rapide ?", 'Le guépard', 'Le lion', "L'antilope", 'Le lévrier'],
    ["Combien d'os compte le squelette humain adulte ?", '206', '186', '226', '256'],
  ]),

  T('capitales', 'Capitales du monde', '🏛️', '#7c5cff', 'Géographie', 'Le tour du monde en sept questions', 31877, [
    ['Quelle est la capitale du Canada ?', 'Ottawa', 'Toronto', 'Montréal', 'Vancouver'],
    ['Quelle est la capitale de la Turquie ?', 'Ankara', 'Istanbul', 'Izmir', 'Antalya'],
    ['Quelle est la capitale du Brésil ?', 'Brasília', 'Rio de Janeiro', 'São Paulo', 'Salvador'],
    ['Quelle est la capitale du Maroc ?', 'Rabat', 'Casablanca', 'Marrakech', 'Fès'],
    ['Quelle est la capitale de la Suisse ?', 'Berne', 'Zurich', 'Genève', 'Bâle'],
    ['Quelle est la capitale de la Nouvelle-Zélande ?', 'Wellington', 'Auckland', 'Christchurch', 'Queenstown'],
    ["Quelle est la capitale de l'Égypte ?", 'Le Caire', 'Alexandrie', 'Louxor', 'Gizeh'],
    ['Quelle est la capitale de la Norvège ?', 'Oslo', 'Bergen', 'Stockholm', 'Trondheim'],
    ["Quelle est la capitale de l'Argentine ?", 'Buenos Aires', 'Córdoba', 'Rosario', 'Mendoza'],
    ['Quelle est la capitale du Viêt Nam ?', 'Hanoï', 'Hô Chi Minh-Ville', 'Da Nang', 'Hué'],
    ['Quelle est la capitale du Nigeria ?', 'Abuja', 'Lagos', 'Kano', 'Ibadan'],
    ['Quelle est la capitale du Kenya ?', 'Nairobi', 'Mombasa', 'Kisumu', 'Dodoma'],
    ['Quelle est la capitale du Pérou ?', 'Lima', 'Cuzco', 'Arequipa', 'Quito'],
    ["Quelle est la capitale de l'Inde ?", 'New Delhi', 'Mumbai', 'Calcutta', 'Bangalore'],
    ['Quelle est la capitale du Japon ?', 'Tokyo', 'Osaka', 'Kyoto', 'Hiroshima'],
  ]),

  T('cinema', 'Cinéma', '🎬', '#ff5d73', 'Cinéma & TV', 'Silence, ça tourne', 40552, [
    ['Qui a réalisé « Titanic » (1997) ?', 'James Cameron', 'Steven Spielberg', 'Ridley Scott', 'Martin Scorsese'],
    ['Dans quelle saga apparaît Dark Vador ?', 'Star Wars', 'Star Trek', 'Dune', 'Alien'],
    ["Quel film a remporté l'Oscar du meilleur film en 2020 ?", 'Parasite', '1917', 'Joker', 'Once Upon a Time… in Hollywood'],
    ['Quel acteur incarne Jack Sparrow ?', 'Johnny Depp', 'Orlando Bloom', 'Brad Pitt', 'Keanu Reeves'],
    ['Quelle récompense suprême décerne le Festival de Cannes ?', "La Palme d'or", "Le Lion d'or", "L'Ours d'or", "La Coquille d'or"],
    ["Qui a réalisé « Le Fabuleux Destin d'Amélie Poulain » ?", 'Jean-Pierre Jeunet', 'Luc Besson', 'Jacques Audiard', 'Michel Gondry'],
    ['Dans « Le Roi Lion », comment s\'appelle le père de Simba ?', 'Mufasa', 'Scar', 'Rafiki', 'Zazu'],
    ['Quel film de 2009 se déroule sur la lune Pandora ?', 'Avatar', 'Interstellar', 'Prometheus', 'Oblivion'],
    ['Qui joue Forrest Gump ?', 'Tom Hanks', 'Tom Cruise', 'Kevin Costner', 'Robin Williams'],
    ['Dans « Intouchables », quel acteur joue Driss ?', 'Omar Sy', 'Jamel Debbouze', 'Gad Elmaleh', 'Kad Merad'],
    ['Dans « Matrix », quelle pilule Neo avale-t-il ?', 'La rouge', 'La bleue', 'La verte', 'La blanche'],
    ['Qui a réalisé « Inception » ?', 'Christopher Nolan', 'Denis Villeneuve', 'David Fincher', 'Ridley Scott'],
    ['Quel studio a produit « Toy Story » ?', 'Pixar', 'DreamWorks', 'Illumination', 'Blue Sky'],
    ['Où se déroule le premier film « Les Bronzés » ?', "En Côte d'Ivoire", 'Au Sénégal', 'Au Maroc', 'En Tunisie'],
  ]),

  T('sciences', 'Sciences', '🧪', '#2ec4ff', 'Sciences', 'Pour les esprits curieux', 22410, [
    ["Quelle est la formule chimique de l'eau ?", 'H₂O', 'CO₂', 'O₂', 'H₂O₂'],
    ['Quelle est la vitesse approximative de la lumière ?', '300 000 km/s', '30 000 km/s', '3 000 000 km/s', '150 000 km/s'],
    ['Quel est le plus grand organe du corps humain ?', 'La peau', 'Le foie', 'Les poumons', "L'intestin"],
    ['Quelle est l\'unité de la résistance électrique ?', "L'ohm", 'Le volt', "L'ampère", 'Le watt'],
    ["Quel gaz est le plus abondant dans l'atmosphère terrestre ?", "L'azote", "L'oxygène", 'Le dioxyde de carbone', "L'argon"],
    ['Qui a formulé la théorie de la relativité ?', 'Albert Einstein', 'Isaac Newton', 'Niels Bohr', 'Max Planck'],
    ["Combien de chromosomes possède une cellule humaine ordinaire ?", '46', '23', '44', '48'],
    ['Quelle est la plus grosse planète du Système solaire ?', 'Jupiter', 'Saturne', 'Neptune', 'Uranus'],
    ["Quel est le pH d'une solution neutre ?", '7', '0', '10', '14'],
    ['Quel est le symbole chimique du fer ?', 'Fe', 'Fr', 'F', 'Ir'],
    ['Qui a découvert la pénicilline ?', 'Alexander Fleming', 'Louis Pasteur', 'Marie Curie', 'Robert Koch'],
    ['Quel organite produit l\'énergie de la cellule ?', 'La mitochondrie', 'Le noyau', 'Le ribosome', 'Le chloroplaste'],
    ['Quelle particule porte une charge électrique négative ?', "L'électron", 'Le proton', 'Le neutron', 'Le photon'],
    ["À quelle température l'eau bout-elle au niveau de la mer ?", '100 °C', '90 °C', '110 °C', '120 °C'],
  ]),

  T('histoire', 'Histoire', '📜', '#c9a26b', 'Histoire', 'Des pharaons au mur de Berlin', 26905, [
    ['En quelle année a eu lieu la prise de la Bastille ?', '1789', '1792', '1776', '1815'],
    ['Qui fut le premier empereur des Français ?', 'Napoléon Ier', 'Louis XIV', 'Charlemagne', 'Napoléon III'],
    ['En quelle année est tombé le mur de Berlin ?', '1989', '1991', '1985', '1961'],
    ['Quel roi était surnommé le Roi-Soleil ?', 'Louis XIV', 'Louis XVI', 'François Ier', 'Henri IV'],
    ['En quelle année a commencé la Première Guerre mondiale ?', '1914', '1912', '1916', '1918'],
    ['Quand a eu lieu le débarquement en Normandie ?', 'Le 6 juin 1944', 'Le 8 mai 1945', 'Le 11 novembre 1918', 'Le 14 juillet 1944'],
    ["Dans quelle ville Jeanne d'Arc a-t-elle été brûlée ?", 'Rouen', 'Orléans', 'Reims', 'Paris'],
    ['Qui fut le premier président des États-Unis ?', 'George Washington', 'Abraham Lincoln', 'Thomas Jefferson', 'John Adams'],
    ['Quelle civilisation a bâti le Machu Picchu ?', 'Les Incas', 'Les Aztèques', 'Les Mayas', 'Les Olmèques'],
    ['Quel pharaon a vu son tombeau découvert presque intact en 1922 ?', 'Toutânkhamon', 'Ramsès II', 'Khéops', 'Akhenaton'],
    ['En quelle année a eu lieu la bataille de Waterloo ?', '1815', '1805', '1812', '1830'],
    ["En quelle année Christophe Colomb atteint-il l'Amérique ?", '1492', '1453', '1515', '1498'],
    ['Sous quel dirigeant le Code civil est-il promulgué en 1804 ?', 'Napoléon Bonaparte', 'Louis XVIII', 'Robespierre', 'Charles X'],
    ['Selon la légende, qui a fondé Rome ?', 'Romulus', 'Rémus', 'Jules César', 'Énée'],
  ]),

  T('musique', 'Musique', '🎧', '#ff7ad9', 'Musique', 'De Vivaldi à Daft Punk', 29340, [
    ['Combien de notes différentes compte une gamme majeure ?', '7', '5', '8', '12'],
    ['Qui a composé « La Flûte enchantée » ?', 'Mozart', 'Beethoven', 'Bach', 'Haydn'],
    ['Quel groupe a sorti « Bohemian Rhapsody » ?', 'Queen', 'The Beatles', 'Led Zeppelin', 'Pink Floyd'],
    ['De quel instrument jouait Jimi Hendrix ?', 'La guitare', 'La batterie', 'La basse', 'Le piano'],
    ['De quelle ville sont originaires les Beatles ?', 'Liverpool', 'Londres', 'Manchester', 'Birmingham'],
    ['De quel pays est originaire le duo Daft Punk ?', 'La France', 'La Belgique', 'Le Royaume-Uni', "L'Allemagne"],
    ['Quel artiste était surnommé le « King of Pop » ?', 'Michael Jackson', 'Elvis Presley', 'Prince', 'Freddie Mercury'],
    ['Combien de touches compte un piano standard ?', '88', '76', '92', '64'],
    ['Qui chantait « La Vie en rose » ?', 'Édith Piaf', 'Dalida', 'Barbara', 'Juliette Gréco'],
    ['Combien de symphonies Beethoven a-t-il achevées ?', '9', '7', '5', '12'],
    ['De quel pays est originaire Stromae ?', 'La Belgique', 'La France', 'La Suisse', 'Le Canada'],
    ['Quel instrument à vent se joue avec une anche double ?', 'Le hautbois', 'La flûte traversière', 'Le saxophone', 'La clarinette'],
    ['Quel compositeur a continué à écrire en devenant sourd ?', 'Beethoven', 'Mozart', 'Chopin', 'Vivaldi'],
    ['Qui a composé « Les Quatre Saisons » ?', 'Vivaldi', 'Bach', 'Haendel', 'Mozart'],
  ]),

  T('foot', 'Football', '⚽', '#3ddc84', 'Sport', 'Le ballon rond, sans hors-jeu', 37120, [
    ['Quel pays a gagné la Coupe du monde 2018 ?', 'La France', 'La Croatie', 'La Belgique', 'Le Brésil'],
    ['Quel pays a gagné la Coupe du monde 2022 ?', "L'Argentine", 'La France', 'La Croatie', 'Le Maroc'],
    ['Combien de temps dure un match hors prolongations ?', '90 minutes', '80 minutes', '100 minutes', '120 minutes'],
    ["Quel joueur détient le record de Ballons d'or ?", 'Lionel Messi', 'Cristiano Ronaldo', 'Michel Platini', 'Johan Cruyff'],
    ['Quel club est surnommé « les Gones » ?', "L'Olympique lyonnais", "L'AS Saint-Étienne", "L'Olympique de Marseille", 'Le LOSC'],
    ['Comment s\'appelle le stade du Paris Saint-Germain ?', 'Le Parc des Princes', 'Le Stade de France', 'Le Vélodrome', 'Le Groupama Stadium'],
    ['Quel club français a remporté la Ligue des champions en 1993 ?', "L'Olympique de Marseille", 'Le PSG', "L'Olympique lyonnais", "L'AS Monaco"],
    ['Contre quel pays Zidane marque-t-il deux buts en finale 1998 ?', 'Le Brésil', "L'Italie", 'La Croatie', "L'Allemagne"],
    ['Quel pays a remporté le plus de Coupes du monde ?', 'Le Brésil', "L'Allemagne", "L'Italie", "L'Argentine"],
    ['Quelle couleur de carton signifie une expulsion ?', 'Rouge', 'Jaune', 'Blanc', 'Vert'],
    ['Comment appelle-t-on le match Real Madrid – FC Barcelone ?', 'El Clásico', 'El Derbi', 'El Superclásico', 'La Grande Finale'],
    ['De quel pays était Pelé ?', 'Le Brésil', "L'Argentine", "L'Uruguay", 'Le Portugal'],
    ['À quelle distance du but se trouve le point de penalty ?', '11 mètres', '9 mètres', '12 mètres', '16,5 mètres'],
    ['Avec quel club Kylian Mbappé a-t-il débuté chez les pros ?', "L'AS Monaco", 'Le PSG', "L'Olympique lyonnais", 'Le LOSC'],
  ]),

  T('jeux-video', 'Jeux vidéo', '🎮', '#5b7cff', 'Jeux vidéo', 'Appuie sur Start', 33605, [
    ['Comment s\'appelle le frère de Mario ?', 'Luigi', 'Wario', 'Toad', 'Yoshi'],
    ['Quelle entreprise fabrique la PlayStation ?', 'Sony', 'Nintendo', 'Sega', 'Microsoft'],
    ['Quel jeu de construction en blocs a été créé par Markus Persson ?', 'Minecraft', 'Roblox', 'Terraria', 'Fortnite'],
    ['Comment s\'appelle le héros de « The Legend of Zelda » ?', 'Link', 'Zelda', 'Ganon', 'Epona'],
    ['Combien de fantômes poursuivent Pac-Man dans le jeu original ?', '4', '3', '5', '6'],
    ["Quel studio français a créé « Assassin's Creed » ?", 'Ubisoft', 'Quantic Dream', 'Arkane', 'Dontnod'],
    ['Dans quel pays Tetris a-t-il été créé ?', "En URSS", 'Au Japon', 'Aux États-Unis', 'En Finlande'],
    ['Quel animal est Sonic ?', 'Un hérisson', 'Un renard', 'Un lièvre', 'Un tatou'],
    ['Quelle console portable Nintendo sort en 1989 ?', 'La Game Boy', 'La Game Gear', 'La DS', 'La Lynx'],
    ['Quel est le Pokémon de départ de type Feu dans Pokémon Rouge et Bleu ?', 'Salamèche', 'Héricendre', 'Poussifeu', 'Ouisticram'],
    ['Quel éditeur est derrière « Fortnite » ?', 'Epic Games', 'Valve', 'Riot Games', 'Blizzard'],
    ['Quel jeu de Rockstar se déroule à Los Santos ?', 'GTA V', 'Red Dead Redemption 2', 'Mafia', 'Watch Dogs'],
    ['Quelle entreprise fabrique la Xbox ?', 'Microsoft', 'Sony', 'Nintendo', 'Sega'],
    ['Quel MOBA est développé par Riot Games ?', 'League of Legends', 'Dota 2', 'Smite', 'Overwatch'],
  ]),

  T('animaux', 'Animaux', '🦊', '#ff9f45', 'Nature', 'Poils, plumes et écailles', 24770, [
    ['Quel est le plus grand mammifère du monde ?', 'La baleine bleue', "L'éléphant d'Afrique", 'Le cachalot', 'La girafe'],
    ['Combien de pattes a une araignée ?', '8', '6', '10', '12'],
    ['Comment appelle-t-on le petit de la biche ?', 'Le faon', 'Le poulain', 'Le chevreau', 'Le marcassin'],
    ['Quel est le seul mammifère capable de vraiment voler ?', 'La chauve-souris', "L'écureuil volant", 'Le colugo', "L'ornithorynque"],
    ['Combien de cœurs possède une pieuvre ?', '3', '1', '2', '8'],
    ['De quoi se nourrit principalement le koala ?', "D'eucalyptus", 'De bambou', "D'acacia", 'De fougères'],
    ['Quel est le plus grand oiseau du monde ?', "L'autruche", "L'émeu", 'Le condor', "L'albatros"],
    ['Comment appelle-t-on le cri du cerf ?', 'Il brame', 'Il barrit', 'Il rugit', 'Il glapit'],
    ['Le dauphin est…', 'Un mammifère', 'Un poisson', 'Un amphibien', 'Un reptile'],
    ['Pourquoi le flamant rose est-il rose ?', 'À cause de son alimentation', 'À cause de ses gènes', 'À cause du soleil', 'Il naît rose'],
    ["Combien de temps dure environ la gestation d'une éléphante ?", '22 mois', '9 mois', '12 mois', '32 mois'],
    ["L'axolotl est…", 'Un amphibien', 'Un poisson', 'Un reptile', 'Un mammifère'],
    ['Quel est le plus grand des félins ?', 'Le tigre', 'Le lion', 'Le jaguar', 'Le léopard'],
    ["Quel animal a des empreintes digitales proches de celles de l'humain ?", 'Le koala', 'Le chat', 'Le paresseux', 'Le raton laveur'],
  ]),

  T('gastronomie', 'Gastronomie française', '🧀', '#f2c94c', 'Cuisine', 'Du terroir dans les réponses', 18220, [
    ['De quelle région la choucroute est-elle la spécialité ?', "L'Alsace", 'La Bretagne', 'La Savoie', 'La Lorraine'],
    ["Quel fromage à pâte persillée est affiné dans l'Aveyron ?", 'Le roquefort', 'Le comté', 'Le munster', 'Le reblochon'],
    ['Quel plat provençal est fait de légumes mijotés ?', 'La ratatouille', 'La bouillabaisse', 'La tapenade', 'Le pistou'],
    ['De quelle région viennent les galettes de sarrasin ?', 'La Bretagne', 'La Normandie', "L'Auvergne", 'Le Nord'],
    ['Quel fromage est au cœur de la tartiflette ?', 'Le reblochon', 'Le comté', 'Le beaufort', 'La raclette'],
    ['Le cassoulet est une spécialité de quelle région ?', "L'Occitanie", 'La Normandie', "L'Alsace", 'La Bourgogne'],
    ['Quelle soupe de poissons est l\'emblème de Marseille ?', 'La bouillabaisse', 'La garbure', 'La pochouse', 'La cotriade'],
    ["Quel gâteau mange-t-on à l'Épiphanie ?", 'La galette des rois', 'Le kouign-amann', 'Le paris-brest', 'Le savarin'],
    ['Le paris-brest doit son nom à…', 'Une course cycliste', 'Une ligne de train', 'Un pâtissier', 'Un bateau'],
    ['Quel ingrédient trouve-t-on dans la vraie quiche lorraine ?', 'Des lardons', 'Du saumon', 'Des champignons', 'Des poireaux'],
    ['De quelle ville le canelé est-il la spécialité ?', 'Bordeaux', 'Lyon', 'Lille', 'Nice'],
    ['Le calvados est une eau-de-vie de…', 'Pomme', 'Poire', 'Raisin', 'Prune'],
    ['Dans quoi mijote un bœuf bourguignon ?', 'Du vin rouge', 'De la bière', 'Du cidre', 'Du vin blanc'],
    ['De quelle ville sont originaires les « bêtises » ?', 'Cambrai', 'Nancy', 'Vichy', 'Montélimar'],
  ]),

  T('expressions', 'Expressions françaises', '💬', '#4dd6b0', 'Langue', 'Avoir la langue bien pendue', 15460, [
    ['« Poser un lapin » signifie…', 'Ne pas venir à un rendez-vous', 'Faire un cadeau', 'Mentir', 'Partir en courant'],
    ['« Avoir le cafard » signifie…', 'Avoir le moral à zéro', 'Avoir peur', 'Avoir faim', 'Être sale'],
    ['« Coûter les yeux de la tête » signifie…', 'Être très cher', 'Faire mal', 'Être fatigant', 'Être rare'],
    ['« Tomber dans les pommes » signifie…', "S'évanouir", 'Faire une chute', 'Être chanceux', 'Tomber amoureux'],
    ['« Avoir un poil dans la main » signifie…', 'Être paresseux', 'Être maladroit', 'Être avare', 'Être blessé'],
    ['« Mettre les pieds dans le plat » signifie…', 'Aborder un sujet sans délicatesse', 'Faire la cuisine', 'Être en retard', 'Se salir'],
    ['« Raconter des salades » signifie…', 'Mentir', 'Parler de cuisine', 'Bavarder', 'Se plaindre'],
    ['« Avoir la pêche » signifie…', 'Être en pleine forme', 'Avoir de la chance', 'Avoir chaud', 'Être en colère'],
    ['« Être dans la lune » signifie…', 'Être distrait', 'Être heureux', 'Être loin', 'Être malade'],
    ['« Donner sa langue au chat » signifie…', 'Renoncer à deviner', 'Se taire', 'Trahir un secret', 'Dire une bêtise'],
    ['« Il pleut des cordes » signifie…', 'Il pleut très fort', 'Il va pleuvoir', 'Il bruine', 'Il grêle'],
    ['« Faire la grasse matinée » signifie…', 'Dormir tard le matin', 'Manger beaucoup', 'Se lever tôt', 'Faire la fête'],
    ['« Avoir une faim de loup » signifie…', 'Avoir très faim', 'Être agressif', 'Être affamé de pouvoir', 'Manger de la viande'],
    ['« Casser les pieds » de quelqu\'un signifie…', "L'ennuyer", 'Le blesser', 'Le faire tomber', 'Le battre à la course'],
  ]),

  T('mythologie', 'Mythologie grecque', '⚡', '#9aa7ff', 'Histoire', "Les dieux de l'Olympe", 19985, [
    ["Qui est le roi des dieux de l'Olympe ?", 'Zeus', 'Hadès', 'Poséidon', 'Apollon'],
    ['Qui est le dieu de la mer ?', 'Poséidon', 'Zeus', 'Hermès', 'Arès'],
    ['Qui est la déesse de la sagesse ?', 'Athéna', 'Aphrodite', 'Héra', 'Artémis'],
    ['Quel héros a accompli douze travaux ?', 'Héraclès', 'Persée', 'Thésée', 'Achille'],
    ['Qui a tranché la tête de Méduse ?', 'Persée', 'Thésée', 'Jason', 'Ulysse'],
    ['Où était enfermé le Minotaure ?', 'Dans le Labyrinthe', 'Aux Enfers', 'Sur le mont Olympe', 'Dans une grotte'],
    ['Quel était le point faible d\'Achille ?', 'Son talon', 'Son cœur', 'Ses yeux', 'Sa nuque'],
    ['Qui est le messager des dieux ?', 'Hermès', 'Apollon', 'Arès', 'Héphaïstos'],
    ['Qui règne sur les Enfers ?', 'Hadès', 'Cronos', 'Arès', 'Thanatos'],
    ['Qui a volé le feu aux dieux pour le donner aux hommes ?', 'Prométhée', 'Épiméthée', 'Icare', 'Atlas'],
    ["De quoi Icare s'est-il trop approché ?", 'Du Soleil', 'De la mer', 'De la Lune', "D'un volcan"],
    ['De quelle île Ulysse est-il le roi ?', 'Ithaque', 'Crète', 'Rhodes', 'Chypre'],
    ['Qui a ouvert la boîte libérant les maux du monde ?', 'Pandore', 'Hélène', 'Médée', 'Perséphone'],
    ['Comment s\'appelle le chien à trois têtes gardien des Enfers ?', 'Cerbère', 'Orthos', "L'Hydre", 'La Chimère'],
  ]),
  T('france', 'Géographie de France', '🗺️', '#3a7bff', 'Géographie', 'Régions, fleuves, villes et outre-mer', 15420, []),
  T('drapeaux', 'Drapeaux du monde', '🏳️', '#ff7a59', 'Géographie', 'Retrouve le pays de 100 vrais drapeaux', 17830, []),
  T('corps', 'Corps humain', '🫀', '#ff5d73', 'Sciences', 'Organes, os, sens et santé', 13960, []),
  T('litterature', 'Littérature', '📚', '#8d6e63', 'Culture', 'Auteurs, romans et personnages', 16240, []),
  T('art', 'Art & peinture', '🎨', '#e85dff', 'Culture', "Chefs-d'œuvre, artistes et musées", 14710, []),
  T('inventions', 'Inventions', '💡', '#ffc93c', 'Sciences', 'Inventeurs, découvertes et dates clés', 12880, []),
  T('sports', 'Sports & JO', '🏅', '#3ddc84', 'Sport', 'Jeux olympiques, tennis, rugby, F1…', 21350, []),
  T('monuments', 'Monuments du monde', '🗽', '#2ec4ff', 'Géographie', 'Merveilles, tours et temples', 18090, []),
  T('anglais', 'Anglais', '🇬🇧', '#5b7cff', 'Langue', 'Vocabulaire, faux amis et expressions', 19570, []),
  T('orthographe', 'Orthographe', '✍️', '#ff9f43', 'Langue', 'Mots pièges, accords, pluriels et homophones', 16580, []),
  T('hunger-games', 'Hunger Games', '🏹', '#e8553d', 'Cinéma & TV', 'Panem, les districts et le geai moqueur', 21480, []),
  T('pop-girlies', 'Pop girlies', '💅', '#ff5fb8', 'Musique', 'Divas, tubes et albums cultes', 23790, []),
  T('petite-maison', 'La Petite Maison dans la prairie', '🌾', '#c98a4b', 'Cinéma & TV', 'Walnut Grove, les Ingalls et les Oleson', 16930, []),
  T('voitures', 'Voitures', '🏎️', '#ff4d4d', 'Sport', 'Marques, modèles, mécanique et sport auto', 17260, []),
  T('quel-animal', 'Quel est cet animal ?', '📸', '#3ddc84', 'Nature', 'Reconnais l\'animal sur la photo', 18240, []),
  T('dessins-animes', 'Dessins animés', '📺', '#ffb648', 'Cinéma & TV', 'Des Simpson à Miyazaki', 22640, []),
]

// Thèmes « créés par la communauté » livrés avec l'appli pour montrer le concept.
const SEED = [
  {
    id: 'c-series-cultes', name: 'Séries cultes', icon: '📺', color: '#e85dff', category: 'Cinéma & TV',
    tagline: 'Pour celles et ceux qui enchaînent les épisodes', by: 'Chloé_binge', followers: 3412, community: true,
    questions: [
      ['Dans « Friends », quel est le métier de Ross ?', 'Paléontologue', 'Chef cuisinier', 'Acteur', 'Masseur'],
      ['Dans « Breaking Bad », quel métier exerce d\'abord Walter White ?', 'Professeur de chimie', 'Pharmacien', 'Avocat', 'Policier'],
      ['Dans quelle ville se déroule « Stranger Things » ?', 'Hawkins', 'Derry', 'Springfield', 'Twin Peaks'],
      ['Dans « Game of Thrones », quelle famille élève Jon Snow ?', 'Les Stark', 'Les Lannister', 'Les Targaryen', 'Les Baratheon'],
      ['Qui tient le rôle principal de la série « Lupin » ?', 'Omar Sy', 'Vincent Cassel', 'Jean Dujardin', 'Tahar Rahim'],
      ['Comment s\'appelle l\'hôpital au début de « Grey\'s Anatomy » ?', 'Seattle Grace', 'Sacred Heart', 'Princeton-Plainsboro', 'County General'],
      ['Dans « The Office » (US), quelle entreprise vend du papier ?', 'Dunder Mifflin', 'Sterling Cooper', 'Wernham Hogg', 'Initech'],
      ['Qui a créé la série « Kaamelott » ?', 'Alexandre Astier', 'Kad Merad', 'Franck Dubosc', 'Éric Judor'],
      ['Dans « La Casa de Papel », comment surnomme-t-on le cerveau du casse ?', 'Le Professeur', 'Berlin', 'Tokyo', 'Rio'],
      ['Dans quelle ville vivent les Simpson ?', 'Springfield', 'Shelbyville', 'Quahog', 'South Park'],
    ],
  },
  {
    id: 'c-espace', name: 'Espace & étoiles', icon: '🪐', color: '#3a7bff', category: 'Sciences',
    tagline: 'La tête dans les étoiles', by: 'orion.lu', followers: 2087, community: true,
    questions: [
      ['Quelle planète est surnommée la planète rouge ?', 'Mars', 'Vénus', 'Jupiter', 'Mercure'],
      ['Qui fut le premier humain dans l\'espace ?', 'Youri Gagarine', 'Neil Armstrong', 'Buzz Aldrin', 'John Glenn'],
      ['Quelle est l\'étoile la plus proche de la Terre ?', 'Le Soleil', 'Proxima du Centaure', 'Sirius', 'Bételgeuse'],
      ['Dans quelle galaxie se trouve le Système solaire ?', 'La Voie lactée', 'Andromède', 'Le Triangle', 'Le Sombrero'],
      ['Quelle planète possède les anneaux les plus spectaculaires ?', 'Saturne', 'Jupiter', 'Uranus', 'Neptune'],
      ['Qui fut le premier Français dans l\'espace ?', 'Jean-Loup Chrétien', 'Thomas Pesquet', 'Patrick Baudry', 'Claudie Haigneré'],
      ['Combien de temps met la lumière du Soleil pour nous atteindre ?', 'Environ 8 minutes', 'Environ 8 secondes', 'Environ 8 heures', 'Environ 1 minute'],
      ['En quelle année Pluton a-t-elle été reclassée planète naine ?', '2006', '1999', '2012', '1994'],
      ['Comment s\'appelle l\'agence spatiale européenne ?', "L'ESA", 'La NASA', 'Le CNES', 'La JAXA'],
    ],
  },
  {
    id: 'c-calzona', name: 'Callie & Arizona', icon: '💞', color: '#ff6fa8', category: 'Cinéma & TV',
    tagline: 'Le couple Calzona de Grey\'s Anatomy', by: 'Jo', followers: 1287, community: true,
    questions: [
      ['Quel surnom les fans donnent-ils au couple Callie et Arizona ?', 'Calzona', 'Arizallie', 'Robbtorres', 'Callizona'],
      ['Quelle est la spécialité de Callie Torres ?', 'La chirurgie orthopédique', 'La neurochirurgie', 'La chirurgie cardiaque', 'La chirurgie plastique'],
      ['Quelle est la spécialité d\'Arizona Robbins ?', 'La chirurgie pédiatrique', 'La chirurgie générale', 'L\'obstétrique', 'La traumatologie'],
      ['Quel est le vrai prénom complet de Callie ?', 'Calliope', 'Caroline', 'Callista', 'Camilla'],
      ['Dans quelle saison Callie apparaît-elle pour la première fois ?', 'La saison 2', 'La saison 1', 'La saison 3', 'La saison 5'],
      ['Dans quelle saison Arizona arrive-t-elle à l\'hôpital ?', 'La saison 5', 'La saison 3', 'La saison 6', 'La saison 7'],
      ['Avec quel interne Callie s\'est-elle mariée avant de rencontrer Arizona ?', 'George O\'Malley', 'Alex Karev', 'Mark Sloan', 'Owen Hunt'],
      ['Avec quelle chirurgienne cardiaque Callie a-t-elle eu une relation avant Arizona ?', 'Erica Hahn', 'Teddy Altman', 'Cristina Yang', 'Maggie Pierce'],
      ['Où Arizona et Callie échangent-elles leur premier baiser ?', 'Dans les toilettes du bar de Joe', 'Dans un ascenseur', 'Sur le toit de l\'hôpital', 'Dans la salle de garde'],
      ['Quelles chaussures à roulettes Arizona porte-t-elle dans les couloirs ?', 'Des Heelys', 'Des patins à glace', 'Des rollers en ligne', 'Des baskets lumineuses'],
      ['D\'où vient le prénom d\'Arizona ?', 'Du cuirassé USS Arizona', 'De l\'État où elle est née', 'D\'une chanson', 'De sa grand-mère'],
      ['Quel métier exerce le père d\'Arizona ?', 'Militaire (colonel dans les Marines)', 'Chirurgien', 'Pasteur', 'Avocat'],
      ['Qu\'est-il arrivé au frère d\'Arizona, Tim ?', 'Il est mort à la guerre', 'Il est devenu médecin', 'Il a disparu en mer', 'Il vit au Malawi'],
      ['Dans quel pays Arizona devait-elle partir travailler grâce à une bourse ?', 'Le Malawi', 'Le Kenya', 'Haïti', 'Le Mexique'],
      ['Qui est le père biologique de Sofia, la fille de Callie ?', 'Mark Sloan', 'George O\'Malley', 'Owen Hunt', 'Derek Shepherd'],
      ['Comment s\'appelle la fille de Callie et Arizona ?', 'Sofia', 'Zola', 'Harriet', 'Ellis'],
      ['Que vit Callie, enceinte, juste avant la naissance de Sofia ?', 'Un accident de voiture', 'Une fusillade', 'Un crash d\'avion', 'Une tempête'],
      ['Comment s\'appelle l\'épisode musical de la saison 7 où Callie chante ?', 'Song Beneath the Song', 'Here Comes the Flood', 'Into You Like a Train', 'How to Save a Life'],
      ['Dans quelle saison Callie et Arizona se marient-elles ?', 'La saison 7', 'La saison 5', 'La saison 9', 'La saison 11'],
      ['Que perd Arizona après le crash d\'avion de la fin de saison 8 ?', 'Une jambe', 'Un bras', 'La vue', 'La mémoire'],
      ['Lequel de ces médecins n\'était PAS dans l\'avion qui s\'écrase en saison 8 ?', 'Callie Torres', 'Arizona Robbins', 'Mark Sloan', 'Lexie Grey'],
      ['Avec quelle chirurgienne plasticienne Arizona trompe-t-elle Callie en saison 9 ?', 'Lauren Boswell', 'Amelia Shepherd', 'Leah Murphy', 'Jo Wilson'],
      ['Auprès de quelle chirurgienne Arizona se forme-t-elle à la chirurgie fœtale ?', 'Nicole Herman', 'Addison Montgomery', 'Miranda Bailey', 'Catherine Avery'],
      ['Pour qui Callie part-elle vivre à New York à la fin de la saison 12 ?', 'Penny Blake', 'Arizona Robbins', 'Erica Hahn', 'Leah Murphy'],
      ['Avec quelle consultante Arizona sort-elle en saison 13 ?', 'Eliza Minnick', 'Penny Blake', 'Carina DeLuca', 'Lauren Boswell'],
      ['Dans quelle ville Arizona part-elle à la fin de la saison 14 ?', 'New York', 'Los Angeles', 'Boston', 'Chicago'],
    ],
  },
  {
    id: 'c-desperate', name: 'Desperate Housewives', icon: '🏡', color: '#7cbf5a', category: 'Cinéma & TV',
    tagline: 'Les secrets de Wisteria Lane', by: 'Jo', followers: 14820, community: true, questions: [],
  },
  {
    id: 'c-villa', name: 'La Villa des cœurs brisés', icon: '💔', color: '#ff5d8f', category: 'Cinéma & TV',
    tagline: 'Love coach, prétendants et villas de rêve', by: 'Jo', followers: 0, community: true, questions: [],
  },
  {
    id: 'c-eras', name: 'The Eras Tour', icon: '✨', color: '#b57edc', category: 'Musique',
    tagline: 'Taylor Swift, 149 concerts et des bracelets d\'amitié', by: 'Jo', followers: 22390, community: true, questions: [],
  },
  {
    id: 'c-greys', name: "Grey's Anatomy", icon: '🩺', color: '#3e9bd6', category: 'Cinéma & TV',
    tagline: 'Seattle Grace, McDreamy et chirurgies impossibles', by: 'Jo', followers: 19640, community: true, questions: [],
  },
  {
    id: 'c-friends', name: 'Friends', icon: '☕', color: '#e8a93a', category: 'Cinéma & TV',
    tagline: 'Central Perk, six amis et un canapé orange', by: 'Jo', followers: 25110, community: true, questions: [],
  },
  {
    id: 'c-potter', name: 'Harry Potter', icon: '⚡', color: '#9b5de5', category: 'Cinéma & TV',
    tagline: 'Poudlard, sortilèges et Quidditch', by: 'Jo', followers: 31870, community: true, questions: [],
  },
  {
    id: 'c-gossip', name: 'Gossip Girl', icon: '💋', color: '#d4a017', category: 'Cinéma & TV',
    tagline: "Les secrets de l'Upper East Side", by: 'Jo', followers: 0, community: true, questions: [],
  },
  {
    id: 'c-pop2000', name: 'Pop des années 2000', icon: '🎤', color: '#ff4fa3', category: 'Musique',
    tagline: 'Tubes, télé-crochets et clips cultes', by: 'Jo', followers: 0, community: true, questions: [],
  },
  {
    id: 'c-disney', name: 'Disney', icon: '🏰', color: '#4f7bff', category: 'Cinéma & TV',
    tagline: 'Un siècle de films, de personnages et de parcs', by: 'Jo', followers: 28450, community: true, questions: [],
  },
].map(t => ({ ...t, questions: merge(t.id, t.questions) }))

// Thèmes communautaires livrés avec l'appli
// Thèmes devenus officiels (ils ne sont plus rangés dans les créations du joueur)
export const MADE_OFFICIAL = ['c-potter', 'c-eras', 'c-friends', 'c-greys', 'c-disney', 'c-desperate']
const MINE = ['c-calzona', 'c-villa', 'c-gossip', 'c-pop2000']
// Anciens thèmes « de la communauté » (attribués à des joueurs simulés) : ce sont désormais des thèmes officiels
export const COMMUNITY_SEED = SEED.filter(t => !MINE.includes(t.id)).map(({ by, community, ...t }) => ({ ...t, official: true })) // eslint-disable-line no-unused-vars

// Thème « Callie & Arizona » : placé dans les créations du joueur, modifiable comme s'il l'avait écrit
export const STARTER_CREATION = { ...SEED.find(t => t.id === 'c-calzona'), own: true, community: true, followers: 0 }
// Tous les thèmes rangés dans les créations du joueur, avec la version de l'appli qui les a ajoutés
const SINCE = { 'c-calzona': 1, 'c-desperate': 3, 'c-disney': 3, 'c-villa': 4, 'c-eras': 7, 'c-greys': 8, 'c-friends': 8, 'c-potter': 8, 'c-gossip': 8, 'c-pop2000': 8 }
export const STARTER_CREATIONS = MINE.map(id => ({ topic: { ...SEED.find(t => t.id === id), own: true, community: true, followers: 0 }, since: SINCE[id] }))
