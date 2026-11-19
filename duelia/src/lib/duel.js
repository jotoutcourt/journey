import { shuffle } from './rng.js'

export const ROUNDS = 7
export const TIME = 10000

// Tire 7 questions en privilégiant celles jamais vues, et mélange les réponses.
export function buildQuestions(topic, seen = []) {
  const all = topic.questions.map((q, i) => ({ ...q, idx: i }))
  const fresh = shuffle(all.filter(q => !seen.includes(q.idx)))
  const old = shuffle(all.filter(q => seen.includes(q.idx)))
  const chosen = [...fresh, ...old].slice(0, ROUNDS)
  return chosen.map(q => {
    const order = shuffle([0, 1, 2, 3])
    if (q.img) new Image().src = q.img // préchargement pendant l'écran face-à-face
    return { q: q.q, img: q.img, dex: q.dex, idx: q.idx, options: order.map(i => q.a[i]), correct: order.indexOf(0) }
  })
}

// 20 points à la volée, puis 2 de moins par seconde écoulée. Dernière question : x2.
export const pointsFor = (t, mult) => Math.max(2, Math.ceil((TIME - t) / 1000) * 2) * mult
