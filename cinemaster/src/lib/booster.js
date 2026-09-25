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

export function openBooster(rand = Math.random) {
  const pulled = new Set()
  return SLOTS.map(weights => {
    const rarity = pickWeighted(weights, rand)
    const fresh = POOL[rarity].filter(c => !pulled.has(c.id))
    const list = fresh.length ? fresh : POOL[rarity]
    const card = list[Math.floor(rand() * list.length)]
    pulled.add(card.id)
    return card
  })
}
