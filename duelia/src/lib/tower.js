// L'Ascension : logique du mode solo (sans interface).
// Toutes les décisions d'une partie viennent d'une graine : la tour du jour est identique pour tout le monde.
import { seeded, shuffle, clamp } from './rng.js'
import { getCommunity } from './bots.js'

export const MAX_HEARTS = 3
export const BOSS_EVERY = 10
export const DOOR_EVERY = 3
export const BOSS_ROUNDS = 3
export const BONUS_CHANCE = 0.3

export const BONUSES = {
  freeze: { icon: '❄️', name: 'Gel', desc: 'Arrête le chrono 5 secondes', when: 'question' },
  half: { icon: '✂️', name: '50/50', desc: 'Retire deux mauvaises réponses', when: 'question' },
  shield: { icon: '🛡️', name: 'Bouclier', desc: 'Ta prochaine erreur ne coûte aucun cœur', when: 'passive' },
  bet: { icon: '🎲', name: 'Pari', desc: 'Mise ×2 ou ×3 avant de voir la question. Raté : −2 cœurs', when: 'card' },
}

export const DOORS = {
  easy: { label: 'Facile', time: 12000, mult: 1 },
  hard: { label: 'Difficile', time: 8000, mult: 1.5 },
}

export const dayKey = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

// Générateur propre à une décision : même graine + même étage + même usage = même résultat.
const rng = (run, tag) => seeded(`${run.seed}|${run.floor}|${tag}`)

// Les thèmes jouables dans la tour (assez de questions ; la tour du jour n'utilise que les thèmes communs à tous).
export function towerTopics(topics, daily) {
  return topics.filter(t => t.questions.length >= 20 && (!daily || t.official || (t.community && !t.own && !t.imported)))
}

export function newRun(daily) {
  return {
    seed: daily ? 'daily:' + dayKey() : Math.random().toString(36).slice(2),
    daily, day: daily ? dayKey() : null,
    floor: 1, hearts: MAX_HEARTS, score: 0, bonus: null,
    topicId: null, door: 'easy', asked: [], correct: 0, bosses: 0,
  }
}

export const isBossFloor = (floor) => floor % BOSS_EVERY === 0
export const isDoorFloor = (floor) => floor % DOOR_EVERY === 1

// Deux portes : deux thèmes différents, une facile et une difficile.
export function doorChoices(run, pool) {
  const r = rng(run, 'doors')
  const [a, b] = shuffle(pool, r)
  const hardFirst = r() < 0.5
  return [
    { topicId: a.id, door: hardFirst ? 'hard' : 'easy' },
    { topicId: b.id, door: hardFirst ? 'easy' : 'hard' },
  ]
}

// Le chrono raccourcit d'une seconde tous les 10 étages (5 s minimum).
export const timeFor = (run) => Math.max(5000, DOORS[run.door].time - Math.floor((run.floor - 1) / 10) * 1000)

// Tire une question jamais posée dans cette partie et mélange ses réponses.
export function pickQuestion(run, topic, tag = 'q') {
  const r = rng(run, tag)
  const fresh = topic.questions.map((q, i) => i).filter(i => !run.asked.includes(`${topic.id}:${i}`))
  const pool = fresh.length ? fresh : topic.questions.map((q, i) => i)
  const idx = pool[Math.floor(r() * pool.length)]
  const q = topic.questions[idx]
  const order = shuffle([0, 1, 2, 3], r)
  return { key: `${topic.id}:${idx}`, q: q.q, options: order.map(i => q.a[i]), correct: order.indexOf(0) }
}

// Points d'une bonne réponse : base + vitesse, multipliés par la porte et le pari.
export function pointsFor(leftMs, doorMult, betMult = 1) {
  return Math.round((10 + Math.ceil(leftMs / 1000) * 2) * doorMult * betMult)
}

// Un bonus tombe parfois après une bonne réponse (seulement si on n'en porte pas déjà un).
export function maybeBonus(run) {
  if (run.bonus) return null
  const r = rng(run, 'bonus')
  if (r() >= BONUS_CHANCE) return null
  const keys = Object.keys(BONUSES)
  return keys[Math.floor(r() * keys.length)]
}

// Le boss d'un étage : le champion du thème en cours.
export function bossFor(topic) {
  const champ = getCommunity(topic)[0]
  return { ...champ, champion: true }
}

// Réponse du boss, déterministe pour la tour du jour.
export function bossAnswer(run, boss, question, round, time) {
  const r = rng(run, 'boss' + round)
  const correct = r() < clamp(boss.skill - 0.05, 0.5, 0.9)
  const wrong = [0, 1, 2, 3].filter(i => i !== question.correct)
  const choice = correct ? question.correct : wrong[Math.floor(r() * 3)]
  const t = clamp(time * (0.25 + r() * 0.45), 900, time - 400)
  return { choice, t }
}

// Classement de la tour du jour : des grimpeurs simulés dont le résultat grimpe au fil de la journée.
export function dailyBoard(topics, me, myResult, day = dayKey()) {
  const names = getCommunity(topics[0]).concat(getCommunity(topics[1] || topics[0]))
  const seen = new Set()
  const now = new Date()
  const frac = clamp((now.getHours() * 60 + now.getMinutes()) / (24 * 60), 0.15, 1)
  const rows = []
  for (const b of names) {
    if (seen.has(b.name)) continue
    seen.add(b.name)
    const r = seeded(`dayboard:${day}:${b.name}`)
    if (r() > frac) continue // n'a pas encore joué aujourd'hui
    const floor = Math.max(1, Math.round(2 + Math.pow(r(), 1.6) * 34 * b.skill))
    const score = Math.round(floor * (28 + r() * 14))
    rows.push({ id: b.id, name: b.name, avatar: b.avatar, flag: b.flag, floor, score })
    if (rows.length >= 40) break
  }
  if (myResult) rows.push({ id: 'me', ...me, floor: myResult.floor, score: myResult.score, isMe: true })
  rows.sort((a, b) => b.floor - a.floor || b.score - a.score || (a.isMe ? -1 : 1))
  rows.forEach((r, i) => { r.rank = i + 1 })
  return rows
}
