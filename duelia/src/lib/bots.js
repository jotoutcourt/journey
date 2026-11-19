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

// Classement complet avec le joueur inséré à sa place.
export function leaderboard(topic, me, myXp) {
  const rows = getCommunity(topic).map(b => ({ ...b }))
  rows.push({ id: 'me', name: me.name, avatar: me.avatar, flag: me.flag || '🇫🇷', xp: myXp, isMe: true })
  rows.sort((a, b) => b.xp - a.xp || (a.isMe ? -1 : 1))
  rows.forEach((r, i) => { r.rank = i + 1; r.champion = i === 0 })
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
