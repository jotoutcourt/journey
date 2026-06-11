import { useState, useRef, useEffect, useCallback } from 'react'

const C = {
  city:    '#f5c842',
  route:   '#78c850',
  water:   '#6890f0',
  dungeon: '#a890f0',
}

const TYPE_LABEL = {
  city:    'Ville',
  route:   'Route',
  water:   'Chenal',
  dungeon: 'Lieu',
}

function rateColor(rate) {
  const n = parseInt(rate)
  if (n >= 20) return '#63bb5b'
  if (n >= 10) return '#e8a838'
  if (n >= 4)  return '#f07030'
  return '#e63946'
}

const MAP_RATIO = 909 / 1290  // height/width de l'image

const ZONES = [
  // ─ VILLES ─
  {
    id: 'bourg-palette', name: 'Bourg-Palette', type: 'city',
    pts: '21.4,62.0 26.4,62.1 26.4,67.1 21.5,67.0',
    desc: "Paisible village natal du joueur, niché au sud de Kanto. Tout commence ici — et on y revient changé après avoir conquis la Ligue.",
    tips: ["Laboratoire du Prof. Chen — choisis ton starter (Salamèche, Bulbizarre ou Carapuce)", "Ta maman soigne gratuitement tes Pokémon", "Maison de Rivale juste en face"],
  },
  {
    id: 'jadielle', name: 'Jadielle', type: 'city',
    pts: '21.3,42.1 28.1,42.3 28.0,49.7 21.2,49.4',
    desc: "Première grande ville de Kanto. L'arène reste mystérieusement fermée au départ — son chef Giovanni n'y apparaît qu'à la toute fin de l'aventure.",
    tips: ["Arène 8 — Giovanni (Sol) : Rhyhorn, Dugtrio, Nidoqueen, Nidoking, Rhydon", "École Pokémon à l'est (tutoriels)", "Route 22 à l'ouest : premier combat contre Rivale"],
  },
  {
    id: 'argenta', name: 'Argenta', type: 'city',
    pts: '21.8,16.3 28.6,16.6 28.6,24.3 21.9,24.2',
    desc: "Ville aux toits d'étain, dominée par son musée de fossiles. La première arène Pokémon de Kanto t'y attend.",
    tips: ["Arène 1 — Pierre (Roche) : Racaillou Lv.12, Gravalanch Lv.14", "Musée de Sciences Naturelles (fossiles préhistoriques)", "Mont Sélénite accessible à l'est via la Route 3"],
  },
  {
    id: 'azuria', name: 'Azuria', type: 'city',
    pts: '61.3,14.4 68.7,14.5 68.5,21.6 61.3,21.6',
    desc: "Cité lacustre aux cascades scintillantes. Après la Forêt de Jade et le Mont Sélénite, la jeune Ondine t'attend dans son arène aquatique.",
    tips: ["Arène 2 — Ondine (Eau) : Staross Lv.18, Staross Lv.21", "Maison cambriolée par la Team Rocket au nord — piège à éviter", "Pont du Zénith au nord (5 dresseurs + pépite)", "Billet Bateau pour la S.S. Anne via Bill (Route 25)"],
  },
  {
    id: 'carmin-sur-mer', name: 'Carmin-sur-Mer', type: 'city',
    pts: '60.8,51.7 68.5,52.1 68.5,60.2 60.6,59.6',
    desc: "Port animé où accoste le grand paquebot S.S. Anne. L'arène électrise tous ceux qui s'y aventurent.",
    tips: ["Arène 3 — Major Bob (Électrique) : Voltorbe Lv.21, Pikachu Lv.18, Électhor Lv.24", "S.S. Anne — CS01 Coupe auprès du Capitaine (mal de mer)", "La S.S. Anne repart définitivement après avoir obtenu CS01"],
  },
  {
    id: 'lavanville', name: 'Lavanville', type: 'city',
    pts: '85.5,33.3 92.3,33.4 92.2,39.1 85.5,38.8',
    desc: "Ville silencieuse et mélancolique où règne une atmosphère pesante. La Tour Pokémon s'élève au-dessus des toits, hantée par des esprits tourmentés.",
    tips: ["Tour Pokémon — 7 étages, Lunettoscope requis (obtenu dans le Repaire Rocket)", "Combat contre Rivale au 5e étage (niveaux ~30-35)", "M. Fuji au sommet — libère-le pour la Flûte de Feu", "La Flûte de Feu réveille les Ronflex sur les Routes 12 et 16"],
  },
  {
    id: 'celadopole', name: 'Céladopole', type: 'city',
    pts: '42.0,29.6 53.5,29.7 53.5,40.9 42.3,40.3',
    desc: "La plus grande ville de Kanto, fourmillant de vie. Grand magasin, casino, jardin secret... et le QG de la Team Rocket en sous-sol.",
    tips: ["Arène 4 — Érika (Plante) : Noeunoeuf, Triopikeur, Noadkoko", "Grand Magasin 6 étages — Ticket Vélo au 5e étage, achats variés", "Jeu Corner — tokens contre Morphéo, Électhor, Smogogo...", "Repaire Rocket souterrain — récupère le Lunettoscope pour la Tour Pokémon", "Ronflex endormi sur la Route 16 à l'ouest (Flûte de Feu requise)"],
  },
  {
    id: 'safrania', name: 'Safrania', type: 'city',
    pts: '60.0,30.2 70.1,30.3 70.1,40.6 60.0,40.4',
    desc: "Cœur économique de Kanto, siège de Sylphe SARL. La Team Rocket a pris le contrôle de la ville — libère-la pour accéder à l'arène.",
    tips: ["Arène 6 — Morgane (Psy) : Abra, Kadabra, Mr. Mime, Alakazam", "Sylphe SARL — bats Giovanni au 11e étage pour libérer le Président", "Le Président offre la Master Ball (unique dans tout le jeu !)", "CS08 Esquive (Teleport) via immeuble Sylphe après libération"],
  },
  {
    id: 'parmanie', name: 'Parmanie', type: 'city',
    pts: '45.8,68.5 54.6,68.7 54.7,80.8 45.1,80.8',
    desc: "Ville secrète au bout de la Piste Cyclable. Son arène empoisonnée et son célèbre Parc Safari en font une étape incontournable.",
    tips: ["Arène 5 — Koga (Poison) : Koffing, Muk, Koffing, Weezing", "Parc Safari — CS03 Surf et CS04 Force à récupérer obligatoirement", "Dentier du Warden à rendre (trouvé dans le Parc Safari) contre CS04 Force", "CS15 Tranche dans une maison à l'est de la ville"],
  },
  {
    id: 'cramois-ile', name: "Cramois'Île", type: 'city',
    pts: '21.3,88.7 26.5,88.8 26.5,94.9 21.3,94.8',
    desc: "Île volcanique au large de Kanto, abritant un laboratoire légendaire et une arène dont les portes sont verrouillées par le Manoir.",
    tips: ["Arène 7 — Pyrobaba (Feu) : clé secrète à trouver dans le Manoir Pokémon", "Laboratoire — ressuscite fossiles : Amonita/Amonistar ou Kabuto/Kabutops", "Échange ton Ronflex contre un Morphéo dans le laboratoire (lettre du Parc Safari)"],
  },
  {
    id: 'plateau-indigo', name: 'Plateau Indigo', type: 'city',
    pts: '9.9,2.4 15.1,2.4 15.0,16.3 10.6,16.0',
    desc: "Le sommet de l'aventure Kanto. Accessible uniquement avec les 8 Badges, il abrite les 4 Fantastiques et le Champion.",
    tips: ["Les 4 Fantastiques : Lorelei (Glace), Bruno (Combat), Agatha (Spectre), Lance (Dragon)", "Champion : Rivale — équipe variée selon ton starter de départ", "Pokémon Center juste avant la salle de la Ligue", "Niveaux conseillés : 50-55 minimum"],
  },

  // ─ ROUTES ─
  {
    id: 'route-1', name: 'Route 1', type: 'route',
    pts: '22.3,51.4 26.2,51.5 26.2,60.7 22.4,60.6',
    desc: "Premier pas hors de Bourg-Palette. Route rectiligne bordée de hautes herbes reliant les deux premières villes de Kanto.",
    tips: ["Aucun dresseur — idéale pour les premiers combats sans risque", "Pokémon sauvages : Roucool, Rattata (niveaux 2-4)"],
  },
  {
    id: 'route-2', name: 'Route 2', type: 'route',
    pts: '22.3,35.8 24.9,35.8 25.5,33.5 25.6,29.7 24.5,28.6 22.2,28.8 22.2,26.9 24.5,26.9 24.6,25.2 25.5,25.1 25.5,28.3 27.3,28.5 27.2,38.8 22.2,39.3',
    desc: "Longue route qui encadre la Forêt de Jade et relie Jadielle à Argenta. La traversée complète nécessite CS06 Coupe.",
    tips: ["Forêt de Jade traversée obligatoire (CS06 requis au retour)", "Pokémon sauvages : Chenipan, Aspicot, Roucool, Taupiqueur", "Maison côté Jadielle — accès direct à la forêt si CS06 possédé"],
  },
  {
    id: 'route-3', name: 'Route 3', type: 'route',
    pts: '28.7,24.5 28.9,20.9 31.7,20.9 31.8,19.3 39.9,19.5 40.2,15.9 45.3,16.1 45.0,22.2 41.5,23.4',
    desc: "Route animée à l'est d'Argenta, menant vers le Mont Sélénite. Premiers combats de dresseurs sérieux de la partie.",
    tips: ["Mène à l'entrée ouest du Mont Sélénite", "Pokémon sauvages : Roucool, Nidoran♂, Nidoran♀, Rattata, Grodoudou", "Nombreux dresseurs Juniors — bon endroit pour monter en niveau"],
  },
  {
    id: 'route-4', name: 'Route 4', type: 'route',
    pts: '47.2,16.3 49.3,16.3 49.3,15.1 58.4,14.9 60.4,16.3 60.8,19.3 47.2,19.6',
    desc: "Route qui longe le sommet du Mont Sélénite et rejoint Azuria par l'est. Un vendeur peu scrupuleux y propose un Magicarpe pour 500₽.",
    tips: ["Vendeur de Magicarpe pour 500₽ — vaut le coup, il évoluera en Leviator !", "Pokémon sauvages : Roucool, Rattata, Ekans (Rouge Feu) / Sabelette (Vert Feuille)", "Sortie est du Mont Sélénite (CS08 Escalade requis pour y accéder)"],
  },
  {
    id: 'route-5', name: 'Route 5', type: 'route',
    pts: '63.0,22.5 66.6,22.1 66.2,28.6 62.8,28.5',
    desc: "Courte route au sud d'Azuria, coupée par un poste de garde. Le Souterrain N-S permet de contourner la frontière vers Carmin-sur-Mer.",
    tips: ["Accès au Souterrain N-S (sous le poste de garde)", "Pokémon sauvages : Roucool, Rattata, Miaous, Doduo"],
  },
  {
    id: 'route-6', name: 'Route 6', type: 'route',
    pts: '62.7,42.1 66.8,42.3 66.6,48.1 62.7,48.0',
    desc: "Route au nord de Carmin-sur-Mer, sortie sud du Souterrain N-S. Symétrique de la Route 5.",
    tips: ["Sortie du Souterrain N-S vers Carmin-sur-Mer", "Pokémon sauvages : Roucool, Rattata, Doduo"],
  },
  {
    id: 'route-7', name: 'Route 7', type: 'route',
    pts: '53.8,32.0 53.9,38.2 59.8,38.1 59.7,32.2',
    desc: "Courte route entre Céladopole et Safrania, bloquée par un poste de garde. Le Souterrain E-O est indispensable pour passer.",
    tips: ["Accès au Souterrain E-O (contourne le poste de garde)", "Pokémon sauvages : Rougyin (Rouge Feu) / Goupix (Vert Feuille), Roucool"],
  },
  {
    id: 'route-8', name: 'Route 8', type: 'route',
    pts: '71.2,33.2 84.3,33.5 84.8,37.7 71.1,37.9',
    desc: "Route entre Safrania et Lavanville, symétrique de la Route 7 côté est.",
    tips: ["Accès au Souterrain E-O côté est", "Pokémon sauvages : Ekans (Rouge Feu), Soporifik, Pikachu (rare)"],
  },
  {
    id: 'route-9', name: 'Route 9', type: 'route',
    pts: '70.6,14.9 70.6,18.7 85.2,18.4 85.0,14.9',
    desc: "Longue route sinueuse encaissée entre des falaises, au nord de Carmin-sur-Mer. Mène à l'entrée de La Grotte.",
    tips: ["Pokémon sauvages : Rattata, Roucool, Nidoran♂, Nidoran♀", "Nombreux dresseurs en escalier — niveau conseillé 20+"],
  },
  {
    id: 'route-10', name: 'Route 10', type: 'route',
    pts: '85.4,15.0 85.9,31.0 91.5,30.7 90.7,15.2',
    desc: "Route longeant le lac au pied de La Grotte, traversée par la voie ferrée de la Centrale Électrique.",
    tips: ["Accès à la Centrale Électrique (à l'ouest)", "Entrées nord et sud de La Grotte", "Pokémon sauvages : Voltorbe, Magnéti, Roucool — utilise Repousse"],
  },
  {
    id: 'route-11', name: 'Route 11', type: 'route',
    pts: '70.9,33.3 84.0,33.3 84.4,37.5 70.8,37.3',
    desc: "Route à l'est de Carmin-sur-Mer, reliant le port à la Route 12 via un poste de garde. Bloquée par un Ronflex endormi côté Route 12.",
    tips: ["Pokémon sauvages : Ekans, Roucool, Doduo, Soporifik", "Poste de garde à l'est — VS Compteur disponible Lv.2", "Le Ronflex sur la Route 12 nécessite la Flûte de Feu"],
  },
  {
    id: 'route-12', name: 'Route 12', type: 'route',
    pts: '87.9,41.0 92.4,41.1 92.6,70.3 88.3,67.2',
    desc: "Longue route côtière descendant vers le sud depuis Lavanville. Un Ronflex l'obstrue à mi-chemin.",
    tips: ["Ronflex Lv.30 — Flûte de Feu de M. Fuji requise", "Pokémon sauvages (herbes) : Soporifik, Doduo", "Pokémon sauvages (pêche) : Magicarpe, Tentatacoul"],
  },
  {
    id: 'route-13', name: 'Route 13', type: 'route',
    pts: '71.9,67.8 71.7,72.6 86.9,71.9 87.1,67.7',
    desc: "Route zigzagante à l'est de Parmanie, reliant les Routes 12 et 14 à travers bois et herbes hautes.",
    tips: ["Pokémon sauvages : Doduo, Soporifik, Lokhlass (Surf)", "Relie la Route 12 au nord et la Route 14 au sud"],
  },
  {
    id: 'route-14', name: 'Route 14', type: 'route',
    pts: '71.7,71.3 74.9,71.3 74.5,77.2 71.6,77.0',
    desc: "Route descendant vers le sud-ouest depuis la Route 13, rejoignant la Route 15 vers Parmanie.",
    tips: ["Pokémon sauvages : Doduo, Doduos, Soporifik", "Route intermédiaire — pas d'objets notables"],
  },
  {
    id: 'route-15', name: 'Route 15', type: 'route',
    pts: '58.8,74.0 58.9,77.5 71.5,77.8 71.1,74.2',
    desc: "Route horizontale reliant Parmanie à la Piste Cyclable. Traversée par de nombreux dresseurs expérimentés.",
    tips: ["Pokémon sauvages : Doduo, Nidoran♂/♀, Soporifik", "Accès direct à la Route 17 (Piste Cyclable) à l'ouest"],
  },
  {
    id: 'route-16', name: 'Route 16', type: 'route',
    pts: '34.4,33.0 41.7,33.1 41.5,37.0 34.2,37.2',
    desc: "Route à l'ouest de Céladopole, bloquée par un Ronflex endormi. Donne accès à la Piste Cyclable.",
    tips: ["Ronflex Lv.30 — Flûte de Feu requise", "CS02 Vol appris dans la maison au nord (si Pokémon compatible)", "Accès direct à la Piste Cyclable (Route 17)"],
  },
  {
    id: 'route-17', name: 'Route 17 — Piste Cyclable', type: 'route',
    pts: '34.1,37.7 36.9,37.7 37.0,72.8 34.4,72.8',
    desc: "Longue descente réservée aux cyclistes reliant Céladopole à Parmanie. Rapide avec le vélo, épuisante à pied.",
    tips: ["CS06 Vélo fortement conseillé (obtenu à Céladopole)", "Pokémon sauvages : Doduo, Doduos (niveaux élevés)", "Route très longue — incontournable pour rejoindre Parmanie"],
  },
  {
    id: 'route-18', name: 'Route 18', type: 'route',
    pts: '34.5,73.8 41.7,73.7 41.6,77.2 34.1,76.8',
    desc: "Courte route horizontale entre la Piste Cyclable et les abords de Parmanie.",
    tips: ["Pokémon sauvages : Doduo, Rattatac, Nidoran", "Accès à Parmanie à l'est"],
  },
  {
    id: 'route-22', name: 'Route 22', type: 'route',
    pts: '11.1,44.8 20.6,44.3 20.7,48.0 11.2,48.3',
    desc: "Route à l'ouest de Jadielle menant vers le Plateau Indigo. Rivale t'y défie dès le début de l'aventure.",
    tips: ["Combat contre Rivale (juste après le 1er starter)", "8 Badges + CS03 Surf requis pour atteindre le Plateau Indigo", "Pokémon sauvages : Nidoran♂, Nidoran♀, Roucool"],
  },
  {
    id: 'route-23', name: 'Route 23', type: 'route',
    pts: '10.6,20.2 14.7,20.6 14.7,42.3 10.4,41.6',
    desc: "Ascension finale vers le Plateau Indigo, jalonnée de postes de contrôle vérifiant chacun de tes 8 Badges.",
    tips: ["8 postes de contrôle — un Badge vérifié à chacun", "CS03 Surf requis pour traverser les parties aquatiques", "Pokémon sauvages : Nidorino, Nidorina, Rhinocorne, Rattatac"],
  },
  {
    id: 'route-24', name: 'Route 24', type: 'route',
    pts: '62.8,3.9 66.7,4.1 66.8,14.0 62.4,14.0',
    desc: "Le Pont du Zénith, au nord d'Azuria. Cinq dresseurs alignés à battre pour une récompense en pépite.",
    tips: ["5 dresseurs consécutifs — bonne source d'expérience en début de partie", "Pépite offerte au bout du pont (vendue 5000₽ à une boutique)", "Mène à la Route 25 et à la maison de Bill"],
  },
  {
    id: 'route-25', name: 'Route 25', type: 'route',
    pts: '66.2,3.3 78.7,3.3 79.2,7.9 66.6,7.8',
    desc: "Route côtière longeant le cap au nord-est d'Azuria. Mène à la maison de Bill, le célèbre inventeur du PC Pokémon.",
    tips: ["Maison de Bill — obtiens le Billet Bateau pour la S.S. Anne", "Bill transformé en Pokémon : aide-le à reprendre forme humaine", "Pokémon sauvages : Roucool, Nidoran, Bellsprout (Vert Feuille) / Abra (Rouge Feu)"],
  },

  // ─ CHENAUX ─
  {
    id: 'chenal-19', name: 'Chenal 19', type: 'water',
    pts: '46.9,83.2 53.0,83.3 52.4,95.2 46.9,95.8',
    desc: "Chenal reliant Parmanie aux Îles Écume. La traversée à la nage est longue et semée de rencontres aquatiques.",
    tips: ["CS03 Surf requis", "Pokémon sauvages : Tentacool, Tentatacuel, Lokhlass", "Mène directement aux Îles Écume (Artikodin)"],
  },
  {
    id: 'chenal-20', name: 'Chenal 20', type: 'water',
    pts: '46.2,89.9 46.3,95.8 27.0,95.8 27.3,89.5',
    desc: "Vaste étendue d'eau entre les Îles Écume et Cramois'Île. Traversée indispensable pour accéder à la 7e arène.",
    tips: ["CS03 Surf requis", "Pokémon sauvages : Tentacool, Tentatacuel, Lokhlass", "Magicarpe et Lokhlass pêchables (Canne Super / Ultra)"],
  },
  {
    id: 'chenal-21', name: 'Chenal 21', type: 'water',
    pts: '20.5,71.6 26.4,71.8 26.6,86.7 20.5,86.4',
    desc: "Chenal au nord de Cramois'Île, reliant l'île volcanique à Bourg-Palette par la mer.",
    tips: ["CS03 Surf requis", "Pokémon sauvages : Tentacool, Tentatacuel, Tangela (herbes côtières)", "Route de retour vers Bourg-Palette après Cramois'Île"],
  },

  // ─ LIEUX / DONJONS ─
  {
    id: 'foret-de-jade', name: 'Forêt de Jade', type: 'dungeon',
    pts: '21.7,35.3 25.4,35.3 25.5,28.6 21.8,28.3',
    desc: "Forêt labyrinthique entre Jadielle et Argenta. L'obscurité y désoriente même les dresseurs chevronnés.",
    tips: ["CS06 Coupe requis pour abattre l'arbre bloquant le passage", "Pokémon sauvages : Chenipan, Aspicot, Mystherbe, Pikachu (rare !)", "Un enfant scout peut guider vers la sortie"],
  },
  {
    id: 'mont-selenite', name: 'Mont Sélénite', type: 'dungeon',
    pts: '38.8,14.8 43.4,14.7 43.7,16.3 45.9,16.2 45.6,8.5 38.9,8.5',
    desc: "Imposant tunnel creusé dans la montagne entre Argenta et Azuria. Un trésor préhistorique s'y cache.",
    tips: ["Fossile au choix : Dôme (→ Kabuto) ou Hélice (→ Amonita) — un seul récupérable !", "CS08 Escalade requis pour accéder aux étages supérieurs", "Pokémon sauvages : Racaillou, Nosferapti, Taupiqueur, Onix", "Rivale t'y affronte pour la première fois"],
  },
  {
    id: 'la-grotte', name: 'La Grotte', type: 'dungeon',
    pts: '85.4,18.3 85.4,20.2 87.4,20.2 87.4,18.6',
    desc: "Réseau de cavernes obscures et tortueuses entre les Routes 9 et 10. CS05 Flash est vivement recommandé pour s'y retrouver.",
    tips: ["CS05 Flash recommandé (réduit la précision des ennemis)", "Pokémon sauvages : Taupiqueur, Osselait, Nosferapti, Voltorbe (niveaux élevés)", "Raccourci entre la Route 9 et la Route 10"],
  },
  {
    id: 'tour-pokemon', name: 'Tour Pokémon', type: 'dungeon',
    pts: '89.7,34.8 91.7,34.8 91.9,32.8 89.8,32.9',
    desc: "Sinistre tour à 7 étages au cœur de Lavanville. Les fantômes qui l'habitent ne peuvent être vus qu'avec le Lunettoscope.",
    tips: ["Lunettoscope requis — récupéré dans le Repaire Rocket de Céladopole", "Combat contre Rivale au 5e étage (équipe niveaux ~30-35)", "M. Fuji au sommet — libère-le pour obtenir la Flûte de Feu", "Pokémon sauvages : Fantominus, Spectrum, Ectoplasma"],
  },
  {
    id: 'caverne-azuree', name: 'Caverne Azurée', type: 'dungeon',
    pts: '',
    desc: "Grotte inondée à l'ouest d'Azuria, accessible uniquement avec CS03 Surf. Au fond de ce labyrinthe obscur se cache... Mewtwo.",
    tips: ["CS03 Surf + CS08 Escalade requis pour naviguer dans les grottes", "Mewtwo Lv.70 au fond — conserve ta Master Ball ou prépare des Ultra Balls", "Post-game uniquement (après avoir battu la Ligue Pokémon)", "Un des dungeons les plus complexes du jeu — explore méthodiquement"],
  },
  {
    id: 'centrale', name: 'Centrale Électrique', type: 'dungeon',
    pts: '85.7,22.9 88.3,22.8 88.3,24.6 85.7,24.9',
    desc: "Usine abandonnée sur la Route 10, dérobée par la Team Rocket. Il faut récupérer le Générateur volé pour rétablir le courant à Céladopole.",
    tips: ["Objectif : trouver et récupérer le Générateur volé par la Team Rocket", "Récompense : déverrouille les jeux d'arcade du Jeu Corner de Céladopole", "Pokémon sauvages : Voltorbe, Électrode, Magnéti, Magnéton"],
  },
  {
    id: 'parc-safari', name: 'Parc Safari', type: 'dungeon',
    pts: '45.2,67.7 55.9,67.5 55.5,56.8 45.0,57.0',
    desc: "Immense réserve naturelle à Parmanie. Règles spéciales : pas d'attaques, lance des Balls ou de la nourriture !",
    tips: ["CS03 Surf et CS04 Force à récupérer dans les cabanes (obligatoire !)", "Dentier du Warden trouvable ici — rends-le lui contre CS04 Force", "500₽ l'entrée pour 500 pas — optimise tes captures !"],
    safariData: [
      {
        zone: 'Zone Centrale (Entrée)',
        rows: [
          { name: 'Rhinocorne',                            rate: '20%', lv: '25' },
          { name: 'Nœunœuf',                              rate: '20%', lv: '24-25' },
          { name: 'Nidoran♂ (RF) · Nidoran♀ (VF)',        rate: '20%', lv: '22' },
          { name: 'Mimitoss',                              rate: '15%', lv: '22' },
          { name: 'Nidorino (RF) · Nidorina (VF)',         rate: '10%', lv: '31' },
          { name: 'Nidorina (RF) · Nidorino (VF)',         rate: '5%',  lv: '31' },
          { name: 'Parasect',                              rate: '5%',  lv: '30' },
          { name: 'Insécateur (RF) · Scarabrute (VF)',     rate: '4%',  lv: '23' },
          { name: 'Leveinard ⭐',                           rate: '1%',  lv: '23' },
        ],
      },
      {
        zone: 'Zone 1 (Est)',
        rows: [
          { name: 'Doduo',                                 rate: '20%', lv: '26' },
          { name: 'Nœunœuf',                              rate: '20%', lv: '23-25' },
          { name: 'Nidoran♂ (RF) · Nidoran♀ (VF)',        rate: '20%', lv: '24' },
          { name: 'Paras',                                 rate: '15%', lv: '22' },
          { name: 'Nidorino (RF) · Nidorina (VF)',         rate: '10%', lv: '33' },
          { name: 'Nidoran♀ (RF) · Nidoran♂ (VF)',        rate: '5%',  lv: '24' },
          { name: 'Parasect',                              rate: '5%',  lv: '25' },
          { name: 'Kangourex ⭐',                           rate: '4%',  lv: '25' },
          { name: 'Insécateur (RF) · Scarabrute (VF)',     rate: '1%',  lv: '28' },
        ],
      },
      {
        zone: 'Zone 2 (Nord)',
        rows: [
          { name: 'Nidoran♂ (RF) · Nidoran♀ (VF)',        rate: '20%', lv: '30' },
          { name: 'Rhinocorne',                            rate: '20%', lv: '26' },
          { name: 'Nœunœuf',                              rate: '20%', lv: '25-27' },
          { name: 'Paras',                                 rate: '15%', lv: '23' },
          { name: 'Nidorino (RF) · Nidorina (VF)',         rate: '10%', lv: '30' },
          { name: 'Nidorina (RF) · Nidorino (VF)',         rate: '5%',  lv: '30' },
          { name: 'Aéromite',                              rate: '5%',  lv: '32' },
          { name: 'Leveinard ⭐',                           rate: '4%',  lv: '26' },
          { name: 'Tauros ⭐',                              rate: '1%',  lv: '28' },
        ],
      },
      {
        zone: 'Zone 3 (Ouest)',
        rows: [
          { name: 'Doduo',                                 rate: '20%', lv: '26' },
          { name: 'Nœunœuf',                              rate: '20%', lv: '25-27' },
          { name: 'Nidoran♂ (RF) · Nidoran♀ (VF)',        rate: '20%', lv: '22' },
          { name: 'Mimitoss',                              rate: '15%', lv: '23' },
          { name: 'Nidorino (RF) · Nidorina (VF)',         rate: '10%', lv: '30' },
          { name: 'Nidoran♀ (RF) · Nidoran♂ (VF)',        rate: '5%',  lv: '30' },
          { name: 'Aéromite',                              rate: '5%',  lv: '32' },
          { name: 'Tauros ⭐',                              rate: '4%',  lv: '25' },
          { name: 'Kangourex ⭐',                           rate: '1%',  lv: '28' },
        ],
      },
    ],
  },
  {
    id: 'iles-ecume', name: 'Îles Écume', type: 'dungeon',
    pts: '36.3,90.6 40.9,91.0 40.9,94.8 36.0,94.7',
    desc: "Archipel de cavernes glacées à l'ouest de Parmanie. Seuls les dresseurs les plus aguerris en atteignent le fond.",
    tips: ["CS03 Surf + CS04 Force requis pour naviguer dans les grottes", "Artikodin Lv.50 au fond — oiseau légendaire de Glace", "Pokémon sauvages : Lokhlass, Jinx, Hypnomade, Glace (pêche)", "Puzzles de rochers à pousser pour atteindre les étages inférieurs"],
  },
  {
    id: 'manoir-pokemon', name: 'Manoir Pokémon', type: 'dungeon',
    pts: '21.4,90.6 23.4,90.6 23.4,88.6 21.3,88.6',
    desc: "Manoir délabré sur Cramois'Île, jadis laboratoire du Dr Fuji. Des journaux cachés révèlent les secrets de la création de Mewtwo.",
    tips: ["Clé Secrète à trouver pour déverrouiller l'Arène de Cramois'Île", "Journaux du Dr Fuji — lore fascinant sur l'origine de Mewtwo", "Pokémon sauvages : Muet, Papinox, Voltorbe, Smogogo, Magmar"],
  },
  {
    id: 'route-victoire', name: 'Route Victoire', type: 'dungeon',
    pts: '10.5,13.1 14.6,13.1 14.6,20.9 10.6,20.3',
    desc: "Dernier défi avant la Ligue Pokémon. Succession de cols et de grottes jalonnés par les dresseurs les plus forts de Kanto.",
    tips: ["CS03 Surf + CS04 Force + CS08 Escalade recommandés", "Pokémon sauvages : Ronflex, Kangourex, Rhinoféros, Minotauros, Dratatin (Surf)", "Niveau conseillé : 45-50 avant de tenter la Ligue", "Chemin non linéaire — explore chaque branche pour les objets cachés"],
  },
  {
    id: 'cave-taupiqueur-a', name: 'Cave Taupiqueur', type: 'dungeon',
    pts: '25.6,26.8 25.8,29.1 27.2,29.0 27.3,26.9',
    desc: "Tunnel naturel creusé par les Taupiqueur sous Kanto, reliant les abords d'Argenta à ceux de Carmin-sur-Mer.",
    tips: ["Accès depuis la Route 2 (entrée nord) et la Route 11 (entrée sud)", "Pokémon sauvages : Taupiqueur (quasi 100%), Dugtrio (rare, niveaux élevés)", "Raccourci utile mais sans objets notables"],
  },
  {
    id: 'cave-taupiqueur-b', name: 'Cave Taupiqueur', type: 'dungeon',
    pts: '70.0,52.7 70.1,54.9 71.8,55.0 71.7,52.8',
    desc: "Tunnel naturel creusé par les Taupiqueur sous Kanto, reliant les abords d'Argenta à ceux de Carmin-sur-Mer.",
    tips: ["Accès depuis la Route 2 (entrée nord) et la Route 11 (entrée sud)", "Pokémon sauvages : Taupiqueur (quasi 100%), Dugtrio (rare, niveaux élevés)", "Raccourci utile mais sans objets notables"],
  },
  {
    id: 'repaire-rocket', name: 'Repaire Rocket', type: 'dungeon',
    pts: '47.6,35.6 49.9,35.9 49.7,33.5 47.4,33.4',
    desc: "Quartier général souterrain de la Team Rocket, caché sous le Jeu Corner de Céladopole. Il faut l'infiltrer pour récupérer le Lunettoscope.",
    tips: ["Accès : pousser le poster dans le Jeu Corner de Céladopole", "Pokémon sauvages : Rattata, Psykokwak, Nosferapti, Noadkoko", "Lunettoscope indispensable pour voir les fantômes de la Tour Pokémon", "Confrontation finale contre Giovanni (1er round)"],
  },
  {
    id: 'sylphe-sarl', name: 'Sylphe SARL', type: 'dungeon',
    pts: '63.8,37.1 66.1,37.1 66.1,32.9 63.4,32.7',
    desc: "Imposant immeuble high-tech au cœur de Safrania, occupé par la Team Rocket. Libère le Président pour la récompense ultime.",
    tips: ["Giovanni au 11e étage — bat-le pour libérer le Président de Sylphe SARL", "Le Président offre la Master Ball (unique dans tout le jeu !)", "Pièces téléportantes dans les couloirs — mémorise le chemin"],
  },
  {
    id: 'souterrain-eo-a', name: 'Souterrain E-O', type: 'dungeon',
    pts: '55.7,35.9 55.7,37.5 57.0,37.1 57.0,35.9',
    desc: "Couloir souterrain reliant l'est et l'ouest de Kanto, contournant les postes de garde entre Céladopole, Safrania et Lavanville.",
    tips: ["Accès libre depuis les Routes 7 et 8", "Indispensable en début de partie — les postes de garde sont bloqués", "Aucun Pokémon sauvage — simple couloir de passage"],
  },
  {
    id: 'souterrain-eo-b', name: 'Souterrain E-O', type: 'dungeon',
    pts: '72.4,33.3 72.4,34.2 73.3,34.2 73.5,33.2',
    desc: "Couloir souterrain reliant l'est et l'ouest de Kanto, contournant les postes de garde entre Céladopole, Safrania et Lavanville.",
    tips: ["Accès libre depuis les Routes 7 et 8", "Indispensable en début de partie — les postes de garde sont bloqués", "Aucun Pokémon sauvage — simple couloir de passage"],
  },
  {
    id: 'souterrain-ns-a', name: 'Souterrain N-S', type: 'dungeon',
    pts: '66.0,27.2 67.1,27.2 67.1,28.6 66.0,28.3',
    desc: "Couloir souterrain nord-sud permettant de passer d'Azuria à Carmin-sur-Mer sans emprunter les postes de garde.",
    tips: ["Accès depuis les Routes 5 (nord) et 6 (sud)", "Indispensable pour rejoindre Carmin-sur-Mer avant d'avoir la S.S. Anne", "Aucun Pokémon sauvage — simple couloir de passage"],
  },
  {
    id: 'souterrain-ns-b', name: 'Souterrain N-S', type: 'dungeon',
    pts: '65.6,43.5 66.6,43.5 66.7,44.6 65.6,44.7',
    desc: "Couloir souterrain nord-sud permettant de passer d'Azuria à Carmin-sur-Mer sans emprunter les postes de garde.",
    tips: ["Accès depuis les Routes 5 (nord) et 6 (sud)", "Indispensable pour rejoindre Carmin-sur-Mer avant d'avoir la S.S. Anne", "Aucun Pokémon sauvage — simple couloir de passage"],
  },
  {
    id: 'l-oceane', name: "L'Océane", type: 'dungeon',
    pts: '62.1,64.7 66.4,64.3 66.8,67.3 61.4,67.5',
    desc: "Port d'embarquement de Carmin-sur-Mer. Le grand paquebot S.S. Anne y est amarré temporairement — profites-en avant qu'il reparte.",
    tips: ["S.S. Anne — CS01 Coupe auprès du Capitaine (soigne son mal de mer)", "Nombreux dresseurs à bord — excellente source d'expérience", "Le bateau repart définitivement après l'obtention de CS01", "Accessible uniquement avec le Billet Bateau (donné par Bill)"],
  },
]

