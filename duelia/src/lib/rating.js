// Cote de niveau par thème (façon Elo) et points de partie. Même calcul que record_game côté serveur.
export const START_RATING = 1000
export const PLACEMENT = 5 // parties avant d'apparaître dans le classement « Depuis toujours »
export const BEST_OF = 10 // Semaine / Mois : total des 10 meilleures parties

export const TIERS = [
  { min: 1550, id: 'kraken', name: 'Kraken', icon: '🐙', color: '#2ee6c5' },
  { min: 1400, id: 'diamant', name: 'Diamant', icon: '💎', color: '#7cc8ff' },
  { min: 1250, id: 'or', name: 'Or', icon: '🥇', color: '#ffc940' },
  { min: 1100, id: 'argent', name: 'Argent', icon: '🥈', color: '#d7dcef' },
  { min: 0, id: 'bronze', name: 'Bronze', icon: '🥉', color: '#e3a06b' },
]
export const tierOf = (rating) => TIERS.find(t => rating >= t.min)

// Points d'une partie : score du duel (max 160) + 40 si victoire, 20 si nul.
export const clampScore = (n) => Math.max(0, Math.min(160, Math.round(n || 0)))
export function gamePoints(myScore, oppScore) {
  const my = clampScore(myScore), opp = clampScore(oppScore)
  return my + (my > opp ? 40 : my === opp ? 20 : 0)
}

// Cote d'un adversaire IA : son niveau (0,35 à 0,95) ramené entre 700 et 1700.
export const botRating = (bot) => Math.round(700 + Math.max(0, Math.min(1, ((bot.skill ?? 0.6) - 0.35) / 0.6)) * 1000) + (bot.champion ? 50 : 0)
export const opponentRating = (o) => (o?.ai ? botRating(o) : Math.round(o?.rating || START_RATING))

export function nextRating(rating, games, oppRating, myScore, oppScore) {
  const my = clampScore(myScore), opp = clampScore(oppScore)
  const s = my > opp ? 1 : my === opp ? 0.5 : 0
  const e = 1 / (1 + Math.pow(10, (oppRating - rating) / 400))
  const k = games < 10 ? 40 : 24
  return Math.max(100, rating + Math.round(k * (s - e)))
}

export const isPlaced = (stats) => (stats?.rated || 0) >= PLACEMENT
