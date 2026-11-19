// Contenu de Culto.
// Chaque leçon : des fiches « À savoir », des questions, et une « phrase pour briller ».
// Types de questions :
//   qcm   : q, choices (la BONNE réponse est toujours la première, mélangée à l'affichage)
//   gap   : phrase à trous (« ___ »), choices comme qcm
//   vf    : affirmation, a = true/false
//   pairs : associer, pairs = [[gauche, droite], …]
//   order : remettre dans l'ordre, items = ordre correct
// « why » s'affiche après la réponse.

export const THEMES = [
  {
    id: 'arts',
    name: 'Peinture',
    emoji: '🎨',
    color: '#E85D75',
    lessons: [
      {
        title: 'Les impressionnistes',
        cards: [
          { title: 'Une insulte devenue un nom', text: 'En 1874, Claude Monet expose « Impression, soleil levant ». Le critique Louis Leroy se moque : ces peintres ne font que des « impressions ». Le nom est resté.' },
          { title: 'Peindre la lumière', text: 'Monet, Renoir, Degas, Pissarro, Sisley ou Berthe Morisot peignent souvent en plein air, par petites touches visibles, pour saisir la lumière et l\'instant.' },
        ],
        questions: [
          { t: 'qcm', q: 'Quel tableau a donné son nom à l\'impressionnisme ?', choices: ['Impression, soleil levant', 'Le Déjeuner sur l\'herbe', 'Les Nymphéas', 'La Liberté guidant le peuple'], why: 'Peint par Monet en 1872, exposé en 1874 et moqué par le critique Louis Leroy.' },
          { t: 'vf', q: 'Edgar Degas est surtout célèbre pour ses danseuses.', a: true, why: 'Il en a peint, dessiné et sculpté plus d\'un millier, dont la fameuse « Petite Danseuse de quatorze ans ».' },
          { t: 'qcm', q: 'Où Monet a-t-il peint ses célèbres Nymphéas ?', choices: ['Giverny', 'Argenteuil', 'Arles', 'Étretat'], why: 'Dans le jardin d\'eau de sa maison de Giverny, en Normandie, où il a vécu plus de 40 ans.' },
          { t: 'pairs', q: 'Associe chaque peintre à son tableau', pairs: [['Monet', 'Les Nymphéas'], ['Renoir', 'Bal du moulin de la Galette'], ['Degas', 'La Classe de danse'], ['Manet', 'Olympia']] },
          { t: 'vf', q: 'Aucune femme ne faisait partie du groupe des impressionnistes.', a: false, why: 'Berthe Morisot était là dès la première exposition de 1874, et l\'Américaine Mary Cassatt les a rejoints ensuite.' },
          { t: 'gap', q: 'Le musée d\'___, à Paris, abrite la plus grande collection impressionniste au monde.', choices: ['Orsay', 'Louvre', 'Pompidou', 'Picasso'], why: 'Le musée d\'Orsay est installé dans une ancienne gare inaugurée pour l\'Exposition universelle de 1900.' },
        ],
        shine: 'Le mot « impressionniste » était une moquerie : un critique s\'est payé la tête du tableau de Monet en 1874, et les peintres ont fini par adopter le nom.',
      },
      {
        title: 'La Renaissance italienne',
        cards: [
          { title: 'Le trio de génies', text: 'Léonard de Vinci, Michel-Ange et Raphaël dominent la Renaissance italienne (XVe–XVIe siècles), qui redécouvre l\'Antiquité et invente la perspective moderne.' },
          { title: 'La Joconde, française ?', text: 'Léonard emporte la Joconde en France quand François Ier l\'invite à Amboise. Il y meurt en 1519 et le tableau rejoint les collections royales, puis le Louvre.' },
        ],
        questions: [
          { t: 'qcm', q: 'Qui a peint le plafond de la chapelle Sixtine ?', choices: ['Michel-Ange', 'Raphaël', 'Léonard de Vinci', 'Botticelli'], why: 'Entre 1508 et 1512, à la demande du pape Jules II. Il se considérait pourtant avant tout comme sculpteur.' },
          { t: 'vf', q: 'La Joconde est arrivée en France grâce aux conquêtes de Napoléon.', a: false, why: 'C\'est Léonard lui-même qui l\'a apportée en France, invité par François Ier, vers 1516.' },
          { t: 'qcm', q: 'Où Léonard de Vinci est-il mort ?', choices: ['Amboise', 'Florence', 'Rome', 'Milan'], why: 'Au manoir du Clos Lucé, à Amboise, en 1519. Il est enterré dans la chapelle du château.' },
          { t: 'pairs', q: 'Associe chaque artiste à son œuvre', pairs: [['Botticelli', 'La Naissance de Vénus'], ['Léonard de Vinci', 'La Cène'], ['Raphaël', 'L\'École d\'Athènes'], ['Michel-Ange', 'Le David']] },
          { t: 'vf', q: 'La Joconde a été volée au Louvre en 1911.', a: true, why: 'Par Vincenzo Peruggia, un vitrier italien. Elle a été retrouvée à Florence deux ans plus tard.' },
          { t: 'order', q: 'Du plus âgé au plus jeune', items: ['Botticelli', 'Léonard de Vinci', 'Michel-Ange', 'Raphaël'], why: 'Botticelli (1445), Léonard (1452), Michel-Ange (1475), Raphaël (1483).' },
        ],
        shine: 'Pendant les deux ans où la Joconde a disparu, après son vol en 1911, des foules venaient au Louvre contempler… l\'emplacement vide sur le mur.',
      },
      {
        title: 'L\'art moderne',
        cards: [
          { title: 'Casser les formes', text: 'Vers 1907, Picasso et Braque inventent le cubisme : un objet est montré sous plusieurs angles à la fois. « Les Demoiselles d\'Avignon » ouvre la voie.' },
          { title: 'Tout peut être de l\'art', text: 'En 1917, Marcel Duchamp présente un urinoir signé « R. Mutt » : c\'est le ready-made. Plus tard, les surréalistes comme Dalí et Magritte peignent le rêve et l\'absurde.' },
        ],
        questions: [
          { t: 'qcm', q: 'Qui a peint « Guernica » ?', choices: ['Picasso', 'Dalí', 'Miró', 'Matisse'], why: 'En 1937, en réaction au bombardement de la ville basque. Le tableau est au musée Reina Sofía, à Madrid.' },
          { t: 'vf', q: 'La « Fontaine » de Marcel Duchamp est un urinoir.', a: true, why: 'Un urinoir en porcelaine, retourné et signé « R. Mutt », en 1917. L\'original a été perdu ; il existe des répliques.' },
          { t: 'qcm', q: 'Les fameuses « montres molles » sont l\'œuvre de…', choices: ['Salvador Dalí', 'René Magritte', 'Max Ernst', 'Joan Miró'], why: '« La Persistance de la mémoire », 1931, conservée au MoMA de New York.' },
          { t: 'gap', q: '« Ceci n\'est pas une ___ », écrit Magritte sous son tableau.', choices: ['pipe', 'pomme', 'chapeau', 'peinture'], why: '« La Trahison des images », 1929 : c\'est une image de pipe, pas une pipe.' },
          { t: 'pairs', q: 'Associe chaque mouvement à un artiste', pairs: [['Cubisme', 'Georges Braque'], ['Surréalisme', 'René Magritte'], ['Fauvisme', 'Henri Matisse'], ['Pop art', 'Andy Warhol']] },
          { t: 'vf', q: 'Van Gogh a vendu des centaines de tableaux de son vivant.', a: false, why: 'Il a vécu dans la pauvreté. On ne cite souvent qu\'une seule vente certaine : « La Vigne rouge », en 1890.' },
        ],
        shine: 'Magritte lui-même s\'amusait des critiques : « Ma pipe, pouvez-vous la bourrer ? Non, n\'est-ce pas, elle n\'est qu\'une représentation. »',
      },
    ],
  },
  {
    id: 'histoire',
    name: 'Histoire',
    emoji: '🏛️',
    color: '#D9822B',
    lessons: [
      {
        title: 'La Révolution française',
        cards: [
          { title: '1789, l\'année qui change tout', text: 'Les États généraux s\'ouvrent en mai, la Bastille tombe le 14 juillet, les privilèges sont abolis le 4 août et la Déclaration des droits de l\'homme est adoptée le 26 août.' },
          { title: 'La fin de la monarchie', text: 'La République est proclamée en septembre 1792. Louis XVI est guillotiné le 21 janvier 1793, Marie-Antoinette en octobre de la même année.' },
        ],
        questions: [
          { t: 'qcm', q: 'Quand a eu lieu la prise de la Bastille ?', choices: ['14 juillet 1789', '4 août 1789', '14 juillet 1790', '21 janvier 1793'], why: 'La forteresse servait de prison et de dépôt de poudre : les Parisiens venaient y chercher des munitions.' },
          { t: 'vf', q: 'Le 14 juillet 1789, il n\'y avait que 7 prisonniers à la Bastille.', a: true, why: 'Quatre faussaires, deux fous et un aristocrate enfermé à la demande de sa famille.' },
          { t: 'order', q: 'Remets ces événements dans l\'ordre', items: ['Ouverture des États généraux', 'Prise de la Bastille', 'Exécution de Louis XVI', 'Sacre de Napoléon'], why: 'Mai 1789, juillet 1789, janvier 1793, décembre 1804.' },
          { t: 'qcm', q: 'Quel révolutionnaire était surnommé « l\'Incorruptible » ?', choices: ['Robespierre', 'Danton', 'Marat', 'Saint-Just'], why: 'Figure de la Terreur, il est lui-même guillotiné le 28 juillet 1794 (10 thermidor an II).' },
          { t: 'vf', q: 'Marie-Antoinette a vraiment dit : « Qu\'ils mangent de la brioche ! »', a: false, why: 'La phrase figure dans les Confessions de Rousseau, attribuée à « une grande princesse », à une époque où Marie-Antoinette était une enfant en Autriche.' },
          { t: 'qcm', q: 'Quel texte est adopté le 26 août 1789 ?', choices: ['La Déclaration des droits de l\'homme et du citoyen', 'Le Code civil', 'La Constitution de la Ve République', 'L\'édit de Nantes'], why: '« Les hommes naissent et demeurent libres et égaux en droits » : son article 1er.' },
        ],
        shine: 'La loi de 1880 qui fait du 14 juillet la fête nationale ne précise aucune année : on célèbre autant la prise de la Bastille que la très pacifique Fête de la Fédération du 14 juillet 1790.',
      },
      {
        title: 'Napoléon',
        cards: [
          { title: 'Du Corse à l\'Empereur', text: 'Né à Ajaccio en 1769, Bonaparte prend le pouvoir en 1799 et se fait sacrer empereur à Notre-Dame en 1804. Il pose lui-même la couronne sur sa tête.' },
          { title: 'Un héritage durable', text: 'Code civil, lycées, baccalauréat, Légion d\'honneur, préfets : beaucoup d\'institutions françaises datent de lui. Il meurt en exil à Sainte-Hélène en 1821.' },
        ],
        questions: [
          { t: 'qcm', q: 'Où Napoléon est-il né ?', choices: ['Ajaccio', 'Paris', 'Nice', 'Bastia'], why: 'Le 15 août 1769, un an à peine après que la Corse est devenue française.' },
          { t: 'vf', q: 'Napoléon était particulièrement petit pour son époque.', a: false, why: 'Il mesurait environ 1,69 m, dans la moyenne. La légende vient des caricatures anglaises et d\'une confusion entre pouces français et anglais.' },
          { t: 'qcm', q: 'Où Napoléon est-il mort ?', choices: ['Sainte-Hélène', 'L\'île d\'Elbe', 'Ajaccio', 'Waterloo'], why: 'Sur cette île perdue de l\'Atlantique Sud, en 1821. Son corps est revenu aux Invalides en 1840.' },
          { t: 'order', q: 'Remets ces événements dans l\'ordre', items: ['Sacre à Notre-Dame', 'Victoire d\'Austerlitz', 'Retraite de Russie', 'Défaite de Waterloo'], why: '1804, 1805, 1812, 1815.' },
          { t: 'gap', q: 'En 1804, Napoléon promulgue le ___, qui reste la base du droit français.', choices: ['Code civil', 'Code de la route', 'Code du travail', 'Code pénal européen'], why: 'Surnommé « Code Napoléon », il a inspiré le droit de nombreux pays.' },
          { t: 'vf', q: 'C\'est Napoléon qui a créé la Légion d\'honneur.', a: true, why: 'En 1802, alors qu\'il était Premier consul, pour récompenser civils et militaires.' },
        ],
        shine: 'Napoléon mesurait environ 1,69 m, la taille moyenne de son temps. Sa « petite taille » est surtout une invention de la propagande anglaise.',
      },
      {
        title: 'L\'Antiquité',
        cards: [
          { title: 'Rome, de la République à l\'Empire', text: 'Jules César n\'a jamais été empereur : il est nommé dictateur, puis assassiné en 44 av. J.-C. Son fils adoptif Octave devient le premier empereur, Auguste.' },
          { title: 'Des époques très étirées', text: 'L\'Égypte des pharaons a duré environ 3 000 ans. Les grandes pyramides de Gizeh étaient déjà des monuments antiques pour les Grecs et les Romains.' },
        ],
        questions: [
          { t: 'qcm', q: 'Qui a franchi le Rubicon en déclarant « Alea jacta est » ?', choices: ['Jules César', 'Auguste', 'Néron', 'Hannibal'], why: 'En 49 av. J.-C., en entrant en armes en Italie, il déclenche la guerre civile.' },
          { t: 'vf', q: 'Jules César a été le premier empereur romain.', a: false, why: 'Il était dictateur. Le premier empereur est Auguste, à partir de 27 av. J.-C.' },
          { t: 'qcm', q: 'Quel général a traversé les Alpes avec des éléphants ?', choices: ['Hannibal', 'Spartacus', 'Vercingétorix', 'Scipion'], why: 'Le Carthaginois Hannibal, en 218 av. J.-C., pour attaquer Rome par le nord.' },
          { t: 'pairs', q: 'Associe chaque personnage à une bataille', pairs: [['Vercingétorix', 'Alésia'], ['Léonidas', 'Les Thermopyles'], ['Alexandre le Grand', 'Gaugamèles'], ['Octave', 'Actium']] },
          { t: 'vf', q: 'Cléopâtre a vécu plus près de nous dans le temps que de la construction de la pyramide de Khéops.', a: true, why: 'La pyramide date d\'environ 2560 av. J.-C., Cléopâtre est morte en 30 av. J.-C. : environ 2 500 ans d\'écart, contre un peu plus de 2 000 jusqu\'à nous.' },
          { t: 'order', q: 'Du plus ancien au plus récent', items: ['Pyramide de Khéops', 'Fondation de Rome', 'Mort d\'Alexandre le Grand', 'Assassinat de César'], why: 'Vers 2560 av. J.-C., 753 av. J.-C. (selon la légende), 323 av. J.-C., 44 av. J.-C.' },
        ],
        shine: 'Cléopâtre vivait plus près de l\'invention de l\'iPhone que de la construction de la pyramide de Khéops.',
      },
    ],
  },
  {
    id: 'litterature',
    name: 'Littérature',
    emoji: '📚',
    color: '#3D7DD8',
    lessons: [
      {
        title: 'Les classiques français',
        cards: [
          { title: 'Le XIXe, siècle du roman', text: 'Hugo, Balzac, Flaubert, Zola, Stendhal : le XIXe siècle est l\'âge d\'or du roman français. Côté poésie, Baudelaire publie « Les Fleurs du mal » en 1857.' },
          { title: 'Le vers roi', text: 'L\'alexandrin compte 12 syllabes. C\'est le vers de Racine, de Corneille et de Molière dans ses grandes comédies.' },
        ],
        questions: [
          { t: 'pairs', q: 'Associe chaque auteur à son œuvre', pairs: [['Victor Hugo', 'Les Misérables'], ['Gustave Flaubert', 'Madame Bovary'], ['Molière', 'Le Misanthrope'], ['Marcel Proust', 'À la recherche du temps perdu']] },
          { t: 'qcm', q: 'Qui a écrit « Les Fleurs du mal » ?', choices: ['Charles Baudelaire', 'Arthur Rimbaud', 'Paul Verlaine', 'Guillaume Apollinaire'], why: 'Publié en 1857, le recueil vaut à Baudelaire une condamnation pour « outrage à la morale publique ».' },
          { t: 'vf', q: '« Madame Bovary » a valu un procès à Flaubert.', a: true, why: 'En 1857, pour atteinte aux bonnes mœurs. Il est acquitté, et le scandale assure le succès du livre.' },
          { t: 'gap', q: '« Longtemps, je me suis couché de bonne heure » est la première phrase de ___.', choices: ['À la recherche du temps perdu', 'L\'Étranger', 'Le Petit Prince', 'Germinal'], why: 'Le premier tome, « Du côté de chez Swann », paraît en 1913, à compte d\'auteur.' },
          { t: 'qcm', q: 'Combien de syllabes compte un alexandrin ?', choices: ['12', '10', '8', '14'], why: 'Son nom viendrait du « Roman d\'Alexandre », un poème du XIIe siècle écrit dans ce vers.' },
          { t: 'vf', q: 'Molière est mort sur scène, en pleine représentation.', a: false, why: 'Il a fait un malaise en jouant « Le Malade imaginaire » en 1673, a terminé la pièce, puis est mort chez lui quelques heures plus tard.' },
        ],
        shine: 'Molière n\'est pas mort sur scène : il a eu un malaise en jouant « Le Malade imaginaire », a fini la représentation, et il est mort chez lui le soir même.',
      },
      {
        title: 'Les chefs-d\'œuvre du monde',
        cards: [
          { title: 'Les piliers', text: 'Dante (Italie), Cervantès (Espagne), Shakespeare (Angleterre), Tolstoï (Russie) : chaque grande langue européenne a son auteur fondateur.' },
          { title: 'Le 23 avril', text: 'L\'UNESCO a choisi le 23 avril comme Journée mondiale du livre, date associée à la mort de Shakespeare et de Cervantès en 1616.' },
        ],
        questions: [
          { t: 'qcm', q: 'Qui a écrit « Cent ans de solitude » ?', choices: ['Gabriel García Márquez', 'Jorge Luis Borges', 'Pablo Neruda', 'Mario Vargas Llosa'], why: 'Le Colombien publie ce roman en 1967 ; il reçoit le prix Nobel en 1982.' },
          { t: 'pairs', q: 'Associe chaque auteur à son œuvre', pairs: [['Shakespeare', 'Hamlet'], ['Cervantès', 'Don Quichotte'], ['Tolstoï', 'Guerre et Paix'], ['Dante', 'La Divine Comédie']] },
          { t: 'vf', q: 'Shakespeare et Cervantès sont morts exactement le même jour.', a: false, why: 'Les deux décès sont datés du 23 avril 1616, mais l\'Angleterre utilisait encore le calendrier julien : il y a en réalité une dizaine de jours d\'écart.' },
          { t: 'qcm', q: 'Dans quelle ville se déroule « Ulysse » de James Joyce ?', choices: ['Dublin', 'Londres', 'Édimbourg', 'Paris'], why: 'Toute l\'action tient en une journée, le 16 juin 1904, fêtée chaque année sous le nom de « Bloomsday ».' },
          { t: 'qcm', q: 'Qui est l\'auteur de « 1984 » ?', choices: ['George Orwell', 'Aldous Huxley', 'Ray Bradbury', 'H. G. Wells'], why: 'Publié en 1949. On lui doit « Big Brother », la « novlangue » et la « police de la pensée ».' },
          { t: 'gap', q: '« Être ou ne pas être, telle est la ___. »', choices: ['question', 'réponse', 'vie', 'règle'], why: 'Hamlet, acte III, scène 1 : « To be, or not to be, that is the question ».' },
        ],
        shine: 'Shakespeare et Cervantès seraient « morts le même jour », le 23 avril 1616. Faux : l\'Angleterre n\'avait pas encore adopté le calendrier grégorien, et dix jours les séparent.',
      },
      {
        title: 'Prix et anecdotes',
        cards: [
          { title: 'Le Goncourt', text: 'Créé par les frères Goncourt, il est décerné chaque automne depuis 1903. C\'est le prix littéraire le plus prestigieux de France… et le moins bien doté.' },
          { title: 'Les Nobel français', text: 'La France est le pays qui compte le plus de prix Nobel de littérature : Camus, Modiano, Annie Ernaux… Et un qui l\'a refusé.' },
        ],
        questions: [
          { t: 'qcm', q: 'Quel écrivain a refusé le prix Nobel de littérature en 1964 ?', choices: ['Jean-Paul Sartre', 'Albert Camus', 'André Gide', 'Samuel Beckett'], why: 'Il refusait toutes les distinctions officielles, estimant qu\'un écrivain ne doit pas se laisser « transformer en institution ».' },
          { t: 'vf', q: '« Le Petit Prince » fait partie des livres les plus traduits au monde.', a: true, why: 'Plus de 500 langues et dialectes : on le cite souvent juste après la Bible.' },
          { t: 'qcm', q: 'Combien rapporte le prix Goncourt à son lauréat ?', choices: ['10 euros', '10 000 euros', '100 000 euros', 'Rien du tout'], why: 'Un chèque symbolique de 10 euros. Le vrai gain, ce sont les ventes : plusieurs centaines de milliers d\'exemplaires.' },
          { t: 'vf', q: 'Romain Gary a reçu deux fois le prix Goncourt.', a: true, why: 'En 1956 pour « Les Racines du ciel », puis en 1975 sous le pseudonyme d\'Émile Ajar pour « La Vie devant soi ». Le règlement l\'interdisait.' },
          { t: 'qcm', q: '« Aujourd\'hui, maman est morte. » Quel livre commence ainsi ?', choices: ['L\'Étranger', 'La Peste', 'La Nausée', 'Bonjour tristesse'], why: 'Le roman d\'Albert Camus, paru en 1942.' },
          { t: 'pairs', q: 'Associe chaque personnage à son créateur', pairs: [['Jean Valjean', 'Victor Hugo'], ['Rastignac', 'Honoré de Balzac'], ['D\'Artagnan', 'Alexandre Dumas'], ['Meursault', 'Albert Camus']] },
        ],
        shine: 'Le Goncourt rapporte un chèque de 10 euros. Beaucoup de lauréats ne l\'encaissent jamais et préfèrent l\'encadrer.',
      },
    ],
  },
  {
    id: 'philo',
    name: 'Philosophie',
    emoji: '🦉',
    color: '#7A5CD6',
    lessons: [
      {
        title: 'Les Grecs',
        cards: [
          { title: 'Socrate, le maître sans livre', text: 'Socrate n\'a rien écrit : on le connaît surtout par son élève Platon. Sa méthode ? Poser des questions jusqu\'à ce que son interlocuteur découvre ses propres contradictions.' },
          { title: 'Une lignée', text: 'Socrate forme Platon, Platon forme Aristote, et Aristote devient le précepteur du jeune Alexandre le Grand.' },
        ],
        questions: [
          { t: 'qcm', q: 'À qui attribue-t-on « Je sais que je ne sais rien » ?', choices: ['Socrate', 'Platon', 'Aristote', 'Diogène'], why: 'L\'idée vient de l\'« Apologie de Socrate » écrite par Platon : le sage est celui qui connaît son ignorance.' },
          { t: 'vf', q: 'Socrate n\'a laissé aucun écrit.', a: true, why: 'Tout ce qu\'on sait de lui passe par Platon, Xénophon et Aristophane.' },
          { t: 'order', q: 'Du maître à l\'élève', items: ['Socrate', 'Platon', 'Aristote', 'Alexandre le Grand'], why: 'Une transmission directe sur quatre générations, au IVe siècle av. J.-C.' },
          { t: 'qcm', q: 'Qui a imaginé l\'allégorie de la caverne ?', choices: ['Platon', 'Aristote', 'Épicure', 'Héraclite'], why: 'Dans « La République » : des prisonniers prennent les ombres projetées sur un mur pour la réalité.' },
          { t: 'vf', q: 'L\'épicurisme est une philosophie de l\'excès et de la fête.', a: false, why: 'Épicure prône des plaisirs simples et modérés pour atteindre l\'ataraxie : l\'absence de trouble.' },
          { t: 'gap', q: 'Selon la légende, le philosophe Diogène vivait dans un ___.', choices: ['tonneau', 'palais', 'temple', 'arbre'], why: 'En réalité une grande jarre en terre cuite (un pithos), le tonneau n\'existant pas en Grèce.' },
        ],
        shine: 'Alexandre le Grand propose à Diogène de lui offrir ce qu\'il désire. Réponse du philosophe : « Ôte-toi de mon soleil. »',
      },
      {
        title: 'Les modernes',
        cards: [
          { title: 'Le doute de Descartes', text: 'Descartes doute de tout, sauf d\'une chose : s\'il doute, c\'est qu\'il pense. D\'où le célèbre « Je pense, donc je suis » (1637).' },
          { title: 'Les Lumières', text: 'Au XVIIIe siècle, Voltaire, Rousseau, Montesquieu et Diderot défendent la raison, la tolérance et la liberté contre l\'absolutisme.' },
        ],
        questions: [
          { t: 'pairs', q: 'Associe chaque philosophe à sa phrase', pairs: [['Descartes', 'Je pense, donc je suis'], ['Nietzsche', 'Dieu est mort'], ['Sartre', 'L\'enfer, c\'est les autres'], ['Pascal', 'Le cœur a ses raisons…']] },
          { t: 'vf', q: '« L\'enfer, c\'est les autres » signifie que les autres sont méchants.', a: false, why: 'Dans « Huis clos » (1944), Sartre veut dire que nous dépendons du regard des autres pour nous juger nous-mêmes.' },
          { t: 'qcm', q: 'Qui a écrit « Le Deuxième Sexe » ?', choices: ['Simone de Beauvoir', 'Simone Weil', 'Hannah Arendt', 'Marguerite Yourcenar'], why: 'En 1949. On lui doit « On ne naît pas femme : on le devient. »' },
          { t: 'qcm', q: 'Qui est l\'auteur « Du contrat social » ?', choices: ['Jean-Jacques Rousseau', 'Voltaire', 'Montesquieu', 'Diderot'], why: 'Publié en 1762, il fonde la légitimité du pouvoir sur la volonté générale du peuple.' },
          { t: 'gap', q: '« Il faut cultiver notre ___ », conclut le Candide de Voltaire.', choices: ['jardin', 'esprit', 'potager', 'champ'], why: 'Après mille malheurs, Candide renonce aux grands discours au profit du travail concret.' },
          { t: 'vf', q: 'Montesquieu a théorisé la séparation des pouvoirs.', a: true, why: 'Dans « De l\'esprit des lois » (1748) : législatif, exécutif et judiciaire doivent être séparés.' },
        ],
        shine: '« L\'enfer, c\'est les autres » ne veut pas dire que les autres sont insupportables : pour Sartre, c\'est qu\'on ne peut pas échapper à leur regard sur nous.',
      },
      {
        title: 'Les grands concepts',
        cards: [
          { title: 'Des outils pour penser', text: 'Certains principes philosophiques sont devenus des réflexes : le rasoir d\'Ockham, le pari de Pascal, la maïeutique de Socrate…' },
          { title: 'Attention aux attributions', text: 'Beaucoup de citations célèbres ne sont pas de ceux à qui on les prête. Les vérifier, c\'est déjà briller.' },
        ],
        questions: [
          { t: 'qcm', q: 'Que dit le « rasoir d\'Ockham » ?', choices: ['L\'explication la plus simple est souvent la meilleure', 'Il faut douter de tout', 'La fin justifie les moyens', 'Il faut se méfier de ses sens'], why: 'Le moine Guillaume d\'Ockham (XIVe siècle) : ne pas multiplier les hypothèses sans nécessité.' },
          { t: 'qcm', q: 'À quel penseur associe-t-on « la fin justifie les moyens » ?', choices: ['Machiavel', 'Hobbes', 'Spinoza', 'Locke'], why: 'La formule exacte n\'est pas dans « Le Prince » (1532), mais elle en résume l\'esprit.' },
          { t: 'vf', q: '« L\'homme est un loup pour l\'homme » a été inventé par Hobbes.', a: false, why: 'La formule vient du dramaturge latin Plaute (« Lupus est homo homini »). Hobbes l\'a reprise et popularisée.' },
          { t: 'pairs', q: 'Associe chaque concept à sa définition', pairs: [['Ataraxie', 'L\'absence de trouble de l\'âme'], ['Maïeutique', 'Faire « accoucher » les idées par des questions'], ['Stoïcisme', 'Distinguer ce qui dépend de nous ou non'], ['Nihilisme', 'Le refus de toute valeur']] },
          { t: 'qcm', q: 'Sur quoi porte le célèbre « pari » de Pascal ?', choices: ['L\'existence de Dieu', 'Le hasard des jeux', 'La liberté humaine', 'La fin du monde'], why: 'Si Dieu existe, on gagne tout à croire ; s\'il n\'existe pas, on ne perd presque rien.' },
          { t: 'gap', q: 'Selon Héraclite, on ne se baigne jamais deux fois dans le même ___.', choices: ['fleuve', 'lac', 'bain', 'océan'], why: 'Tout change en permanence : l\'eau a coulé, et nous aussi avons changé.' },
        ],
        shine: '« L\'homme est un loup pour l\'homme » n\'est pas de Hobbes mais de Plaute, un auteur de comédies latin, deux siècles avant notre ère.',
      },
    ],
  },
  {
    id: 'musique',
    name: 'Musique classique',
    emoji: '🎻',
    color: '#1F9E89',
    lessons: [
      {
        title: 'Les géants',
        cards: [
          { title: 'Trois époques', text: 'Baroque (Bach, Vivaldi), classique (Mozart, Haydn), romantique (Chopin, Liszt) : Beethoven fait le pont entre les deux dernières.' },
          { title: 'Le génie sourd', text: 'Beethoven perd progressivement l\'audition dès la trentaine. Il compose sa Neuvième Symphonie alors qu\'il est presque totalement sourd.' },
        ],
        questions: [
          { t: 'qcm', q: 'Quel compositeur était sourd à la fin de sa vie ?', choices: ['Beethoven', 'Mozart', 'Bach', 'Chopin'], why: 'Il communiquait par des « cahiers de conversation » où ses visiteurs écrivaient.' },
          { t: 'vf', q: 'Mozart composait déjà vers l\'âge de 5 ans.', a: true, why: 'Ses premiers petits menuets datent de 1761, quand il avait 5 ans.' },
          { t: 'pairs', q: 'Associe chaque compositeur à son œuvre', pairs: [['Vivaldi', 'Les Quatre Saisons'], ['Beethoven', 'L\'Hymne à la joie'], ['Ravel', 'Le Boléro'], ['Bizet', 'Carmen']] },
          { t: 'order', q: 'Du plus ancien au plus récent', items: ['Bach', 'Mozart', 'Beethoven', 'Debussy'], why: 'Naissances : 1685, 1756, 1770, 1862.' },
          { t: 'qcm', q: 'De quel pays Frédéric Chopin était-il originaire ?', choices: ['Pologne', 'Autriche', 'Hongrie', 'Russie'], why: 'Né près de Varsovie d\'un père français, il a passé la seconde moitié de sa vie à Paris. Il est enterré au Père-Lachaise.' },
          { t: 'vf', q: 'L\'Hymne à la joie est l\'hymne de l\'Union européenne.', a: true, why: 'C\'est le final de la Neuvième de Beethoven, sur un poème de Schiller, adopté par l\'Europe en 1985.' },
        ],
        shine: 'À la création de la Neuvième, Beethoven, presque sourd, n\'entendait pas les applaudissements : une chanteuse a dû le retourner pour qu\'il voie la salle en délire.',
      },
      {
        title: 'L\'opéra',
        cards: [
          { title: 'L\'Italie en tête', text: 'L\'opéra naît en Italie vers 1600. Au XIXe siècle, Verdi et Puccini en font un art populaire, pendant que Wagner le révolutionne en Allemagne.' },
          { title: 'Les voix', text: 'Chez les femmes : soprano (aiguë), mezzo, alto. Chez les hommes : ténor (aiguë), baryton, basse (grave).' },
        ],
        questions: [
          { t: 'qcm', q: 'Qui a composé « La Traviata » ?', choices: ['Verdi', 'Puccini', 'Rossini', 'Wagner'], why: 'En 1853, d\'après « La Dame aux camélias » d\'Alexandre Dumas fils.' },
          { t: 'pairs', q: 'Associe chaque compositeur à son opéra', pairs: [['Mozart', 'La Flûte enchantée'], ['Puccini', 'La Bohème'], ['Wagner', 'L\'Anneau du Nibelung'], ['Rossini', 'Le Barbier de Séville']] },
          { t: 'vf', q: '« L\'amour est un oiseau rebelle » vient de « Carmen ».', a: true, why: 'C\'est la Habanera de l\'opéra de Bizet (1875), d\'abord accueilli très froidement.' },
          { t: 'qcm', q: 'Combien d\'opéras composent la « Tétralogie » de Wagner ?', choices: ['4', '3', '5', '9'], why: 'Comme son nom l\'indique : environ 15 heures de musique, jouées sur quatre soirées.' },
          { t: 'gap', q: 'L\'opéra de Paris inauguré en 1875 porte le nom de son architecte : le palais ___.', choices: ['Garnier', 'Bastille', 'Haussmann', 'Eiffel'], why: 'Charles Garnier avait 35 ans quand il a remporté le concours.' },
          { t: 'vf', q: 'Le ténor est la voix d\'homme la plus grave.', a: false, why: 'C\'est la plus aiguë (hors contre-ténor). La plus grave est la basse.' },
        ],
        shine: 'La Tétralogie de Wagner dure environ 15 heures. Le festival de Bayreuth la joue sur quatre soirées, et les places s\'obtiennent parfois après des années d\'attente.',
      },
      {
        title: 'L\'orchestre',
        cards: [
          { title: 'Quatre familles', text: 'Un orchestre symphonique réunit les cordes, les bois, les cuivres et les percussions. Les cordes, les plus nombreuses, sont devant.' },
          { title: 'Bois ou cuivre ?', text: 'Ce n\'est pas la matière qui compte, mais la façon de produire le son : une anche ou un biseau pour les bois, les lèvres qui vibrent pour les cuivres.' },
        ],
        questions: [
          { t: 'qcm', q: 'Combien de cordes a un violon ?', choices: ['4', '5', '6', '3'], why: 'Sol, ré, la, mi. L\'alto et le violoncelle en ont aussi quatre.' },
          { t: 'vf', q: 'Le piano est un instrument à cordes frappées.', a: true, why: 'Chaque touche actionne un marteau feutré qui frappe une ou plusieurs cordes.' },
          { t: 'qcm', q: 'Quel instrument donne le « la » à l\'orchestre ?', choices: ['Le hautbois', 'Le piano', 'La flûte', 'La trompette'], why: 'Son son est stable et perçant. Le premier violon prend ensuite le relais pour accorder les cordes.' },
          { t: 'pairs', q: 'Associe chaque instrument à sa famille', pairs: [['Violoncelle', 'Cordes'], ['Clarinette', 'Bois'], ['Trombone', 'Cuivres'], ['Timbales', 'Percussions']] },
          { t: 'vf', q: 'Le saxophone fait partie de la famille des bois.', a: true, why: 'Bien qu\'il soit en métal, il fonctionne avec une anche, comme la clarinette.' },
          { t: 'gap', q: 'Les violons Stradivarius ont été fabriqués à ___, en Italie.', choices: ['Crémone', 'Venise', 'Naples', 'Florence'], why: 'Antonio Stradivari y a travaillé jusqu\'à sa mort en 1737. Il reste environ 650 de ses instruments.' },
        ],
        shine: 'Le saxophone est en métal, mais c\'est un bois : comme la clarinette, il produit le son avec une anche en roseau. Il a été inventé par le Belge Adolphe Sax.',
      },
    ],
  },
  {
    id: 'sciences',
    name: 'Sciences',
    emoji: '🔭',
    color: '#4E8F2E',
    lessons: [
      {
        title: 'Le système solaire',
        cards: [
          { title: 'Huit planètes', text: 'Mercure, Vénus, la Terre, Mars (rocheuses), puis Jupiter, Saturne, Uranus et Neptune (géantes). Pluton a été reclassée « planète naine » en 2006.' },
          { title: 'Des distances folles', text: 'La lumière du Soleil met environ 8 minutes à nous parvenir. Celle de Neptune voyage plus de 4 heures.' },
        ],
        questions: [
          { t: 'qcm', q: 'Quelle est la plus grande planète du système solaire ?', choices: ['Jupiter', 'Saturne', 'Neptune', 'Uranus'], why: 'On pourrait y faire tenir plus de 1 300 Terres.' },
          { t: 'vf', q: 'Pluton n\'est plus considérée comme une planète.', a: true, why: 'Depuis 2006, l\'Union astronomique internationale la classe parmi les planètes naines.' },
          { t: 'order', q: 'De la plus proche à la plus éloignée du Soleil', items: ['Mercure', 'Vénus', 'Terre', 'Mars'], why: 'Moyen mnémotechnique des huit planètes : « Me Voici Toute Mouillée, Je Suis Une Naïade ».' },
          { t: 'qcm', q: 'Quelle est la planète la plus chaude ?', choices: ['Vénus', 'Mercure', 'Mars', 'Jupiter'], why: 'Son épaisse atmosphère crée un effet de serre extrême : environ 460 °C, plus que Mercure pourtant plus proche du Soleil.' },
          { t: 'vf', q: 'La lumière du Soleil met environ 8 minutes à arriver sur Terre.', a: true, why: 'Le Soleil que vous voyez est donc celui d\'il y a 8 minutes.' },
          { t: 'gap', q: 'Sur Vénus, une journée dure plus longtemps qu\'une ___.', choices: ['année', 'semaine', 'heure', 'saison'], why: 'Vénus tourne sur elle-même en 243 jours terrestres, mais fait le tour du Soleil en 225 jours.' },
        ],
        shine: 'Sur Vénus, un jour dure plus longtemps qu\'une année : elle tourne sur elle-même en 243 jours, mais autour du Soleil en 225.',
      },
      {
        title: 'Les grands savants',
        cards: [
          { title: 'Des révolutions', text: 'Copernic place le Soleil au centre (1543), Newton explique la gravitation (1687), Darwin l\'évolution (1859), Einstein la relativité (1905).' },
          { title: 'Marie Curie', text: 'Première femme prix Nobel, et seule personne récompensée dans deux sciences différentes : physique en 1903, chimie en 1911.' },
        ],
        questions: [
          { t: 'pairs', q: 'Associe chaque savant à sa découverte', pairs: [['Newton', 'La gravitation universelle'], ['Darwin', 'La sélection naturelle'], ['Marie Curie', 'Le radium'], ['Pasteur', 'Le vaccin contre la rage']] },
          { t: 'vf', q: 'Marie Curie a reçu deux prix Nobel dans deux disciplines différentes.', a: true, why: 'Physique en 1903 (avec Pierre Curie et Henri Becquerel), chimie en 1911.' },
          { t: 'qcm', q: 'Qui a formulé E = mc² ?', choices: ['Albert Einstein', 'Isaac Newton', 'Niels Bohr', 'Max Planck'], why: 'En 1905 : la masse et l\'énergie sont équivalentes.' },
          { t: 'vf', q: 'Galilée a inventé la lunette astronomique.', a: false, why: 'La lunette vient des Pays-Bas (1608). Galilée l\'a perfectionnée et a été l\'un des premiers à la pointer vers le ciel.' },
          { t: 'qcm', q: 'Qui a établi le tableau périodique des éléments ?', choices: ['Dmitri Mendeleïev', 'Antoine Lavoisier', 'John Dalton', 'Niels Bohr'], why: 'En 1869, en laissant des cases vides pour des éléments encore inconnus, découverts ensuite.' },
          { t: 'gap', q: '« Rien ne se perd, rien ne se crée, tout se ___. »', choices: ['transforme', 'recycle', 'détruit', 'multiplie'], why: 'La formule résume la loi de conservation de la masse de Lavoisier, guillotiné en 1794.' },
        ],
        shine: 'La pomme de Newton n\'est pas un mythe : il a lui-même raconté l\'anecdote à un ami. Mais elle ne lui est jamais tombée sur la tête.',
      },
      {
        title: 'Le corps humain',
        cards: [
          { title: 'Une charpente', text: 'Un bébé naît avec environ 300 os, dont beaucoup fusionnent en grandissant. Un adulte en a 206.' },
          { title: 'Des records', text: 'Le plus grand organe est la peau. Le plus petit os, l\'étrier, se trouve dans l\'oreille et mesure environ 3 mm.' },
        ],
        questions: [
          { t: 'qcm', q: 'Combien d\'os compte le squelette d\'un adulte ?', choices: ['206', '186', '250', '312'], why: 'Plus de la moitié se trouvent dans les mains et les pieds.' },
          { t: 'vf', q: 'Nous n\'utilisons que 10 % de notre cerveau.', a: false, why: 'C\'est un mythe : l\'imagerie montre que toutes les zones du cerveau sont actives, à des moments différents.' },
          { t: 'qcm', q: 'Quel est le plus grand organe du corps humain ?', choices: ['La peau', 'Le foie', 'Les poumons', 'L\'intestin'], why: 'Environ 2 m² et plusieurs kilos chez un adulte.' },
          { t: 'vf', q: 'Le plus petit os du corps se trouve dans l\'oreille.', a: true, why: 'L\'étrier, environ 3 mm, transmet les vibrations du son vers l\'oreille interne.' },
          { t: 'pairs', q: 'Associe chaque organe à son rôle', pairs: [['Globules rouges', 'Transporter l\'oxygène'], ['Pancréas', 'Produire l\'insuline'], ['Reins', 'Filtrer le sang'], ['Rétine', 'Capter la lumière']] },
          { t: 'gap', q: 'Notre sang est rouge grâce au ___ contenu dans l\'hémoglobine.', choices: ['fer', 'cuivre', 'magnésium', 'sel'], why: 'Chez la pieuvre, c\'est le cuivre qui transporte l\'oxygène : son sang est bleu.' },
        ],
        shine: 'La pieuvre a trois cœurs et le sang bleu : chez elle, c\'est le cuivre, et non le fer, qui transporte l\'oxygène.',
      },
    ],
  },
  {
    id: 'geo',
    name: 'Géographie',
    emoji: '🌍',
    color: '#2295B8',
    lessons: [
      {
        title: 'Les capitales pièges',
        cards: [
          { title: 'Pas la plus grande ville', text: 'Souvent, la capitale n\'est pas la ville la plus connue : Canberra plutôt que Sydney, Ottawa plutôt que Toronto, Ankara plutôt qu\'Istanbul.' },
          { title: 'Des capitales inventées', text: 'Certaines ont été créées de toutes pièces pour départager des rivales ou développer l\'intérieur du pays, comme Brasilia en 1960.' },
        ],
        questions: [
          { t: 'qcm', q: 'Quelle est la capitale de l\'Australie ?', choices: ['Canberra', 'Sydney', 'Melbourne', 'Perth'], why: 'Construite pour mettre fin à la rivalité entre Sydney et Melbourne.' },
          { t: 'qcm', q: 'Quelle est la capitale du Canada ?', choices: ['Ottawa', 'Toronto', 'Montréal', 'Vancouver'], why: 'Choisie par la reine Victoria en 1857, à la frontière entre l\'Ontario anglophone et le Québec francophone.' },
          { t: 'pairs', q: 'Associe chaque pays à sa capitale', pairs: [['Turquie', 'Ankara'], ['Brésil', 'Brasilia'], ['Suisse', 'Berne'], ['Maroc', 'Rabat']] },
          { t: 'vf', q: 'La Bolivie a deux capitales.', a: true, why: 'Sucre est la capitale constitutionnelle, La Paz le siège du gouvernement.' },
          { t: 'qcm', q: 'Quel pays compte le plus de fuseaux horaires ?', choices: ['La France', 'La Russie', 'Les États-Unis', 'La Chine'], why: 'Grâce à ses territoires d\'outre-mer : 12 fuseaux, de la Polynésie à la Nouvelle-Calédonie.' },
          { t: 'gap', q: 'La capitale de la Nouvelle-Zélande est ___.', choices: ['Wellington', 'Auckland', 'Christchurch', 'Queenstown'], why: 'Auckland est bien plus peuplée, mais c\'est Wellington qui accueille le Parlement.' },
        ],
        shine: 'Le pays qui a le plus de fuseaux horaires au monde, ce n\'est ni la Russie ni les États-Unis : c\'est la France, avec 12 fuseaux grâce à l\'outre-mer.',
      },
      {
        title: 'Les records de la planète',
        cards: [
          { title: 'Désert ne veut pas dire chaud', text: 'Un désert se définit par la rareté des précipitations, pas par la chaleur. Selon ce critère, le plus grand désert du monde est glacé.' },
          { title: 'Le toit du monde', text: 'L\'Everest culmine à 8 849 m, sur la frontière entre le Népal et la Chine. Il grandit encore de quelques millimètres par an.' },
        ],
        questions: [
          { t: 'qcm', q: 'Quel est le plus haut sommet du monde ?', choices: ['L\'Everest', 'Le K2', 'Le Kilimandjaro', 'L\'Aconcagua'], why: '8 849 m selon la mesure commune de la Chine et du Népal en 2020.' },
          { t: 'vf', q: 'Le Nil et l\'Amazone se disputent le titre de plus long fleuve du monde.', a: true, why: 'Tout dépend de l\'endroit où l\'on place la source : les deux dépassent 6 400 km.' },
          { t: 'qcm', q: 'Quel est le plus grand désert du monde ?', choices: ['L\'Antarctique', 'Le Sahara', 'Le Gobi', 'Le Kalahari'], why: 'Environ 14 millions de km². Le Sahara est le plus grand désert chaud.' },
          { t: 'vf', q: 'Le mont Blanc est le plus haut sommet du continent européen.', a: false, why: 'On retient en général l\'Elbrouz (5 642 m), dans le Caucase russe. Le mont Blanc est le plus haut d\'Europe occidentale.' },
          { t: 'order', q: 'Du plus peuplé au moins peuplé', items: ['Inde', 'Chine', 'États-Unis', 'Indonésie'], why: 'L\'Inde a dépassé la Chine en 2023, avec plus de 1,4 milliard d\'habitants.' },
          { t: 'gap', q: 'Le lac ___, en Sibérie, est le plus profond du monde.', choices: ['Baïkal', 'Titicaca', 'Victoria', 'Léman'], why: 'Plus de 1 600 m de profondeur. Il contient environ 20 % de l\'eau douce liquide de surface de la planète.' },
        ],
        shine: 'Le plus grand désert du monde n\'est pas le Sahara mais l\'Antarctique : un désert se définit par l\'absence de pluie, pas par la chaleur.',
      },
      {
        title: 'La France',
        cards: [
          { title: 'Un pays aux quatre coins du monde', text: 'Avec la Guyane, la Réunion, la Polynésie ou la Nouvelle-Calédonie, la France possède le deuxième plus grand domaine maritime du monde.' },
          { title: 'L\'Hexagone', text: 'Depuis 2016, la France métropolitaine compte 13 régions (18 avec l\'outre-mer). La Loire est le plus long fleuve entièrement français.' },
        ],
        questions: [
          { t: 'qcm', q: 'Quel est le plus long fleuve de France ?', choices: ['La Loire', 'La Seine', 'Le Rhône', 'La Garonne'], why: 'Environ 1 000 km, du mont Gerbier-de-Jonc à l\'Atlantique.' },
          { t: 'vf', q: 'La France a une frontière terrestre avec le Brésil.', a: true, why: 'Par la Guyane : environ 730 km. C\'est même la plus longue frontière terrestre de la France.' },
          { t: 'qcm', q: 'Combien de régions compte la France métropolitaine depuis 2016 ?', choices: ['13', '22', '18', '12'], why: 'Elles étaient 22 avant la réforme. On arrive à 18 en comptant l\'outre-mer.' },
          { t: 'pairs', q: 'Associe chaque ville à son surnom', pairs: [['Lyon', 'La capitale des Gaules'], ['Toulouse', 'La Ville rose'], ['Marseille', 'La cité phocéenne'], ['Lille', 'La capitale des Flandres']] },
          { t: 'vf', q: 'Le point culminant de la France est le mont Blanc.', a: true, why: 'Environ 4 805 m. Sa hauteur varie de quelques mètres selon l\'épaisseur de la glace au sommet.' },
          { t: 'gap', q: 'La Corse compte ___ départements.', choices: ['2', '1', '3', '4'], why: 'La Corse-du-Sud (2A) et la Haute-Corse (2B).' },
        ],
        shine: 'La plus longue frontière terrestre de la France n\'est pas avec l\'Espagne ni la Belgique, mais avec le Brésil : 730 km, par la Guyane.',
      },
    ],
  },
  {
    id: 'mytho',
    name: 'Mythologie',
    emoji: '⚡',
    color: '#B8861B',
    lessons: [
      {
        title: 'Les dieux de l\'Olympe',
        cards: [
          { title: 'Deux noms pour un dieu', text: 'Les Romains ont repris les dieux grecs en les rebaptisant : Zeus devient Jupiter, Aphrodite devient Vénus, Arès devient Mars.' },
          { title: 'Une grande famille', text: 'Zeus règne sur le ciel, Poséidon sur les mers, Hadès sur les Enfers. Les trois frères se sont partagé le monde.' },
        ],
        questions: [
          { t: 'pairs', q: 'Associe chaque dieu grec à son nom romain', pairs: [['Zeus', 'Jupiter'], ['Aphrodite', 'Vénus'], ['Arès', 'Mars'], ['Hermès', 'Mercure']] },
          { t: 'qcm', q: 'Qui est le dieu des mers ?', choices: ['Poséidon', 'Hadès', 'Apollon', 'Héphaïstos'], why: 'Neptune chez les Romains. On le reconnaît à son trident.' },
          { t: 'vf', q: 'Hadès vit sur l\'Olympe avec les autres dieux.', a: false, why: 'Il règne sous terre, sur le royaume des morts, qui porte d\'ailleurs son nom.' },
          { t: 'qcm', q: 'D\'où est née la déesse Athéna ?', choices: ['Du crâne de Zeus', 'De l\'écume de la mer', 'D\'un œuf', 'D\'un olivier'], why: 'Elle en est sortie tout armée. C\'est Aphrodite qui naît de l\'écume.' },
          { t: 'vf', q: 'La plupart des planètes portent des noms de dieux romains.', a: true, why: 'Mercure, Vénus, Mars, Jupiter, Saturne, Neptune. Exception : Uranus, nom grec (Ouranos), et la Terre.' },
          { t: 'gap', q: 'Le « talon d\'___ » désigne un point faible.', choices: ['Achille', 'Hercule', 'Ulysse', 'Hector'], why: 'Sa mère l\'a plongé dans le Styx pour le rendre invulnérable, en le tenant par le talon.' },
        ],
        shine: 'Toutes les planètes portent des noms de dieux romains… sauf Uranus, la seule au nom grec, et la Terre.',
      },
      {
        title: 'Héros et légendes',
        cards: [
          { title: 'Homère', text: 'L\'Iliade raconte un épisode de la guerre de Troie, la colère d\'Achille. L\'Odyssée raconte le long retour d\'Ulysse vers son île d\'Ithaque.' },
          { title: 'Les héros', text: 'Héraclès (Hercule), Thésée, Persée, Jason : les héros grecs sont souvent des demi-dieux, et leurs exploits finissent rarement bien.' },
        ],
        questions: [
          { t: 'qcm', q: 'Combien de travaux Héraclès doit-il accomplir ?', choices: ['12', '7', '10', '3'], why: 'Parmi eux : tuer le lion de Némée, l\'hydre de Lerne, nettoyer les écuries d\'Augias.' },
          { t: 'qcm', q: 'Combien de temps Ulysse erre-t-il avant de rentrer à Ithaque ?', choices: ['10 ans', '1 an', '20 ans', '3 ans'], why: 'Après 10 ans de guerre à Troie, il met 10 ans à rentrer : 20 ans d\'absence en tout.' },
          { t: 'vf', q: 'Le cheval de Troie est raconté en détail dans l\'Iliade.', a: false, why: 'L\'Iliade s\'arrête avant la chute de Troie. Le cheval est évoqué dans l\'Odyssée et raconté en détail dans l\'Énéide de Virgile.' },
          { t: 'pairs', q: 'Associe chaque héros à son exploit', pairs: [['Thésée', 'Le Minotaure'], ['Persée', 'Méduse'], ['Jason', 'La Toison d\'or'], ['Œdipe', 'L\'énigme du Sphinx']] },
          { t: 'qcm', q: 'Qui a volé le feu aux dieux pour le donner aux hommes ?', choices: ['Prométhée', 'Icare', 'Sisyphe', 'Tantale'], why: 'Puni par Zeus, il est enchaîné à un rocher où un aigle lui dévore le foie chaque jour.' },
          { t: 'gap', q: 'Pénélope défaisait chaque nuit sa ___ pour faire patienter ses prétendants.', choices: ['tapisserie', 'robe', 'coiffure', 'tresse'], why: 'Elle avait promis de choisir un mari une fois ce linceul terminé. Il ne l\'a jamais été.' },
        ],
        shine: 'Le cheval de Troie n\'apparaît pas dans l\'Iliade, qui s\'arrête avant la chute de la ville : c\'est Virgile qui le raconte en détail dans l\'Énéide.',
      },
      {
        title: 'Les mots des mythes',
        cards: [
          { title: 'Une langue pleine de dieux', text: 'Panique, écho, narcissique, morphine, titanesque : notre vocabulaire quotidien est rempli de mythologie grecque.' },
          { title: 'Des expressions', text: 'Un travail de Sisyphe, la boîte de Pandore, le fil d\'Ariane : chacune résume une histoire entière.' },
        ],
        questions: [
          { t: 'pairs', q: 'Associe chaque expression à son sens', pairs: [['Un travail de Sisyphe', 'Une tâche sans fin'], ['La boîte de Pandore', 'La source de tous les maux'], ['Le fil d\'Ariane', 'Ce qui guide dans un labyrinthe'], ['De Charybde en Scylla', 'De mal en pis']] },
          { t: 'vf', q: 'La « boîte » de Pandore était à l\'origine une jarre.', a: true, why: 'Le texte grec parle d\'un pithos, une jarre. La « boîte » vient d\'une traduction d\'Érasme au XVIe siècle.' },
          { t: 'qcm', q: 'Le mot « panique » vient de quel dieu ?', choices: ['Pan', 'Apollon', 'Pallas', 'Poséidon'], why: 'Le dieu des bergers, mi-homme mi-bouc, semait une terreur soudaine par ses cris.' },
          { t: 'qcm', q: 'De qui Narcisse tombe-t-il amoureux ?', choices: ['De son propre reflet', 'De la nymphe Écho', 'D\'une déesse', 'D\'une fleur'], why: 'C\'est Écho qui l\'aime en vain. Lui dépérit en contemplant son reflet dans l\'eau.' },
          { t: 'vf', q: 'Le mot « écho » vient du nom d\'une nymphe.', a: true, why: 'Punie par Héra, elle ne pouvait plus que répéter les derniers mots qu\'elle entendait.' },
          { t: 'gap', q: 'La ___ tire son nom de Morphée, le dieu des rêves.', choices: ['morphine', 'médecine', 'mémoire', 'musique'], why: 'Nommée ainsi par son découvreur, le pharmacien allemand Friedrich Sertürner, au début du XIXe siècle, pour ses effets somnifères.' },
        ],
        shine: 'La boîte de Pandore n\'était pas une boîte mais une jarre : c\'est Érasme qui s\'est trompé en traduisant, au XVIe siècle.',
      },
    ],
  },
  {
    id: 'vin',
    name: 'Vin & gastronomie',
    emoji: '🍷',
    color: '#9B2C4A',
    lessons: [
      {
        title: 'Les vins de France',
        cards: [
          { title: 'Terroirs et cépages', text: 'En France, on nomme souvent un vin par son lieu (Pauillac, Sancerre, Chablis), pas par son cépage. Chaque région a ses raisins de prédilection.' },
          { title: 'Le classement de 1855', text: 'Pour l\'Exposition universelle de 1855, Napoléon III fait classer les grands vins de Bordeaux. Ce classement n\'a presque pas bougé depuis.' },
        ],
        questions: [
          { t: 'pairs', q: 'Associe chaque vin à son cépage principal', pairs: [['Bourgogne rouge', 'Pinot noir'], ['Beaujolais', 'Gamay'], ['Pauillac', 'Cabernet sauvignon'], ['Sancerre', 'Sauvignon blanc']] },
          { t: 'vf', q: 'Le champagne peut être fait avec des raisins noirs.', a: true, why: 'Le pinot noir et le pinot meunier sont des raisins noirs à jus blanc. Un « blanc de noirs » n\'utilise qu\'eux.' },
          { t: 'qcm', q: 'Quand le Beaujolais nouveau arrive-t-il ?', choices: ['Le 3e jeudi de novembre', 'Le 1er mai', 'Le 14 juillet', 'Le 1er janvier'], why: 'Une date fixée en 1985 pour lancer la commercialisation partout en même temps.' },
          { t: 'vf', q: 'Dom Pérignon a inventé le champagne.', a: false, why: 'Ce moine d\'Hautvillers a beaucoup amélioré l\'assemblage, mais les bulles, à l\'époque, étaient plutôt un défaut qu\'on cherchait à éviter.' },
          { t: 'qcm', q: 'Les « grands crus classés en 1855 » viennent de…', choices: ['Bordeaux', 'Bourgogne', 'Alsace', 'Champagne'], why: 'Le seul changement majeur depuis : la promotion de Château Mouton Rothschild, en 1973.' },
          { t: 'gap', q: 'Le ___ est un vin blanc liquoreux de Bordeaux, né de la « pourriture noble ».', choices: ['sauternes', 'chablis', 'muscadet', 'vin jaune'], why: 'Un champignon, le botrytis, concentre le sucre des raisins. Le plus célèbre : Château d\'Yquem.' },
        ],
        shine: 'Le classement des vins de Bordeaux date de 1855 et n\'a connu qu\'un seul vrai changement : la promotion de Mouton Rothschild, en 1973.',
      },
      {
        title: 'La gastronomie française',
        cards: [
          { title: 'Patrimoine mondial', text: 'Depuis 2010, le « repas gastronomique des Français » est inscrit au patrimoine culturel immatériel de l\'UNESCO.' },
          { title: 'Des traditions… parfois récentes', text: 'Certains plats « ancestraux » sont en fait très jeunes, et certains symboles français viennent d\'ailleurs.' },
        ],
        questions: [
          { t: 'qcm', q: 'D\'où vient l\'ancêtre du croissant ?', choices: ['D\'Autriche', 'De France', 'D\'Italie', 'De Turquie'], why: 'Du kipferl viennois, d\'où le nom de « viennoiserie ». La version feuilletée au beurre, elle, s\'est développée à Paris.' },
          { t: 'vf', q: 'Le repas gastronomique des Français est inscrit au patrimoine de l\'UNESCO.', a: true, why: 'Depuis 2010 : ce qui est reconnu, c\'est le rituel (apéritif, entrée, plat, fromage, dessert, accords mets-vins), pas une recette.' },
          { t: 'pairs', q: 'Associe chaque plat à sa région', pairs: [['Choucroute', 'Alsace'], ['Bouillabaisse', 'Provence'], ['Cassoulet', 'Occitanie'], ['Kouign-amann', 'Bretagne']] },
          { t: 'qcm', q: '« Comment voulez-vous gouverner un pays qui a ___ variétés de fromage ? » demandait de Gaulle.', choices: ['246', '52', '1 000', '365'], why: 'Le chiffre varie selon les récits. Aujourd\'hui, on compte plus de 1 000 fromages français selon les définitions.' },
          { t: 'vf', q: 'La tartiflette est une recette savoyarde ancestrale.', a: false, why: 'Elle a été créée dans les années 1980 par l\'interprofession du reblochon pour relancer les ventes, en s\'inspirant d\'un plat traditionnel.' },
          { t: 'gap', q: 'Un bœuf ___ est mijoté dans du vin rouge, à la mode de Bourgogne.', choices: ['bourguignon', 'mironton', 'Stroganoff', 'Wellington'], why: 'Traditionnellement avec un vin de Bourgogne, des lardons, des champignons et des petits oignons.' },
        ],
        shine: 'La tartiflette n\'a rien d\'ancestral : elle a été inventée dans les années 1980 pour aider à vendre du reblochon.',
      },
      {
        title: 'Déguster comme un pro',
        cards: [
          { title: 'L\'œil, le nez, la bouche', text: 'Une dégustation se fait en trois temps : on observe la robe, on sent le nez (en deux fois, avant et après avoir fait tourner le verre), puis on goûte.' },
          { title: 'Le bon geste', text: 'On tient le verre par le pied : la main ne réchauffe pas le vin et ne laisse pas de traces qui gêneraient l\'observation.' },
        ],
        questions: [
          { t: 'qcm', q: 'En dégustation, qu\'appelle-t-on le « nez » d\'un vin ?', choices: ['Ses arômes', 'Sa couleur', 'Son goût en bouche', 'Son degré d\'alcool'], why: 'Le premier nez se prend verre immobile, le second après l\'avoir fait tourner pour libérer les arômes.' },
          { t: 'vf', q: 'Il vaut mieux tenir son verre de vin par le pied.', a: true, why: 'Pour ne pas réchauffer le vin avec la main et garder le verre propre.' },
          { t: 'qcm', q: 'Que désigne la « robe » d\'un vin ?', choices: ['Sa couleur et son aspect', 'Son étiquette', 'Son bouchon', 'Son prix'], why: 'Intensité, nuance, limpidité : la robe donne des indices sur l\'âge et le cépage.' },
          { t: 'pairs', q: 'Associe chaque terme à son sens', pairs: [['Tanins', 'Sensation d\'astringence'], ['Millésime', 'Année de la récolte'], ['Caudalie', 'Une seconde de persistance en bouche'], ['Cépage', 'Variété de raisin']] },
          { t: 'vf', q: 'En France, un rosé s\'obtient en mélangeant du vin blanc et du vin rouge.', a: false, why: 'C\'est interdit pour les rosés tranquilles : on laisse macérer peu de temps des raisins noirs. La seule exception est le champagne rosé.' },
          { t: 'gap', q: 'Pour aérer un vin, on peut le verser dans une ___.', choices: ['carafe', 'cuve', 'barrique', 'flûte'], why: 'On parle de « carafer » ou de « décanter », surtout pour les rouges jeunes et puissants.' },
        ],
        shine: 'En France, mélanger du rouge et du blanc pour faire du rosé est interdit… sauf en Champagne, où c\'est même la méthode la plus courante pour le champagne rosé.',
      },
    ],
  },
  {
    id: 'mots',
    name: 'Expressions & mots',
    emoji: '💬',
    color: '#4F6AA8',
    lessons: [
      {
        title: 'D\'où viennent nos expressions ?',
        cards: [
          { title: 'Des histoires cachées', text: 'Beaucoup d\'expressions viennent du Moyen Âge, du théâtre ou des tribunaux. Leur origine est parfois connue… et parfois une jolie légende.' },
          { title: 'Se méfier des belles histoires', text: 'Les étymologies trop parfaites sont souvent inventées après coup. Les linguistes appellent ça l\'« étymologie populaire ».' },
        ],
        questions: [
          { t: 'qcm', q: 'Que désignait la « sellette » dans « être sur la sellette » ?', choices: ['Le petit siège de l\'accusé', 'La selle d\'un cheval', 'Un tabouret de traite', 'Une chaise de barbier'], why: 'Au tribunal, l\'accusé était assis sur un siège bas pendant son interrogatoire.' },
          { t: 'vf', q: '« Payer en monnaie de singe » vient de montreurs de singes qui payaient un péage en faisant faire des tours à leur animal.', a: true, why: 'Au XIIIe siècle, sous Saint Louis, ils étaient dispensés du péage du Petit-Pont à Paris en échange d\'un numéro.' },
          { t: 'pairs', q: 'Associe chaque expression à son sens', pairs: [['Poser un lapin', 'Ne pas venir au rendez-vous'], ['Faire chou blanc', 'Échouer'], ['Tirer les vers du nez', 'Faire parler quelqu\'un'], ['Avoir le cafard', 'Avoir des idées noires']] },
          { t: 'qcm', q: 'Qui est Artaban, dans « fier comme Artaban » ?', choices: ['Un héros de roman du XVIIe siècle', 'Un général romain', 'Un roi de France', 'Un mousquetaire'], why: 'Un personnage hautain du roman « Cléopâtre » de La Calprenède, très lu à l\'époque.' },
          { t: 'vf', q: 'Le mot « bistrot » vient de soldats russes qui criaient « bystro » (vite) à Paris en 1814.', a: false, why: 'Jolie légende, mais le mot n\'apparaît qu\'à la fin du XIXe siècle, bien après 1814. Les linguistes la rejettent.' },
          { t: 'gap', q: '« Revenons à nos ___ » vient d\'une farce du Moyen Âge.', choices: ['moutons', 'chèvres', 'vaches', 'cochons'], why: 'La « Farce de Maître Pathelin » (XVe siècle) : un juge perdu ramène le procès au vol de moutons.' },
        ],
        shine: 'Non, « bistrot » ne vient pas des cosaques criant « bystro » en 1814 : le mot apparaît soixante-dix ans plus tard. C\'est une étymologie trop belle pour être vraie.',
      },
      {
        title: 'Le latin de salon',
        cards: [
          { title: 'Quelques mots qui font effet', text: 'Carpe diem, alea jacta est, in vino veritas : le latin glissé au bon moment fait toujours son petit effet.' },
          { title: 'César, roi de la formule', text: 'Après une victoire éclair à Zéla en 47 av. J.-C., César aurait résumé : « Veni, vidi, vici ».' },
        ],
        questions: [
          { t: 'pairs', q: 'Associe chaque locution à sa traduction', pairs: [['Carpe diem', 'Cueille le jour'], ['Alea jacta est', 'Le sort en est jeté'], ['Veni, vidi, vici', 'Je suis venu, j\'ai vu, j\'ai vaincu'], ['In vino veritas', 'La vérité est dans le vin']] },
          { t: 'qcm', q: 'Que signifie « ad vitam aeternam » ?', choices: ['Pour toujours', 'À votre santé', 'Pour la vie de château', 'Jusqu\'à demain'], why: 'Littéralement « pour la vie éternelle ».' },
          { t: 'vf', q: '« Carpe diem » vient d\'un poème d\'Horace.', a: true, why: 'Des « Odes », vers 23 av. J.-C. : profiter du jour présent sans trop compter sur le lendemain.' },
          { t: 'qcm', q: 'Que signifie « sic transit gloria mundi » ?', choices: ['Ainsi passe la gloire du monde', 'Le monde appartient aux audacieux', 'La gloire est éternelle', 'Le monde est un théâtre'], why: 'Une formule qu\'on prononçait autrefois lors du couronnement des papes.' },
          { t: 'vf', q: '« Et cetera » signifie « et les autres choses ».', a: true, why: 'Et cetera = « et les autres (choses) ». Écrire « etc… » avec des points de suspension est donc redondant.' },
          { t: 'gap', q: 'Un lapsus à l\'oral est un lapsus ___ ; à l\'écrit, un lapsus calami.', choices: ['linguae', 'oris', 'vocis', 'verbi'], why: '« Lingua », la langue ; « calamus », le roseau qui servait à écrire.' },
        ],
        shine: '« Etc… » avec des points de suspension est une faute : « et cetera » veut déjà dire « et le reste ».',
      },
      {
        title: 'Les mots voyageurs',
        cards: [
          { title: 'Un vocabulaire métissé', text: 'Le français a emprunté à l\'arabe (algèbre, café), à l\'italien (balcon, bizarre), au nahuatl des Aztèques (chocolat, tomate)…' },
          { title: 'L\'aller-retour', text: 'Certains mots anglais sont du vieux français revenu de voyage : « budget » vient de « bougette », une petite bourse.' },
        ],
        questions: [
          { t: 'qcm', q: 'De quelle langue vient le mot « algèbre » ?', choices: ['L\'arabe', 'Le grec', 'Le latin', 'Le persan'], why: 'De « al-jabr », dans le titre d\'un traité du mathématicien al-Khwârizmî (IXe siècle), qui a aussi donné « algorithme ».' },
          { t: 'pairs', q: 'Associe chaque mot à sa langue d\'origine', pairs: [['Kiosque', 'Turc'], ['Pyjama', 'Hindi'], ['Chocolat', 'Nahuatl (aztèque)'], ['Bizarre', 'Italien']] },
          { t: 'vf', q: 'Le mot anglais « budget » vient de l\'ancien français.', a: true, why: 'De « bougette », la petite bourse. Le mot est revenu en français par l\'anglais au XVIIIe siècle.' },
          { t: 'vf', q: '« Redingote » vient de l\'anglais « riding coat ».', a: true, why: 'Une veste pour monter à cheval, francisée au XVIIIe siècle.' },
          { t: 'qcm', q: 'Le mot « salaire » viendrait du latin « salarium », lié au…', choices: ['Sel', 'Soleil', 'Salut', 'Sang'], why: 'Le salarium était l\'indemnité versée aux soldats romains, traditionnellement rattachée au sel, denrée précieuse.' },
          { t: 'gap', q: 'Le mot « tennis » viendrait de « ___ ! », lancé par le serveur au jeu de paume.', choices: ['Tenez', 'Attention', 'Allez', 'Touché'], why: 'Le jeu de paume, ancêtre du tennis, était très populaire en France.' },
        ],
        shine: '« Budget » et « tennis » sont des mots anglais… venus du vieux français : la « bougette » était une petite bourse, et « Tenez ! » se criait au jeu de paume.',
      },
    ],
  },
]

// Index plat pour les révisions et les défis : id stable de chaque question.
export const ALL_QUESTIONS = []
export const LESSON_INDEX = {}
THEMES.forEach(theme => {
  theme.lessons.forEach((lesson, li) => {
    lesson.id = `${theme.id}-${li}`
    lesson.index = li
    LESSON_INDEX[lesson.id] = { theme, lesson }
    lesson.questions.forEach((q, qi) => {
      q.id = `${lesson.id}-${qi}`
      q.lessonId = lesson.id
      ALL_QUESTIONS.push(q)
    })
  })
})
export const QUESTION_INDEX = Object.fromEntries(ALL_QUESTIONS.map(q => [q.id, q]))
export const ALL_SHINES = THEMES.flatMap(t => t.lessons.map(l => ({ text: l.shine, theme: t, lesson: l })))
