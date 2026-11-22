// « Le Butin » : mode coopératif à deux (logique sans interface).
// Le duo partage un trésor de lingots et le répartit sur les réponses ; le serveur arbitre.
import { seeded, shuffle } from './rng.js'
import BANK from '../data/butin-questions.js'

export const START = 20 // lingots au départ
export const ROUNDS = 8
// Nombre de réponses par manche : de moins en moins de choix… mais tout se joue sur la fin
export const OPTIONS = [4, 4, 4, 4, 3, 3, 3, 2]
export const PLACE_MS = 45000

// Affichage : on compte simplement en lingots
export const gold = (n) => `${n} lingot${n > 1 ? 's' : ''}`

// Questions dédiées au Butin (avec explication), tirées au hasard : jamais deux fois la même catégorie de suite,
// au plus une question « capitale » par partie, et en évitant les questions vues récemment.
const ICONS = { 'Géographie': '🌍', 'Histoire': '📜', 'Sciences': '🧪', 'Nature': '🦊', 'Pop culture': '🍿', 'Culture générale': '🧠',
  'Culture': '🎨', 'Littérature': '📚', 'Musique': '🎧', 'Sport': '🏅', 'Faits insolites': '🤯', 'Cinéma': '🎬', 'Télévision': '📺',
  'Gastronomie': '🧀', 'Vie quotidienne': '🏠', 'Inventions': '💡' }
export const BUTIN_BANK = BANK.map(([cat, q, good, ...rest], id) => ({ id, cat, q, a: [good, ...rest.slice(0, 3)], expl: rest[3] }))

export function buildButin(recent = [], seed = Date.now() + ':' + Math.random()) {
  const rnd = seeded('butin|' + seed)
  const avoid = new Set(recent)
  let pool = BUTIN_BANK.filter(x => !avoid.has(x.id))
  if (pool.length < 40) pool = BUTIN_BANK
  pool = shuffle(pool, rnd)
  const rounds = []
  let prevCat = null, capitals = 0
  for (let i = 0; i < ROUNDS; i++) {
    const k = pool.findIndex(x => x.cat !== prevCat && !(capitals && /capitale/i.test(x.q)))
    const raw = pool.splice(k < 0 ? 0 : k, 1)[0]
    prevCat = raw.cat
    if (/capitale/i.test(raw.q)) capitals++
    // la bonne réponse (a[0]) et des mauvaises tirées au hasard, puis mélangées
    const wrong = shuffle([1, 2, 3], rnd).slice(0, OPTIONS[i] - 1)
    const order = shuffle([0, ...wrong], rnd)
    rounds.push({
      id: raw.id, q: raw.q, options: order.map(n => raw.a[n]), correct: order.indexOf(0), expl: raw.expl,
      topic: { name: raw.cat, icon: ICONS[raw.cat] || '❓', color: '#7c5cff' },
    })
  }
  return rounds
}

// Répartition jouable : entiers positifs, pas plus que le trésor, au moins une réponse vide
export function validPlacement(placement, bank) {
  if (!Array.isArray(placement) || placement.some(v => !Number.isInteger(v) || v < 0)) return false
  const total = placement.reduce((a, b) => a + b, 0)
  return total <= bank && placement.filter(v => v > 0).length < placement.length
}

export const placed = (placement) => (placement || []).reduce((a, b) => a + b, 0)

// Ajoute (ou retire) des lingots sur une réponse, en respectant les règles ; renvoie la nouvelle répartition
export function move(placement, idx, delta, bank) {
  const next = [...placement]
  const free = bank - placed(placement)
  const d = delta > 0 ? Math.min(delta, free) : Math.max(delta, -next[idx])
  if (!d) return placement
  next[idx] += d
  return validPlacement(next, bank) ? next : placement
}

// Titre du duo de voleurs selon le butin final
export const RANKS = [
  { min: 1, icon: '🪙', name: 'Pickpockets' },
  { min: 5, icon: '🗝️', name: 'Crocheteurs' },
  { min: 10, icon: '🏴‍☠️', name: 'Pirates' },
  { min: 15, icon: '👑', name: 'Maîtres voleurs' },
  { min: 20, icon: '💎', name: 'Fléaux du Kraken' },
]
export const rankFor = (bank) => [...RANKS].reverse().find(r => bank >= r.min) || null
