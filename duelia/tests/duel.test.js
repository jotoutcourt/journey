import { describe, it, expect } from 'vitest'
import { buildQuestions, pointsFor, TIME, ROUNDS } from '../src/lib/duel.js'
import { exploitFor, settleDuel } from '../src/lib/rewards.js'
import { OFFICIAL_TOPICS } from '../src/data/topics.js'

const topic = OFFICIAL_TOPICS.find(t => t.questions.length >= 20 && !t.questions[0].img)

describe('points', () => {
  it('20 points à la volée, 2 de moins par seconde, minimum 2', () => {
    expect(pointsFor(0, 1)).toBe(20)
    expect(pointsFor(1500, 1)).toBe(18)
    expect(pointsFor(TIME, 1)).toBe(2)
  })
  it('dernière question doublée', () => expect(pointsFor(0, 2)).toBe(40))
})

describe('questions d\'un duel', () => {
  it('7 questions différentes, la bonne réponse suit le mélange', () => {
    const qs = buildQuestions(topic)
    expect(qs).toHaveLength(ROUNDS)
    expect(new Set(qs.map(q => q.idx)).size).toBe(ROUNDS)
    for (const q of qs) expect(q.options[q.correct]).toBe(topic.questions[q.idx].a[0])
  })
  it('les questions déjà vues passent en dernier', () => {
    const seen = topic.questions.map((_, i) => i).slice(0, topic.questions.length - ROUNDS)
    const qs = buildQuestions(topic, seen)
    expect(qs.every(q => !seen.includes(q.idx))).toBe(true)
  })
})

describe('règlement d\'un duel', () => {
  const st = { profile: { name: 'Jo', avatar: 'jo' }, xp: 0, topicStats: {}, history: [], exploits: {}, challenges: [] }
  const qs = buildQuestions(topic)
  const log = { me: qs.map(q => ({ choice: q.correct, t: 1000, pts: 18 })), opp: qs.map(() => ({ choice: -1, t: TIME, pts: 0 })) }
  const base = { topic, opponent: { id: 'champ', name: 'Champion' }, myScore: 144, oppScore: 0, log, questions: qs, now: Date.UTC(2026, 10, 20, 12) }

  it('barème des exploits', () => {
    expect([1, 2, 3, 4, 10, 11, undefined].map(exploitFor)).toEqual([150, 100, 100, 50, 50, 0, 0])
  })
  it('victoire contre le n° 1 : bonus d\'exploit, une seule fois par jour', () => {
    const first = settleDuel(st, { ...base, ranks: { me: 30, opp: 1 } })
    expect(first.data.bonuses.exploit).toBe(150)
    expect(first.data.bonuses.victory).toBe(100)
    expect(first.state.topicStats[topic.id].xp).toBe(first.data.total)
    const again = settleDuel(first.state, { ...base, ranks: { me: 30, opp: 1 } })
    expect(again.data.bonuses.exploit).toBe(0)
  })
  it('pas d\'exploit en cas de défaite', () => {
    const r = settleDuel(st, { ...base, myScore: 10, oppScore: 50, ranks: { me: 30, opp: 1 } })
    expect(r.data.outcome).toBe('lose')
    expect(r.data.bonuses.exploit).toBe(0)
  })
  it('un duel rapporte au plus 520 XP (plafond du serveur)', () => {
    const r = settleDuel(st, { ...base, myScore: 160, ranks: { me: 2, opp: 1 } })
    expect(r.data.total).toBeLessThanOrEqual(520)
  })
})
