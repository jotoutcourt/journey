// ─── DONNÉES GUIDE Rubis Oméga / Saphir Alpha — Hoenn ────────────────────────
// Structure identique à firered.js.
// Exclusivités de version : OR = 'OR', AS = 'AS'
// Les dresseurs sont identiques entre les deux versions.
// Seules les tables de rencontres sauvages diffèrent.

// ── Badges Hoenn ──────────────────────────────────────────────────────────────
export const HOENN_BADGES = [
  { id: 1, name: 'Roche',   gym: 'Mérouville',    leader: 'Roxanne'         },
  { id: 2, name: 'Poing',   gym: 'Rosaverse',     leader: 'Brice'           },
  { id: 3, name: 'Dynamo',  gym: 'Maculis',       leader: 'Voltère'         },
  { id: 4, name: 'Chaleur', gym: 'Lavapolis',     leader: 'Téta'            },
  { id: 5, name: 'Balance', gym: 'Vergella',      leader: 'Norbert'         },
  { id: 6, name: 'Plume',   gym: 'Bourg-en-Vol',  leader: 'Narcisse'        },
  { id: 7, name: 'Esprit',  gym: 'Tempestacité',  leader: 'Walter & Norma'  },
  { id: 8, name: 'Pluie',   gym: 'Cristalia',     leader: 'Marin'           },
]

