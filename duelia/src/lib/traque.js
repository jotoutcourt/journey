// La Traque du Kraken : réglages partagés par le salon et le plateau
export const SEAT_COLORS = ['#2ee6c5', '#ff4fd8', '#ffc940', '#5b9cff']
export const SEAT_NAMES = ['Turquoise', 'Rose', 'Or', 'Bleu']
// Thèmes « généraux » posés sur les cases ordinaires du plateau
export const GENERAL_TOPICS = ['culture-g', 'histoire', 'cinema', 'sciences', 'capitales', 'musique', 'animaux', 'sports', 'expressions', 'monuments']
export const ITEMS = {
  double: { icon: '🎲', name: 'Double dé', desc: 'Lance 2 dés ce tour-ci', target: false },
  ancre: { icon: '⚓', name: 'Ancre', desc: 'Un adversaire passe son prochain tour', target: true },
  joker: { icon: '🃏', name: 'Joker 50/50', desc: 'Retire 2 mauvaises réponses (pendant une question)', target: false },
  vol: { icon: '🦝', name: 'Vol', desc: 'Prends 5 perles à un adversaire', target: true },
  echange: { icon: '🔄', name: 'Échange', desc: 'Échange ta place avec un adversaire', target: true },
}
export const ITEM_COST = { double: 6, ancre: 5, joker: 4, vol: 5, echange: 8 }
export const CELL_ICON = { shop: '🏪', start: '⚓', truce: '🤝', chest: '💰', current: '🌊', tentacle: '🐙', shortcut: '🚪', lair: '💀' }
export const CELL_LABEL = {
  shop: 'Boutique : on s\'y arrête en passant pour acheter des objets', start: 'Départ', general: 'Question', spec: 'Spécialité', truce: 'Trêve : défi commun pour remplir le trésor', chest: 'Coffre : des perles',
  current: 'Courant : ±2 cases', tentacle: 'Tentacule : événement surprise', shortcut: 'Raccourci : question difficile, +5 cases', lair: 'Antre du Kraken',
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
  { id: 'stitch', name: 'Bonnet bleu' }, { id: 'gilet', name: 'Gilet jaune' }, { id: 'araignee', name: 'Homme-araignée' },
  { id: 'sorcier', name: 'Apprenti sorcier' }, { id: 'reine-neiges', name: 'Reine des neiges' }, { id: 'liberte', name: 'Liberté' },
  { id: 'astronaute', name: 'Astronaute' }, { id: 'fantome', name: 'Fantôme' }, { id: 'dormeur', name: 'Marmotte' }, { id: 'eclair', name: 'Pyjama éclair' },
].map(p => ({ ...p, img: `/traque/pions/${p.id}.webp` }))
export const pawnImg = (id, seat) => `/traque/pions/${id || PAWNS[seat % PAWNS.length].id}.webp`
