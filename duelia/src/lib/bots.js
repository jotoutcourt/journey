// Adversaires : chaque thème a sa propre communauté de joueurs, stable d'une partie à l'autre.
import { seeded, pick, clamp } from './rng.js'
import { periodBounds } from './periods.js'

const PSEUDOS = [
  'Lunaire', 'MaxiQuiz', 'Zébulon', 'Nina_K', 'Toto42', 'Pixelle', 'Rodrigue', 'Sam.B', 'Inès', 'KevDu59',
  'Margaux', 'BigBrain', 'Yuki', 'Léon_LeVrai', 'Capucine', 'Mehdi', 'Ophélie', 'Sacha', 'Bao', 'Jules.v',
  'Aïcha', 'Thibault', 'Elif', 'Gaspard', 'Noor', 'Lou', 'Kenji', 'Romy', 'Hugo_TheBest', 'Anouk',
  'Diego', 'Maëlys', 'Ilyes', 'Clem', 'Soline', 'Oskar', 'Priya', 'Nils', 'Zoé', 'Malik',
  'QuizzBuzz', 'LaFouine', 'Cerise', 'Timéo', 'Astrid', 'Wassim', 'Jade', 'Pablo', 'Mila', 'Raphaël',
  'Électre', 'Nabil', 'Lilou', 'Arthur.D', 'Yasmine', 'Basile', 'Ana', 'Victor', 'Salomé', 'Ezra',
]
const FLAGS = ['🇫🇷', '🇫🇷', '🇫🇷', '🇫🇷', '🇧🇪', '🇨🇭', '🇨🇦', '🇲🇦', '🇩🇿', '🇹🇳', '🇸🇳', '🇨🇮', '🇱🇺', '🇪🇸', '🇮🇹']

const SIZE = 40

function community(topic) {
  const rnd = seeded('lb:' + topic.id)
  const pop = clamp((topic.followers || 500) / 40000, 0.15, 1.2)
  const used = new Set()
  const bots = []
  for (let i = 0; i < SIZE; i++) {
    let name
    do {
      name = pick(PSEUDOS, rnd)
      if (used.has(name)) name += Math.floor(rnd() * 90 + 10)
    } while (used.has(name))
    used.add(name)
    const xp = Math.round((40 + 5200 * Math.pow(rnd(), 2.4)) * pop)
    bots.push({ id: `${topic.id}:${i}`, name, avatar: name + topic.id, flag: pick(FLAGS, rnd), xp })
  }
  bots.sort((a, b) => b.xp - a.xp)
  bots[0].xp = Math.round(bots[1].xp * 1.35 + 400 * pop) // le champion creuse l'écart
  const max = bots[0].xp
  bots.forEach((b, i) => {
    b.skill = clamp(0.38 + 0.5 * Math.sqrt(b.xp / max) + (rnd() - 0.5) * 0.1, 0.35, 0.95)
    b.champion = i === 0
  })
  return bots
}

const cache = new Map()
export function getCommunity(topic) {
  if (!cache.has(topic.id)) cache.set(topic.id, community(topic))
  return cache.get(topic.id)
}

// XP d'un joueur simulé sur la période en cours. Son rythme est fixé pour la période
// (graine = thème + période) et l'XP grimpe à mesure que la période avance : le classement
// bouge pendant la semaine, et repart de zéro à chaque nouvelle période.
// Un duel rapporte 100 à 300 XP : le plus actif d'un thème populaire en joue une dizaine par semaine.
function botPeriodXp(bot, topic, kind, key, frac, champXp) {
  const r = seeded(`${topic.id}:${key}:${bot.id}`)
  const idle = r() < (kind === 'week' ? 0.4 : 0.2)
  if (idle) return 0
  const pop = clamp(champXp / 6000, 0.3, 1.2)
  const perWeek = (120 + 1700 * Math.sqrt(bot.xp / champXp) * (0.3 + 1.4 * r())) * pop
  const weeks = kind === 'week' ? 1 : 4.35
  return Math.round(perWeek * weeks * frac)
}

// Classement complet avec le joueur inséré à sa place.
// kind : 'all' (depuis toujours), 'week' ou 'month'.
export function leaderboard(topic, me, myXp, kind = 'all') {
  let rows
  if (kind === 'all') {
    rows = getCommunity(topic).map(b => ({ ...b, allXp: b.xp }))
  } else {
    const { start, end, key } = periodBounds(kind)
    const frac = Math.max(0.02, Math.min(1, (Date.now() - start) / (end - start)))
    const community = getCommunity(topic)
    rows = community
      .map(b => ({ ...b, allXp: b.xp, xp: botPeriodXp(b, topic, kind, key, frac, community[0].xp) }))
      .filter(b => b.xp > 0)
  }
  rows.push({ id: 'me', name: me.name, avatar: me.avatar, flag: me.flag || '🇫🇷', xp: myXp, allXp: me.allXp ?? myXp, isMe: true })
  rows.sort((a, b) => b.xp - a.xp || (a.isMe ? -1 : 1))
  rows.forEach((r, i) => { r.rank = i + 1; r.champion = i === 0 && r.xp > 0 })
  return rows
}

// Choix d'un adversaire : quelqu'un de ton niveau… et parfois le champion lui-même.
export function findOpponent(topic, myXp, { forceChampion = false } = {}) {
  const bots = getCommunity(topic)
  const champ = bots[0]
  if (forceChampion || (myXp < champ.xp && Math.random() < 0.12)) return { ...champ, champion: true }
  const sorted = [...bots].sort((a, b) => Math.abs(a.xp - myXp) - Math.abs(b.xp - myXp))
  const pool = sorted.slice(0, 8).filter(b => !b.champion)
  return { ...pick(pool), champion: false }
}

// Comportement d'un adversaire sur une question : quelle réponse, en combien de temps.
export function botAnswer(bot, question, time) {
  const correct = Math.random() < bot.skill
  const wrong = [0, 1, 2, 3].filter(i => i !== question.correct)
  const choice = correct ? question.correct : pick(wrong)
  const base = 6200 - bot.skill * 4600
  let t = clamp(base + (Math.random() - 0.4) * 3200, 800, time - 300)
  if (Math.random() < 0.04) t = Infinity // il arrive qu'on sèche
  return { choice, t }
}
