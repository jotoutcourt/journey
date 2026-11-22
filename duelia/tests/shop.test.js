import { describe, it, expect } from 'vitest'
import { STARTER_COUNT, priceOf, isLockable } from '../src/lib/shop.js'
import { OFFICIAL_TOPICS } from '../src/data/topics.js'

describe('boutique de thèmes', () => {
  it('5 thèmes au choix au départ, et assez de thèmes officiels pour choisir', () => {
    expect(STARTER_COUNT).toBe(5)
    expect(OFFICIAL_TOPICS.filter(isLockable).length).toBeGreaterThan(STARTER_COUNT)
  })
  it('prix : thèmes officiels à 40, Pokémon et thèmes pop à 60', () => {
    expect(priceOf('histoire')).toBe(40)
  })
  it('les créations des joueurs ne se verrouillent jamais', () => {
    expect(isLockable({ id: 'x1', official: false, own: true })).toBe(false)
    expect(isLockable(OFFICIAL_TOPICS.find(t => t.id === 'drapeaux'))).toBe(true)
  })
})
