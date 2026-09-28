// Univers du joueur : il en choisit 5 au départ ; chaque collection
// complétée (toutes les cartes sauf les Gold) débloque un univers de plus.
// Les boosters ne contiennent que des cartes de ses univers.
import { CARDS, UNIVERSES } from '../data/cards.js'

export const START_UNIVERSES = 5
export const ALL_UNIVERSES = Object.keys(UNIVERSES)

// cartes à réunir pour compléter une série (les Gold ne comptent pas)
const TO_COMPLETE = Object.fromEntries(ALL_UNIVERSES.map(u => [u, CARDS.filter(c => c.u === u && c.rarity !== 'secrete')]))

export const completionOf = (u, owned) => {
  const list = TO_COMPLETE[u]
  const have = list.filter(c => owned[c.id]).length
  return { have, total: list.length, done: list.length > 0 && have === list.length }
}

// univers choisis dont la collection est complète
export const completedUniverses = state => (state.universes || []).filter(u => completionOf(u, state.owned).done)

// nombre d'univers auxquels le joueur a droit
export const slotsFor = state => Math.min(ALL_UNIVERSES.length, START_UNIVERSES + completedUniverses(state).length)

// combien d'univers le joueur doit encore choisir (0 = rien à faire)
export const toChoose = state => Math.max(0, slotsFor(state) - (state.universes?.length || 0))

// suggestion de départ : les univers où il a déjà le plus de cartes
export function suggested(owned) {
  return ALL_UNIVERSES
    .map(u => [u, CARDS.filter(c => c.u === u && owned[c.id]).length])
    .filter(([, n]) => n > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, START_UNIVERSES)
    .map(([u]) => u)
}
