// Statistiques de jeu, mises à jour à chaque booster ouvert.
import { rarityRank } from './rarity.js'

export function recordPull(state, cards, newIds) {
  const prev = state.stats || {}
  const byRarity = { ...prev.byRarity }
  for (const c of cards) byRarity[c.rarity] = (byRarity[c.rarity] || 0) + 1
  // meilleure carte tirée : la plus rare (la première obtenue en cas d'égalité)
  let best = prev.best || null
  for (const c of cards) {
    if (!best || rarityRank(c.rarity) > best.rank) best = { id: c.id, rank: rarityRank(c.rarity), at: Date.now() }
  }
  return {
    ...state,
    stats: {
      pulled: (prev.pulled || 0) + cards.length,
      found: (prev.found || 0) + newIds.size,
      byRarity,
      best,
    },
  }
}