// ── Légendaires ───────────────────────────────────────────────────────────────
// OR : Groudon en story, Kyogre post-game
// AS : Kyogre en story, Groudon post-game
const LORE = {
  // ── Île du Destin ──
  249: { lore: "Lugia est le gardien des mers et des vents, une entité si puissante qu'un simple battement de ses ailes déclenche des tempêtes de quarante jours. Par crainte de ravager le monde, il préfère s'isoler au fond des océans. Seuls les plus purs de cœur peuvent l'approcher — dans les légendes de Johto, son chant apaise les flots déchaînés et ramène le calme après les grandes catastrophes.", anecdotes: ["Son chant, d'une beauté inouïe, peut endormir en un instant des centaines de Pokémon.", "Dans le film Pokémon 2000, Lugia est le seul être capable d'arrêter la guerre des oiseaux légendaires.", "Bien que de type Psy/Vol, il fut initialement conçu comme le légendaire de Pokémon Or avant d'être assigné à Argent."] },
  250: { lore: "Ho-Oh est le phénix immortel aux plumes aux sept couleurs, gardien du ciel et symbole d'un éternel recommencement. Selon la mythologie de Johto, quiconque aperçoit Ho-Oh sera béni d'un bonheur éternel. Après la destruction de la Tour Écarlate par un incendie mystérieux, Ho-Oh ressuscita les trois Pokémon qui périrent dans les flammes — Raikou, Entei et Suicune — et disparut dans les nuages.", anecdotes: ["Sacha aperçoit Ho-Oh dans le tout premier épisode de l'anime, posant une question que la série mettra des années à élucider.", "Ses plumes sacrées, appelées plumes Arc-en-ciel, peuvent ressusciter les morts selon la légende.", "C'est le légendaire mascotte de Pokémon Or et Pokémon Or HeartGold."] },
  243: { lore: "Raikou est la foudre incarnée. Né des flammes de la Tour Écarlate et ressuscité par Ho-Oh, il porte en lui la mémoire de l'incendie qui l'a tué. Plus rapide que l'éclair qu'il génère, il traverse les plaines de Johto comme une tempête, grondant comme le tonnerre. Sa crinière nuageuse laisse dans son sillage des traînées d'étincelles.", anecdotes: ["Il est l'un des trois Chiens Légendaires ressuscités par Ho-Oh après l'incendie de la Tour Écarlate.", "Dans Pokémon Or & Argent, il parcourt Johto de manière aléatoire, rendant sa capture particulièrement difficile.", "Son rugissement est capable de faire vibrer le sol sur des kilomètres à la ronde."] },
  244: { lore: "Entei est le volcan vivant. Ressuscité par Ho-Oh dans les flammes de la Tour Écarlate, chacun de ses rugissements fait gronder les volcans de la Terre. Il court à une vitesse telle que ses sabots ne touchent presque jamais le sol. La légende dit qu'un nouveau volcan naît quelque part dans le monde chaque fois qu'Entei rugit.", anecdotes: ["Chaque fois qu'il rugit, un volcan entre en éruption quelque part dans le monde selon le Pokédex.", "Dans le film Pokémon 3 L'Enchanteur des Rêves, il joue un rôle central en tant que père de substitution.", "Il est l'un des Pokémon les plus rapides de sa génération malgré sa stature imposante."] },
  245: { lore: "Suicune est la pureté des eaux. Né des cendres et ressuscité par Ho-Oh, il est capable de purifier en un instant les eaux les plus corrompues. Il court toujours face au vent du nord, traversant les continents en quête des lieux souillés à assainir. Entité silencieuse et mystérieuse, il choisit lui-même les Dresseurs qu'il juge dignes de l'affronter.", anecdotes: ["Il est la mascotte officielle de Pokémon Cristal, version dans laquelle il joue un rôle narratif central.", "Sa longue cape bleue n'est pas un appendice mais un flux d'eau pure cristallisée.", "Dans les romans Pokémon Adventures, Suicune choisit Cristal parmi tous les Dresseurs pour lui confier sa capture."] },
  150: { lore: "Mewtwo est le résultat de la plus grande — et la plus tragique — expérience scientifique jamais menée sur un Pokémon. Créé par le Team Rocket à partir de l'ADN de Mew, il fut doté d'une intelligence surhumaine et de capacités psychiques sans égal. Mais cet être créé comme une arme développa sa propre conscience, sa propre souffrance, et une seule obsession : comprendre sa raison d'exister.", anecdotes: ["Son QI dépasse celui de n'importe quel être humain ou Pokémon connu selon le Pokédex.", "Dans le film Mewtwo contre-attaque, son monologue sur l'identité et la naissance reste l'un des plus profonds de la saga.", "Il est le seul Pokémon à avoir deux Méga-Évolutions différentes (X et Y)."] },
  144: { lore: "Artikodin est le gardien mystique de l'hiver éternel. Il règne sur les terres gelées avec une majesté absolue, et son apparition signale l'arrivée des grands froids. Sa température corporelle est si basse que l'air gèle autour de lui en permanence, créant des cristaux de glace qui scintillent dans son sillage comme une traîne de diamants.", anecdotes: ["Son nom japonais フリーザー (Freezer) est une référence directe à sa maîtrise du froid absolu.", "Dans Pokémon Or & Argent, il peut être trouvé dans la nature au Mont Morph, loin des Îles Écume de Kanto.", "Il est l'un des tout premiers légendaires de la franchise, présent depuis Pokémon Rouge et Bleu en 1996."] },
  145: { lore: "Électhor est l'oiseau de la foudre éternelle. Son corps génère des décharges électriques si puissantes qu'il illumine le ciel nocturne comme un éclair permanent. Les pilotes et marins de l'ère prémoderne craignaient son passage — sa présence annonçait les tempêtes les plus dévastatrices. Il ne se pose presque jamais, dormant en vol au cœur des nuages d'orage.", anecdotes: ["Son nom japonais サンダー (Thunder) reflète sa nature d'incarnation de l'orage.", "Il est associé à la mer du côté du Rocher de la Falaise dans Pokémon Rouge/Bleu.", "Électhor est l'oiseau légendaire le plus souvent considéré comme le plus compétitif des trois grâce à sa vitesse."] },
  146: { lore: "Sulfura est le titan du feu céleste. Son corps entier est enveloppé de flammes intenses qui ne s'éteignent jamais. Selon la mythologie, il plonge dans des volcans en éruption pour régénérer ses flammes et absorber la lave comme nourriture. Sa traversée du ciel laisse derrière lui une traînée de feu visible à des centaines de kilomètres — les anciens l'appelaient « l'étoile qui saigne ».", anecdotes: ["Son nom japonais ファイヤー (Fire) est le plus simple des trois oiseaux, reflétant sa nature directe et puissante.", "Il vit au sommet du Mont Sécateur dans Pokémon Rouge/Bleu, un lieu emblématique difficile d'accès.", "Dans les légendes locales de Kanto, une apparition de Sulfura annonce de grandes catastrophes naturelles."] },
  480: { lore: "Créhelf est l'Être de la Connaissance. Selon les mythes de Sinnoh, il émergea du Lac de la Connaissance avec ses deux compagnons à l'aube du monde, apportant aux êtres vivants la capacité d'apprendre et de retenir. Sa présence irradie une sérénité absolue — les témoins de son apparition rapportent que leurs pensées se clarifient instantanément, comme si des années de confusion se dissipaient d'un coup.", anecdotes: ["Il peut effacer la mémoire de quiconque le regarde dans les yeux, selon le Pokédex.", "Avec Créfollet et Créfadet, il forme le Trio du Lac de Sinnoh, gardiens de l'équilibre psychique du monde.", "Sa taille minuscule (30 cm) contraste radicalement avec le pouvoir immense qu'il renferme."] },
  481: { lore: "Créfollet est l'Être des Émotions. Il insuffla aux humains et aux Pokémon la capacité de ressentir joie, tristesse, colère et amour. Certains mytholographes de Sinnoh soutiennent que sans Créfollet, le monde serait froid et mécanique — tous les êtres vivraient en automates dépourvus de désir. On dit qu'il ressent lui-même toutes les émotions qu'il a données, et en souffre.", anecdotes: ["Après sa capture ou sa défaite, les émotions du Dresseur deviennent instables pendant un court moment.", "Il est le seul membre du trio du Lac à avoir une légère résonance avec les humains — il peut partager leurs émotions.", "Son corps rose et délicat contraste avec l'intensité des sentiments qu'il représente."] },
  482: { lore: "Créfadet est l'Être de la Volonté. Il donna aux créatures vivantes la force de poursuivre leurs objectifs, de ne pas abandonner face à l'adversité. Sans lui, ni humain ni Pokémon n'aurait jamais eu le courage d'explorer les profondeurs des mers ou de gravir les plus hauts sommets. Dans le mythe de Sinnoh, c'est lui qui scella le portail vers le monde des esprits après la grande guerre.", anecdotes: ["Il peut priver instantanément un être de toute volonté d'agir, le plongeant dans une apathie totale.", "Créfadet est considéré le plus impulsif des trois — il agit avant de réfléchir, fidèle à son rôle.", "Avec Créhelf et Créfollet, ils symbolisent les trois fondements de la conscience : savoir, sentir, vouloir."] },
  483: { lore: "Dialga est le maître absolu du Temps. Son cœur est une gemme Adamante qui bat comme une horloge cosmique — tant qu'il bat, le temps s'écoule dans l'univers. Dès sa naissance, il créa les secondes, les minutes, les siècles et les millénaires. Les mythes de Sinnoh racontent qu'Arceus lui confia le temps car il jugea qu'aucun autre être n'aurait la rigueur et la patience de le garder.", anecdotes: ["Il peut accélérer, ralentir ou figer le temps à volonté — une capacité que nul autre Pokémon ne possède.", "Sa Méga-Évolution dans BDSP le transforme en Dialga Originelle, sa forme la plus proche d'Arceus.", "C'est la mascotte de Pokémon Diamant et sa forme cosmique fait l'objet de gravures rupestres à Sinnoh."] },
  484: { lore: "Palkia est le seigneur de l'Espace. Sa naissance définit les dimensions et les directions — haut, bas, loin, proche. Sa Perle Lustral, nichée dans ses épaules, est l'ancre de toute la réalité spatiale. Quand il se déplace entre les dimensions, des distorsions visibles apparaissent dans l'espace — les murs ondulent, les distances se compriment, la matière se plie.", anecdotes: ["Il peut créer et détruire des dimensions parallèles en un battement de cœur.", "Sa Méga-Évolution dans BDSP révèle sa forme Originelle, ser­pentine et cosmique.", "C'est la mascotte de Pokémon Perle et son pouvoir sur l'espace lui permet de se téléporter n'importe où dans l'univers."] },
  485: { lore: "Heatran est le titan de la lave et du métal, né aux entrailles d'un volcan lors d'une éruption cataclysmique. Mi-Pokémon mi-forteresse volcanique, ses pattes acérées lui permettent de s'accrocher aux parois de magma et de marcher sur le feu comme sur une plaine. Il n'est ni tout à fait mâle ni tout à fait femelle — la nature elle-même hésite.", anecdotes: ["C'est l'un des rares légendaires à pouvoir être de n'importe quel sexe — ou sans sexe.", "Sa carapace métallique est forgée par la pression et la chaleur des profondeurs volcaniques.", "Il vit habituellement au Mont Coronet dans Sinnoh, dans la chambre de lave la plus profonde."] },
  487: { lore: "Giratina est l'être banni, exilé dans le Monde Distorsion pour sa violence et son chaos. Dans la cosmologie de Sinnoh, Arceus créa Dialga et Palkia pour gouverner le temps et l'espace — et Giratina pour gouverner l'antimatière et la mort. Mais Giratina était trop destructeur pour coexister avec le monde des vivants, et fut condamné à errer seul dans un univers parallèle fait de vide et de miroirs brisés.", anecdotes: ["Ses deux Formes — Modifiée et Originelle — symbolisent sa double nature : cage et liberté.", "Le Monde Distorsion qu'il habite est une réflexion inversée du monde réel, obéissant à des lois physiques différentes.", "Il est l'un des rares Pokémon à être associé à la mort et à l'antimatière dans sa mythologie officielle."] },
  488: { lore: "Cresselia est la déesse des rêves doux, gardienne du sommeil paisible. Ses plumes dorées créent des voiles de lumière qui enveloppent les dormeurs dans des songes heureux. Elle est l'opposée absolue de Darkrai — là où ce dernier plonge les êtres dans des cauchemars sans fin, Cresselia les en libère. La lune croissante est son symbole, et son passage dans le ciel nocturne laisse une traînée de lumière lunaire.", anecdotes: ["Elle est le seul remède aux cauchemars permanents infligés par Darkrai.", "Une de ses plumes posée sur l'oreiller d'un être en proie à des cauchemars les fait disparaître immédiatement.", "Elle et Darkrai forment un duo antagoniste emblématique — lumière et ombre, rêves et cauchemars."] },
  643: { lore: "Reshiram est le Dragon de la Vérité, né du feu sacré de la rectitude. Selon la légende d'Unys, deux héros fondèrent leur royaume sur des idéaux opposés — l'un chercha la Vérité, l'autre l'Idéal. Le dragon originel se scinda en deux : Reshiram naquit pour accompagner celui qui cherchait la Vérité. Son feu purificateur brûle les mensonges et consume les cœurs malhonnêtes.", anecdotes: ["Sa queue est un réacteur thermique qui peut réchauffer l'atmosphère entière s'il s'embrase pleinement.", "Il s'allie uniquement aux Dresseurs dont le cœur est sincère et qui cherchent la vérité absolue.", "C'est la mascotte de Pokémon Noir — une ironie visuelle que les fans ont souvent soulignée."] },
  644: { lore: "Zekrom est le Dragon de l'Idéal, forgé dans la foudre de la conviction absolue. Né quand le dragon originel d'Unys se scinda, Zekrom s'allia au héros qui croyait que les idéaux valent plus que la réalité. Son générateur caudal produit des champs électromagnétiques capables de désactiver toute technologie dans un rayon de plusieurs kilomètres.", anecdotes: ["Son corps noir absorbe la lumière, le rendant presque invisible la nuit.", "Il s'allie uniquement aux Dresseurs animés par des convictions profondes et des idéaux inébranlables.", "C'est la mascotte de Pokémon Blanc — là encore, une ironie chromatique délibérée des développeurs."] },
  646: { lore: "Kyurem est le Dragon du Vide, fragment glacé et incomplet du dragon originel d'Unys. Quand Reshiram et Zekrom naquirent, ce qui restait — l'enveloppe vide, la coque sans âme — devint Kyurem. Il erre dans les friches glacées de Glace-Vive, figé dans un état d'inachèvement douloureux, aspirant à fusionner avec l'un des deux autres dragons pour redevenir entier.", anecdotes: ["Il peut fusionner avec Reshiram (Kyurem Blanc) ou Zekrom (Kyurem Noir) via le Gène Union.", "Sa température corporelle est si basse qu'il crée des blizzards simplement en respirant.", "Il est le seul membre du Trio du Tao à ne pas avoir de version mascotte dédiée."] },
  716: { lore: "Xerneas est la déesse de la Vie, un cerf immortel aux bois ornés d'étoiles. Selon les mythes de Kalos, il peut accorder la vie éternelle à n'importe quel être, mais le prix à payer est sa propre dormance — il se transforme en arbre pendant mille ans après avoir utilisé ce pouvoir. Son aurore boréale, émanant de ses bois, est le signe que la vie peut fleurir même dans les contrées les plus arides.", anecdotes: ["Son pouvoir Géo-Contrôle est la seule capacité de type Fée capable de booster toutes ses statistiques spéciales.", "Dans Pokémon X, Team Flare cherche à utiliser son énergie vitale pour alimenter l'Arme Ultime.", "Il est directement inspiré du Dieu Cerf de la mythologie nordique, associé à la fertilité et aux forêts."] },
  717: { lore: "Yveltal est le dieu de la Destruction et de la Mort. Quand il déploie ses ailes noires, il absorbe l'énergie vitale de tout être vivant à sa portée. Selon la légende de Kalos, à la fin de sa vie, Yveltal se transforme en cocon et absorbe toute la vie environnante pour se régénérer. C'est l'opposé absolu de Xerneas — là où l'un donne, l'autre prend.", anecdotes: ["Son corps en forme de Y fait écho à la lettre Y — symbole de ramification et de choix entre la vie et la mort.", "Dans Pokémon Y, il est à l'origine de la grande catastrophe que Team Flare tente de recréer.", "Il est inspiré de la figure du Simurgh et du Yatagarasu dans les mythologies perse et japonaise."] },
  718: { lore: "Zygarde est le Gardien de l'Ordre, l'être chargé de surveiller l'équilibre de l'écosystème de Kalos. Son corps est une colonie de cellules minuscules disséminées dans la nature entière — quand l'équilibre est menacé, elles se regroupent pour former des corps de plus en plus puissants. Sa Forme Parfaite à 100%, déclenchée uniquement en cas de crise extrême, est plus puissante que Xerneas et Yveltal réunis.", anecdotes: ["Il existe en trois formes : Cellule (10%), Chien (50%) et Parfaite (100%).", "Dans l'anime, la série XYZ révèle son rôle cosmique de gardien de la biosphère de la Terre entière.", "Ses cellules sont présentes partout dans la nature sans que personne ne les remarque — une métaphore de l'écosystème invisible."] },
  // ── Hoenn ──
  383: { lore: "Groudon est le titan de la terre, l'incarnation du magma et des continents. La mythologie de Hoenn raconte qu'il et Kyogre se battirent pendant des millénaires — Groudon asséchant les mers, Kyogre les inondant — jusqu'à ce que Rayquaza descende du ciel pour les soumettre. Depuis, Groudon sommeille dans les entrailles de la Terre, attendant que son heure sonne à nouveau.", anecdotes: ["Sa Primo-résurgence dans ORAS le transforme en Groudon Primitif, être de lave pure.", "Un seul de ses pas peut provoquer des séismes à des milliers de kilomètres selon le Pokédex.", "C'est la mascotte de Pokémon Rubis et Pokémon Rubis Oméga."] },
  382: { lore: "Kyogre est la puissance originelle des océans. Aux origines du monde, il étendit les mers en faisant tomber des torrents de pluie sur les terres encore arides. Sa rivalité avec Groudon est l'une des plus anciennes et des plus violentes de la mythologie Pokémon — deux forces primordiales s'affrontant pour décider du destin d'un monde encore en formation.", anecdotes: ["Sa Primo-résurgence dans ORAS le transforme en Kyogre Primitif aux pouvoirs décuplés.", "Son corps génère des champs magnétiques capables d'influencer les courants marins mondiaux.", "C'est la mascotte de Pokémon Saphir et Pokémon Saphir Alpha."] },
  384: { lore: "Rayquaza règne sur la haute atmosphère depuis l'aube des temps, se nourrissant de météores et de particules cosmiques. Seul être à avoir mis un terme à la guerre millénaire entre Groudon et Kyogre, il représente l'équilibre ultime entre la terre et la mer. Gardien de la frontière entre le monde terrestre et l'espace, il ne connaît aucune limite ni aucune frontière.", anecdotes: ["Rayquaza peut Méga-évoluer sans Pierre d'Évolution — sa maîtrise de Draco-Météore suffit.", "C'est le seul Pokémon pouvant Méga-évoluer sans tenir d'objet.", "Dans ORAS, le Delta Épisode révèle son rôle cosmique contre les météorites menaçant la Terre."] },
  380: { lore: "Latias est un Pokémon empathique aux capacités extraordinaires. Elle peut réfracter la lumière autour de son corps pour devenir invisible ou prendre l'apparence d'un être humain. Liée à son frère jumeau Latios par un lien psychique indestructible, leur légende raconte qu'ils protégèrent la cité d'Alto Mare pendant des siècles, gardiens silencieux d'une ville oubliée.", anecdotes: ["Latias peut scanner les émotions et pensées des êtres qu'elle côtoie.", "Dans le film Pokémon 5, elle joue un rôle central aux côtés de Latios.", "La pierre de l'Âme, obtenue après leur aventure, permet d'accéder à Latios en Saphir."] },
  381: { lore: "Latios est l'un des Pokémon légendaires les plus intelligents jamais répertoriés. Capable de comprendre les langues humaines et de projeter des images dans l'esprit d'autrui, il peut voyager plus vite que les avions de chasse. Sa connexion spirituelle avec Latias est si profonde qu'il ressent ses émotions à des milliers de kilomètres de distance.", anecdotes: ["Latios peut projeter des visions dans l'esprit des humains comme un cinéma mental.", "Dans le film Pokémon 5, son sacrifice marque l'un des moments les plus poignants de la saga.", "La pierre de l'Âme, obtenue après leur aventure, permet d'accéder à Latias en Rubis."] },
  377: { lore: "Regirock est une entité de pierre millénaire dont le corps entier est constitué de rochers d'origines géologiques différentes. Nul ne sait s'il possède une conscience — il répare simplement ses dommages en ramassant de nouveaux rochers. Les archéologues de Hoenn pensent qu'il fut créé par une civilisation ancienne dont il ne reste aucune trace écrite.", anecdotes: ["Son accès est protégé par une énigme en morse dans la Grotte Scellée.", "Il fait partie du trio des Golems de Hoenn avec Regice et Registeel.", "Son maître, Regigigas, sommeille à l'Île du Destin."] },
  378: { lore: "Regice est un colosse de glace dont la température de surface atteint -200°C. Même en plein désert tropical, il ne fond jamais. Les légendes de Hoenn suggèrent qu'il fut créé pendant l'âge glaciaire, et que son corps renferme la mémoire d'un monde recouvert entièrement par les glaces — un monde que plus aucun être vivant ne peut imaginer.", anecdotes: ["Sa température de surface de -200°C en fait l'un des Pokémon les plus froids de la saga.", "Fait partie du trio des Golems aux côtés de Regirock et Registeel.", "Son accès est protégé par un puzzle sur l'Île Scellée, nécessitant un Pokémon avec Surf et Plongeon."] },
  379: { lore: "Registeel est une armure de métal vivant durci par la pression des profondeurs terrestres pendant des millénaires. Son métal est d'une nature inconnue de la science moderne — indestructible, immuable, résistant à toutes les attaques connues. Certains scientifiques pensent qu'il fut forgé à partir d'une météorite extraterrestre tombée à Hoenn lors d'une ère préhistorique.", anecdotes: ["Son métal est impossible à reproduire ou à analyser avec les technologies actuelles.", "Fait partie du trio des Golems aux côtés de Regirock et Regice.", "Son accès est protégé par une énigme dans la Caverne Scellée requérant Strength et Rock Smash."] },
  486: { lore: "Regigigas est le créateur légendaire des trois Golems. Selon les mythes de Hoenn, c'est lui qui sculpta Regirock, Regice et Registeel pour garder les trésors de civilisations disparues. Son pouvoir était si dévastateur qu'après la grande guerre, il fut scellé dans un sommeil éternel, enchaîné par les trois golems qu'il avait lui-même créés — une ironie cosmique que nul n'osa nommer.", anecdotes: ["Pour le réveiller, il faut obligatoirement avoir les trois Golems dans l'équipe.", "Sa capacité Début Lent divise par deux ses statistiques durant les deux premiers tours.", "Il est la mascotte officieuse du trio des Golems, leur créateur et leur maître."] },
}

