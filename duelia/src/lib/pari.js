// Le Pari : logique du mode solo (sans interface).
// On mise une part de ses jetons AVANT de voir la question, en ne connaissant que le thème.
// La partie du jour est la même pour tout le monde (même graine) et compte au classement.
import { seeded, shuffle } from './rng.js'

export const START = 1000
export const ROUNDS = 10
export const PARI_TIME = 15000
export const STEPS = [0.1, 0.25, 0.5, 0.75, 1] // parts du tapis proposées
export const LAST_MIN = 0.5 // dernière manche : au moins la moitié du tapis… mais gain doublé

// Jour du calendrier en France (la partie du jour change à minuit, heure de Paris)
export function pariDay(d = new Date()) {
  const p = new Intl.DateTimeFormat('fr-CA', { timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d)
  return p // AAAA-MM-JJ
}

// Thèmes jouables : la partie du jour n'utilise que les thèmes officiels (communs à tous)
export const pariTopics = (topics, daily) => topics.filter(t => t.questions.length >= 20 && (daily ? t.official : true))

// Prépare les 10 manches : un thème (jamais deux fois de suite) et une question mélangée par manche
export function planGame(topics, seed) {
  const rnd = seeded('pari|' + seed)
  const pool = [...topics].sort((a, b) => (a.id < b.id ? -1 : 1))
  const rounds = []
  let prev = null
  const used = new Map()
  for (let i = 0; i < ROUNDS; i++) {
    const choices = pool.filter(t => t.id !== prev)
    const topic = choices[Math.floor(rnd() * choices.length)] || pool[0]
    prev = topic.id
    const taken = used.get(topic.id) || new Set()
    const free = topic.questions.map((_, k) => k).filter(k => !taken.has(k))
    const idx = free[Math.floor(rnd() * free.length)]
    taken.add(idx); used.set(topic.id, taken)
    const raw = topic.questions[idx]
    const order = shuffle([0, 1, 2, 3], rnd)
    rounds.push({ topicId: topic.id, q: { q: raw.q, idx, options: order.map(k => raw.a[k]), correct: order.indexOf(0) } })
  }
  return rounds
}

// Parts proposées pour une manche (la dernière commence à la moitié du tapis)
export const stepsFor = (round) => (round === ROUNDS - 1 ? STEPS.filter(s => s >= LAST_MIN) : STEPS)

// Mise minimale et maximale d'une manche
export function betRange(bank, round) {
  const last = round === ROUNDS - 1
  const min = Math.max(1, Math.ceil(bank * (last ? LAST_MIN : 0.1)))
  return { min: Math.min(min, bank), max: bank, last }
}

// Mise correspondant à une part du tapis, arrondie et bornée
export function betFor(bank, round, share) {
  const { min, max, last } = betRange(bank, round)
  if (last && share <= LAST_MIN) return min
  const raw = share >= 1 ? bank : Math.round((bank * share) / 10) * 10
  return Math.max(min, Math.min(max, raw))
}

// Résultat d'une manche : nouveau tapis
export function settle(bank, bet, ok, round) {
  const last = round === ROUNDS - 1
  return ok ? bank + bet * (last ? 2 : 1) : bank - bet
}

// Le plus gros tapis possible (tout miser et tout réussir) : sert de garde-fou côté serveur
export const MAX_BANK = START * 2 ** (ROUNDS - 1) * 3
