// Périodes de classement : semaine (lundi 0 h), mois (le 1er à 0 h), et depuis toujours.
export const PERIODS = [
  { id: 'week', label: 'Semaine', champ: 'Champion de la semaine' },
  { id: 'month', label: 'Mois', champ: 'Champion du mois' },
  { id: 'all', label: 'Depuis toujours', champ: 'Champion du thème' },
]

export function periodBounds(kind, now = new Date()) {
  if (kind === 'week') {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7)) // retour au lundi
    const end = new Date(start); end.setDate(end.getDate() + 7)
    return { start, end, key: `w${start.getFullYear()}-${start.getMonth()}-${start.getDate()}` }
  }
  if (kind === 'month') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 1)
    return { start, end, key: `m${start.getFullYear()}-${start.getMonth()}` }
  }
  return { start: new Date(0), end: null, key: 'all' }
}

// XP gagné par le joueur depuis le début de la période.
export function myPeriodXp(stats, kind, now = new Date()) {
  if (!stats) return 0
  if (kind === 'all') return stats.xp || 0
  const from = periodBounds(kind, now).start.getTime()
  return (stats.log || []).filter(e => e.at >= from).reduce((s, e) => s + e.xp, 0)
}

// « dans 3 j 4 h » avant la remise à zéro
export function resetIn(kind, now = new Date()) {
  const { end } = periodBounds(kind, now)
  if (!end) return null
  const ms = end - now
  const d = Math.floor(ms / 86400000), h = Math.floor((ms % 86400000) / 3600000), m = Math.floor((ms % 3600000) / 60000)
  return d > 0 ? `${d} j ${h} h` : h > 0 ? `${h} h ${m} min` : `${m} min`
}
