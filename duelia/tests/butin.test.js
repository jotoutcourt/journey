import { describe, it, expect } from 'vitest'
import { buildButin, validPlacement, move, ROUNDS, OPTIONS, START, rankFor } from '../src/lib/butin.js'
import { OFFICIAL_TOPICS } from '../src/data/topics.js'

describe('Le Butin', () => {
  it('prépare 8 manches avec de moins en moins de réponses, la bonne réponse toujours présente', () => {
    const rounds = buildButin(OFFICIAL_TOPICS, 'graine')
    expect(rounds).toHaveLength(ROUNDS)
    rounds.forEach((r, i) => {
      expect(r.options).toHaveLength(OPTIONS[i])
      expect(new Set(r.options).size).toBe(OPTIONS[i])
      expect(r.correct).toBeGreaterThanOrEqual(0)
      expect(r.correct).toBeLessThan(OPTIONS[i])
      const src = OFFICIAL_TOPICS.flatMap(t => t.questions).find(q => q.q === r.q)
      expect(r.options[r.correct]).toBe(src.a[0])
      if (i) expect(r.topic.name === rounds[i - 1].topic.name && r.q === rounds[i - 1].q).toBe(false)
    })
    expect(buildButin(OFFICIAL_TOPICS, 'graine')).toEqual(rounds) // même graine, même partie
  })
  it('refuse de couvrir toutes les réponses ou de miser plus que le trésor', () => {
    expect(validPlacement([5, 5, 5, 5], START)).toBe(false)
    expect(validPlacement([21, 0, 0, 0], START)).toBe(false)
    expect(validPlacement([10, 10, 0, 0], START)).toBe(true)
    expect(validPlacement([1.5, 0, 0], START)).toBe(false)
  })
  it('déplacer des lingots reste dans les règles', () => {
    let p = [0, 0, 0, 0]
    p = move(p, 0, 15, START); p = move(p, 1, 10, START) // il n'en reste que 5
    expect(p).toEqual([15, 5, 0, 0])
    p = move(p, 2, 1, START) // trésor épuisé
    expect(p).toEqual([15, 5, 0, 0])
    p = move(p, 0, -20, START)
    expect(p).toEqual([0, 5, 0, 0])
    expect(move([1, 1, 1, 0], 3, 1, START)).toEqual([1, 1, 1, 0]) // la dernière réponse vide doit le rester
  })
  it('les paliers suivent le butin final', () => {
    expect(rankFor(0)).toBeNull()
    expect(rankFor(20).name).toBe('Fléaux du Kraken')
  })
})