export const HOENN_LEGENDARIES = [
  // ── Légendaires Hoenn natifs ──────────────────────────────────────────────
  { group: 'hoenn', id: 383, nameFr: 'Groudon',   location: 'Caverne Écarlate',            types: ['ground'],           version: 'OR', storyReq: 7, ...LORE[383] },
  { group: 'hoenn', id: 382, nameFr: 'Kyogre',    location: 'Fosse Marine',                types: ['water'],            version: 'AS', storyReq: 7, ...LORE[382] },
  { group: 'hoenn', id: 383, nameFr: 'Groudon',   location: 'Caverne Écarlate (post-game)',types: ['ground'],           version: 'AS', storyReq: 8, ...LORE[383] },
  { group: 'hoenn', id: 382, nameFr: 'Kyogre',    location: 'Fosse Marine (post-game)',    types: ['water'],            version: 'OR', storyReq: 8, ...LORE[382] },
  { group: 'hoenn', id: 384, nameFr: 'Rayquaza',  location: 'Tour Ciel',                   types: ['dragon','flying'],               storyReq: 8, ...LORE[384] },
  { group: 'hoenn', id: 380, nameFr: 'Latias',    location: 'Journée des amis',            types: ['dragon','psychic'], version: 'AS', storyReq: 8, ...LORE[380] },
  { group: 'hoenn', id: 381, nameFr: 'Latios',    location: 'Journée des amis',            types: ['dragon','psychic'], version: 'OR', storyReq: 8, ...LORE[381] },
  { group: 'hoenn', id: 377, nameFr: 'Regirock',  location: 'Grotte Scellée',              types: ['rock'],                          storyReq: 8, ...LORE[377] },
  { group: 'hoenn', id: 378, nameFr: 'Regice',    location: 'Île Scellée',                 types: ['ice'],                           storyReq: 8, ...LORE[378] },
  { group: 'hoenn', id: 379, nameFr: 'Registeel', location: 'Caverne Scellée',             types: ['steel'],                         storyReq: 8, ...LORE[379] },
  { group: 'hoenn', id: 486, nameFr: 'Regigigas', location: 'Île du Destin (post-game)',   types: ['normal'],                        storyReq: 8, ...LORE[486] },

  // ── Île du Destin — légendaires des autres régions ────────────────────────
  { group: 'eon', id: 249, nameFr: 'Lugia',     location: 'Île du Destin', types: ['psychic','flying'],  version: 'AS', storyReq: 8, ...LORE[249] },
  { group: 'eon', id: 250, nameFr: 'Ho-Oh',     location: 'Île du Destin', types: ['fire','flying'],     version: 'OR', storyReq: 8, ...LORE[250] },
  { group: 'eon', id: 243, nameFr: 'Raikou',    location: 'Île du Destin', types: ['electric'],          version: 'OR', storyReq: 8, ...LORE[243] },
  { group: 'eon', id: 244, nameFr: 'Entei',     location: 'Île du Destin', types: ['fire'],              version: 'OR', storyReq: 8, ...LORE[244] },
  { group: 'eon', id: 245, nameFr: 'Suicune',   location: 'Île du Destin', types: ['water'],             version: 'OR', storyReq: 8, ...LORE[245] },
  { group: 'eon', id: 243, nameFr: 'Raikou',    location: 'Île du Destin', types: ['electric'],          version: 'AS', storyReq: 8, ...LORE[243] },
  { group: 'eon', id: 244, nameFr: 'Entei',     location: 'Île du Destin', types: ['fire'],              version: 'AS', storyReq: 8, ...LORE[244] },
  { group: 'eon', id: 245, nameFr: 'Suicune',   location: 'Île du Destin', types: ['water'],             version: 'AS', storyReq: 8, ...LORE[245] },
  { group: 'eon', id: 150, nameFr: 'Mewtwo',    location: 'Île du Destin', types: ['psychic'],                         storyReq: 8, ...LORE[150] },
  { group: 'eon', id: 144, nameFr: 'Artikodin', location: 'Île du Destin', types: ['ice','flying'],                    storyReq: 8, ...LORE[144] },
  { group: 'eon', id: 145, nameFr: 'Électhor',  location: 'Île du Destin', types: ['electric','flying'],               storyReq: 8, ...LORE[145] },
  { group: 'eon', id: 146, nameFr: 'Sulfura',   location: 'Île du Destin', types: ['fire','flying'],                   storyReq: 8, ...LORE[146] },
  { group: 'eon', id: 480, nameFr: 'Créhelf',   location: 'Île du Destin', types: ['psychic'],                         storyReq: 8, ...LORE[480] },
  { group: 'eon', id: 481, nameFr: 'Créfollet', location: 'Île du Destin', types: ['psychic'],                         storyReq: 8, ...LORE[481] },
  { group: 'eon', id: 482, nameFr: 'Créfadet',  location: 'Île du Destin', types: ['psychic'],                         storyReq: 8, ...LORE[482] },
  { group: 'eon', id: 483, nameFr: 'Dialga',    location: 'Île du Destin', types: ['steel','dragon'],    version: 'OR', storyReq: 8, ...LORE[483] },
  { group: 'eon', id: 484, nameFr: 'Palkia',    location: 'Île du Destin', types: ['water','dragon'],    version: 'AS', storyReq: 8, ...LORE[484] },
  { group: 'eon', id: 485, nameFr: 'Heatran',   location: 'Île du Destin', types: ['fire','steel'],                    storyReq: 8, ...LORE[485] },
  { group: 'eon', id: 487, nameFr: 'Giratina',  location: 'Île du Destin', types: ['ghost','dragon'],                  storyReq: 8, ...LORE[487] },
  { group: 'eon', id: 488, nameFr: 'Cresselia', location: 'Île du Destin', types: ['psychic'],                         storyReq: 8, ...LORE[488] },
  { group: 'eon', id: 643, nameFr: 'Reshiram',  location: 'Île du Destin', types: ['dragon','fire'],     version: 'AS', storyReq: 8, ...LORE[643] },
  { group: 'eon', id: 644, nameFr: 'Zekrom',    location: 'Île du Destin', types: ['dragon','electric'], version: 'OR', storyReq: 8, ...LORE[644] },
  { group: 'eon', id: 646, nameFr: 'Kyurem',    location: 'Île du Destin', types: ['dragon','ice'],                    storyReq: 8, ...LORE[646] },
  { group: 'eon', id: 716, nameFr: 'Xerneas',   location: 'Île du Destin', types: ['fairy'],             version: 'AS', storyReq: 8, ...LORE[716] },
  { group: 'eon', id: 717, nameFr: 'Yveltal',   location: 'Île du Destin', types: ['dark','flying'],     version: 'OR', storyReq: 8, ...LORE[717] },
  { group: 'eon', id: 718, nameFr: 'Zygarde',   location: 'Île du Destin', types: ['dragon','ground'],                 storyReq: 8, ...LORE[718] },

  // ── Événements ────────────────────────────────────────────────────────────
  { group: 'event', id: 490, nameFr: 'Manaphy',   location: 'Événement', types: ['water']              },
  { group: 'event', id: 491, nameFr: 'Darkrai',   location: 'Événement', types: ['dark']               },
  { group: 'event', id: 492, nameFr: 'Shaymin',   location: 'Événement', types: ['grass']              },
  { group: 'event', id: 493, nameFr: 'Arceus',    location: 'Événement', types: ['normal']             },
  { group: 'event', id: 719, nameFr: 'Diancie',   location: 'Événement', types: ['rock','fairy']       },
  { group: 'event', id: 720, nameFr: 'Hoopa',     location: 'Événement', types: ['psychic','ghost']    },
  { group: 'event', id: 721, nameFr: 'Volcanion', location: 'Événement', types: ['fire','water']       },
]

