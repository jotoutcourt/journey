// Titres de niveau propres à chaque thème : 8 échelons, du premier niveau au sommet.
// Le titre change aux niveaux 1, 2, 3, 4, 6, 8, 11 et 15 (le dernier se mérite).
export const TITLE_LEVELS = [1, 2, 3, 4, 6, 8, 11, 15]

const LADDERS = {
  'c-calzona': ['Étudiant en médecine', 'Interne', 'Résident', 'Chef des résidents', 'Chirurgien titulaire', 'Chef de service', 'Chef adjoint de la chirurgie', 'Chef de la chirurgie'],
  'culture-g': ['Curieux', 'Touche-à-tout', 'Rat de bibliothèque', 'Esprit vif', 'Érudit', 'Puits de science', 'Sage', 'Encyclopédie vivante'],
  capitales: ['Touriste', 'Routard', 'Voyageur', 'Globe-trotteur', 'Explorateur', 'Cartographe', 'Ambassadeur', 'Diplomate en chef'],
  cinema: ['Spectateur', 'Cinéphile', 'Figurant', 'Second rôle', 'Tête d\'affiche', 'Scénariste', 'Réalisateur', 'Légende du 7e art'],
  sciences: ['Élève curieux', 'Apprenti chimiste', 'Laborantin', 'Doctorant', 'Chercheur', 'Directeur de recherche', 'Académicien', 'Prix Nobel'],
  histoire: ['Paysan', 'Écuyer', 'Chevalier', 'Baron', 'Comte', 'Duc', 'Prince', 'Souverain'],
  musique: ['Auditeur', 'Choriste', 'Musicien de rue', 'Musicien d\'orchestre', 'Soliste', 'Compositeur', 'Chef d\'orchestre', 'Virtuose'],
  foot: ['Supporter', 'Joueur de district', 'Remplaçant', 'Titulaire', 'Capitaine', 'International', 'Ballon d\'or', 'Légende du ballon rond'],
  'jeux-video': ['Joueur du dimanche', 'Joueur assidu', 'Chasseur de trophées', 'Speedrunner', 'Joueur pro', 'Champion d\'e-sport', 'Boss final', 'Légende du jeu vidéo'],
  animaux: ['Promeneur', 'Observateur', 'Naturaliste', 'Garde forestier', 'Soigneur', 'Vétérinaire', 'Zoologiste', 'Roi de la savane'],
  gastronomie: ['Plongeur', 'Commis', 'Cuisinier', 'Chef de partie', 'Sous-chef', 'Chef', 'Chef étoilé', 'Chef trois étoiles'],
  expressions: ['Bavard', 'Beau parleur', 'Conteur', 'Orateur', 'Lettré', 'Linguiste', 'Académicien', 'Immortel'],
  mythologie: ['Simple mortel', 'Héros', 'Demi-dieu', 'Oracle', 'Titan', 'Dieu mineur', 'Olympien', 'Roi de l\'Olympe'],
  pokemon: ['Dresseur débutant', 'Dresseur', 'Éleveur', 'Collectionneur', 'Expert du Pokédex', 'Professeur', 'Champion', 'Maître des dresseurs'],
  'c-series-cultes': ['Téléspectateur', 'Binge-watcheur', 'Sériephile', 'Critique', 'Scénariste', 'Producteur', 'Showrunner', 'Légende du petit écran'],
  'c-desperate': ['Nouvelle arrivante', 'Voisine', 'Commère du quartier', 'Reine du barbecue', 'Joueuse de poker', 'Pilier de Wisteria Lane', 'Gardienne des secrets', 'Reine de Wisteria Lane'],
  'c-eras': ['Fan en tribune', 'Faiseur de bracelets', 'Swiftie', 'Danseur de la fosse', 'Choriste', 'Danseur de la troupe', 'Musicien du groupe', 'Légende des Eras'],
  'c-villa': ['Cœur brisé', 'Célibataire', 'Prétendant', 'Séducteur', 'Expert en séduction', 'Love coach stagiaire', 'Love coach', 'Légende de la Villa'],
  'c-disney': ['Visiteur du parc', 'Fan de dessins animés', 'Collectionneur', 'Animateur stagiaire', 'Animateur', 'Réalisateur', 'Imagineer', 'Légende du royaume enchanté'],
  'c-espace': ['Observateur du ciel', 'Astronome amateur', 'Cadet de l\'espace', 'Astronaute', 'Commandant de bord', 'Directeur de vol', 'Explorateur stellaire', 'Seigneur des galaxies'],
}

// Pour les thèmes créés par les joueurs : une échelle selon la catégorie, sinon une échelle générique.
const BY_CATEGORY = {
  'Cinéma & TV': LADDERS['c-series-cultes'],
  'Géographie': LADDERS.capitales,
  'Sciences': LADDERS.sciences,
  'Histoire': LADDERS.histoire,
  'Musique': LADDERS.musique,
  'Sport': ['Supporter', 'Amateur', 'Remplaçant', 'Titulaire', 'Capitaine', 'International', 'Champion', 'Légende du sport'],
  'Jeux vidéo': LADDERS['jeux-video'],
  'Nature': LADDERS.animaux,
  'Cuisine': LADDERS.gastronomie,
  'Langue': LADDERS.expressions,
}
const GENERIC = ['Curieux', 'Amateur', 'Connaisseur', 'Passionné', 'Spécialiste', 'Expert', 'Maître', 'Légende']

export const ladderFor = (topic) =>
  (topic && (topic.ladder || LADDERS[topic.id] || BY_CATEGORY[topic.category])) || GENERIC

export function topicTitle(topic, level) {
  const ladder = ladderFor(topic)
  let i = 0
  TITLE_LEVELS.forEach((min, k) => { if (level >= min) i = k })
  return ladder[i]
}

// Le prochain titre à décrocher, et à quel niveau.
export function nextTitle(topic, level) {
  const k = TITLE_LEVELS.findIndex(min => min > level)
  return k === -1 ? null : { level: TITLE_LEVELS[k], title: ladderFor(topic)[k] }
}
