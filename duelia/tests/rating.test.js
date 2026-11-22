import { describe, it, expect } from 'vitest'
import { gamePoints, nextRating, botRating, tierOf, START_RATING } from '../src/lib/rating.js'
import { myPeriodScore } from '../src/lib/periods.js'
import { leaderboard, setRealRows } from '../src/lib/bots.js'

describe('cote de niveau', () => {
  it('points de partie : score + bonus victoire / nul', () => {
    expect(gamePoints(100, 80)).toBe(140)
    expect(gamePoints(60, 60)).toBe(80)
    expect(gamePoints(50, 90)).toBe(50)
    expect(gamePoints(999, 0)).toBe(200) // borné
  })
  it('gagner contre plus fort rapporte plus', () => {
    const weak = nextRating(1000, 20, 800, 100, 50) - 1000
    const strong = nextRating(1000, 20, 1300, 100, 50) - 1000
    expect(strong).toBeGreaterThan(weak)
    expect(weak).toBeGreaterThan(0)
    expect(nextRating(1000, 20, 1000, 10, 50)).toBeLessThan(1000)
  })
  it('placement : coefficient plus fort les 10 premières parties', () => {
    expect(nextRating(1000, 0, 1000, 100, 0)).toBe(1020)
    expect(nextRating(1000, 10, 1000, 100, 0)).toBe(1012)
  })
  it('cote des IA entre 700 et 1750', () => {
    expect(botRating({ skill: 0.35 })).toBe(700)
    expect(botRating({ skill: 0.95 })).toBe(1700)
    expect(botRating({ skill: 0.95, champion: true })).toBe(1750)
  })
  it('rangs', () => {
    expect(tierOf(START_RATING).name).toBe('Bronze')
    expect(tierOf(1260).name).toBe('Or')
    expect(tierOf(1600).name).toBe('Kraken')
  })
})

describe('score des périodes', () => {
  const now = new Date()
  const log = Array.from({ length: 14 }, (_, i) => ({ at: now.getTime() - 1000 * i, xp: 200, pts: 10 * (i + 1) }))
  it('semaine = 10 meilleures parties', () => {
    expect(myPeriodScore({ log }, 'week', now)).toBe([140, 130, 120, 110, 100, 90, 80, 70, 60, 50].reduce((a, b) => a + b))
  })
  it('pas de partie = pas classé', () => {
    expect(myPeriodScore({ log: [{ at: now.getTime(), xp: 300 }] }, 'week', now)).toBeNull()
    expect(myPeriodScore({ rating: 1100, rated: 4 }, 'all')).toBeNull()
    expect(myPeriodScore({ rating: 1100, rated: 5 }, 'all')).toBe(1100)
  })
  it('joueur non classé affiché en bas, sans rang', () => {
    const topic = { id: 't-test' }
    setRealRows('t-test', 'all', [{ id: 'p:1', playerId: 'u1', name: 'A', xp: 1200 }])
    const rows = leaderboard(topic, { name: 'Moi' }, null, 'all')
    expect(rows.map(r => r.rank)).toEqual([1, null])
    expect(rows[1].isMe).toBe(true)
  })
})
