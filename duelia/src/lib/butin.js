// « Le Butin » : mode coopératif à deux (logique sans interface).
// Le duo partage un trésor de lingots et le répartit sur les réponses ; le serveur arbitre.
import { seeded, shuffle } from './rng.js'

export const START = 20 // lingots au départ
export const LINGOT = 1000 // valeur affichée d'un lingot (en pièces d'or)
export const ROUNDS = 8
// Nombre de réponses par manche : de moins en moins de choix… mais tout se joue sur la fin
export const OPTIONS = [4, 4, 4, 4, 3, 3, 3, 2]
export const PLACE_MS = 45000

export const gold = (lingots) => (lingots * LINGOT).toLocaleString('fr-FR')

// Prépare les 8 manches : thèmes officiels variés (jamais deux fois de suite), réponses réduites selon la manche
export function buildButin(topics, seed = Date.now() + ':' + Math.random()) {
  const rnd = seeded('butin|' + seed)
  const pool = topics.filter(t => t.official && t.questions.length >= 20 && !t.questions.some(q => q.img)).sort((a, b) => (a.id < b.id ? -1 : 1))
  const rounds = []
  let prev = null
  for (let i = 0; i < ROUNDS; i++) {
    const choices = pool.filter(t => t.id !== prev)
    const topic = choices[Math.floor(rnd() * choices.length)]
    prev = topic.id
    const raw = topic.questions[Math.floor(rnd() * topic.questions.length)]
    // la bonne réponse (a[0]) et des mauvaises tirées au hasard, puis mélangées
    const wrong = shuffle(raw.a.slice(1).map((_, k) => k + 1), rnd).slice(0, OPTIONS[i] - 1)
    const order = shuffle([0, ...wrong], rnd)
    rounds.push({
      q: raw.q, options: order.map(k => raw.a[k]), correct: order.indexOf(0),
      topic: { name: topic.name, icon: topic.icon, color: topic.color },
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

// Palier (titre) du duo selon le butin final
export const RANKS = [
  { min: 1, icon: '🪙', name: 'Pilleurs d\'épaves' },
  { min: 5, icon: '⚓', name: 'Corsaires' },
  { min: 10, icon: '🏴‍☠️', name: 'Capitaines' },
  { min: 15, icon: '👑', name: 'Rois des abysses' },
  { min: 20, icon: '💎', name: 'Légendes du Kraken' },
]
export const rankFor = (bank) => [...RANKS].reverse().find(r => bank >= r.min) || null