// ── Méga-Évolutions ───────────────────────────────────────────────────────────
// stone : nom français de la Méga-Gemme (clé unique pour localStorage)
// id    : numéro national du Pokémon de base (pour le sprite)
// starterReq : 'Arcko' | 'Gobou' | 'Poussifeu' | null
export const HOENN_MEGAS = [

  // ── Méga-Gemmes Hoenn ─────────────────────────────────────────────────────
  { group: 'hoenn', id: 334, megaId: 10067, stone: 'Altarite',     nameFr: 'Altaria',   location: 'Nénucrique — montrez un Altaria à un Collectionneur' },
  { group: 'hoenn', id: 323, megaId: 10087, stone: 'Caméruptite',  nameFr: 'Camérupt',  location: 'RO : Épisode Delta (Max) · SA : Atoll de Combat (Max)' },
  { group: 'hoenn', id: 15,  megaId: 10090, stone: 'Dardargnite',  nameFr: 'Dardargnan',location: 'Lavandia Sea — salle de stockage' },
  { group: 'hoenn', id: 373, megaId: 10089, stone: 'Drattakite',   nameFr: 'Drattak',   location: 'Site Météore — donnée par une femme après l\'Épisode Delta' },
  { group: 'hoenn', id: 719, megaId: 10075, stone: 'Diancite',     nameFr: 'Diancie',   location: 'Rentrez dans un Centre Pokémon avec Diancie dans l\'équipe' },
  { group: 'hoenn', id: 80,  megaId: 10071, stone: 'Flagadossite', nameFr: 'Flagadoss', location: 'Entrée de la Grotte Tréfonds — après avoir créé un Grelot Coque' },
  { group: 'hoenn', id: 475, megaId: 10068, stone: 'Gallamite',    nameFr: 'Gallame',   location: 'Autéquia — maison du Professeur Kosmo, après l\'Épisode Delta' },
  { group: 'hoenn', id: 254, megaId: 10065, stone: 'Jungkite',     nameFr: 'Jungko',    starterReq: 'Arcko',     location: 'Pierre Rochard après Cimetronelle (Arcko) · Route 114 (1 500 ₽)' },
  { group: 'hoenn', id: 260, megaId: 10064, stone: 'Laggronite',   nameFr: 'Laggron',   starterReq: 'Gobou',     location: 'Pierre Rochard après Cimetronelle (Gobou) · Route 114 (1 500 ₽)' },
  { group: 'hoenn', id: 380, megaId: 10062, stone: 'Latiasite',    nameFr: 'Latias',    location: 'RO : Bourg-en-Vol (votre mère) · SA : sur Latias capturée' },
  { group: 'hoenn', id: 381, megaId: 10063, stone: 'Latiosite',    nameFr: 'Latios',    location: 'SA : Bourg-en-Vol (votre mère) · RO : sur Latios capturé' },
  { group: 'hoenn', id: 428, megaId: 10088, stone: 'Lockpinite',   nameFr: 'Lockpin',   location: 'Lavandia — appartements, parlez deux fois à l\'homme en noir' },
  { group: 'hoenn', id: 376, megaId: 10076, stone: 'Métalossite',  nameFr: 'Métalosse', location: 'Pierre Rochard — après avoir terminé la Ligue deux fois' },
  { group: 'hoenn', id: 531, megaId: 10069, stone: 'Nanméouïte',   nameFr: 'Nanméou',   location: 'Atoll de Combat — maison de Beladonis, après l\'avoir secouru sur la plage' },
  { group: 'hoenn', id: 362, megaId: 10074, stone: 'Oniglalite',   nameFr: 'Oniglalie', location: 'Grotte Tréfonds — salle gelée (nécessite la marée basse)' },
  { group: 'hoenn', id: 18,  megaId: 10073, stone: 'Roucarnagite', nameFr: 'Roucarnage',location: 'Mérouville — bureau de M. Rochard (montrez la Pierre Insolite)' },
  { group: 'hoenn', id: 319, megaId: 10070, stone: 'Sharpédite',   nameFr: 'Sharpedo',  location: 'SA : Épisode Delta (Arthur) · RO : Atoll de Combat (Arthur)' },
  { group: 'hoenn', id: 208, megaId: 10072, stone: 'Steelixite',   nameFr: 'Steelix',   location: 'Grotte Granite — nécessite le Vélo Course' },
  { group: 'hoenn', id: 302, megaId: 10066, stone: 'Ténéfixite',   nameFr: 'Ténéfix',   location: 'Atalanopolis — devant la Grotte Origine, à l\'Est du grand arbre' },

  // ── Méga-Gemmes X & Y ─────────────────────────────────────────────────────
  { group: 'xy', id: 359, megaId: 10057, stone: 'Absolite',      nameFr: 'Absol',      location: 'Parc Safari — nécessite le Vélo Cross' },
  { group: 'xy', id: 65,  megaId: 10037, stone: 'Alakazamite',   nameFr: 'Alakazam',   location: 'Marché de Poivressel — partie sud-ouest' },
  { group: 'xy', id: 460, megaId: 10060, stone: 'Blizzarite',    nameFr: 'Blizzaroi',  location: 'Route 123 — nord du Jardin des Baies, après la Grotte Origine' },
  { group: 'xy', id: 354, megaId: 10056, stone: 'Branettite',    nameFr: 'Branette',   location: 'Mont Mémoria — extérieur, près des tombes à l\'Est' },
  { group: 'xy', id: 257, megaId: 10050, stone: 'Braségalite',   nameFr: 'Braségali',  starterReq: 'Poussifeu', location: 'Pierre Rochard après Cimetronelle (Poussifeu) · Route 114 (1 500 ₽)' },
  { group: 'xy', id: 445, megaId: 10058, stone: 'Carchacrokite', nameFr: 'Carchacrok', location: 'Base Secrète de Millepertuis — avec le Drapeau Platine' },
  { group: 'xy', id: 212, megaId: 10046, stone: 'Cizayoxite',    nameFr: 'Cizayox',   location: 'Bois Clémenti — partie Est (nécessite Coupe)' },
  { group: 'xy', id: 308, megaId: 10054, stone: 'Charminite',    nameFr: 'Charmina',   location: 'Mont Mémoria intérieur — au sommet du monument' },
  { group: 'xy', id: 229, megaId: 10048, stone: 'Démolossite',   nameFr: 'Démolosse',  location: 'Vermilava — à côté des sources chaudes' },
  { group: 'xy', id: 6,   megaId: 10034, stone: 'Dracaufite X',  nameFr: 'Dracaufeu',  location: 'Chemin Ardent — nécessite Force' },
  { group: 'xy', id: 6,   megaId: 10035, stone: 'Dracaufite Y',  nameFr: 'Dracaufeu',  location: 'Grotte Zénith' },
  { group: 'xy', id: 94,  megaId: 10038, stone: 'Ectoplasmite',  nameFr: 'Ectoplasma', location: 'Atoll de Combat — maison du gardien de l\'île' },
  { group: 'xy', id: 310, megaId: 10055, stone: 'Élecsprintite', nameFr: 'Élecsprint', location: 'Route 110 — Piste Cyclable, petit chemin en dessous (côté Lavandia)' },
  { group: 'xy', id: 3,   megaId: 10033, stone: 'Florizarrite',  nameFr: 'Florizarre', location: 'Route 119 — dans les hautes herbes' },
  { group: 'xy', id: 306, megaId: 10053, stone: 'Galekingite',   nameFr: 'Galeking',   location: 'Tunnel Mérazon — après avoir utilisé Éclate-Roc pour dégager le tunnel' },
  { group: 'xy', id: 282, megaId: 10051, stone: 'Gardevoirite',  nameFr: 'Gardevoir',  location: 'Vergazon — maison d\'une femme, après avoir obtenu la Flûte Éon' },
  { group: 'xy', id: 115, megaId: 10039, stone: 'Kangourexite',  nameFr: 'Kangourex',  location: 'Pacifiville — à côté du Centre Pokémon' },
  { group: 'xy', id: 130, megaId: 10041, stone: 'Léviatorite',   nameFr: 'Léviator',   location: 'Route 123 — Cabane du pêcheur, offerte par Medhyèna après l\'avoir soigné' },
  { group: 'xy', id: 448, megaId: 10059, stone: 'Lucarite',      nameFr: 'Lucario',    location: 'Offerte par Liseron après avoir battu Atalante dans un Concours Master' },
  { group: 'xy', id: 150, megaId: 10043, stone: 'Mewtwoïte X',   nameFr: 'Mewtwo',     location: 'Bourg-en-Vol — à gauche du Laboratoire du Professeur Séquoia' },
  { group: 'xy', id: 150, megaId: 10044, stone: 'Mewtwoïte Y',   nameFr: 'Mewtwo',     location: 'Devant la Ligue Pokémon' },
  { group: 'xy', id: 303, megaId: 10052, stone: 'Mysdibulite',   nameFr: 'Mysdibule',  location: 'Vergazon — en passant par la Route 117' },
  { group: 'xy', id: 181, megaId: 10045, stone: 'Pharampite',    nameFr: 'Pharamp',    location: 'New Lavandia — salle du fond' },
  { group: 'xy', id: 142, megaId: 10042, stone: 'Ptéraïte',      nameFr: 'Ptéra',      location: 'Site Météore — nécessite Cascade' },
  { group: 'xy', id: 127, megaId: 10040, stone: 'Scarabruite',   nameFr: 'Scaraboss',  location: 'Route 124 — nécessite Plongée' },
  { group: 'xy', id: 214, megaId: 10047, stone: 'Scarhinoïte',   nameFr: 'Scarhino',   location: 'Route 127 — petite plage au Sud de la route' },
  { group: 'xy', id: 9,   megaId: 10036, stone: 'Tortankite',    nameFr: 'Tortank',    location: 'Le Marina (bateau Poivressel ↔ Nénucrique) — sur le pont' },
  { group: 'xy', id: 248, megaId: 10049, stone: 'Tyranocivite',  nameFr: 'Tyranocif',  location: 'Sentier Sinuroc — nécessite le Vélo Cross' },
]

