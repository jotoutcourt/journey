import { useState } from 'react'
import { sfx } from '../lib/feedback.js'

const PROMPT = {
  qcm: 'Choisis la bonne réponse',
  gap: 'Complète la phrase',
  vf: 'Vrai ou faux ?',
  order: 'Remets dans l\'ordre',
  pairs: 'Associe les paires',
}

export default function Question({ q, opts, value, onChange, locked }) {
  return (
    <div className="question">
      <div className="q-kind">{PROMPT[q.t]}</div>
      {q.t === 'qcm' && <Choice q={q} opts={opts} value={value} onChange={onChange} locked={locked} />}
      {q.t === 'gap' && <Gap q={q} opts={opts} value={value} onChange={onChange} locked={locked} />}
      {q.t === 'vf' && <TrueFalse q={q} value={value} onChange={onChange} locked={locked} />}
      {q.t === 'order' && <Order q={q} opts={opts} value={value || []} onChange={onChange} locked={locked} />}
      {q.t === 'pairs' && <Pairs q={q} opts={opts} onChange={onChange} />}
    </div>
  )
}

function stateOf(q, opt, value, locked) {
  if (!locked) return value === opt ? 'sel' : ''
  if (opt === q.choices[0]) return 'right'
  if (opt === value) return 'wrong'
  return 'dim'
}

function Choice({ q, opts, value, onChange, locked }) {
  return (
    <>
      <h2 className="q-title">{q.q}</h2>
      <div className="choices">
        {opts.map((o, i) => (
          <button key={o} className={`choice ${stateOf(q, o, value, locked)}`} disabled={locked}
            onClick={() => { sfx.tap(); onChange(o) }}>
            <span className="choice-key">{i + 1}</span>
            <span>{o}</span>
          </button>
        ))}
      </div>
    </>
  )
}

function Gap({ q, opts, value, onChange, locked }) {
  const [before, after] = q.q.split('___')
  const ok = locked && value === q.choices[0]
  return (
    <>
      <h2 className="q-title gap-text">
        {before}
        <span className={`blank ${value ? 'filled' : ''} ${locked ? (ok ? 'right' : 'wrong') : ''}`}>{value || ' '}</span>
        {after}
      </h2>
      <div className="chips">
        {opts.map(o => (
          <button key={o} className={`chip ${stateOf(q, o, value, locked)}`} disabled={locked}
            onClick={() => { sfx.tap(); onChange(o) }}>{o}</button>
        ))}
      </div>
    </>
  )
}

function TrueFalse({ q, value, onChange, locked }) {
  const cls = v => {
    if (!locked) return value === v ? 'sel' : ''
    if (v === q.a) return 'right'
    if (v === value) return 'wrong'
    return 'dim'
  }
  return (
    <>
      <div className="statement">« {q.q} »</div>
      <div className="vf">
        <button className={`vf-btn ${cls(true)}`} disabled={locked} onClick={() => { sfx.tap(); onChange(true) }}>
          <span className="vf-ico">👍</span>Vrai
        </button>
        <button className={`vf-btn ${cls(false)}`} disabled={locked} onClick={() => { sfx.tap(); onChange(false) }}>
          <span className="vf-ico">👎</span>Faux
        </button>
      </div>
    </>
  )
}

function Order({ q, opts, value, onChange, locked }) {
  const pool = opts.filter(o => !value.includes(o))
  return (
    <>
      <h2 className="q-title">{q.q}</h2>
      <div className="order-slots">
        {q.items.map((_, i) => {
          const item = value[i]
          const st = locked && item ? (item === q.items[i] ? 'right' : 'wrong') : ''
          return (
            <button key={i} className={`slot ${item ? 'filled' : ''} ${st}`} disabled={locked || !item}
              onClick={() => { sfx.tap(); onChange(value.filter(v => v !== item)) }}>
              <span className="slot-n">{i + 1}</span>
              <span>{item || ''}</span>
            </button>
          )
        })}
      </div>
      <div className="chips order-pool">
        {pool.map(o => (
          <button key={o} className="chip" disabled={locked} onClick={() => { sfx.tap(); onChange([...value, o]) }}>{o}</button>
        ))}
      </div>
    </>
  )
}

function Pairs({ q, opts, onChange }) {
  const [sel, setSel] = useState(null) // { side, label }
  const [matched, setMatched] = useState([]) // labels gauches trouvés
  const [flash, setFlash] = useState(null) // [gauche, droite] erronés
  const [mistakes, setMistakes] = useState(0)
  const rightOf = Object.fromEntries(q.pairs)
  const matchedRight = matched.map(l => rightOf[l])

  const pick = (side, label) => {
    if (!sel || sel.side === side) { sfx.tap(); setSel({ side, label }); return }
    const left = side === 'L' ? label : sel.label
    const right = side === 'R' ? label : sel.label
    setSel(null)
    if (rightOf[left] === right) {
      sfx.good()
      const m = [...matched, left]
      setMatched(m)
      if (m.length === q.pairs.length) onChange({ done: true, mistakes })
    } else {
      sfx.bad()
      setMistakes(mistakes + 1)
      setFlash([left, right])
      setTimeout(() => setFlash(null), 550)
    }
  }

  const cls = (side, label) => {
    const done = side === 'L' ? matched.includes(label) : matchedRight.includes(label)
    if (done) return 'matched'
    if (flash && flash[side === 'L' ? 0 : 1] === label) return 'wrong shake'
    if (sel && sel.side === side && sel.label === label) return 'sel'
    return ''
  }

  return (
    <>
      <h2 className="q-title">{q.q}</h2>
      <div className="pairs">
        <div className="pair-col">
          {opts.left.map(l => (
            <button key={l} className={`pair ${cls('L', l)}`} disabled={matched.includes(l)} onClick={() => pick('L', l)}>{l}</button>
          ))}
        </div>
        <div className="pair-col">
          {opts.right.map(r => (
            <button key={r} className={`pair ${cls('R', r)}`} disabled={matchedRight.includes(r)} onClick={() => pick('R', r)}>{r}</button>
          ))}
        </div>
      </div>
    </>
  )
}
