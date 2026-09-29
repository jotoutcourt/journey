// Série de connexions : une récompense par jour, qui grandit chaque jour
// d'affilée (7 jours, puis on recommence). Un jour manqué remet à zéro.
import { dayKey, giveReward } from './missions.js'

export const STREAK_REWARDS = [
  { dust: 10 }, { dust: 15 }, { dust: 20 }, { dust: 25 }, { dust: 30 }, { dust: 40 }, { booster: 1 },
]

const yesterday = now => {
  const d = new Date(now)
  return dayKey(new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1).getTime())
}

// État du jour : `count` jours d'affilée (aujourd'hui compris s'il est
// récupéré), `claimed`, et la case (0 à 6) de la récompense du jour.
export function streakInfo(state, now = Date.now()) {
  const s = state.streak
  const today = dayKey(now)
  if (s?.day === today) return { claimed: true, count: s.count, slot: (s.count - 1) % 7 }
  const count = s?.day === yesterday(now) ? s.count + 1 : 1
  return { claimed: false, count, slot: (count - 1) % 7, broken: !!s && count === 1 }
}

export function claimStreak(state, now = Date.now()) {
  const info = streakInfo(state, now)
  if (info.claimed) return state
  return { ...giveReward(state, STREAK_REWARDS[info.slot]), streak: { day: dayKey(now), count: info.count } }
}