// ── Exclusifs de version ──────────────────────────────────────────────────────
// Utilisé dans les rencontres : { ..., version: 'OR' } ou { ..., version: 'AS' }
// Le filtre dans App.jsx affiche uniquement les Pokémon correspondant à la version du joueur.
export const OR_EXCLUSIVES = new Set([
  140, 141,         // Kabuto, Kabutops
  250,              // Ho-Oh
  273, 274, 275,    // Grainipiot, Pifeuil, Tengalice (ligne Seedot)
  303,              // Mysdibule (Mawile)
  335,              // Mangriff (Zangoose)
  338,              // Solaroc (Solrock)
  383,              // Groudon
  410, 411,         // Dinoclier, Bastiodon
  484,              // Palkia
  538,              // Judokrak
  566, 567,         // Arkéapti, Aéroptéryx
  641,              // Boréas
  643,              // Reshiram
  690, 691,         // Venalgue, Kravarech
])

export const AS_EXCLUSIVES = new Set([
  138, 139,         // Amonita, Amonistar
  249,              // Lugia
  270, 271, 272,    // Nénupiot, Lombre, Ludicolo (ligne Lotad)
  302,              // Ténéfix (Sableye)
  336,              // Séviper
  337,              // Séléroc (Lunatone)
  382,              // Kyogre
  408, 409,         // Kranidos, Charkos
  483,              // Dialga
  539,              // Karaclée
  564, 565,         // Carapagos, Mégapagos
  642,              // Fulguris
  644,              // Zekrom
  692, 693,         // Flingouste, Gamblast
])

// ── Chapitres ─────────────────────────────────────────────────────────────────
export const CHAPTERS = [
  {
    id: 1,
    label: 'Partie 1 — Les Premiers Pas',
    zoneIds: [
      'bourg-en-vol', 'route-101', 'rosyeres', 'route-103',
      'route-102', 'clementi-ville', 'route-104-sud', 'bois-clementi',
      'route-104-nord', 'merouville', 'route-116', 'merouville-arene',
    ],
  },
  {
    id: 2,
    label: 'Partie 2 — De Mérouville à Poivressel',
    zoneIds: [
      'route-116-suite', 'tunnel-merazon', 'merouville-devon',
      'route-106', 'myokara', 'grotte-granite',
      'myokara-arene', 'grotte-granite-suite',
    ],
  },
]

