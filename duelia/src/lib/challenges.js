// Défis différés : quand l'adversaire n'est pas en ligne, chacun joue de son côté.
// En attendant de vrais joueurs, les adversaires simulés répondent au bout de quelques dizaines de secondes.
import { seeded, pick, shuffle } from './rng.js'
import { getCommunity, leaderboard, botAnswer } from './bots.js'
import { buildQuestions, TIME, pointsFor } from './duel.js'
import { meEntry } from './profile.js'
import { settleDuel } from './rewards.js'

const SEC = 1000, MIN = 60 * SEC
const between = (a, b) => a + Math.random() * (b - a)

// Présence en ligne d'un joueur simulé : stable pendant une heure, environ 1 joueur sur 3 en ligne.
export function presence(bot, now = Date.now()) {
  const r = seeded(`presence:${bot.id}:${Math.floor(now / (60 * MIN))}`)
  const online = r() < 0.35
  return { online, lastSeenMin: online ? 0 : Math.round(5 + r() * 540) }
}

export function lastSeenLabel(min) {
  if (min < 60) return `vu il y a ${min} min`
  const h = Math.round(min / 60)
  return `vu il y a ${h} h`
}

// Rang mondial (classement « depuis toujours ») des deux joueurs au moment du défi.
function ranksAt(st, topic, opponent) {
  const xp = st.topicStats[topic.id]?.xp || 0
  const rows = leaderboard(topic, { ...meEntry(st.profile), allXp: xp }, xp, 'all')
  return { me: rows.find(x => x.isMe)?.rank, opp: rows.find(x => x.id === opponent.id)?.rank }
}

const slimBot = (b) => ({ id: b.id, name: b.name, avatar: b.avatar, flag: b.flag, xp: b.xp, skill: b.skill, champion: !!b.champion })

// Réponses de l'adversaire simulé sur les questions du défi, comme s'il avait joué en direct.
function botPlay(bot, questions) {
  const answers = questions.map(q => {
    const plan = botAnswer(bot, q, TIME)
    return Number.isFinite(plan.t) ? { choice: plan.choice, t: plan.t } : { choice: -1, t: TIME }
  })
  const score = answers.reduce((s, a, i) => s + (a.choice === questions[i].correct ? pointsFor(a.t, i === questions.length - 1 ? 2 : 1) : 0), 0)
  return { answers, score }
}

// Le joueur défie quelqu'un qui n'est pas en ligne.
export function createOutgoing(st, topic, bot, now = Date.now()) {
  const respondAt = now + between(20 * SEC, 75 * SEC)
  return {
    id: 'out-' + now.toString(36) + Math.random().toString(36).slice(2, 6),
    dir: 'out', topicId: topic.id, opponent: slimBot(bot), ranks: ranksAt(st, topic, bot),
    questions: buildQuestions(topic, st.topicStats[topic.id]?.seen),
    createdAt: now, status: 'pending', respondAt,
    willAccept: Math.random() > 0.2,
    oppPlayAt: respondAt + between(30 * SEC, 100 * SEC),
    unseen: false,
  }
}

// Un joueur simulé défie le joueur.
function createIncoming(st, topics, now) {
  const pool = topics.filter(t => st.follows.includes(t.id) && t.questions.length >= 7)
  const topic = pick(pool.length ? pool : topics.filter(t => t.official))
  const xp = st.topicStats[topic.id]?.xp || 0
  const near = [...getCommunity(topic)].sort((a, b) => Math.abs(a.xp - xp) - Math.abs(b.xp - xp)).slice(0, 12)
  const bot = pick(shuffle(near))
  return {
    id: 'in-' + now.toString(36) + Math.random().toString(36).slice(2, 6),
    dir: 'in', topicId: topic.id, opponent: slimBot({ ...bot, champion: bot === getCommunity(topic)[0] }), ranks: ranksAt(st, topic, bot),
    questions: buildQuestions(topic, st.topicStats[topic.id]?.seen),
    createdAt: now, status: 'pending', unseen: true,
  }
}

