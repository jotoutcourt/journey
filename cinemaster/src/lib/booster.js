import { CARDS } from '../data/cards.js'
import { FEATURED_RARE_SLOT } from './featured.js'

// Un booster = 5 cartes :
//   3 × emplacement « commun »       (commune 80 % · peu commune 20 %)
//   1 × emplacement « peu commun+ »  (peu commune 70 % · rare 30 %)
//   1 × emplacement « rare »         (rare 62 % · holo 25 % · full art 10 % · gold 3 %)
export const SLOTS = [
  { commune: 80, 'peu-commune': 20 },
  { commune: 80, 'peu-commune': 20 },
  { commune: 80, 'peu-commune': 20 },
  { 'peu-commune': 70, rare: 30 },
  { rare: 62, holo: 25, ultra: 10, secrete: 3 },
]

export const BOOSTER_SIZE = SLOTS.length

const POOL = CARDS.reduce((acc, c) => ((acc[c.rarity] ||= []).push(c), acc), {})

function pickWeighted(weights, rand) {
  const total = Object.values(weights).reduce((a, b) => a + b, 0)
  let roll = rand() * total
  for (const [key, w] of Object.entries(weights)) {
    if ((roll -= w) < 0) return key
  }
  return Object.keys(weights).at(-1)
}

// Ouvre un booster.
// - `theme` (clé d'univers) : booster à thème, les 5 cartes viennent de
//   cette série uniquement.
// - sinon `universes` : univers du joueur ; toutes les cartes en viennent.
// - `featured` : booster vedette du week-end, meilleur emplacement rare.
// Sinon, mêmes taux de rareté dans tous les cas. Si une rareté tirée n'existe pas
// dans les cartes possibles, on prend la rareté voisine la plus proche en
// dessous (puis au-dessus).
const ORDER = ['commune', 'peu-commune', 'rare', 'holo', 'ultra', 'secrete']
const groupByRarity = cards => cards.reduce((acc, c) => ((acc[c.rarity] ||= []).push(c), acc), {})

export function openBooster({ theme, universes, featured = false, rand = Math.random } = {}) {
  const pulled = new Set()
  const allowed = theme ? new Set([theme]) : universes?.length ? new Set(universes) : null
  const pool = allowed ? groupByRarity(CARDS.filter(c => allowed.has(c.u))) : POOL

  // rareté disponible la plus proche de celle tirée
  const nearest = (p, rarity) => {
    if (p[rarity]?.length) return rarity
    const i = ORDER.indexOf(rarity)
    for (let d = 1; d < ORDER.length; d++) {
      if (p[ORDER[i - d]]?.length) return ORDER[i - d]
      if (p[ORDER[i + d]]?.length) return ORDER[i + d]
    }
    return null
  }

  const draw = (p, rarity) => {
    const r = nearest(p, rarity)
    const fresh = p[r].filter(c => !pulled.has(c.id))
    const list = fresh.length ? fresh : p[r]
    const card = list[Math.floor(rand() * list.length)]
    pulled.add(card.id)
    return card
  }

  const slots = featured ? [...SLOTS.slice(0, -1), FEATURED_RARE_SLOT] : SLOTS
  return slots.map(weights => draw(pool, pickWeighted(weights, rand)))
}
