// Défi par lien, sans serveur : toutes les informations voyagent dans l'adresse.
// #d=… : un défi (les 7 questions + les réponses et temps du challenger, score caché)
// #r=… : la réponse de l'ami (ses réponses et son score) pour que le challenger voie le résultat
import { TIME, pointsFor } from './duel.js'

const PUBLIC_URL = 'https://duelia.vercel.app/'

// Un défi par lien expire au bout de 7 jours
export const LINK_TTL = 7 * 86400000

// Adresse de base des liens : le site public, sauf si on y est déjà (ou en local pour les tests)
export function baseUrl() {
  const { hostname, origin, pathname } = location
  if (hostname.endsWith('vercel.app') || hostname === 'localhost' || hostname === '127.0.0.1') return origin + pathname
  return PUBLIC_URL
}

function b64encode(obj) {
  const bytes = new TextEncoder().encode(JSON.stringify(obj))
  let bin = ''
  bytes.forEach(b => { bin += String.fromCharCode(b) })
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}
function b64decode(code) {
  const bin = atob(code.replace(/-/g, '+').replace(/_/g, '/'))
  return JSON.parse(new TextDecoder().decode(Uint8Array.from(bin, c => c.charCodeAt(0))))
}

const str = (v, max) => (typeof v === 'string' && v.trim() ? v.slice(0, max) : null)
const int = (v, lo, hi) => (Number.isFinite(v) ? Math.max(lo, Math.min(hi, Math.round(v))) : null)

// Score d'une série de réponses (dernière question ×2), comme dans un duel
export function scoreOf(questions, answers) {
  return answers.reduce((s, a, i) => s + (a && a.choice === questions[i].correct ? pointsFor(a.t, i === questions.length - 1 ? 2 : 1) : 0), 0)
}

// ---- Défi ----
export function encodeChallenge({ id, from, topic, questions, answers, expiresAt }) {
  return b64encode({
    v: 1, id, x: expiresAt,
    f: { n: from.name, a: from.avatar, fl: from.flag },
    t: { id: topic.id, n: topic.name, i: topic.icon, c: topic.color, k: topic.category },
    q: questions.map(q => [q.q, ...q.options, q.correct, q.idx ?? -1]),
    a: answers.map(a => [a.choice, Math.round(a.t)]),
  })
}

function readQuestions(raw) {
  if (!Array.isArray(raw) || raw.length < 3 || raw.length > 10) return null
  const qs = raw.map((r, i) => {
    if (!Array.isArray(r) || r.length < 6) return null
    const [q, o1, o2, o3, o4, correct, idx] = r
    const options = [o1, o2, o3, o4].map(o => str(o, 80))
    if (!str(q, 200) || options.some(o => !o) || new Set(options).size !== 4) return null
    const c = int(correct, 0, 3)
    return c == null ? null : { q: q.slice(0, 200), options, correct: c, idx: Number.isInteger(idx) && idx >= 0 ? idx : 1000 + i }
  })
  return qs.every(Boolean) ? qs : null
}

function readAnswers(raw, n) {
  if (!Array.isArray(raw) || raw.length !== n) return null
  const as = raw.map(r => {
    if (!Array.isArray(r)) return null
    const choice = int(r[0], -1, 3), t = int(r[1], 0, TIME)
    return choice == null || t == null ? null : { choice, t: choice === -1 ? TIME : t }
  })
  return as.every(Boolean) ? as : null
}

export function decodeChallenge(code) {
  try {
    const d = b64decode(code)
    const name = str(d?.f?.n, 18), topicName = str(d?.t?.n, 40)
    const questions = readQuestions(d.q)
    const answers = questions && readAnswers(d.a, questions.length)
    if (!name || !topicName || !questions || !answers) return null
    return {
      id: String(d.id || '').slice(0, 40) || 'lien',
      from: { name, avatar: str(d.f.a, 40) || name, flag: str(d.f.fl, 8) || '🏳️' },
      topic: {
        id: str(d.t.id, 40) || 'lien', name: topicName, icon: str(d.t.i, 8) || '❓',
        color: /^#[0-9a-f]{6}$/i.test(d.t.c) ? d.t.c : '#7c5cff', category: str(d.t.k, 30) || 'Culture',
      },
      questions, answers, score: scoreOf(questions, answers),
      expiresAt: Number.isFinite(d.x) ? d.x : null,
    }
  } catch {
    return null
  }
}

// ---- Réponse de l'ami ----
export function encodeReply({ id, from, answers, questions }) {
  return b64encode({
    v: 1, id, f: { n: from.name, a: from.avatar, fl: from.flag },
    a: answers.map(a => [a.choice, Math.round(a.t)]),
    // les questions voyagent aussi, pour afficher le récapitulatif même si le défi a été effacé
    q: questions.map(q => [q.q, ...q.options, q.correct, q.idx ?? -1]),
  })
}

export function decodeReply(code) {
  try {
    const d = b64decode(code)
    const name = str(d?.f?.n, 18)
    const questions = readQuestions(d.q)
    const answers = questions && readAnswers(d.a, questions.length)
    if (!name || !questions || !answers) return null
    return {
      id: String(d.id || '').slice(0, 40),
      from: { name, avatar: str(d.f.a, 40) || name, flag: str(d.f.fl, 8) || '🏳️' },
      questions, answers, score: scoreOf(questions, answers),
    }
  } catch {
    return null
  }
}

export const challengeUrl = (payload) => `${baseUrl()}#d=${encodeChallenge(payload)}`
export const replyUrl = (payload) => `${baseUrl()}#r=${encodeReply(payload)}`

// Lit l'adresse au chargement (une seule fois) et la nettoie
export function readLinkFromHash() {
  const m = location.hash.match(/#([dr])=([\w-]+)/)
  if (!m) return null
  history.replaceState(null, '', location.pathname + location.search)
  if (m[1] === 'd') { const c = decodeChallenge(m[2]); return c ? { kind: 'challenge', ...c } : { kind: 'invalid' } }
  const r = decodeReply(m[2]); return r ? { kind: 'reply', ...r } : { kind: 'invalid' }
}
