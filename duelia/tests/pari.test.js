import { describe, it, expect } from 'vitest'
import { planGame, pariTopics, betFor, betRange, settle, START, ROUNDS, MAX_BANK } from '../src/lib/pari.js'
import { OFFICIAL_TOPICS } from '../src/data/topics.js'

const topics = pariTopics(OFFICIAL_TOPICS, true)

describe('Le Pari', () => {
  it('même graine = même partie (partie du jour identique pour tous)', () => {
    expect(planGame(topics, 'daily:2026-11-21')).toEqual(planGame(topics, 'daily:2026-11-21'))
    expect(planGame(topics, 'daily:2026-11-21')).not.toEqual(planGame(topics, 'daily:2026-11-22'))
  })
  it('10 manches, jamais deux fois le même thème de suite, bonne réponse correcte', () => {
    for (let k = 0; k < 30; k++) {
      const g = planGame(topics, 'x' + k)
      expect(g).toHaveLength(ROUNDS)
      g.forEach((r, i) => {
        if (i) expect(r.topicId).not.toBe(g[i - 1].topicId)
        const t = topics.find(x => x.id === r.topicId)
        expect(r.q.options[r.q.correct]).toBe(t.questions[r.q.idx].a[0])
        expect(new Set(r.q.options).size).toBe(4)
      })
    }
  })
  it('mises bornées : au moins 10 %, et la moitié à la dernière manche', () => {
    expect(betFor(1000, 0, 0.1)).toBe(100)
    expect(betFor(1000, 0, 1)).toBe(1000)
    expect(betRange(1000, ROUNDS - 1).min).toBe(500)
    expect(betFor(1000, ROUNDS - 1, 0.1)).toBe(500)
    expect(betFor(7, 3, 0.1)).toBe(1)
  })
  it('gain simple, gain doublé à la dernière manche, perte', () => {
    expect(settle(1000, 300, true, 0)).toBe(1300)
    expect(settle(1000, 300, false, 0)).toBe(700)
    expect(settle(1000, 500, true, ROUNDS - 1)).toBe(2000)
  })
  it('le plus gros tapis possible reste sous le plafond du serveur', () => {
    let bank = START
    for (let i = 0; i < ROUNDS; i++) bank = settle(bank, bank, true, i)
    expect(bank).toBe(MAX_BANK)
    expect(bank).toBeLessThanOrEqual(2048000)
  })
})
