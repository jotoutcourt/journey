// La Traque du Kraken : réglages partagés par le salon et le plateau
export const SEAT_COLORS = ['#2ee6c5', '#ff4fd8', '#ffc940', '#5b9cff', '#ff7a3d', '#a3e635', '#c77dff', '#ff5d73']
export const SEAT_NAMES = ['Turquoise', 'Rose', 'Or', 'Bleu']
// Thèmes « généraux » posés sur les cases ordinaires du plateau
// Cases « Question » : 8 thèmes grand public tirés au hasard à chaque partie (hors spécialités des joueurs)
export const GENERAL_TOPICS = ['culture-g', 'musique', 'jeux-video', 'animaux', 'art', 'pop-girlies', 'dessins-animes', 'capitales', 'cinema',
  'sciences', 'histoire', 'gastronomie', 'expressions', 'mythologie', 'france', 'corps', 'litterature', 'inventions', 'monuments',
  'chanson-francaise', 'annees-80-90', 'voitures', 'c-series-cultes', 'c-espace', 'c-pop2000']
export function pickGeneral(topics, exclude = []) {
  const ok = GENERAL_TOPICS.filter(id => !exclude.includes(id) && (topics.find(t => t.id === id)?.questions || []).filter(q => !q.img && q.a?.length === 4).length >= 20)
  return shuffle(ok).slice(0, 16) // le serveur retire les spécialités (secrètes) de tous les joueurs et en garde 8
}
export const ITEMS = {
  double: { icon: '🎲', name: 'Double dé', desc: 'Lance 2 dés ce tour-ci', target: false },
  ancre: { icon: '⚓', name: 'Ancre', desc: 'Un adversaire passe son prochain tour', target: true },
  joker: { icon: '🃏', name: 'Joker 50/50', desc: 'Retire 2 mauvaises réponses (pendant une question)', target: false },
  vol: { icon: '🦝', name: 'Vol', desc: 'Prends 5 perles à un adversaire', target: true },
  echange: { icon: '🔄', name: 'Échange', desc: 'Échange ta place avec un adversaire', target: true },
  harpon: { icon: '🔱', name: 'Harpon', desc: 'Repousse le requin une fois, tout seul (+3 perles)', target: false, passive: true },
}
export const ITEM_COST = { double: 6, ancre: 5, joker: 4, vol: 5, echange: 8, harpon: 7 }
export const CELL_ICON = { shop: '🏪', start: '⚓', truce: '🤝', chest: '💰', current: '🌊', tentacle: '🐙', shortcut: '🚪', lair: '💀', crab: '🦀', bubble: '🫧', puffer: '🐡', whirl: '🌀', cursed: '🎁', shark: '🦈' }
export const CELL_LABEL = {
  shop: 'Boutique : on s\'y arrête en passant pour acheter des objets', start: 'Départ', general: 'Question', spec: 'Spécialité', truce: 'Trêve : défi commun pour remplir le trésor', chest: 'Coffre : des perles',
  current: 'Courant : ±2 cases', crab: 'Crabe farceur : échange de place avec un joueur au hasard', bubble: 'Bulle : ton prochain dé compte double (sans arrêt en boutique)',
  puffer: 'Poisson-ballon (une seule fois) : +2 perles pour les autres, -2 pour toi', whirl: 'Tourbillon (une seule fois) : tous les pions sont mélangés', cursed: 'Coffre maudit : 3 coffres, perles, objet… ou tentacule',
  shark: 'Requin : 2 questions de survie, une bonne réponse suffit… sinon tu deviens un fantôme', tentacle: 'Tentacule : événement surprise', shortcut: 'Raccourci : question difficile, +5 cases', lair: 'Antre du Kraken',
}

const shuffle = (a) => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]] } return b }

// Questions envoyées au serveur au lancement : jusqu'à 40 par thème, réponses mélangées
export function buildPool(topics, ids) {
  const pool = {}
  for (const id of ids) {
    const t = topics.find(x => x.id === id)
    if (!t) continue
    pool[id] = shuffle(t.questions.filter(q => !q.img && q.a?.length === 4)).slice(0, 40).map(q => {
      const order = shuffle([0, 1, 2, 3])
      return { q: q.q.slice(0, 380), o: order.map(i => String(q.a[i]).slice(0, 150)), c: order.indexOf(0) }
    })
  }
  return pool
}
export const topicMeta = (t) => ({ id: t.id, name: t.name, icon: t.icon, color: t.color })
export const randomTopics = (topics, n = 3) => shuffle(topics.filter(t => t.official && t.questions.length >= 30 && !t.questions[0]?.img)).slice(0, n).map(topicMeta)

// Spirale carrée 9×9 de l'extérieur vers le centre : position (ligne, colonne) de chaque case
export function spiral(n = 9) {
  const out = []
  let top = 0, left = 0, bottom = n - 1, right = n - 1
  while (top <= bottom && left <= right) {
    for (let c = left; c <= right; c++) out.push([top, c])
    top++
    for (let r = top; r <= bottom; r++) out.push([r, right])
    right--
    if (top <= bottom) { for (let c = right; c >= left; c--) out.push([bottom, c]); bottom-- }
    if (left <= right) { for (let r = bottom; r >= top; r--) out.push([r, left]); left++ }
  }
  return out
}

// Figurines (pions) au choix
export const PAWNS = [
  // les 4 premières sont offertes
  { id: 'stitch', name: 'Stitch' }, { id: 'araignee', name: 'Spider-Man' }, { id: 'pirate', name: 'Jack Sparrow' }, { id: 'dino', name: 'Yoshi' },
  // les autres se débloquent avec la figurine mystère
  { id: 'gilet', name: 'Gilet jaune' }, { id: 'sorcier', name: 'Harry Potter' }, { id: 'reine-neiges', name: 'Elsa' }, { id: 'liberte', name: 'Statue de la Liberté' },
  { id: 'astronaute', name: 'Astronaute' }, { id: 'fantome', name: 'Ghostface' }, { id: 'dormeur', name: 'Endormi' }, { id: 'eclair', name: 'Pikachu' },
  { id: 'heros', name: 'Link' }, { id: 'ane', name: 'Bourriquet' }, { id: 'retro', name: 'Liam Payne' }, { id: 'seigneur', name: 'Dark Vador' },
].map(p => ({ ...p, img: `/traque/pions/${p.id}.webp` }))
// les 4 premières figurines sont offertes ; les autres se débloquent au hasard (figurine mystère, 20 lingots)
export const FREE_PAWNS = ['stitch', 'araignee', 'pirate', 'dino']
export const PAWN_PRICE = 20
export const pawnImg = (id, seat) => `/traque/pions/${id || PAWNS[seat % PAWNS.length].id}.webp`
