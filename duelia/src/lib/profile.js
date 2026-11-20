import { leaderboard } from './bots.js'
import { myPeriodXp } from './periods.js'

// Pays proposés dans le profil (drapeau + nom).
export const COUNTRIES = [
  ['🇫🇷', 'France'], ['🇧🇪', 'Belgique'], ['🇨🇭', 'Suisse'], ['🇨🇦', 'Canada'], ['🇱🇺', 'Luxembourg'], ['🇲🇨', 'Monaco'],
  ['🇲🇦', 'Maroc'], ['🇩🇿', 'Algérie'], ['🇹🇳', 'Tunisie'], ['🇸🇳', 'Sénégal'], ['🇨🇮', "Côte d'Ivoire"], ['🇨🇲', 'Cameroun'],
  ['🇲🇬', 'Madagascar'], ['🇲🇱', 'Mali'], ['🇨🇩', 'RD Congo'], ['🇭🇹', 'Haïti'], ['🇱🇧', 'Liban'], ['🇪🇸', 'Espagne'],
  ['🇵🇹', 'Portugal'], ['🇮🇹', 'Italie'], ['🇩🇪', 'Allemagne'], ['🇬🇧', 'Royaume-Uni'], ['🇮🇪', 'Irlande'], ['🇳🇱', 'Pays-Bas'],
  ['🇺🇸', 'États-Unis'], ['🇲🇽', 'Mexique'], ['🇧🇷', 'Brésil'], ['🇦🇷', 'Argentine'], ['🇯🇵', 'Japon'], ['🇰🇷', 'Corée du Sud'],
  ['🇨🇳', 'Chine'], ['🇮🇳', 'Inde'], ['🇹🇷', 'Turquie'], ['🇦🇺', 'Australie'], ['🌍', 'Autre'],
]

// Ce que le classement et le duel savent du joueur.
export const meEntry = (p) => ({ name: p.name, avatar: p.avatar, photo: p.photo, flag: p.flag || '🇫🇷', playerId: p.playerId })

// Recadre une photo de l'appareil au centre et la réduit (JPEG léger, stocké dans le navigateur).
export function resizeImage(file, w, h, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const scale = Math.max(w / img.width, h / img.height)
      const sw = w / scale, sh = h / scale
      const canvas = document.createElement('canvas')
      canvas.width = w; canvas.height = h
      canvas.getContext('2d').drawImage(img, (img.width - sw) / 2, (img.height - sh) / 2, sw, sh, 0, 0, w, h)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('image illisible')) }
    img.src = url
  })
}

// Statistiques agrégées sur tous les thèmes.
export function computeStats(st, topics) {
  const all = Object.entries(st.topicStats)
  const sum = (k) => all.reduce((s, [, t]) => s + (t[k] || 0), 0)
  const played = sum('played'), wins = sum('wins'), draws = sum('draws')
  const tracked = sum('tracked') // parties jouées depuis que ces statistiques existent
  const byCat = new Map()
  for (const [id, t] of all) {
    const topic = topics.find(x => x.id === id)
    if (!topic || !t.xp) continue
    byCat.set(topic.category, (byCat.get(topic.category) || 0) + t.xp)
  }
  return {
    played, wins, draws, losses: Math.max(0, played - wins - draws),
    avgScore: tracked ? Math.round(sum('scoreSum') / tracked) : null,
    avgTime: sum('answered') ? sum('timeSum') / sum('answered') / 1000 : null,
    accuracy: sum('asked') ? Math.round((sum('correct') / sum('asked')) * 100) : null,
    byCategory: [...byCat.entries()].sort((a, b) => b[1] - a[1]),
    totalXp: st.xp,
  }
}

// Meilleur classement actuel du joueur, pour le bandeau du profil.
export function bestBadge(st, topics) {
  let best = null
  const order = { all: 0, month: 1, week: 2 }
  for (const [id, stats] of Object.entries(st.topicStats)) {
    const topic = topics.find(x => x.id === id)
    if (!topic || !stats.played) continue
    for (const kind of ['all', 'month', 'week']) {
      const xp = myPeriodXp(stats, kind)
      if (!xp) continue
      const rank = leaderboard(topic, { ...meEntry(st.profile), allXp: stats.xp }, xp, kind).find(r => r.isMe).rank
      if (rank > 10) continue
      if (!best || rank < best.rank || (rank === best.rank && order[kind] < order[best.kind])) best = { rank, kind, topic }
    }
  }
  return best
}
