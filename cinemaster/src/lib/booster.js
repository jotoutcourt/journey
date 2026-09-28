import { CARDS } from '../data/cards.js'

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

// Rareté tirée parmi celles que `allowed` accepte, poids renormalisés.
function pickAmong(weights, allowed, rand) {
  const w = Object.fromEntries(Object.entries(weights).filter(([k]) => allowed(k)))
  return Object.keys(w).length ? pickWeighted(w, rand) : null
}

// Part des chances d'un emplacement que le thème peut honorer
const coverage = (weights, pool) => Object.entries(weights)
  .reduce((sum, [k, w]) => sum + (pool[k]?.length ? w : 0), 0)

// Ouvre un booster. Avec `theme` (clé d'univers), au moins une carte vient
// de cette série. Elle prend la place de l'emplacement que la série couvre le
// mieux, avec les mêmes taux de rareté : pour Friends ou The 100, dont toutes
// les raretés existent, les taux restent strictement identiques ; pour une
// série sans commune (Titanic), la carte garantie sort de l'emplacement rare.
export function openBooster({ theme, rand = Math.random } = {}) {
  const pulled = new Set()
  const themePool = theme ? CARDS.filter(c => c.u === theme)
    .reduce((acc, c) => ((acc[c.rarity] ||= []).push(c), acc), {}) : null

  let themeSlot = -1
  if (themePool) {
    const scores = SLOTS.map(w => coverage(w, themePool))
    const best = Math.max(...scores)
    const candidates = scores.flatMap((sc, i) => (sc === best && best > 0 ? [i] : []))
    if (candidates.length) themeSlot = candidates[Math.floor(rand() * candidates.length)]
  }

  const draw = (pool, rarity) => {
    const fresh = pool[rarity].filter(c => !pulled.has(c.id))
    const list = fresh.length ? fresh : pool[rarity]
    const card = list[Math.floor(rand() * list.length)]
    pulled.add(card.id)
    return card
  }

  return SLOTS.map((weights, i) => {
    if (i === themeSlot) {
      const rarity = pickAmong(weights, k => themePool[k]?.length, rand)
      return draw(themePool, rarity)
    }
    return draw(POOL, pickWeighted(weights, rand))
  })
}