// Centroïde d'un polygone pts-string
function centroid(ptsStr) {
  const pairs = ptsStr.trim().split(/\s+/).map(p => p.split(',').map(Number))
  return {
    x: pairs.reduce((s, [x]) => s + x, 0) / pairs.length,
    y: pairs.reduce((s, [, y]) => s + y, 0) / pairs.length,
  }
}

export default function KantoMap({ game, onNavigate }) {
  const [active, setActive]   = useState(null)
  const [scale, setScale]     = useState(1)
  const [pan, setPan]         = useState({ x: 0, y: 0 })
  const [search, setSearch]   = useState('')
  const [showResults, setShowResults] = useState(false)

  // ── État éditeur ──
  const [editMode, setEditMode]     = useState(false)
  const [editPts, setEditPts]       = useState([])
  const [editCursor, setEditCursor] = useState(null)
  const [copied, setCopied]         = useState(false)

  const rootRef       = useRef(null)
  const svgRef        = useRef(null)
  const searchRef     = useRef(null)
  const isDragging    = useRef(false)
  const hasDragged    = useRef(false)
  const lastPos       = useRef({ x: 0, y: 0 })
  const lastTouchDist = useRef(null)
  const lastTouchPos  = useRef(null)

  // ── Calcul scale minimum (carte couvre tout l'écran) ──
  const getMinScale = useCallback(() => {
    const rect = rootRef.current?.getBoundingClientRect()
    if (!rect) return 1
    const mapH = rect.width * MAP_RATIO
    return Math.max(1, rect.height / mapH)
  }, [])

  // ── Clamp pan pour ne jamais montrer de bords noirs ──
  const clamp = useCallback((px, py, sc) => {
    const rect = rootRef.current?.getBoundingClientRect()
    if (!rect) return { x: px, y: py }
    const mapH = rect.width * MAP_RATIO
    return {
      x: Math.min(0, Math.max(px, rect.width  - rect.width  * sc)),
      y: Math.min(0, Math.max(py, rect.height - mapH * sc)),
    }
  }, [])

  // ── Zoom molette ──
  const handleWheel = useCallback(e => {
    e.preventDefault()
    const rect = rootRef.current?.getBoundingClientRect()
    if (!rect) return
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top
    const factor = e.deltaY < 0 ? 1.14 : 1 / 1.14
    const minSc = getMinScale()
    setScale(prev => {
      const next = Math.max(minSc, Math.min(3, prev * factor))
      const ratio = next / prev
      const rawX = mx - ratio * (mx - pan.x)
      const rawY = my - ratio * (my - pan.y)
      setPan(clamp(rawX, rawY, next))
      return next
    })
  }, [pan, clamp, getMinScale])

  useEffect(() => {
    const el = rootRef.current
    if (!el) return
    el.addEventListener('wheel', handleWheel, { passive: false })
    return () => el.removeEventListener('wheel', handleWheel)
  }, [handleWheel])

  // ── Init : applique minScale dès le montage ──
  useEffect(() => {
    const minSc = getMinScale()
    if (minSc > 1) {
      setScale(minSc)
      setPan(p => clamp(p.x, p.y, minSc))
    }
  }, []) // eslint-disable-line

  // ── Convertit coordonnées écran → % SVG ──
  const screenToSvgPct = useCallback((clientX, clientY) => {
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return null
    return {
      x: +((clientX - rect.left) / rect.width  * 100).toFixed(1),
      y: +((clientY - rect.top)  / rect.height * 100).toFixed(1),
    }
  }, [])

  // ── Drag ──
  const onMouseDown = e => {
    if (editMode || e.button !== 0) return
    isDragging.current = true
    hasDragged.current = false
    lastPos.current = { x: e.clientX, y: e.clientY }
  }
  const onMouseMove = e => {
    if (editMode) { setEditCursor(screenToSvgPct(e.clientX, e.clientY)); return }
    if (!isDragging.current) return
    const dx = e.clientX - lastPos.current.x
    const dy = e.clientY - lastPos.current.y
    if (Math.abs(dx) > 2 || Math.abs(dy) > 2) hasDragged.current = true
    lastPos.current = { x: e.clientX, y: e.clientY }
    setPan(p => clamp(p.x + dx, p.y + dy, scale))
  }
  const onMouseUp    = () => { isDragging.current = false }
  const onMouseLeave = () => { isDragging.current = false; if (editMode) setEditCursor(null) }

  // ── Touch ──
  const onTouchStart = e => {
    if (e.touches.length === 1) lastTouchPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
    else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      lastTouchDist.current = Math.hypot(dx, dy)
    }
  }
  const handleTouchMove = useCallback(e => {
    e.preventDefault()
    if (e.touches.length === 1 && lastTouchPos.current) {
      const dx = e.touches[0].clientX - lastTouchPos.current.x
      const dy = e.touches[0].clientY - lastTouchPos.current.y
      lastTouchPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
      if (!editMode) setPan(p => clamp(p.x + dx, p.y + dy, scale))
    } else if (e.touches.length === 2 && lastTouchDist.current) {
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      const dist = Math.hypot(dx, dy)
      const minSc = getMinScale()
      const next = Math.max(minSc, Math.min(3, scale * dist / lastTouchDist.current))
      setScale(next)
      setPan(p => clamp(p.x, p.y, next))
      lastTouchDist.current = dist
    }
  }, [editMode, scale, clamp, getMinScale])

  useEffect(() => {
    const el = rootRef.current
    if (!el) return
    el.addEventListener('touchmove', handleTouchMove, { passive: false })
    return () => el.removeEventListener('touchmove', handleTouchMove)
  }, [handleTouchMove])

  const onTouchEnd = () => { lastTouchPos.current = null; lastTouchDist.current = null }

  // ── Clic root ──
  const onRootClick = e => {
    if (editMode) return
    if (!hasDragged.current) { setActive(null); setSearch(''); setShowResults(false) }
  }

  const closePanel = () => setActive(null)

  const handleZoneClick = (e, zone) => {
    if (editMode) return
    e.stopPropagation()
    setActive(z => z?.id === zone.id ? null : zone)
  }

  // ── Éditeur ──
  const onSvgClick = e => {
    if (!editMode) return
    e.stopPropagation()
    const pos = screenToSvgPct(e.clientX, e.clientY)
    if (pos) setEditPts(prev => [...prev, [pos.x, pos.y]])
  }

  const zoom = factor => {
    const rect = rootRef.current?.getBoundingClientRect()
    const cx = rect ? rect.width  / 2 : 0
    const cy = rect ? rect.height / 2 : 0
    const minSc = getMinScale()
    setScale(prev => {
      const next = Math.max(minSc, Math.min(3, prev * factor))
      const ratio = next / prev
      setPan(p => clamp(cx - ratio * (cx - p.x), cy - ratio * (cy - p.y), next))
      return next
    })
  }

  const toggleEdit = () => {
    setEditMode(m => !m); setEditPts([]); setEditCursor(null); setCopied(false); setActive(null)
  }

  const ptsString = editPts.map(([x, y]) => `${x},${y}`).join(' ')
  const copyPts = () => {
    navigator.clipboard.writeText(ptsString)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // ── Recherche ──
  const query = search.trim().toLowerCase()
  const searchResults = query.length >= 1
    ? ZONES.filter(z => z.pts && z.name.toLowerCase().includes(query))
            .filter((z, i, arr) => arr.findIndex(o => o.name === z.name) === i) // déduplique
    : []
  const highlightedNames = new Set(searchResults.map(z => z.name))

  const goToZone = useCallback(zone => {
    if (!zone.pts) return
    const rect = rootRef.current?.getBoundingClientRect()
    if (!rect) return
    const c = centroid(zone.pts)
    const mapH = rect.width * MAP_RATIO
    const targetScale = Math.max(getMinScale(), Math.min(3, 2.2))
    const rawX = rect.width  / 2 - (c.x / 100) * rect.width  * targetScale
    const rawY = rect.height / 2 - (c.y / 100) * mapH        * targetScale
    setScale(targetScale)
    setPan(clamp(rawX, rawY, targetScale))
    setActive(zone)
    setSearch(zone.name)
    setShowResults(false)
  }, [clamp, getMinScale])

  const editPolyPoints = editPts.map(([x, y]) => `${x},${y}`).join(' ')
  const previewLine = editPts.length > 0 && editCursor
    ? { x1: editPts[editPts.length - 1][0], y1: editPts[editPts.length - 1][1], x2: editCursor.x, y2: editCursor.y }
    : null

  return (
    <div
      className={`kmap-root${editMode ? ' kmap-root-edit' : ''}`}
      ref={rootRef}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseLeave}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onClick={onRootClick}
    >
      {/* ── Carte + SVG ── */}
      <div
        className="kmap-inner"
        style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`, transformOrigin: '0 0', willChange: 'transform' }}
      >
        <div className="kmap-viewport">
          <svg ref={svgRef} className="kmap-svg" viewBox="0 0 100 100" preserveAspectRatio="none" onClick={onSvgClick}>
            {ZONES.filter(z => z.pts).map(zone => (
              <polygon
                key={zone.id}
                className={[
                  'kmap-zone',
                  `kmap-zone-${zone.type}`,
                  active?.id === zone.id ? 'kmap-zone-active' : '',
                  highlightedNames.has(zone.name) && query ? 'kmap-zone-highlight' : '',
                ].filter(Boolean).join(' ')}
                points={zone.pts}
                onClick={e => handleZoneClick(e, zone)}
              />
            ))}

            {/* Éditeur */}
            {editMode && editPts.length > 1 && (
              <polygon points={editPolyPoints} fill="rgba(255,80,80,0.25)" stroke="#ff5050"
                strokeWidth="0.4" strokeDasharray="1,0.5" vectorEffect="non-scaling-stroke" style={{ pointerEvents: 'none' }} />
            )}
            {editMode && editPts.map(([x, y], i) => (
              <circle key={i} cx={x} cy={y} r="0.6" fill="#ff5050" stroke="#fff" strokeWidth="0.2"
                vectorEffect="non-scaling-stroke" style={{ pointerEvents: 'none' }} />
            ))}
            {editMode && previewLine && (
              <line x1={previewLine.x1} y1={previewLine.y1} x2={previewLine.x2} y2={previewLine.y2}
                stroke="#ff5050" strokeWidth="0.3" strokeDasharray="0.8,0.5"
                vectorEffect="non-scaling-stroke" style={{ pointerEvents: 'none' }} />
            )}
            {editMode && editCursor && (
              <>
                <line x1={editCursor.x} y1={0} x2={editCursor.x} y2={100} stroke="rgba(255,80,80,0.35)" strokeWidth="0.2" vectorEffect="non-scaling-stroke" style={{ pointerEvents: 'none' }} />
                <line x1={0} y1={editCursor.y} x2={100} y2={editCursor.y} stroke="rgba(255,80,80,0.35)" strokeWidth="0.2" vectorEffect="non-scaling-stroke" style={{ pointerEvents: 'none' }} />
              </>
            )}
          </svg>
        </div>
      </div>

      {/* ── Backdrop ── */}
      {active && !editMode && <div className="kmap-backdrop" onClick={closePanel} />}

      {/* ── Barre de recherche ── */}
      <div className="kmap-search" onClick={e => e.stopPropagation()} ref={searchRef}>
        <input
          className="kmap-search-input"
          type="text"
          placeholder="🔍 Rechercher un lieu…"
          value={search}
          onChange={e => { setSearch(e.target.value); setShowResults(true) }}
          onFocus={() => setShowResults(true)}
        />
        {search && (
          <button className="kmap-search-clear" onClick={() => { setSearch(''); setShowResults(false) }}>✕</button>
        )}
        {showResults && searchResults.length > 0 && (
          <ul className="kmap-search-results">
            {searchResults.map(zone => (
              <li key={zone.id} className="kmap-search-result" onClick={() => goToZone(zone)}>
                <span className="kmap-search-result-dot" style={{ background: C[zone.type] }} />
                <span className="kmap-search-result-name">{zone.name}</span>
                <span className="kmap-search-result-type">{TYPE_LABEL[zone.type]}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ── Panneau info zone ── */}
      {active && !editMode && (
        <aside className="kmap-panel" style={{ '--zc': C[active.type] }}>
          <button className="kmap-panel-close" onClick={closePanel} aria-label="Fermer">✕</button>
          <div className="kmap-panel-header">
            <span className="kmap-panel-badge">{TYPE_LABEL[active.type]}</span>
            <h2 className="kmap-panel-name">{active.name}</h2>
          </div>
          <div className="kmap-panel-body">
            <p className="kmap-panel-desc">{active.desc}</p>
            {active.tips?.length > 0 && (
              <>
                <p className="kmap-panel-section-label" style={{ marginTop: '1rem' }}>Points clés</p>
                <ul className="kmap-panel-list">
                  {active.tips.map((tip, i) => <li key={i} className="kmap-panel-list-item">{tip}</li>)}
                </ul>
              </>
            )}
            {active.safariData?.length > 0 && (
              <>
                <p className="kmap-panel-section-label" style={{ marginTop: '1.2rem' }}>Rencontres par zone</p>
                {active.safariData.map(sz => (
                  <div key={sz.zone} className="kmap-safari-zone">
                    <p className="kmap-safari-zone-title">{sz.zone}</p>
                    {sz.rows.map((row, i) => (
                      <div key={i} className="kmap-safari-row">
                        <span className="kmap-safari-rate" style={{ color: rateColor(row.rate) }}>{row.rate}</span>
                        <span className="kmap-safari-name">{row.name}</span>
                        <span className="kmap-safari-lv">Lv.{row.lv}</span>
                      </div>
                    ))}
                  </div>
                ))}
                <p className="kmap-safari-fishing-note">🎣 Pêche identique dans toutes les zones : Magicarpe · Poissirène · Ptitard · Poissoroy · Minidraco · Draco (très rare)</p>
              </>
            )}
            <button className="kmap-panel-cta" style={{ background: game?.color || '#ff4444' }}
              onClick={() => { closePanel(); onNavigate?.(active.id) }}>
              Voir dans la soluce →
            </button>
          </div>
        </aside>
      )}

      {/* ── Panneau éditeur ── */}
      {editMode && (
        <div className="kmap-editor-panel">
          <div className="kmap-editor-header">
            <span className="kmap-editor-title">Mode éditeur</span>
            {editCursor && <span className="kmap-editor-coords">{editCursor.x}%, {editCursor.y}%</span>}
          </div>
          <div className="kmap-editor-pts">
            {ptsString || <span className="kmap-editor-hint">Clique sur la carte pour poser des points</span>}
          </div>
          <div className="kmap-editor-actions">
            <button className="kmap-editor-btn" onClick={() => setEditPts(p => p.slice(0, -1))} disabled={editPts.length === 0}>↩ Annuler dernier</button>
            <button className="kmap-editor-btn" onClick={() => { setEditPts([]); setCopied(false) }} disabled={editPts.length === 0}>🗑 Effacer</button>
            <button className={`kmap-editor-btn kmap-editor-btn-copy${copied ? ' kmap-editor-btn-copied' : ''}`} onClick={copyPts} disabled={editPts.length < 3}>
              {copied ? '✓ Copié !' : '📋 Copier pts'}
            </button>
          </div>
          <p className="kmap-editor-info">{editPts.length} point{editPts.length !== 1 ? 's' : ''}</p>
        </div>
      )}

      {/* ── Légende ── */}
      {!editMode && (
        <div className="kmap-legend">
          {Object.entries(C).map(([type, color]) => (
            <span key={type} className="kmap-legend-item">
              <span className="kmap-legend-dot" style={{ background: color }} />
              {TYPE_LABEL[type]}
            </span>
          ))}
        </div>
      )}

      {/* ── Contrôles zoom + éditeur ── */}
      <div className="kmap-zoom-ctrl">
        <button className="kmap-zoom-btn" onClick={() => zoom(1.25)}>+</button>
        <button className="kmap-zoom-btn" onClick={() => zoom(1 / 1.25)}>−</button>
        <button className="kmap-zoom-btn kmap-zoom-reset"
          onClick={() => { const m = getMinScale(); setScale(m); setPan(clamp(0, 0, m)) }}
          title="Réinitialiser">⌂</button>
        <button className={`kmap-zoom-btn kmap-edit-toggle${editMode ? ' kmap-edit-toggle-on' : ''}`}
          onClick={toggleEdit} title="Mode éditeur">🔧</button>
      </div>
    </div>
  )
}
