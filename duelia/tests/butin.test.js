import { describe, it, expect } from 'vitest'
import { buildButin, validPlacement, move, ROUNDS, OPTIONS, START, rankFor } from '../src/lib/butin.js'
import { BUTIN_BANK } from '../src/lib/butin.js'

describe('Le Butin', () => {
  it('prépare 8 manches avec de moins en moins de réponses, la bonne réponse toujours présente', () => {
    const rounds = buildButin([], 'graine')
    expect(rounds).toHaveLength(ROUNDS)
    rounds.forEach((r, i) => {
      expect(r.options).toHaveLength(OPTIONS[i])
      expect(new Set(r.options).size).toBe(OPTIONS[i])
      const src = BUTIN_BANK.find(x => x.id === r.id)
      expect(r.options[r.correct]).toBe(src.a[0])
      expect(r.expl).toBeTruthy()
      if (i) expect(r.topic.name).not.toBe(rounds[i - 1].topic.name)
    })
    expect(new Set(rounds.map(r => r.id)).size).toBe(ROUNDS)
    expect(rounds.filter(r => /capitale/i.test(r.q)).length).toBeLessThanOrEqual(1)
    expect(buildButin([], 'graine')).toEqual(rounds)
  })
  it('banque : questions uniques, 4 réponses distinctes, explication', () => {
    expect(BUTIN_BANK.length).toBeGreaterThan(350)
    expect(new Set(BUTIN_BANK.map(x => x.q.toLowerCase())).size).toBe(BUTIN_BANK.length)
    for (const x of BUTIN_BANK) { expect(new Set(x.a).size, x.q).toBe(4); expect(x.expl, x.q).toBeTruthy() }
  })
  it('évite les questions vues récemment', () => {
    const first = buildButin([], 'a').map(r => r.id)
    expect(buildButin(first, 'a').some(r => first.includes(r.id))).toBe(false)
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
