// ─────────────────────────────────────────────────────────────────────────────
// CinéMaster — Série 1 « Premières Séances »
//
// Types   : CHAR (personnage) · LIEU (lieu culte) · OBJET (objet culte)
// Raretés : commune · peu-commune · rare · holo · ultra (full art) · secrete (gold)
//
// Pour utiliser tes propres illustrations : dépose une image dans
// public/cards/ et ajoute `image: '/cards/nom-du-fichier.jpg'` à la carte.
// Sans image, une illustration est générée à partir des couleurs de l'univers.
// ─────────────────────────────────────────────────────────────────────────────

export const SET = { code: 'S1', name: 'Premières Séances' }

export const UNIVERSES = {
  greys:    { name: "Grey's Anatomy",          kind: 'Série', c1: '#e8485c', c2: '#4a90d9', ink: '#e8485c' },
  revenge:  { name: 'Revenge',                 kind: 'Série', c1: '#c1121f', c2: '#1d3557', ink: '#d62839' },
  hp:       { name: 'Harry Potter',            kind: 'Film',  c1: '#7f0909', c2: '#d3a625', ink: '#b8860b' },
  sw:       { name: 'Star Wars',               kind: 'Film',  c1: '#ffe81f', c2: '#1b1f3b', ink: '#d4a900' },
  friends:  { name: 'Friends',                 kind: 'Série', c1: '#f7c948', c2: '#9b5de5', ink: '#9b5de5' },
  bb:       { name: 'Breaking Bad',            kind: 'Série', c1: '#3a7d44', c2: '#f4d35e', ink: '#3a7d44' },
  got:      { name: 'Game of Thrones',         kind: 'Série', c1: '#8d99ae', c2: '#3b2f2f', ink: '#6c757d' },
  lotr:     { name: 'Le Seigneur des Anneaux', kind: 'Film',  c1: '#c9a227', c2: '#2f3e2f', ink: '#a67c00' },
  bttf:     { name: 'Retour vers le futur',    kind: 'Film',  c1: '#ff6b00', c2: '#00b4d8', ink: '#ff6b00' },
  st:       { name: 'Stranger Things',         kind: 'Série', c1: '#e50914', c2: '#14213d', ink: '#e50914' },
  matrix:   { name: 'Matrix',                  kind: 'Film',  c1: '#00c93a', c2: '#0d0208', ink: '#00a32e' },
  titanic:  { name: 'Titanic',                 kind: 'Film',  c1: '#0077b6', c2: '#caf0f8', ink: '#0077b6' },
}

export const TYPES = {
  CHAR:  { label: 'Personnage', short: 'CHAR' },
  LIEU:  { label: 'Lieu culte', short: 'LIEU' },
  OBJET: { label: 'Objet culte', short: 'OBJET' },
}

