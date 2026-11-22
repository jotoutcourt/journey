// Adversaires : chaque thème a sa propre communauté de joueurs, stable d'une partie à l'autre.
import { seeded, pick, clamp } from './rng.js'

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
    bots.push({ id: `${topic.id}:${i}`, name, avatar: name + topic.id, flag: pick(FLAGS, rnd), xp, ai: true })
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

// Vrais joueurs (comptes) récupérés sur le serveur, par thème et par période.
const realRows = new Map()
export function setRealRows(topicId, kind, rows) { realRows.set(`${topicId}:${kind}`, rows) }
export const getRealRows = (topicId, kind) => realRows.get(`${topicId}:${kind}`) || []
export const hasRealRows = (topicId) => realRows.has(`${topicId}:all`)

// Classement complet (vrais joueurs uniquement, valeur classée dans xp) avec le joueur inséré à sa place.
// kind : 'all' (depuis toujours), 'week' ou 'month'. Les adversaires simulés ne servent plus qu'aux duels contre l'IA.
export function leaderboard(topic, me, myXp, kind = 'all') {
  const all = getRealRows(topic.id, 'all')
  const rows = getRealRows(topic.id, kind)
    .filter(r => !(me.playerId && r.playerId === me.playerId) && r.xp > 0)
    .map(r => ({ ...r, allXp: kind === 'all' ? r.xp : (all.find(x => x.playerId === r.playerId)?.xp ?? r.xp), ai: false }))
  // myXp vaut null quand le joueur n'est pas encore classé sur la période : il apparaît en bas, sans rang
  const meRow = { id: 'me', playerId: me.playerId, name: me.name, avatar: me.avatar, photo: me.photo, flag: me.flag || '🇫🇷', xp: myXp ?? 0, allXp: me.allXp ?? myXp, isMe: true, unranked: myXp == null }
  if (!meRow.unranked) rows.push(meRow)
  rows.sort((a, b) => b.xp - a.xp || (a.isMe ? -1 : 1))
  rows.forEach((r, i) => { r.rank = i + 1; r.champion = i === 0 && r.xp > 0 })
  if (meRow.unranked) rows.push({ ...meRow, rank: null, champion: false })
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
