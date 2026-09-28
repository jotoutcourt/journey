// Missions du jour : trois objectifs tirés chaque jour (les mêmes pour tout
// le monde ce jour-là), avec une récompense à récupérer une fois réussis.
import { UNIVERSES } from '../data/cards.js'
import { PACK_COVERS } from './packs.js'
import { rarityRank } from './rarity.js'
import { BOOSTER_DUST_COST, MAX_BOOSTERS } from './storage.js'

// Jour local « 2026-09-28 » : les missions changent à minuit chez le joueur.
export function dayKey(now = Date.now()) {
  const d = new Date(now)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function msUntilTomorrow(now = Date.now()) {
  const d = new Date(now)
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1) - d
}

// Générateur pseudo-aléatoire reproductible à partir du jour
function seeded(str) {
  let h = 2166136261
  for (const ch of str) h = Math.imul(h ^ ch.charCodeAt(0), 16777619)
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507)
    h = Math.imul(h ^ (h >>> 13), 3266489909)
    return ((h ^= h >>> 16) >>> 0) / 4294967296
  }
}

const pick = (list, rand) => list[Math.floor(rand() * list.length)]

// Familles de missions ; chaque jour en tire trois différentes.
const FAMILIES = [
  rand => {
    const n = pick([1, 2, 3], rand)
    return { kind: 'open', goal: n, label: n > 1 ? `Ouvre ${n} boosters` : 'Ouvre un booster', reward: { dust: 5 * n } }
  },
  rand => {
    const u = pick(PACK_COVERS, rand).u
    return { kind: 'series', param: u, goal: 1, label: `Trouve une carte ${UNIVERSES[u].name}`, reward: { dust: 10 } }
  },
  rand => {
    const n = pick([3, 4, 5], rand)
    return { kind: 'new', goal: n, label: `Découvre ${n} nouvelles cartes`, reward: { dust: 15 } }
  },
  rand => (rand() < 0.5
    ? { kind: 'rarity', param: 'rare', goal: 2, label: 'Obtiens 2 cartes Rare ou mieux', reward: { dust: 10 } }
    : { kind: 'rarity', param: 'holo', goal: 1, label: 'Obtiens une Holo ou mieux', reward: { booster: 1 } }),
  () => ({ kind: 'recycle', goal: 1, label: 'Recycle un doublon', reward: { dust: 5 } }),
]

export function missionsFor(day) {
  const rand = seeded(`popcard-${day}`)
  const order = FAMILIES.map((f, i) => [rand(), i]).sort((a, b) => a[0] - b[0]).map(x => x[1])
  const list = order.slice(0, 3).map((i, n) => ({ id: `${day}-${n}`, ...FAMILIES[i](rand) }))
  // au moins une mission offre un booster : la plus exigeante
  if (!list.some(m => m.reward.booster)) {
    const hardest = list.reduce((a, b) => (b.goal > a.goal ? b : a))
    hardest.reward = { booster: 1 }
  }
  return list
}

// Remet les missions à zéro quand le jour change.
export function withToday(state, now = Date.now()) {
  const day = dayKey(now)
  if (state.missions?.day === day) return state
  return { ...state, missions: { day, progress: {}, claimed: {} } }
}

// Avance les missions selon un événement de jeu :
//   { type: 'open', cards, newIds }  ·  { type: 'recycle', count }
export function track(state, event) {
  const s = withToday(state)
  const progress = { ...s.missions.progress }
  for (const m of missionsFor(s.missions.day)) {
    let add = 0
    if (event.type === 'open') {
      if (m.kind === 'open') add = 1
      if (m.kind === 'series') add = event.cards.filter(c => c.u === m.param).length
      if (m.kind === 'new') add = event.newIds.size
      if (m.kind === 'rarity') add = event.cards.filter(c => rarityRank(c.rarity) >= rarityRank(m.param)).length
    } else if (event.type === 'recycle' && m.kind === 'recycle') {
      add = event.count
    }
    if (add) progress[m.id] = Math.min(m.goal, (progress[m.id] || 0) + add)
  }
  return { ...s, missions: { ...s.missions, progress } }
}

// Récompense d'une mission réussie. Un booster offert alors que la réserve
// est pleine est converti en pellicules (de quoi en ouvrir un).
export function claim(state, id) {
  const s = withToday(state)
  const m = missionsFor(s.missions.day).find(x => x.id === id)
  if (!m || s.missions.claimed[id] || (s.missions.progress[id] || 0) < m.goal) return state
  const claimed = { ...s.missions.claimed, [id]: true }
  let { dust, boosters } = s
  if (m.reward.dust) dust += m.reward.dust
  if (m.reward.booster) {
    if (boosters < MAX_BOOSTERS) boosters += 1
    else dust += BOOSTER_DUST_COST
  }
  return { ...s, dust, boosters, missions: { ...s.missions, claimed } }
}

export const rewardLabel = r => (r.booster ? '1 booster' : `${r.dust} pellicules`)