// first/last : le nom est affiché sur deux lignes (prénom petit, nom en grand)
// role       : métier / localisation / propriétaire
// period     : saisons, films ou année
// credit     : acteur·rice, lieu de tournage…  (creditLabel = libellé au-dessus)
// emoji      : pictogramme utilisé pour l'illustration générée
const RAW = [
  // ── Grey's Anatomy ────────────────────────────────────────────────────────
  { u: 'greys', type: 'CHAR', rarity: 'holo', first: 'Meredith', last: 'Grey',
    quote: 'Pick me. Choose me. Love me.', role: 'Chirurgienne générale · Cheffe de chirurgie',
    period: 'Saison 1 – Saison 19', creditLabel: 'Actrice', credit: 'Ellen Pompeo', emoji: '🩺' },
  { u: 'greys', type: 'CHAR', rarity: 'ultra', first: 'Derek', last: 'Shepherd',
    quote: "Don't McDreamy me!", role: 'Attending Neurosurgeon / Board Director',
    period: 'Saison 1 – Saison 11', creditLabel: 'Acteur', credit: 'Patrick Dempsey', emoji: '🧠' },
  { u: 'greys', type: 'CHAR', rarity: 'ultra', first: 'Arizona', last: 'Robbins', vertical: true,
    quote: "I'm a good man in a storm.", role: "Robbins-Herman Center for Women's Health",
    period: 'Saison 5 – Saison 14', creditLabel: 'Actrice', credit: 'Jessica Capshaw', emoji: '🛼' },
  { u: 'greys', type: 'CHAR', rarity: 'rare', first: 'Cristina', last: 'Yang',
    quote: "He's not the sun. You are.", role: 'Chirurgienne cardiothoracique',
    period: 'Saison 1 – Saison 10', creditLabel: 'Actrice', credit: 'Sandra Oh', emoji: '🫀' },
  { u: 'greys', type: 'LIEU', rarity: 'commune', first: 'Grey Sloan', last: 'Memorial',
    quote: "It's a beautiful day to save lives.", role: 'Seattle, Washington',
    period: 'Saison 1 – …', creditLabel: 'Hôpital', credit: 'Seattle Grace', emoji: '🏥' },
  { u: 'greys', type: 'OBJET', rarity: 'peu-commune', first: 'Le', last: 'Post-it',
    quote: 'Le mariage écrit sur un post-it.', role: 'Meredith & Derek',
    period: 'Saison 5', creditLabel: 'Appartient à', credit: 'Meredith Grey', emoji: '📝' },

  // ── Revenge ───────────────────────────────────────────────────────────────
  { u: 'revenge', type: 'CHAR', rarity: 'ultra', first: 'Emily', last: 'Thorne', caps: true,
    quote: 'Amanda Clarke no longer exists.', role: 'Philanthropist / Socialite',
    period: 'Saison 1 – Saison 4', creditLabel: 'Actrice', credit: 'Emily VanCamp', emoji: '🥀' },
  { u: 'revenge', type: 'CHAR', rarity: 'rare', first: 'Victoria', last: 'Grayson',
    quote: 'La reine des Hamptons.', role: 'Matriarche Grayson',
    period: 'Saison 1 – Saison 4', creditLabel: 'Actrice', credit: 'Madeleine Stowe', emoji: '👑' },
  { u: 'revenge', type: 'OBJET', rarity: 'holo', first: 'La Boîte', last: 'Infinity',
    quote: 'Tout le plan de vengeance est dedans.', role: 'Héritage de David Clarke',
    period: 'Saison 1', creditLabel: 'Appartient à', credit: 'Emily Thorne', emoji: '♾️' },
  { u: 'revenge', type: 'LIEU', rarity: 'commune', first: 'Grayson', last: 'Manor',
    quote: 'Bienvenue dans les Hamptons.', role: 'Hamptons, New York',
    period: 'Saison 1 – Saison 4', creditLabel: 'Propriétaires', credit: 'Famille Grayson', emoji: '🏛️' },

  // ── Harry Potter ──────────────────────────────────────────────────────────
  { u: 'hp', type: 'CHAR', rarity: 'holo', first: 'Harry', last: 'Potter',
    quote: 'I solemnly swear that I am up to no good.', role: 'Attrapeur · Gryffondor',
    period: 'Film 1 – Film 8', creditLabel: 'Acteur', credit: 'Daniel Radcliffe', emoji: '⚡' },
  { u: 'hp', type: 'CHAR', rarity: 'peu-commune', first: 'Hermione', last: 'Granger',
    quote: "It's Levi-O-sa, not Levio-SA.", role: 'Élève · Gryffondor',
    period: 'Film 1 – Film 8', creditLabel: 'Actrice', credit: 'Emma Watson', emoji: '📚' },
  { u: 'hp', type: 'CHAR', rarity: 'ultra', first: 'Severus', last: 'Rogue',
    quote: 'Always.', role: 'Maître des potions · Serpentard',
    period: 'Film 1 – Film 8', creditLabel: 'Acteur', credit: 'Alan Rickman', emoji: '🧪' },
  { u: 'hp', type: 'LIEU', rarity: 'holo', first: 'Château de', last: 'Poudlard',
    quote: 'Poudlard sera toujours là pour vous accueillir.', role: 'Highlands, Écosse',
    period: 'Film 1 – Film 8', creditLabel: 'Tournage', credit: 'Alnwick Castle', emoji: '🏰' },
  { u: 'hp', type: 'LIEU', rarity: 'commune', first: 'Voie', last: '9 ¾',
    quote: 'Fonce droit sur la barrière.', role: 'Gare de King’s Cross, Londres',
    period: 'Film 1 – Film 8', creditLabel: 'Tournage', credit: "King's Cross", emoji: '🚂' },
  { u: 'hp', type: 'OBJET', rarity: 'secrete', first: 'La Baguette', last: 'de Sureau',
    quote: 'La plus puissante des baguettes.', role: 'Relique de la Mort',
    period: 'Film 7 – Film 8', creditLabel: 'Maître actuel', credit: 'Harry Potter', emoji: '🪄' },
  { u: 'hp', type: 'OBJET', rarity: 'commune', first: 'Le', last: 'Choixpeau',
    quote: 'Hmm… difficile. Très difficile.', role: 'Grande Salle de Poudlard',
    period: 'Film 1 – Film 8', creditLabel: 'Appartenait à', credit: 'Godric Gryffondor', emoji: '🎩' },

  // ── Star Wars ─────────────────────────────────────────────────────────────
  { u: 'sw', type: 'CHAR', rarity: 'secrete', first: 'Dark', last: 'Vador',
    quote: 'No, I am your father.', role: 'Seigneur Sith · Empire Galactique',
    period: 'Épisode III – Épisode VI', creditLabel: 'Voix', credit: 'James Earl Jones', emoji: '🦹' },
  { u: 'sw', type: 'CHAR', rarity: 'rare', first: 'Luke', last: 'Skywalker',
    quote: "I'm a Jedi, like my father before me.", role: 'Chevalier Jedi · Rébellion',
    period: 'Épisode IV – Épisode IX', creditLabel: 'Acteur', credit: 'Mark Hamill', emoji: '🌅' },
  { u: 'sw', type: 'CHAR', rarity: 'holo', first: 'Maître', last: 'Yoda',
    quote: 'Do. Or do not. There is no try.', role: 'Grand Maître Jedi · Dagobah',
    period: 'Épisode I – Épisode VIII', creditLabel: 'Marionnettiste', credit: 'Frank Oz', emoji: '🟢' },
  { u: 'sw', type: 'OBJET', rarity: 'ultra', first: 'Faucon', last: 'Millenium',
    quote: "She may not look like much, but she's got it where it counts.", role: 'Cargo YT-1300',
    period: 'Épisode IV – Épisode IX', creditLabel: 'Capitaine', credit: 'Han Solo', emoji: '🚀' },
  { u: 'sw', type: 'LIEU', rarity: 'commune', first: 'Planète', last: 'Tatooine',
    quote: 'Deux soleils, et du sable partout.', role: 'Bordure Extérieure',
    period: 'Épisode I – Épisode VI', creditLabel: 'Tournage', credit: 'Tunisie', emoji: '🏜️' },
  { u: 'sw', type: 'OBJET', rarity: 'peu-commune', first: 'Le Sabre', last: 'Laser',
    quote: 'An elegant weapon for a more civilized age.', role: 'Arme des Jedi',
    period: 'Toute la saga', creditLabel: 'Porté par', credit: 'Les Jedi', emoji: '🗡️' },

  // ── Friends ───────────────────────────────────────────────────────────────
  { u: 'friends', type: 'CHAR', rarity: 'rare', first: 'Joey', last: 'Tribbiani',
    quote: "How you doin'?", role: 'Acteur · Dr Drake Ramoray',
    period: 'Saison 1 – Saison 10', creditLabel: 'Acteur', credit: 'Matt LeBlanc', emoji: '🍕' },
  { u: 'friends', type: 'CHAR', rarity: 'peu-commune', first: 'Ross', last: 'Geller',
    quote: 'We were on a break!', role: 'Paléontologue',
    period: 'Saison 1 – Saison 10', creditLabel: 'Acteur', credit: 'David Schwimmer', emoji: '🦖' },
  { u: 'friends', type: 'CHAR', rarity: 'commune', first: 'Phoebe', last: 'Buffay',
    quote: 'Smelly cat, smelly cat…', role: 'Masseuse · Chanteuse',
    period: 'Saison 1 – Saison 10', creditLabel: 'Actrice', credit: 'Lisa Kudrow', emoji: '🎸' },
  { u: 'friends', type: 'LIEU', rarity: 'holo', first: 'Le Café', last: 'Central Perk',
    quote: 'Le canapé orange est pris.', role: 'Greenwich Village, New York',
    period: 'Saison 1 – Saison 10', creditLabel: 'Serveuse', credit: 'Rachel Green', emoji: '☕' },
  { u: 'friends', type: 'OBJET', rarity: 'commune', first: 'Le Cadre', last: 'Jaune',
    quote: 'Autour du judas de chez Monica.', role: 'Appartement 20',
    period: 'Saison 1 – Saison 10', creditLabel: 'Appartient à', credit: 'Monica Geller', emoji: '🖼️' },

  // ── Breaking Bad ──────────────────────────────────────────────────────────
  { u: 'bb', type: 'CHAR', rarity: 'secrete', first: 'Walter', last: 'White', caps: true,
    quote: 'I am the one who knocks.', role: 'Professeur de chimie · Heisenberg',
    period: 'Saison 1 – Saison 5', creditLabel: 'Acteur', credit: 'Bryan Cranston', emoji: '⚗️' },
  { u: 'bb', type: 'CHAR', rarity: 'holo', first: 'Jesse', last: 'Pinkman',
    quote: 'Yeah, science!', role: 'Partenaire · Cap’n Cook',
    period: 'Saison 1 – Saison 5', creditLabel: 'Acteur', credit: 'Aaron Paul', emoji: '🧢' },
  { u: 'bb', type: 'LIEU', rarity: 'peu-commune', first: 'Los Pollos', last: 'Hermanos',
    quote: 'The chicken brothers.', role: 'Albuquerque, Nouveau-Mexique',
    period: 'Saison 2 – Saison 4', creditLabel: 'Gérant', credit: 'Gustavo Fring', emoji: '🍗' },
  { u: 'bb', type: 'OBJET', rarity: 'rare', first: 'Le', last: 'Camping-car',
    quote: 'Le premier labo mobile.', role: 'Désert du Nouveau-Mexique',
    period: 'Saison 1 – Saison 3', creditLabel: 'Appartient à', credit: 'Jesse Pinkman', emoji: '🚐' },

  // ── Game of Thrones ───────────────────────────────────────────────────────
  { u: 'got', type: 'CHAR', rarity: 'ultra', first: 'Daenerys', last: 'Targaryen',
    quote: 'Dracarys.', role: 'Mère des Dragons · Briseuse de chaînes',
    period: 'Saison 1 – Saison 8', creditLabel: 'Actrice', credit: 'Emilia Clarke', emoji: '🐉' },
  { u: 'got', type: 'CHAR', rarity: 'rare', first: 'Jon', last: 'Snow',
    quote: 'You know nothing, Jon Snow.', role: 'Lord Commandant · Garde de Nuit',
    period: 'Saison 1 – Saison 8', creditLabel: 'Acteur', credit: 'Kit Harington', emoji: '🐺' },
  { u: 'got', type: 'OBJET', rarity: 'holo', first: 'Le Trône', last: 'de Fer',
    quote: 'When you play the game of thrones, you win or you die.', role: 'Port-Réal',
    period: 'Saison 1 – Saison 8', creditLabel: 'Forgé par', credit: 'Aegon le Conquérant', emoji: '⚔️' },
  { u: 'got', type: 'LIEU', rarity: 'commune', first: 'Château de', last: 'Winterfell',
    quote: 'Winter is coming.', role: 'Le Nord',
    period: 'Saison 1 – Saison 8', creditLabel: 'Tournage', credit: 'Irlande du Nord', emoji: '❄️' },

  // ── Le Seigneur des Anneaux ───────────────────────────────────────────────
  { u: 'lotr', type: 'CHAR', rarity: 'holo', first: 'Gandalf', last: 'le Gris',
    quote: 'You shall not pass!', role: 'Magicien · Istar',
    period: 'Trilogie 2001 – 2003', creditLabel: 'Acteur', credit: 'Ian McKellen', emoji: '🧙' },
  { u: 'lotr', type: 'CHAR', rarity: 'rare', first: 'Sméagol', last: 'Gollum',
    quote: 'My precious.', role: 'Porteur de l’Anneau (500 ans)',
    period: 'Trilogie 2001 – 2003', creditLabel: 'Performance', credit: 'Andy Serkis', emoji: '🐟' },
  { u: 'lotr', type: 'OBJET', rarity: 'secrete', first: "L'Anneau", last: 'Unique',
    quote: 'One ring to rule them all.', role: 'Forgé en Montagne du Destin',
    period: 'Trilogie 2001 – 2003', creditLabel: 'Forgé par', credit: 'Sauron', emoji: '💍' },
  { u: 'lotr', type: 'LIEU', rarity: 'peu-commune', first: 'La', last: 'Comté',
    quote: 'Rien ne presse chez les Hobbits.', role: 'Hobbitebourg · Terre du Milieu',
    period: 'Trilogie 2001 – 2003', creditLabel: 'Tournage', credit: 'Matamata, NZ', emoji: '🌳' },

  // ── Retour vers le futur ──────────────────────────────────────────────────
  { u: 'bttf', type: 'CHAR', rarity: 'rare', first: 'Doc', last: 'Brown',
    quote: 'Great Scott!', role: 'Scientifique · Inventeur',
    period: 'Film 1 – Film 3', creditLabel: 'Acteur', credit: 'Christopher Lloyd', emoji: '🧑‍🔬' },
  { u: 'bttf', type: 'CHAR', rarity: 'peu-commune', first: 'Marty', last: 'McFly',
    quote: 'This is heavy.', role: 'Lycéen · Voyageur temporel',
    period: 'Film 1 – Film 3', creditLabel: 'Acteur', credit: 'Michael J. Fox', emoji: '🛹' },
  { u: 'bttf', type: 'OBJET', rarity: 'ultra', first: 'La', last: 'DeLorean', caps: true,
    quote: "Where we're going, we don't need roads.", role: 'DMC-12 · 88 miles/h',
    period: 'Film 1 – Film 3', creditLabel: 'Inventeur', credit: 'Emmett Brown', emoji: '🏎️' },
  { u: 'bttf', type: 'LIEU', rarity: 'commune', first: 'Hill Valley', last: 'Courthouse',
    quote: 'Sauvez la tour de l’horloge !', role: 'Hill Valley, Californie',
    period: '1955 · 1985 · 2015', creditLabel: 'Tournage', credit: 'Universal Studios', emoji: '🕰️' },

  // ── Stranger Things ───────────────────────────────────────────────────────
  { u: 'st', type: 'CHAR', rarity: 'holo', first: 'Jane Hopper', last: 'Eleven', caps: true,
    quote: "Friends don't lie.", role: 'Hawkins, Indiana',
    period: 'Saison 1 – Saison 5', creditLabel: 'Actrice', credit: 'Millie Bobby Brown', emoji: '🧇' },
  { u: 'st', type: 'LIEU', rarity: 'rare', first: 'Le Monde', last: "à l'Envers",
    quote: 'Tout est pareil. Mais en pire.', role: 'Dimension parallèle',
    period: 'Saison 1 – Saison 5', creditLabel: 'Découvert par', credit: 'Will Byers', emoji: '🕸️' },
  { u: 'st', type: 'OBJET', rarity: 'commune', first: 'Les', last: 'Guirlandes',
    quote: 'R-U-N.', role: 'Maison des Byers',
    period: 'Saison 1', creditLabel: 'Installées par', credit: 'Joyce Byers', emoji: '💡' },

  // ── Matrix ────────────────────────────────────────────────────────────────
  { u: 'matrix', type: 'CHAR', rarity: 'rare', first: 'Thomas Anderson', last: 'Neo', caps: true,
    quote: 'I know kung fu.', role: "L'Élu · Nabuchodonosor",
    period: 'Film 1 – Film 4', creditLabel: 'Acteur', credit: 'Keanu Reeves', emoji: '🕶️' },
  { u: 'matrix', type: 'OBJET', rarity: 'holo', first: 'La Pilule', last: 'Rouge',
    quote: 'You take the red pill… you stay in Wonderland.', role: 'Offerte par Morpheus',
    period: 'Film 1', creditLabel: 'Choisie par', credit: 'Neo', emoji: '💊' },
  { u: 'matrix', type: 'CHAR', rarity: 'commune', first: 'Agent', last: 'Smith',
    quote: 'Mister Anderson…', role: 'Programme · La Matrice',
    period: 'Film 1 – Film 3', creditLabel: 'Acteur', credit: 'Hugo Weaving', emoji: '🕴️' },

  // ── Titanic ───────────────────────────────────────────────────────────────
  { u: 'titanic', type: 'CHAR', rarity: 'peu-commune', first: 'Jack', last: 'Dawson',
    quote: "I'm the king of the world!", role: 'Artiste · 3e classe',
    period: '1997', creditLabel: 'Acteur', credit: 'Leonardo DiCaprio', emoji: '🎨' },
  { u: 'titanic', type: 'CHAR', rarity: 'commune', first: 'Rose', last: 'DeWitt Bukater',
    quote: "I'll never let go, Jack.", role: '1re classe',
    period: '1997', creditLabel: 'Actrice', credit: 'Kate Winslet', emoji: '🌹' },
  { u: 'titanic', type: 'OBJET', rarity: 'ultra', first: 'Le Cœur', last: "de l'Océan",
    quote: 'Un diamant bleu au fond de l’Atlantique.', role: 'Collier de Rose',
    period: '1912', creditLabel: 'Offert par', credit: 'Cal Hockley', emoji: '💎' },
  { u: 'titanic', type: 'LIEU', rarity: 'commune', first: 'La Proue du', last: 'Titanic',
    quote: 'Je vole, Jack !', role: 'Atlantique Nord',
    period: '1997', creditLabel: 'Navire', credit: 'RMS Titanic', emoji: '🚢' },
]

// Tri : par univers puis par rareté pour que la numérotation ait du sens,
// les secrètes étant numérotées au-delà du total (ex. 58/52) comme dans le TCG.
const RARITY_ORDER = ['commune', 'peu-commune', 'rare', 'holo', 'ultra', 'secrete']

const main = RAW.filter(c => c.rarity !== 'secrete')
const secret = RAW.filter(c => c.rarity === 'secrete')
main.sort((a, b) =>
  Object.keys(UNIVERSES).indexOf(a.u) - Object.keys(UNIVERSES).indexOf(b.u) ||
  RARITY_ORDER.indexOf(a.rarity) - RARITY_ORDER.indexOf(b.rarity))

export const SET_SIZE = main.length

const slug = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

export const CARDS = [...main, ...secret].map((c, i) => ({
  ...c,
  id: `${SET.code}-${String(i + 1).padStart(3, '0')}-${slug(`${c.first} ${c.last}`)}`,
  number: i + 1,
  universe: UNIVERSES[c.u],
  typeInfo: TYPES[c.type],
}))

export const CARDS_BY_ID = Object.fromEntries(CARDS.map(c => [c.id, c]))