// ── Zones ─────────────────────────────────────────────────────────────────────
export const ZONES = [

  // ══════════════════════════════════════════════════════
  //  CHAPITRE 1
  // ══════════════════════════════════════════════════════

  {
    id: 'bourg-en-vol',
    name: 'Bourg-en-Vol',
    type: 'town',
    icon: '🏡',
    tip: 'Ton point de départ. Règle l\'horloge dans ta chambre, parle à ta mère, puis suis ton voisin(e) sur la Route 101. Le Professeur Séquoia est en difficulté face à un Pokémon sauvage — choisis ton starter pour le repousser. Reviens au labo après la Route 103 pour recevoir le Pokédex.',
    encounters: [],
    items: [
      { name: 'Pokédex', source: 'Professeur Séquoia — au labo, après la Route 103', key: true },
      { name: 'Poké Balls ×5', source: 'Professeur Séquoia — au labo, après la Route 103', key: true },
    ],
    checklist: [
      'Régler l\'horloge dans ta chambre',
      'Parler à ta mère',
      'Suivre le voisin(e) sur la Route 101 pour rejoindre Séquoia',
      'Choisir ton starter : Arcko, Poussifeu ou Gobou',
      'Repousser le Medhyèna pour libérer le Professeur Séquoia',
      'Retourner au labo du Professeur après la Route 103',
      'Recevoir le Pokédex et les 5 Poké Balls',
    ],
  },

  {
    id: 'route-101',
    name: 'Route 101',
    type: 'route',
    icon: '🛤️',
    tip: 'Première route. Ton rival t\'y retrouve pour un tutoriel sur le Navi-Dex et l\'approche des Pokémon visibles dans les herbes. Astuce : les Zigzaton ont le talent Ramassage, qui collecte automatiquement des objets après les combats — excellent pour obtenir des Potions et Baies gratuitement.',
    encounters: [
      {
        method: 'grass',
        pokemon: [
          { id: 265, nameFr: 'Chenipotte', rate: 40, levels: '2' },
          { id: 263, nameFr: 'Zigzaton',   rate: 40, levels: '2' },
          { id: 261, nameFr: 'Medhyèna',   rate: 20, levels: '2' },
        ],
      },
      {
        method: 'horde',
        pokemon: [
          { id: 263, nameFr: 'Zigzaton ×5',   rate: 95, levels: '2' },
          { id: 261, nameFr: 'Medhyèna ×5',   rate:  5, levels: '2' },
        ],
      },
    ],
    items: [],
    checklist: [
      'Traverser la Route 101 vers Rosyères',
      'Écouter le tutoriel Navi-Dex avec ton rival',
      'Capturer un Zigzaton (talent Ramassage)',
    ],
  },

  {
    id: 'rosyeres',
    name: 'Rosyères',
    type: 'town',
    icon: '🏘️',
    tip: 'Petite ville de passage. Un vendeur t\'offre un assortiment de Potions à ton arrivée. Profites-en pour soigner ton équipe avant de continuer.',
    encounters: [],
    items: [
      { name: 'Potions ×1 (assortiment)', source: 'Vendeur à l\'entrée de la ville', key: false },
    ],
    checklist: [
      'Récupérer les Potions du vendeur',
      'Soigner ses Pokémon au Centre Pokémon',
    ],
  },

  {
    id: 'route-103',
    name: 'Route 103',
    type: 'route',
    icon: '🛤️',
    tip: 'Ton rival t\'y attend pour un premier vrai combat. Niveau 5 quelle que soit ta version — il a le starter faible face au tien. Retourne ensuite au labo du Professeur Séquoia à Bourg-en-Vol pour le Pokédex.',
    encounters: [
      {
        method: 'grass',
        pokemon: [
          { id: 263, nameFr: 'Zigzaton', rate: 60, levels: '2–3' },
          { id: 261, nameFr: 'Medhyèna', rate: 40, levels: '2–3' },
        ],
      },
    ],
    items: [],
    trainers: [
      { id: 'r103-rival-vs-gobou',     name: 'Rival si Gobou choisi',     class: 'rival', team: [{ id: 252, nameFr: 'Arcko',     level: 5 }] },
      { id: 'r103-rival-vs-arcko',     name: 'Rival si Arcko choisi',     class: 'rival', team: [{ id: 255, nameFr: 'Poussifeu', level: 5 }] },
      { id: 'r103-rival-vs-poussifeu', name: 'Rival si Poussifeu choisi', class: 'rival', team: [{ id: 258, nameFr: 'Gobou',     level: 5 }] },
    ],
    checklist: [
      'Affronter le rival (il a le starter faible face au tien)',
      'Retourner au labo de Séquoia à Bourg-en-Vol pour le Pokédex',
    ],
  },

  {
    id: 'route-102',
    name: 'Route 102',
    type: 'route',
    icon: '🛤️',
    tip: 'Ton rival te présente une fonctionnalité du Navi-Dex sur cette route. Tarsal apparaît à seulement 3% — vaut la peine d\'être capturé : il évolue en Gardevoir (Psy/Fée) ou Gallame (Psy/Combat). En Rubis Oméga, Grainipiot remplace Nénupiot dans les herbes.',
    encounters: [
      {
        method: 'grass',
        pokemon: [
          { id: 263, nameFr: 'Zigzaton',   rate: 30, levels: '2–3' },
          { id: 265, nameFr: 'Chenipotte', rate: 30, levels: '2–3' },
          { id: 261, nameFr: 'Medhyèna',   rate: 20, levels: '2–3' },
          { id: 273, nameFr: 'Grainipiot', rate: 15, levels: '2–3', version: 'OR' },
          { id: 270, nameFr: 'Nénupiot',   rate: 15, levels: '2–3', version: 'AS' },
          { id: 280, nameFr: 'Tarsal',     rate:  3, levels: '3'   },
          { id: 283, nameFr: 'Arakdo',     rate:  1, levels: '3'   },
        ],
      },
      {
        method: 'horde',
        pokemon: [
          { id: 263, nameFr: 'Zigzaton ×5',   rate: 60, levels: '2' },
          { id: 273, nameFr: 'Grainipiot ×5', rate: 35, levels: '2', version: 'OR' },
          { id: 270, nameFr: 'Nénupiot ×5',   rate: 35, levels: '2', version: 'AS' },
          { id: 283, nameFr: 'Arakdo ×5',     rate:  5, levels: '2' },
        ],
      },
      {
        method: 'surf',
        pokemon: [
          { id: 183, nameFr: 'Marill',   rate: 50, levels: '15'    },
          { id: 184, nameFr: 'Azumarill', rate: 31, levels: '20–25' },
          { id: 283, nameFr: 'Arakdo',   rate: 15, levels: '20'    },
          { id: 284, nameFr: 'Maskadra', rate:  4, levels: '25'    },
        ],
      },
      {
        method: 'canne',
        pokemon: [
          { id: 129, nameFr: 'Magicarpe',  rate: 65, levels: '10–15' },
          { id: 118, nameFr: 'Poissirène', rate: 35, levels: '5'     },
        ],
      },
      {
        method: 'super-canne',
        pokemon: [
          { id: 129, nameFr: 'Magicarpe',  rate: 60, levels: '25' },
          { id: 118, nameFr: 'Poissirène', rate: 35, levels: '25' },
          { id: 341, nameFr: 'Écrapince',  rate:  5, levels: '25' },
        ],
      },
      {
        method: 'mega-canne',
        pokemon: [
          { id: 341, nameFr: 'Écrapince', rate: 100, levels: '30–40' },
        ],
      },
    ],
    items: [
      { name: 'Potion',        source: 'Au sud-ouest de la route', key: false },
      { name: 'Baies Oran ×2', source: 'Au nord de la route',      key: false },
      { name: 'Baies Pêcha ×2',source: 'Au nord de la route',      key: false },
    ],
    trainers: [
      { id: 'r102-01', name: 'Philippe le Gamin',  class: 'youngster', team: [{ id: 263, nameFr: 'Zigzaton', level: 4 }] },
      { id: 'r102-02', name: 'Ricky le Scout',      class: 'scout',     team: [{ id: 265, nameFr: 'Chenipotte', level: 4 }] },
      { id: 'r102-03', name: 'Dixie la Fillette',   class: 'fillette',  team: [{ id: 263, nameFr: 'Zigzaton', level: 5 }] },
      { id: 'r102-04', name: 'Achille le Gamin',    class: 'youngster', team: [
        { id: 261, nameFr: 'Medhyèna',  level: 4 },
        { id: 276, nameFr: 'Nirondelle', level: 2 },
      ]},
    ],
    checklist: [
      'Écouter le tutoriel du rival sur le Navi-Dex',
      'Battre les 4 dresseurs de la route',
      'Capturer un Tarsal (rare, 3%)',
      'Récupérer la Potion (sud-ouest)',
      'Récupérer les Baies Oran ×2 et Pêcha ×2 (nord)',
    ],
  },

  {
    id: 'clementi-ville',
    name: 'Clémenti-Ville',
    type: 'town',
    icon: '🏙️',
    tip: 'Ton père Norman, Champion d\'Arène, t\'y accueille. Il te demande d\'accompagner Timmy pour capturer son premier Pokémon — une fois fait, tu reçois une mise à jour du Navi-Dex (PSS, Poké Récré, SPV). Rien d\'autre à faire ici pour le moment : l\'Arène est verrouillée.',
    encounters: [],
    items: [],
    checklist: [
      'Rencontrer Norman, ton père et Champion de l\'Arène',
      'Accompagner Timmy sur la Route 102 pour capturer son premier Pokémon',
      'Recevoir la mise à jour du Navi-Dex (PSS / Poké Récré / SPV)',
    ],
  },

  {
    id: 'route-104-sud',
    name: 'Route 104 Sud',
    type: 'route',
    icon: '🛤️',
    tip: 'Direction le Bois Clémenti au nord. Goélise est très utile : il peut apprendre Vol ET Surf, en faire un HM mule idéal. Capture-en un ici.',
    encounters: [
      {
        method: 'grass',
        pokemon: [
          { id: 263, nameFr: 'Zigzaton',   rate: 40, levels: '2–5' },
          { id: 265, nameFr: 'Chenipotte', rate: 40, levels: '2–5' },
          { id: 278, nameFr: 'Goélise',    rate: 15, levels: '3–5' },
          { id: 276, nameFr: 'Nirondelle', rate:  5, levels: '3–5' },
        ],
      },
      {
        method: 'horde',
        pokemon: [
          { id: 263, nameFr: 'Zigzaton ×5', rate: 95, levels: '2' },
          { id: 278, nameFr: 'Goélise ×5',  rate:  5, levels: '2' },
        ],
      },
      {
        method: 'surf',
        pokemon: [
          { id: 278, nameFr: 'Goélise', rate: 95, levels: '15–20' },
          { id: 279, nameFr: 'Bekipan', rate:  5, levels: '25'    },
        ],
      },
      {
        method: 'canne',
        pokemon: [{ id: 129, nameFr: 'Magicarpe', rate: 100, levels: '5–15' }],
      },
      {
        method: 'super-canne',
        pokemon: [{ id: 129, nameFr: 'Magicarpe', rate: 100, levels: '25' }],
      },
      {
        method: 'mega-canne',
        pokemon: [{ id: 129, nameFr: 'Magicarpe', rate: 100, levels: '30–40' }],
      },
    ],
    items: [
      { name: 'Poké Ball',      source: 'À l\'est, accessible via le Bois Clémenti', key: false },
      { name: 'Baies Pêcha ×2', source: 'Près de l\'entrée du Bois Clémenti',        key: false },
      { name: 'Baies Oran ×2',  source: 'Près de l\'entrée du Bois Clémenti',        key: false },
    ],
    trainers: [
      { id: 'r104s-01', name: 'Raymond le Gamin', class: 'youngster', team: [
        { id: 273, nameFr: 'Grainipiot', level: 4 },
        { id: 276, nameFr: 'Nirondelle', level: 6 },
      ]},
      { id: 'r104s-02', name: 'Tristan le Richard', class: 'gentleman', team: [
        { id: 263, nameFr: 'Zigzaton', level: 8 },
      ]},
    ],
    checklist: [
      'Battre les 2 dresseurs',
      'Capturer un Goélise (Vol + Surf)',
      'Récupérer la Poké Ball (est, via le Bois Clémenti)',
    ],
  },

  {
    id: 'bois-clementi',
    name: 'Bois Clémenti',
    type: 'cave',
    icon: '🌲',
    tip: 'Avant d\'entrer, va à l\'ouest récupérer la Poké Ball sur la Route 104 Sud. Au fond du bois, un sbire de la Team Magma (OR) ou Aqua (AS) s\'en prend à un employé de la Devon SARL — bats-le pour recevoir le Multi Exp (partage d\'expérience pour toute l\'équipe). Parecool est rare mais vaut le coup : il évolue en Monaflèche, l\'un des Pokémon avec les meilleures stats du jeu.',
    encounters: [
      {
        method: 'grass',
        pokemon: [
          { id: 263, nameFr: 'Zigzaton',   rate: 30, levels: '4–6' },
          { id: 265, nameFr: 'Chenipotte', rate: 30, levels: '4–6' },
          { id: 266, nameFr: 'Armulys',    rate: 10, levels: '6'   },
          { id: 268, nameFr: 'Blindalys',  rate: 10, levels: '6'   },
          { id: 285, nameFr: 'Balignon',   rate: 10, levels: '5'   },
          { id: 276, nameFr: 'Nirondelle', rate:  5, levels: '5'   },
          { id: 287, nameFr: 'Parecool',   rate:  5, levels: '5'   },
        ],
      },
      {
        method: 'horde',
        pokemon: [
          { id: 265, nameFr: 'Chenipotte ×5', rate: 60, levels: '3' },
          { id: 263, nameFr: 'Zigzaton ×5',   rate: 35, levels: '3' },
          { id: 285, nameFr: 'Balignon ×5',   rate:  5, levels: '3' },
        ],
      },
    ],
    items: [
      { name: 'Anti-Para',   source: 'Au sud-ouest du bois', key: false },
      { name: 'Multi Exp',   source: 'Offert par l\'employé de la Devon SARL (après avoir battu le sbire)', key: true },
      { name: 'Super Ball',  source: 'Offerte par l\'employé de la Devon SARL', key: false },
      { name: 'Huile',       source: 'Au nord-ouest du bois', key: false },
      { name: 'Grain Miracle', source: 'Offert par un garçon au nord (après CS Coupe)', key: false },
      { name: 'Super Ball',  source: 'Au nord-est, avant le fossé (après CS Coupe)', key: false },
      { name: 'Attaque +',   source: 'À l\'est après le premier fossé (après CS Coupe)', key: false },
    ],
    trainers: [
      { id: 'bois-01', name: 'Jullion le Scout', class: 'scout', team: [
        { id: 265, nameFr: 'Chenipotte', level: 5 },
        { id: 265, nameFr: 'Chenipotte', level: 5 },
        { id: 265, nameFr: 'Chenipotte', level: 5 },
      ]},
      { id: 'bois-02', name: 'Odon le Scout', class: 'scout', team: [
        { id: 290, nameFr: 'Ningale', level: 8 },
      ]},
      { id: 'bois-03', name: 'Sbire Team Magma (Rubis Oméga)', class: 'rocket', team: [
        { id: 261, nameFr: 'Medhyèna', level: 9 },
      ]},
      { id: 'bois-04', name: 'Sbire Team Aqua (Saphir Alpha)', class: 'rocket', team: [
        { id: 261, nameFr: 'Medhyèna', level: 9 },
      ]},
    ],
    checklist: [
      'Récupérer la Poké Ball sur la Route 104 Sud (à l\'ouest avant d\'entrer)',
      'Battre Jullion le Scout',
      'Battre Odon le Scout',
      'Battre le Sbire de la Team et récupérer le Multi Exp',
      'Récupérer l\'Anti-Para (sud-ouest)',
      'Récupérer la Huile (nord-ouest)',
      'Capturer un Parecool (5%, évolue en Monaflèche)',
    ],
  },

  {
    id: 'route-104-nord',
    name: 'Route 104 Nord',
    type: 'route',
    icon: '🛤️',
    tip: 'À l\'ouest, le Fleuriste Jolie Fleur — récupère le Wailmerrosoir et une baie à planter. Juste au sud du fleuriste, un personnage t\'offre la CT49 Écho. Continue vers l\'est pour rejoindre Mérouville.',
    encounters: [
      {
        method: 'grass',
        pokemon: [
          { id: 263, nameFr: 'Zigzaton',   rate: 40, levels: '4–7' },
          { id: 265, nameFr: 'Chenipotte', rate: 40, levels: '4–7' },
          { id: 276, nameFr: 'Nirondelle', rate: 15, levels: '5–7' },
          { id: 278, nameFr: 'Goélise',    rate:  5, levels: '5–7' },
        ],
      },
      {
        method: 'horde',
        pokemon: [
          { id: 263, nameFr: 'Zigzaton ×5',   rate: 95, levels: '3' },
          { id: 276, nameFr: 'Nirondelle ×5', rate:  5, levels: '3' },
        ],
      },
      {
        method: 'surf',
        pokemon: [
          { id: 278, nameFr: 'Goélise', rate: 95, levels: '15–20' },
          { id: 279, nameFr: 'Bekipan', rate:  5, levels: '25'    },
        ],
      },
      {
        method: 'canne',
        pokemon: [{ id: 129, nameFr: 'Magicarpe', rate: 100, levels: '5–15' }],
      },
      {
        method: 'super-canne',
        pokemon: [{ id: 129, nameFr: 'Magicarpe', rate: 100, levels: '25' }],
      },
      {
        method: 'mega-canne',
        pokemon: [{ id: 129, nameFr: 'Magicarpe', rate: 100, levels: '30–40' }],
      },
    ],
    items: [
      { name: 'CT49 Écho',     source: 'Personnage au sud du Fleuriste Jolie Fleur', key: false },
      { name: 'Attaque +',     source: 'Dans les hautes herbes au nord du Fleuriste', key: false },
      { name: 'Wailmerrosoir', source: 'Maître des Baies au Fleuriste Jolie Fleur', key: false },
      { name: 'Baie Maron',    source: 'Vieille dame près des hautes herbes au nord', key: false },
      { name: 'Baies Oran ×2', source: 'Près de la sortie du Bois Clémenti',          key: false },
      { name: 'Baies Ceriz ×2',source: 'Près de la sortie du Bois Clémenti',          key: false },
      { name: 'Baies Pêcha ×3',source: 'Près de la sortie du Bois Clémenti',          key: false },
      { name: 'Baies Oran ×8', source: 'Au nord-est, après le ponton',                key: false },
      { name: 'Baies Ceriz ×4',source: 'Au nord-est, après le ponton',                key: false },
      { name: 'Rappel',        source: 'Au sud-est près du ponton (après CS Coupe)',   key: false },
    ],
    trainers: [
      { id: 'r104n-01', name: 'Émilie la Mademoiselle', class: 'lass', team: [
        { id: 263, nameFr: 'Zigzaton', level: 10 },
      ]},
      { id: 'r104n-02', name: 'Eliza la Fillette', class: 'fillette', team: [
        { id: 270, nameFr: 'Nénupiot', level: 6 },
        { id: 285, nameFr: 'Balignon', level: 8 },
      ]},
      { id: 'r104n-03', name: 'Ava & Aya les Jumelles', class: 'twins', team: [
        { id: 273, nameFr: 'Grainipiot', level: 9 },
        { id: 270, nameFr: 'Nénupiot',   level: 9 },
      ]},
      { id: 'r104n-04', name: 'Stéphane le Pêcheur', class: 'pêcheur', team: [
        { id: 129, nameFr: 'Magicarpe', level: 7 },
        { id: 129, nameFr: 'Magicarpe', level: 7 },
        { id: 129, nameFr: 'Magicarpe', level: 7 },
      ]},
    ],
    checklist: [
      'Battre les 4 dresseurs',
      'Récupérer la CT49 Écho (sud du Fleuriste)',
      'Récupérer le Wailmerrosoir au Fleuriste Jolie Fleur',
    ],
  },

  {
    id: 'merouville',
    name: 'Mérouville',
    type: 'town',
    icon: '⛏️',
    tip: 'Soigne ton équipe et récupère les objets avant l\'arène. L\'Arène de Roxanne est au nord-est. CS01 Coupe disponible dans la maison Coupcoup — utilisable hors combat après le Badge Roche. Tu peux aussi échanger un Makuhita contre un Parecool dans la maison adjacente à l\'arène.',
    encounters: [],
    items: [
      { name: 'Défense +',     source: 'Au sud-est, accessible depuis la Route 104', key: false },
      { name: 'CT54 Faux-Chage', source: 'Homme d\'affaires dans la Boutique Pokémon', key: false },
      { name: 'Honor Ball',    source: 'Jeune homme, maison au nord du Centre Pokémon', key: false },
      { name: 'Pierrallégée', source: 'Topdresseur, maison au nord du Centre Pokémon', key: false },
      { name: 'CS01 Coupe',    source: 'Maison Coupcoup (utilisable hors combat après Badge Roche)', key: true },
      { name: 'Vive Griffe',   source: 'Professeur de l\'École des Dresseurs', key: false },
    ],
    checklist: [
      'Soigner son équipe au Centre Pokémon',
      'Récupérer la CT54 Faux-Chage (boutique)',
      'Récupérer la CS01 Coupe (maison Coupcoup)',
      'Récupérer la Vive Griffe (École des Dresseurs)',
      'Récupérer la Pierrallégée (maison au nord du Centre)',
      'Monter l\'équipe au niveau 15 avant l\'arène',
    ],
  },

  {
    id: 'route-116',
    name: 'Route 116',
    type: 'route',
    icon: '🛤️',
    tip: 'À l\'est de Mérouville — bonne zone pour niveler avant l\'arène. Chuchmur est utile contre les arènes suivantes (type Combat). Ningale évolue en Ninjask + Shedinja avec une Poké Ball libre dans l\'équipe. Note le Tunnel Mérazon à l\'est : on y reviendra après le Badge Roche.',
    encounters: [
      {
        method: 'grass',
        pokemon: [
          { id: 263, nameFr: 'Zigzaton',  rate: 30, levels: '6–8' },
          { id: 293, nameFr: 'Chuchmur',  rate: 30, levels: '5–7' },
          { id: 290, nameFr: 'Ningale',   rate: 30, levels: '6–8' },
          { id: 276, nameFr: 'Nirondelle',rate: 15, levels: '6–8' },
          { id: 300, nameFr: 'Skitty',    rate:  5, levels: '8'   },
        ],
      },
      {
        method: 'horde',
        pokemon: [
          { id: 263, nameFr: 'Zigzaton ×5', rate: 60, levels: '4' },
          { id: 290, nameFr: 'Ningale ×5',  rate: 35, levels: '4' },
          { id: 300, nameFr: 'Skitty ×5',   rate:  5, levels: '4' },
        ],
      },
    ],
    items: [
      { name: 'Repousse', source: 'Dans les hautes herbes, près d\'Emilio le Scout', key: false },
      { name: 'Spécial +', source: 'À l\'est de l\'entrée du Tunnel Mérazon, premier plateau', key: false },
      { name: 'Potion',    source: 'Au nord-ouest, près de Fred le Gamin', key: false },
    ],
    trainers: [
      { id: 'r116-01', name: 'Emilio le Scout',      class: 'scout',   team: [
        { id: 265, nameFr: 'Chenipotte', level: 7 },
        { id: 290, nameFr: 'Ningale',    level: 7 },
        { id: 266, nameFr: 'Armulys',    level: 7 },
      ]},
      { id: 'r116-02', name: 'Monique la Fillette',  class: 'fillette', team: [
        { id: 183, nameFr: 'Marill', level: 10 },
      ]},
      { id: 'r116-03', name: 'Fred le Gamin',        class: 'youngster', team: [
        { id: 263, nameFr: 'Zigzaton', level: 7 },
        { id: 66,  nameFr: 'Machoc',   level: 9 },
      ]},
      { id: 'r116-04', name: 'Norbert le Montagnard', class: 'hiker', team: [
        { id: 74, nameFr: 'Racaillou', level: 10 },
        { id: 74, nameFr: 'Racaillou', level: 10 },
      ]},
    ],
    checklist: [
      'Battre les 4 dresseurs',
      'Récupérer le Repousse',
      'Récupérer la Potion (nord-ouest)',
      'Capturer un Ningale (évolue en Ninjask + Shedinja)',
    ],
  },

  // ══════════════════════════════════════════════════════
  //  CHAPITRE 2
  // ══════════════════════════════════════════════════════

  {
    id: 'route-116-suite',
    name: 'Route 116 (suite)',
    type: 'route',
    icon: '🌿',
    tip: 'Avec la CS Coupe obtenue à Mérouville, accédez à la zone nord de la route pour retrouver le scientifique. Deux dresseurs supplémentaires et plusieurs objets cachés derrière les haies vous y attendent.',
    encounters: [],
    items: [
      { name: 'Huile',          source: 'Près des arbres à Baies, après avoir traversé les haies', key: false },
      { name: 'Super Potion',   source: 'Cachée sous l\'arbre le plus foncé, au sud de la zone',    key: false },
      { name: 'Baies Maron ×6', source: 'Au nord-ouest, après avoir traversé les haies',             key: false },
    ],
    trainers: [
      { id: 'r116s-01', name: 'Connor l\'Élève',  class: 'intello', team: [
        { id: 280, nameFr: 'Tarsal',    level: 10 },
      ]},
      { id: 'r116s-02', name: 'Hillary l\'Élève', class: 'intello', team: [
        { id: 285, nameFr: 'Balignon', level: 8 },
        { id: 293, nameFr: 'Chuchmur', level: 8 },
      ]},
    ],
    checklist: [
      'Utiliser la CS Coupe pour accéder à la zone nord',
      'Battre Connor l\'Élève (Tarsal niv. 10)',
      'Battre Hillary l\'Élève (Balignon + Chuchmur niv. 8)',
      'Récupérer l\'Huile (près des arbres à Baies)',
      'Récupérer la Super Potion (sous l\'arbre le plus foncé)',
      'Récupérer les Baies Maron ×6 (nord-ouest)',
    ],
  },

  {
    id: 'tunnel-merazon',
    name: 'Tunnel Mérazon',
    type: 'cave',
    icon: '🚇',
    tip: 'Le Sbire de la Team (Magma en OR, Aqua en AS) a volé le Pack Devon d\'un scientifique. Battez-le pour le récupérer. Chuchmur est l\'unique rencontre au sol — parfait si tu ne l\'as pas encore capturé.',
    encounters: [
      {
        method: 'grass',
        pokemon: [
          { id: 293, nameFr: 'Chuchmur', rate: 100, levels: '7–10' },
        ],
      },
      {
        method: 'eclate-roc',
        pokemon: [
          { id: 74, nameFr: 'Racaillou', rate: 100, levels: '14–17' },
        ],
      },
      {
        method: 'horde',
        pokemon: [
          { id: 293, nameFr: 'Chuchmur ×5', rate: 100, levels: '5' },
        ],
      },
    ],
    items: [
      { name: 'Poké Ball',  source: 'Au nord-ouest, sur la petite zone surélevée', key: false },
      { name: 'Pack Devon', source: 'Rendu par le Sbire après le combat',           key: true  },
    ],
    trainers: [
      { id: 'tun-01', name: 'Sbire Team Magma (OR)', class: 'rocket', team: [
        { id: 261, nameFr: 'Medhyèna', level: 13 },
      ]},
      { id: 'tun-02', name: 'Sbire Team Aqua (AS)',  class: 'rocket', team: [
        { id: 261, nameFr: 'Medhyèna', level: 13 },
      ]},
    ],
    checklist: [
      'Entrer dans le Tunnel Mérazon',
      'Battre le Sbire Team Magma (OR) / Sbire Team Aqua (AS)',
      'Récupérer le Pack Devon',
      'Récupérer la Poké Ball (nord-ouest, zone surélevée)',
    ],
  },

  {
    id: 'merouville-devon',
    name: 'Mérouville — Devon SARL',
    type: 'town',
    icon: '🏢',
    tip: 'Retournez au scientifique devant le siège de la Devon SARL. Il vous présente au directeur M. Rochard, qui améliore votre Poké Multi-Navi avec la Navi-Show et vous confie une lettre à remettre à Pierre au Village Myokara.',
    encounters: [],
    items: [
      { name: 'Super Ball',     source: 'Offerte par l\'employé de la Devon SARL',       key: false },
      { name: 'Lettre à Pierre', source: 'Confiée par M. Rochard (à remettre à Pierre)', key: true  },
    ],
    trainers: [],
    checklist: [
      'Parler au scientifique à l\'entrée de la Devon SARL',
      'Rencontrer le directeur M. Rochard',
      'Recevoir la fonction Navi-Show pour le Poké Multi-Navi',
      'Récupérer la Super Ball (employé)',
      'Récupérer la Lettre à Pierre (M. Rochard)',
      'Soigner son équipe puis traverser le Bois Clémenti vers M. Marco',
    ],
  },

  {
    id: 'route-106',
    name: 'Route 106',
    type: 'route',
    icon: '🛤️',
    tip: 'Route côtière au sud de Mérouville. Trois dresseurs dont deux pêcheurs. La Protéine se trouve à l\'extrémité ouest en longeant la plage. Wailmer (Super Canne) évolue en Wailord — l\'un des Pokémon les plus imposants du jeu.',
    encounters: [
      {
        method: 'surf',
        pokemon: [
          { id: 72,  nameFr: 'Tentacool', rate: 65, levels: '20–25' },
          { id: 278, nameFr: 'Goélise',   rate: 30, levels: '20'    },
          { id: 279, nameFr: 'Bekipan',   rate:  5, levels: '25–30' },
        ],
      },
      {
        method: 'canne',
        pokemon: [
          { id: 129, nameFr: 'Magicarpe', rate: 65, levels: '10–15' },
          { id: 72,  nameFr: 'Tentacool', rate: 35, levels: '5'     },
        ],
      },
      {
        method: 'super-canne',
        pokemon: [
          { id: 129, nameFr: 'Magicarpe', rate: 60, levels: '25' },
          { id: 72,  nameFr: 'Tentacool', rate: 35, levels: '25' },
          { id: 320, nameFr: 'Wailmer',   rate:  5, levels: '25' },
        ],
      },
      {
        method: 'mega-canne',
        pokemon: [
          { id: 320, nameFr: 'Wailmer', rate: 100, levels: '30–40' },
        ],
      },
    ],
    items: [
      { name: 'Protéine', source: 'Vers l\'ouest, en suivant la plage au plus près de l\'eau', key: false },
    ],
    trainers: [
      { id: 'r106-01', name: 'Johnny le Randonneur', class: 'hiker', team: [
        { id: 287, nameFr: 'Parecool', level: 13 },
      ]},
      { id: 'r106-02', name: 'Chaz le Pêcheur', class: 'pêcheur', team: [
        { id: 129, nameFr: 'Magicarpe', level: 10 },
        { id: 72,  nameFr: 'Tentacool', level: 12 },
      ]},
      { id: 'r106-03', name: 'Smith le Pêcheur', class: 'pêcheur', team: [
        { id: 72, nameFr: 'Tentacool', level: 13 },
      ]},
    ],
    checklist: [
      'Battre les 3 dresseurs',
      'Récupérer la Protéine (longe la plage à l\'ouest)',
    ],
  },

  {
    id: 'myokara',
    name: 'Village Myokara',
    type: 'town',
    icon: '⚓',
    tip: 'Récupérez en priorité le Mouchoir Soie (maison près du ponton) et la Canne (pêcheur au sud). Trois dresseurs au nord pour grinder avant l\'arène. N\'oubliez pas de remettre la Lettre à Pierre.',
    encounters: [],
    items: [
      { name: 'Mouchoir Soie', source: 'Dans la maison à côté du ponton',      key: false },
      { name: 'Canne',         source: 'Offerte par le pêcheur au sud de l\'arène', key: true },
    ],
    trainers: [],
    checklist: [
      'Récupérer le Mouchoir Soie (maison près du ponton)',
      'Récupérer la Canne (pêcheur au sud)',
      'Soigner son équipe au Centre Pokémon',
      'Battre les 3 dresseurs au nord du village',
    ],
  },

  {
    id: 'grotte-granite',
    name: 'Grotte Granite',
    type: 'cave',
    icon: '🪨',
    tip: 'L\'accès au fond est bloqué pour l\'instant — récupérez la CT70 Flash à l\'entrée. Makuhita évolue en Hariyama (très utile pour les prochaines arènes). Abra (15%) évolue en Alakazam.',
    encounters: [
      {
        method: 'cave',
        pokemon: [
          { id: 41,  nameFr: 'Nosférapti', rate: 40, levels: '9–12'  },
          { id: 296, nameFr: 'Makuhita',   rate: 40, levels: '9–12'  },
          { id: 63,  nameFr: 'Abra',       rate: 15, levels: '10–12' },
          { id: 74,  nameFr: 'Racaillou',  rate:  5, levels: '10–12' },
        ],
      },
      {
        method: 'horde',
        pokemon: [
          { id: 41,  nameFr: 'Nosférapti ×5',              rate: 60, levels: '6' },
          { id: 296, nameFr: 'Makuhita ×4 / Racaillou ×1', rate: 35, levels: '6' },
          { id: 296, nameFr: 'Makuhita ×5',                rate:  5, levels: '6' },
        ],
      },
    ],
    items: [
      { name: 'CT70 Flash', source: 'Offerte par le Montagnard près des escaliers menant au fond', key: false },
    ],
    trainers: [],
    checklist: [
      'Récupérer la CT70 Flash (Montagnard près des escaliers)',
      'Capturer un Makuhita (Combat, évolue en Hariyama)',
      'Capturer un Abra si besoin (15%, évolue en Alakazam)',
    ],
  },

  {
    id: 'myokara-arene',
    name: 'Arène de Village Myokara',
    type: 'gym',
    icon: '🏆',
    tip: 'Arène de type Combat. Psy et Vol sont très efficaces : Tarsal avec ses attaques Psy, Nirondelle ou Goélise avec Cru-Aile. L\'énigme repose sur des interrupteurs à activer après chaque combat.',
    encounters: [],
    items: [
      { name: 'CT08 Gonflette', source: 'Bastien — récompense de victoire', key: false },
    ],
    trainers: [
      { id: 'gym2-01', name: 'Cammie la Combattante', class: 'fighter', team: [
        { id: 307, nameFr: 'Méditikka', level: 13 },
      ]},
      { id: 'gym2-02', name: 'Ken le Karatéka', class: 'fighter', team: [
        { id: 66, nameFr: 'Machoc', level: 13 },
      ]},
      { id: 'gym2-03', name: 'Shinobu la Combattante', class: 'fighter', team: [
        { id: 307, nameFr: 'Méditikka', level: 11 },
        { id: 66,  nameFr: 'Machoc',    level: 11 },
      ]},
    ],
    checklist: [
      'Battre Cammie la Combattante (Méditikka niv. 13)',
      'Battre Ken le Karatéka (Machoc niv. 13)',
      'Battre Shinobu la Combattante (Méditikka + Machoc niv. 11)',
      'Activer les interrupteurs après chaque combat pour dégager le passage',
      'Battre le Champion Bastien',
      'Obtenir le Badge Poing',
      'Recevoir la CT08 Gonflette',
    ],
    gym: {
      badgeId: 2,
      leader: 'Bastien',
      leaderTitle: 'Maître du Combat',
      specialty: ['fighting'],
      team: [
        { id: 66,  nameFr: 'Machoc',   level: 14, types: ['fighting'], note: 'Groz\'Yeux / Poing-Karaté / Frappe Atlas / Gonflette' },
        { id: 296, nameFr: 'Makuhita', level: 16, types: ['fighting'], note: 'Cogne / Sabotage / Jet de Sable / Gonflette' },
      ],
      weaknesses: ['flying', 'psychic', 'fairy'],
      strategy: 'Bastien utilise Gonflette pour booster son Attaque et peut soigner avec une Super Potion. Jet de Sable réduit ta Précision, Groz\'Yeux abaisse ta Défense. Tarsal avec des attaques Psy, Nirondelle ou Goélise avec Cru-Aile font des ravages.',
      tips: [
        'Gonflette monte l\'Attaque de +2 — frappe vite avant qu\'il ait le temps de se booster.',
        'Jet de Sable réduit ta Précision — garde des Antibrume ou passe à l\'offensive immédiatement.',
        'Niveau recommandé : 16–17.',
      ],
      recommended: [280, 276, 278],
    },
  },

  {
    id: 'grotte-granite-suite',
    name: 'Grotte Granite — Fond',
    type: 'cave',
    icon: '📜',
    tip: 'Badge Poing en poche, le fond de la Grotte Granite est désormais accessible. Pierre vous y attend pour recevoir la lettre de M. Rochard — il vous remercie avec la CT51 Aile d\'Acier.',
    encounters: [],
    items: [
      { name: 'CT51 Aile d\'Acier', source: 'Donnée par Pierre après lui avoir remis la lettre', key: true },
    ],
    trainers: [],
    checklist: [
      'Retourner à la Grotte Granite (fond accessible avec le Badge Poing)',
      'Rejoindre Pierre au fond de la grotte',
      'Lui remettre la Lettre de M. Rochard',
      'Recevoir la CT51 Aile d\'Acier',
      'Retourner chez M. Marco pour embarquer vers Poivressel',
    ],
  },

  {
    id: 'merouville-arene',
    name: 'Arène de Mérouville',
    type: 'gym',
    icon: '🏆',
    tip: 'Arène de type Roche. Les trois starters s\'en sortent bien ici : Gobou avec ses attaques Eau, Arcko avec ses attaques Plante, et Galifeu qui apprend Double-Pied (Combat) dès son évolution au niveau 16. Vise le niveau 15–16 avant d\'affronter Roxanne.',
    encounters: [],
    items: [
      { name: 'CT39 Tomberoche', source: 'Roxanne — récompense de victoire', key: false },
    ],
    trainers: [
      { id: 'gym1-01', name: 'Ali le Gamin',      class: 'youngster', team: [
        { id: 74, nameFr: 'Racaillou', level: 7 },
        { id: 74, nameFr: 'Racaillou', level: 9 },
      ]},
      { id: 'gym1-02', name: 'Pietro le Gamin',   class: 'youngster', team: [
        { id: 74, nameFr: 'Racaillou', level: 10 },
      ]},
      { id: 'gym1-03', name: 'Nicolette l\'Élève', class: 'intello', team: [
        { id: 74, nameFr: 'Racaillou', level: 10 },
      ]},
    ],
    checklist: [
      'Battre Ali le Gamin',
      'Battre Pietro le Gamin',
      'Battre Nicolette l\'Élève',
      'Battre la Championne Roxanne',
      'Obtenir le Badge Roche',
      'Recevoir la CT39 Tomberoche',
    ],
    gym: {
      badgeId: 1,
      leader: 'Roxanne',
      leaderTitle: 'Maîtresse des Roches',
      specialty: ['rock'],
      team: [
        { id: 74,  nameFr: 'Racaillou', level: 12, types: ['rock','ground'], note: 'Charge / Boul\'Armure / Tomberoche' },
        { id: 299, nameFr: 'Tarinor',   level: 14, types: ['rock'],          note: 'Charge / Armure / Tomberoche' },
      ],
      weaknesses: ['water', 'grass', 'fighting', 'ground', 'steel'],
      strategy: 'Roxanne mise sur la défense (Armure, Boul\'Armure) et Tomberoche pour faire des dégâts. Gobou avec Pistolet à O est idéal. Arcko avec Vol-Vie ou des attaques Plante fonctionne aussi. Si tu as évolué en Galifeu (niv. 16), Double-Pied fait des ravages.',
      tips: [
        'Armure/Boul\'Armure augmente sa Défense — attaque vite pour ne pas laisser le temps de se booster.',
        'Tomberoche peut faire tressaillir (empêche d\'agir) — garde des Potions en réserve.',
        'Niveau recommandé : 15–16.',
      ],
      recommended: [258, 252, 255],
    },
  },
]
