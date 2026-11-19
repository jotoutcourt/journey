// État de l'appli, gardé dans le téléphone (localStorage).
import { useSyncExternalStore } from 'react'

const KEY = 'culto-v1'
export const HEART_MAX = 5
export const HEART_MS = 20 * 60 * 1000 // une vie revient toutes les 20 min

export const dayKey = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

const fromKey = k => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d) }
export const daysBetween = (a, b) => Math.round((fromKey(b) - fromKey(a)) / 864e5)

const INITIAL = {
  onboarded: false,
  goal: 30,
  sound: true,
  xp: 0,
  days: {}, // { 'YYYY-MM-DD': xp }
  streak: { count: 0, last: null, best: 0 },
  lessons: {}, // { lessonId: { stars, runs } }
  mistakes: [], // ids de questions ratées
  hearts: { n: HEART_MAX, ts: 0 },
  answered: 0,
  correct: 0,
  perfect: 0,
  challenge: null, // jour du dernier défi terminé
}

function load() {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return { ...INITIAL, ...JSON.parse(raw) }
  } catch { /* stockage indisponible : on repart de zéro */ }
  return INITIAL
}

let state = load()
const listeners = new Set()

function set(patch) {
  state = { ...state, ...patch }
  try { localStorage.setItem(KEY, JSON.stringify(state)) } catch { /* rien */ }
  listeners.forEach(l => l())
}

export const getState = () => state
export function useStore() {
  return useSyncExternalStore(cb => { listeners.add(cb); return () => listeners.delete(cb) }, () => state)
}

// ── Vies ──────────────────────────────────────────────────────────────────
export function heartsAt(s, now) {
  const { n, ts } = s.hearts
  if (n >= HEART_MAX) return { n: HEART_MAX, ts, next: null }
  const gained = Math.max(0, Math.floor((now - ts) / HEART_MS))
  const cur = Math.min(HEART_MAX, n + gained)
  const nts = ts + gained * HEART_MS
  return { n: cur, ts: nts, next: cur < HEART_MAX ? nts + HEART_MS : null }
}

export function loseHeart() {
  const now = Date.now()
  const h = heartsAt(state, now)
  set({ hearts: { n: Math.max(0, h.n - 1), ts: h.n >= HEART_MAX ? now : h.ts } })
}

export function gainHeart() {
  const now = Date.now()
  const h = heartsAt(state, now)
  set({ hearts: { n: Math.min(HEART_MAX, h.n + 1), ts: h.ts } })
}

// ── Série de jours ────────────────────────────────────────────────────────
export function streakNow(s, today = dayKey()) {
  const { count, last } = s.streak
  if (!last) return 0
  const gap = daysBetween(last, today)
  return gap <= 1 ? count : 0
}

// ── Réponses ──────────────────────────────────────────────────────────────
// canClear : une bonne réponse retire la question des erreurs (pas pendant
// une leçon, où la question ratée puis réussie reste à réviser plus tard).
export function recordAnswer(qid, ok, canClear = true) {
  const mistakes = ok ? (canClear ? state.mistakes.filter(id => id !== qid) : state.mistakes) : state.mistakes.includes(qid) ? state.mistakes : [...state.mistakes, qid]
  set({ answered: state.answered + 1, correct: state.correct + (ok ? 1 : 0), mistakes })
}

// Fin d'une session : XP, série, étoiles. Renvoie ce qu'il faut afficher.
export function finishSession({ xp, lessonId, stars, perfect, challengeDay }) {
  const today = dayKey()
  const before = streakNow(state, today)
  let { count, last, best } = state.streak
  if (last !== today) {
    count = last && daysBetween(last, today) === 1 ? count + 1 : 1
    last = today
  }
  const lessons = { ...state.lessons }
  if (lessonId) {
    const prev = lessons[lessonId]
    lessons[lessonId] = { stars: Math.max(stars, prev?.stars || 0), runs: (prev?.runs || 0) + 1 }
  }
  const dayXp = (state.days[today] || 0) + xp
  set({
    xp: state.xp + xp,
    days: { ...state.days, [today]: dayXp },
    streak: { count, last, best: Math.max(best, count) },
    lessons,
    perfect: state.perfect + (perfect ? 1 : 0),
    challenge: challengeDay || state.challenge,
  })
  return { streakBefore: before, streakAfter: count, dayXp, goal: state.goal }
}

export const setGoal = goal => set({ goal })
export const setSound = sound => set({ sound })
export const completeOnboarding = goal => set({ onboarded: true, goal })
export const resetAll = () => set({ ...INITIAL, onboarded: true, goal: state.goal })

// ── Niveaux ───────────────────────────────────────────────────────────────
export const LEVELS = [
  { xp: 0, name: 'Néophyte' },
  { xp: 60, name: 'Curieux' },
  { xp: 150, name: 'Initié' },
  { xp: 300, name: 'Cultivé' },
  { xp: 500, name: 'Érudit' },
  { xp: 800, name: 'Lettré' },
  { xp: 1200, name: 'Encyclopédie vivante' },
]
export function levelOf(xp) {
  let i = 0
  while (i + 1 < LEVELS.length && xp >= LEVELS[i + 1].xp) i++
  const cur = LEVELS[i], next = LEVELS[i + 1]
  return { index: i + 1, name: cur.name, next, progress: next ? (xp - cur.xp) / (next.xp - cur.xp) : 1 }
}
