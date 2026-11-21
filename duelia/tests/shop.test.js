import { describe, it, expect } from 'vitest'
import { FREE_TOPICS, priceOf, isLockable } from '../src/lib/shop.js'
import { OFFICIAL_TOPICS } from '../src/data/topics.js'

describe('boutique de thèmes', () => {
  it('les 5 thèmes gratuits existent', () => {
    for (const id of FREE_TOPICS) expect(OFFICIAL_TOPICS.some(t => t.id === id), id).toBe(true)
    expect(FREE_TOPICS).toHaveLength(5)
  })
  it('prix : gratuits à 0, thèmes officiels à 40, Pokémon et thèmes pop à 60', () => {
    expect(priceOf('histoire')).toBe(0)
    expect(priceOf('orthographe')).toBe(40)
    expect(priceOf('pokemon')).toBe(60)
  })
  it('les créations des joueurs ne se verrouillent jamais', () => {
    expect(isLockable({ id: 'x1', official: false, own: true })).toBe(false)
    expect(isLockable(OFFICIAL_TOPICS.find(t => t.id === 'drapeaux'))).toBe(true)
    expect(isLockable(OFFICIAL_TOPICS.find(t => t.id === 'culture-g'))).toBe(false)
  })
})
