// Appliquer la réponse d'un ami à un défi par lien, qu'elle arrive par un lien (#r=…)
// ou automatiquement par le serveur. Fonction pure : renvoie le nouvel état et les données de résultat.
import { settleDuel } from './rewards.js'
import { pointsFor, TIME } from './duel.js'

const toLog = (answers, qs) => answers.map((a, i) => ({ ...a, pts: a.choice === qs[i].correct ? pointsFor(a.t, i === qs.length - 1 ? 2 : 1) : 0 }))

export const PSEUDO_TOPIC = { id: 'lien', name: 'Défi par lien', icon: '🔗', color: '#7c5cff', category: 'Culture', questions: [] }

// Transforme une ligne renvoyée par le serveur en réponse d'ami (null si elle ne colle pas au défi)
export function rowToReply(row, rec) {
  if (!rec || !Array.isArray(row.answers) || row.answers.length !== rec.questions.length) return null
  const answers = row.answers.map(a => {
    const choice = Number.isInteger(a?.[0]) && a[0] >= -1 && a[0] <= 3 ? a[0] : -1
    const t = Number.isFinite(a?.[1]) ? Math.max(0, Math.min(TIME, a[1])) : TIME
    return { choice, t: choice === -1 ? TIME : t }
  })
  const from = { name: String(row.from_name || 'Ton ami').slice(0, 18), avatar: String(row.from_avatar || row.from_name || 'ami').slice(0, 40), flag: String(row.from_flag || '🏳️').slice(0, 8) }
  return { id: rec.id, from, answers, questions: rec.questions }
}

export function applyLinkReply(st, rep, byId) {
  const rec = (st.linkChallenges || []).find(c => c.id === rep.id)
  const t = rec ? byId(rec.topicId) : null
  const questions = rec ? rec.questions : rep.questions
  const opponent = { id: 'lien:' + rep.from.name, ...rep.from, xp: 0 }
  const log = { me: rec ? toLog(rec.answers, questions) : [], opp: toLog(rep.answers, questions) }
  const myScore = rec ? rec.score : 0
  const oppScore = log.opp.reduce((s, a) => s + a.pts, 0)
  const already = !!rec?.replies?.includes(rep.from.name)

  // Range le résultat dans l'onglet Défis : le défi en attente passe en « Résultats »
  const file = (s, data) => {
    const list = s.challenges || []
    if (list.some(c => c.dir === 'link-out' && c.linkId === rep.id && c.status === 'done' && c.opponent.name === rep.from.name)) return list
    const waiting = list.find(c => c.dir === 'link-out' && c.linkId === rep.id && c.status === 'waiting-link')
    const done = { dir: 'link-out', linkId: rep.id, topicId: rec?.topicId || 'lien', opponent, status: 'done', result: data, unseen: true, createdAt: Date.now() }
    return waiting ? list.map(c => (c === waiting ? { ...c, ...done } : c)) : [{ id: 'lk-' + rep.id + rep.from.name, ...done }, ...list].slice(0, 40)
  }
  const markReplied = (s) => (s.linkChallenges || []).map(c => (c.id === rec?.id ? { ...c, replies: [...(c.replies || []), rep.from.name] } : c))

  if (rec && t && !already) {
    const { state, data } = settleDuel(st, { topic: t, opponent, myScore, oppScore, log, questions })
    const full = { ...data, fromLink: true }
    return { state: { ...state, challenges: file(state, full), linkChallenges: markReplied(state) }, data: full, topic: t, isNew: true }
  }
  const outcome = myScore > oppScore ? 'win' : myScore < oppScore ? 'lose' : 'draw'
  const full = { outcome, myScore, oppScore, opponent, bonuses: {}, total: 0, before: 0, after: 0, log, questions, noXp: true, fromLink: true, alreadyCounted: already, unknownMine: !rec }
  const state = rec && !already ? { ...st, challenges: file(st, full), linkChallenges: markReplied(st) } : null
  return { state, data: full, topic: t || PSEUDO_TOPIC, isNew: !!state }
}
