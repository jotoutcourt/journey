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
  france: ['Touriste', 'Randonneur', 'Voyageur', 'Guide local', 'Explorateur', 'Géographe', 'Cartographe', 'Tour de France vivant'],
  drapeaux: ['Supporter', 'Porte-drapeau', 'Collectionneur', 'Vexillophile', 'Diplomate', 'Ambassadeur', 'Vexillologue', 'Maître des drapeaux'],
  corps: ['Patient', 'Secouriste', 'Étudiant en médecine', 'Infirmier', 'Interne', 'Médecin', 'Professeur de médecine', 'Prix Nobel de médecine'],
  litterature: ['Lecteur', 'Rat de bibliothèque', 'Critique', 'Libraire', 'Écrivain', 'Prix Goncourt', 'Académicien', 'Immortel'],
  art: ['Visiteur', 'Amateur d\'art', 'Apprenti peintre', 'Artiste', 'Galeriste', 'Critique d\'art', 'Conservateur', 'Maître de la Renaissance'],
  inventions: ['Bricoleur', 'Curieux', 'Apprenti inventeur', 'Ingénieur', 'Chercheur', 'Breveté', 'Génie', 'Léonard de Vinci'],
  sports: ['Supporter', 'Sportif du dimanche', 'Licencié', 'Athlète', 'Champion régional', 'Champion national', 'Médaillé olympique', 'Légende olympique'],
  monuments: ['Touriste', 'Routard', 'Guide', 'Archéologue', 'Architecte', 'Explorateur', 'Bâtisseur', 'Gardien des merveilles'],
  'chanson-francaise': ['Auditeur', 'Chanteur de salle de bain', 'Pilier de karaoké', 'Choriste', 'Chanteur de bal', 'Tête d\'affiche', 'Victoire de la musique', 'Monument de la chanson'],
  'annees-80-90': ['Né trop tard', 'Collectionneur de Pogs', 'Fan du Club Dorothée', 'Roi du Walkman', 'Maître du Tamagotchi', 'Champion du Minitel', 'Enfant du Top 50', 'Légende des années 80'],
  'tele-realite': ['Téléspectateur', 'Candidat au casting', 'Nominé', 'Rescapé du conseil', 'Finaliste', 'Gagnant de la cagnotte', 'Star de la télé-réalité', 'Légende du Loft'],
  'marvel': ['Civil', 'Agent du S.H.I.E.L.D.', 'Recrue', 'Gardien de la Galaxie', 'Avenger', 'Sorcier suprême', 'Porteur du Gant', 'Je suis Iron Man'],
  'biathlon': ['Spectateur', 'Fondeur du dimanche', 'Tireur couché', 'Tireur debout', 'Sans-faute', 'Dossard rouge', 'Dossard jaune', 'Gros globe de cristal'],
  'one-piece': ['Mousse', 'Pirate d\'East Blue', 'Chasseur de primes', 'Supernova', 'Grand Corsaire', 'Commandant', 'Empereur', 'Roi des pirates'],
  'nintendo': ['Joueur du dimanche', 'Goomba', 'Toad', 'Champion de Mario Kart', 'Héros d\'Hyrule', 'Maître Pokémon', 'Smasheur', 'Shigeru Miyamoto'],
  'taylor-swift': ['Curieux', 'Fan de Fearless', 'Fan de Red', 'Swiftie', 'Chasseur d\'easter eggs', 'Porteur de bracelets', 'Mastermind', 'Taylor\'s Version'],
  'one-direction': ['Curieux', 'Auditionné', 'Directioner', 'Fan de la première heure', 'Up All Night', 'Midnight Memories', 'Membre honoraire', 'Sixième membre'],
  'sex-and-the-city': ['Célibataire', 'Lectrice du New York Star', 'Fan de Cosmo', 'Amie de Stanford', 'Accro aux Manolo', 'Reine du brunch', 'Icône de Manhattan', 'Carrie Bradshaw'],
  'the-100': ['Délinquant', 'Débarqué', 'Terrien', 'Guerrier de Trikru', 'Natblida', 'Wanheda', 'Heda', 'Survivant de Praimfaya'],
  'hunger-games': ['Habitant du 12', 'Tribut', 'Survivant', 'Carrière', 'Mentor', 'Vainqueur', 'Geai moqueur', 'Fille du feu'],
  'pop-girlies': ['Fan', 'Stan', 'Choriste', 'Danseuse', 'Popstar', 'Diva', 'Icône', 'Queen'],
  'petite-maison': ['Voyageur', 'Pionnier', 'Écolier', 'Fermier', 'Voisin', 'Habitant de Walnut Grove', 'Ami des Ingalls', 'Demi-portion'],
  'ici-tout-commence': ['Plongeur', 'Commis', 'Élève de première année', 'Chef de partie', 'Second', 'Chef de cuisine', 'Professeur à l\'Institut', 'Chef étoilé'],
  'secret-story': ['Téléspectateur', 'Nominé', 'Habitant', 'Buzzeur', 'Complice de La Voix', 'Finaliste', 'Gagnant', 'Gardien des secrets'],
  voitures: ['Piéton', 'Apprenti conducteur', 'Jeune permis', 'Copilote', 'Mécano', 'Pilote', 'Champion de rallye', 'Légende des circuits'],
  'quel-animal': ['Promeneur', 'Curieux', 'Observateur', 'Photographe', 'Naturaliste', 'Explorateur', 'Zoologiste', 'Maître des bêtes'],
  orthographe: ['Faute de frappe', 'Écolier', 'Bon élève', 'Relecteur', 'Plume habile', 'Correcteur', 'Grammairien', 'Académicien'],
  anglais: ['Beginner', 'Débutant', 'Élève appliqué', 'Bilingue en herbe', 'Voyageur', 'Interprète', 'Traducteur', 'Native speaker'],
  'dessins-animes': ['Spectateur du mercredi', 'Fan de génériques', 'Collectionneur de DVD', 'Dessinateur', 'Animateur', 'Réalisateur', 'Créateur de studio', 'Légende de l\'animation'],
  mythologie: ['Simple mortel', 'Héros', 'Demi-dieu', 'Oracle', 'Titan', 'Dieu mineur', 'Olympien', 'Roi de l\'Olympe'],
  'c-series-cultes': ['Téléspectateur', 'Binge-watcheur', 'Sériephile', 'Critique', 'Scénariste', 'Producteur', 'Showrunner', 'Légende du petit écran'],
  'c-desperate': ['Nouvelle arrivante', 'Voisine', 'Commère du quartier', 'Reine du barbecue', 'Joueuse de poker', 'Pilier de Wisteria Lane', 'Gardienne des secrets', 'Reine de Wisteria Lane'],
  'c-greys': ['Externe', 'Interne', 'Résident', 'Résident en chef', 'Titulaire', 'Chef de service', 'Chef de la chirurgie', 'Légende du Grey Sloan'],
  'c-friends': ['Client du Central Perk', 'Voisin de palier', 'Colocataire', 'Habitué du canapé', 'Ami de Gunther', 'Septième ami', 'Pilier de la bande', 'Légende de Central Perk'],
  'c-potter': ['Moldu', 'Élève de première année', 'Préfet', 'Attrapeur', 'Préfet-en-chef', 'Auror', 'Professeur', 'Directeur de Poudlard'],
  'c-gossip': ['Lecteur du blog', 'Élève de Constance', 'Habitué des marches du Met', 'Invité du gala', 'Membre de la cour', 'Héritier de l\'Upper East Side', 'Reine B', 'Gossip Girl'],
  'c-pop2000': ['Auditeur de radio', 'Fan de clips', 'Chanteur sous la douche', 'Candidat de télé-crochet', 'Choriste', 'Star montante', 'Tête d\'affiche', 'Icône des années 2000'],
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
