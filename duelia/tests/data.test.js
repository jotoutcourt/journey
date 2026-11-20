import { describe, it, expect } from 'vitest'
import { OFFICIAL_TOPICS, COMMUNITY_SEED, STARTER_CREATIONS } from '../src/data/topics.js'
import { ladderFor, TITLE_LEVELS } from '../src/lib/titles.js'

const all = [...OFFICIAL_TOPICS, ...COMMUNITY_SEED, ...STARTER_CREATIONS.map(s => s.topic)]

describe('banques de questions', () => {
  it('identifiants de thèmes uniques', () => {
    expect(new Set(all.map(t => t.id)).size).toBe(all.length)
  })
  for (const t of all) {
    describe(t.name, () => {
      it('au moins 7 questions, 4 réponses distinctes et non vides', () => {
        expect(t.questions.length).toBeGreaterThanOrEqual(7)
        for (const q of t.questions) {
          expect(q.q?.trim(), t.name).toBeTruthy()
          expect(q.a).toHaveLength(4)
          expect(q.a.every(a => typeof a === 'string' && a.trim()), q.q).toBe(true)
          expect(new Set(q.a.map(a => a.trim().toLowerCase())).size, q.q).toBe(4)
        }
      })
      it('pas de question en double', () => {
        const texts = t.questions.map(q => q.q.trim().toLowerCase())
        const dups = texts.filter((x, i) => texts.indexOf(x) !== i)
        expect(dups).toEqual([])
      })
      it('8 titres de niveau', () => expect(ladderFor(t)).toHaveLength(TITLE_LEVELS.length))
    })
  }
  it('les thèmes officiels et mes créations ont 100 questions', () => {
    const short = [...OFFICIAL_TOPICS, ...STARTER_CREATIONS.map(s => s.topic)].filter(t => t.questions.length < 100).map(t => t.name)
    expect(short).toEqual([])
  })
})
