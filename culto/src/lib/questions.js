import { shuffle } from './util.js'

// Prépare l'affichage d'une question (ordre mélangé), hors du rendu.
export function prepare(q) {
  if (q.t === 'qcm' || q.t === 'gap') return shuffle(q.choices)
  if (q.t === 'order') {
    let o = shuffle(q.items)
    while (o.every((x, i) => x === q.items[i])) o = shuffle(q.items)
    return o
  }
  if (q.t === 'pairs') return { left: shuffle(q.pairs.map(p => p[0])), right: shuffle(q.pairs.map(p => p[1])) }
  return null
}

export function isReady(q, v) {
  if (v == null) return false
  if (q.t === 'order') return v.length === q.items.length
  if (q.t === 'pairs') return v.done
  return true
}

export function isCorrect(q, v) {
  if (q.t === 'qcm' || q.t === 'gap') return v === q.choices[0]
  if (q.t === 'vf') return v === q.a
  if (q.t === 'order') return v.every((x, i) => x === q.items[i])
  if (q.t === 'pairs') return v.mistakes === 0
  return false
}

export function answerText(q) {
  if (q.t === 'qcm' || q.t === 'gap') return q.choices[0]
  if (q.t === 'vf') return q.a ? 'Vrai' : 'Faux'
  if (q.t === 'order') return q.items.join(' → ')
  return null
}
