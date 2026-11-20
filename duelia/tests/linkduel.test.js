import { describe, it, expect, beforeAll } from 'vitest'
import { encodeChallenge, decodeChallenge, encodeReply, decodeReply, scoreOf } from '../src/lib/linkduel.js'
import { buildQuestions } from '../src/lib/duel.js'
import { OFFICIAL_TOPICS } from '../src/data/topics.js'

const topic = OFFICIAL_TOPICS.find(t => t.questions.length >= 20 && !t.questions[0].img)
let questions, answers
beforeAll(() => {
  questions = buildQuestions(topic).map(({ q, options, correct, idx }) => ({ q, options, correct, idx }))
  answers = questions.map((q, i) => ({ choice: i % 2 ? q.correct : -1, t: 2000 + i * 100 }))
})

describe('défi par lien', () => {
  it('aller-retour du défi, avec un score recalculé', () => {
    const code = encodeChallenge({ id: 'abc', from: { name: 'Jo', avatar: 'jo', flag: '🇫🇷' }, topic, questions, answers, expiresAt: 123 })
    const d = decodeChallenge(code)
    expect(d.from.name).toBe('Jo')
    expect(d.questions).toEqual(questions)
    expect(d.expiresAt).toBe(123)
    expect(d.score).toBe(scoreOf(questions, d.answers))
  })
  it('les temps impossibles sont ramenés dans les bornes', () => {
    const bad = answers.map(a => ({ ...a, t: 999999 }))
    const d = decodeChallenge(encodeChallenge({ id: 'x', from: { name: 'Jo' }, topic, questions, answers: bad }))
    expect(d.answers.every(a => a.t <= 10000)).toBe(true)
  })
  it('un lien abîmé est refusé', () => {
    expect(decodeChallenge('nimportequoi')).toBeNull()
    expect(decodeReply('%%%')).toBeNull()
  })
  it('aller-retour de la réponse', () => {
    const r = decodeReply(encodeReply({ id: 'abc', from: { name: 'Léa', avatar: 'lea' }, answers, questions }))
    expect(r.from.name).toBe('Léa')
    expect(r.answers).toHaveLength(questions.length)
  })
})