// Fait avancer les défis dans le temps. Renvoie le nouvel état (ou null si rien n'a changé) et les notifications.
export function tickChallenges(st, topics, now = Date.now()) {
  if (!st.profile) return { state: null, events: [] }
  let changed = false
  const events = []
  let state = st
  const list = (st.challenges || []).map(c => {
    const topic = topics.find(t => t.id === c.topicId)
    if (!topic) return c
    // Défi envoyé : l'adversaire accepte ou refuse
    if (c.dir === 'out' && c.status === 'pending' && now >= c.respondAt) {
      changed = true
      if (!c.willAccept) {
        events.push({ text: `${c.opponent.name} a refusé ton défi sur « ${topic.name} »`, kind: 'rejected' })
        return { ...c, status: 'rejected', unseen: true }
      }
      events.push({ text: `${c.opponent.name} a accepté ton défi sur « ${topic.name} »`, kind: 'accepted' })
      return { ...c, status: 'accepted' }
    }
    // Défi accepté : l'adversaire joue sa partie, puis c'est au joueur
    if (c.dir === 'out' && c.status === 'accepted' && now >= c.oppPlayAt) {
      changed = true
      const { answers, score } = botPlay(c.opponent, c.questions)
      events.push({ text: `${c.opponent.name} a terminé sa partie. À toi de jouer !`, kind: 'your_turn' })
      return { ...c, status: 'your_turn', oppAnswers: answers, oppScore: score, unseen: true }
    }
    // Défi reçu, déjà joué par le joueur : le challenger joue à son tour et le résultat tombe
    if (c.dir === 'in' && c.status === 'waiting' && now >= c.oppPlayAt) {
      changed = true
      const { answers, score } = botPlay(c.opponent, c.questions)
      const log = { me: c.myLog, opp: answers.map((a, i) => ({ ...a, pts: a.choice === c.questions[i].correct ? pointsFor(a.t, i === c.questions.length - 1 ? 2 : 1) : 0 })) }
      const settled = settleDuel(state, { topic, opponent: c.opponent, myScore: c.myScore, oppScore: score, log, questions: c.questions, ranks: c.ranks, now })
      state = settled.state
      const verdict = c.myScore > score ? 'Tu as gagné' : c.myScore < score ? 'Tu as perdu' : 'Égalité'
      events.push({ text: `${c.opponent.name} a joué : ${verdict} (${c.myScore}–${score}). Viens voir le résultat !`, kind: 'result' })
      return { ...c, status: 'done', oppScore: score, result: settled.data, unseen: true }
    }
    return c
  })

  // De temps en temps, un joueur défie le joueur (au plus 2 défis reçus en attente).
  let nextIncomingAt = st.nextIncomingAt ?? now + 45 * SEC
  const openIncoming = list.filter(c => c.dir === 'in' && c.status === 'pending').length
  if (now >= nextIncomingAt) {
    if (openIncoming < 2) {
      const c = createIncoming(state, topics, now)
      list.unshift(c)
      events.push({ text: `${c.opponent.name} te défie sur « ${topics.find(t => t.id === c.topicId).name} »`, kind: 'incoming' })
    }
    nextIncomingAt = now + between(3 * MIN, 7 * MIN)
    changed = true
  } else if (st.nextIncomingAt == null) changed = true

  if (!changed) return { state: null, events }
  return { state: { ...state, challenges: list.slice(0, 40), nextIncomingAt }, events }
}

// Nombre d'éléments qui attendent une action ou un coup d'œil du joueur (badge de l'onglet Défis).
export const pendingCount = (st) => (st.challenges || []).filter(c => c.unseen).length

// Le joueur a joué sa part d'un défi reçu : on attend que le challenger joue.
export function markPlayed(c, myLog, myScore, now = Date.now()) {
  return { ...c, status: 'waiting', myLog, myScore, playedAt: now, oppPlayAt: now + between(40 * SEC, 120 * SEC), unseen: false }
}
