import { useState } from 'react'
import Question from './Question.jsx'
import { answerText, isCorrect, isReady, prepare } from '../lib/questions.js'
import { Close, Heart, Sparkle } from './Icons.jsx'
import { gainHeart, getState, heartsAt, loseHeart, recordAnswer } from '../lib/store.js'
import { sfx } from '../lib/feedback.js'

const PRAISE = ['Excellent !', 'Bien vu !', 'Bravo !', 'Parfait !', 'Brillant !', 'Impeccable !', 'Exactement !']

export default function Lesson({ session, onExit, onDone }) {
  const { mode, steps } = session
  const [queue, setQueue] = useState(steps)
  const [i, setI] = useState(0)
  const [value, setValue] = useState(null)
  const [checked, setChecked] = useState(null)
  const [missed, setMissed] = useState([])
  const [done, setDone] = useState(0)
  const [combo, setCombo] = useState(0)
  const [hearts, setHearts] = useState(() => heartsAt(getState(), Date.now()).n)
  const [out, setOut] = useState(false)
  const [quit, setQuit] = useState(false)

  const step = queue[i]
  const usesHearts = mode === 'lesson'
  const progress = done / steps.length

  const check = (v = value) => {
    const q = step.q
    const ok = isCorrect(q, v)
    if (q.t !== 'pairs') (ok ? sfx.good : sfx.bad)()
    recordAnswer(q.id, ok, mode !== 'lesson')
    if (ok) {
      setCombo(c => c + 1)
      setDone(d => d + 1)
      if (mode === 'review') gainHeart()
    } else {
      setCombo(0)
      if (!missed.includes(q.id)) setMissed([...missed, q.id])
      if (usesHearts) { loseHeart(); setHearts(h => h - 1) }
      if (q.t === 'pairs') setDone(d => d + 1)
      // la question ratée revient à la fin
      else setQueue(list => [...list, { ...step, key: `${step.key}+`, opts: prepare(q) }])
    }
    setChecked({ ok })
  }

  const next = () => {
    if (step.kind === 'card') setDone(d => d + 1)
    if (usesHearts && hearts <= 0) { setOut(true); return }
    if (i + 1 >= queue.length) {
      const questions = steps.filter(s => s.kind === 'q').length
      onDone({ questions, missed: missed.length })
      return
    }
    setI(i + 1)
    setValue(null)
    setChecked(null)
  }

  const change = v => {
    setValue(v)
    if (step.q?.t === 'pairs' && v?.done) check(v)
  }

  if (out) {
    return (
      <div className="lesson screen-center">
        <div className="big-emoji">💔</div>
        <h1 className="title">Plus de vies !</h1>
        <p className="lead">Une vie revient toutes les 20 minutes. Fais une révision de tes erreurs pour en regagner tout de suite.</p>
        <button className="btn primary wide" onClick={onExit}>Retour au parcours</button>
      </div>
    )
  }

  return (
    <div className="lesson" style={{ '--theme': session.color }}>
      <header className="lesson-top">
        <button className="icon-btn" aria-label="Quitter" onClick={() => setQuit(true)}><Close /></button>
        <div className="bar"><div className="bar-fill" style={{ width: `${Math.max(4, progress * 100)}%` }} /></div>
        {usesHearts ? (
          <div className="pill hearts"><Heart size={20} />{hearts}</div>
        ) : <div className="pill mode-pill">{session.emoji}</div>}
      </header>

      <main className="lesson-body" key={step.key}>
        {step.kind === 'card' ? (
          <div className="learn-card">
            <div className="learn-tag"><Sparkle size={16} /> À savoir</div>
            <div className="learn-emoji">{session.emoji}</div>
            <h2 className="learn-title">{step.card.title}</h2>
            <p className="learn-text">{step.card.text}</p>
          </div>
        ) : (
          <>
            {step.key.endsWith('+') && <div className="retry-tag">On réessaie ↺</div>}
            {mode !== 'lesson' && step.from && <div className="from-tag">{step.from}</div>}
            <Question q={step.q} opts={step.opts} value={value} onChange={change} locked={!!checked} />
          </>
        )}
      </main>

      <footer className={`lesson-foot ${checked ? (checked.ok ? 'ok' : 'ko') : ''}`}>
        {checked && (
          <div className="feedback">
            <div className="fb-head">
              <span className="fb-ico">{checked.ok ? '✓' : '✕'}</span>
              <span>{checked.ok ? (combo >= 3 ? `${combo} d'affilée !` : PRAISE[i % PRAISE.length]) : step.q.t === 'pairs' ? 'Quelques confusions' : 'Pas tout à fait…'}</span>
            </div>
            {!checked.ok && answerText(step.q) && (
              <div className="fb-answer"><b>Réponse :</b> {answerText(step.q)}</div>
            )}
            {step.q.why && <p className="fb-why">{step.q.why}</p>}
          </div>
        )}
        {step.kind === 'card' ? (
          <button className="btn primary wide" onClick={next}>J'ai compris</button>
        ) : checked ? (
          <button className={`btn wide ${checked.ok ? 'good' : 'bad'}`} onClick={next}>Continuer</button>
        ) : step.q.t === 'pairs' ? (
          <div className="foot-hint">Touche un élément de chaque colonne</div>
        ) : (
          <button className="btn primary wide" disabled={!isReady(step.q, value)} onClick={() => check()}>Vérifier</button>
        )}
      </footer>

      {quit && (
        <div className="sheet-wrap" onClick={() => setQuit(false)}>
          <div className="sheet" onClick={e => e.stopPropagation()}>
            <div className="big-emoji small">🤔</div>
            <h3 className="sheet-title">Tu pars déjà ?</h3>
            <p className="lead">Ta progression dans cette leçon sera perdue.</p>
            <button className="btn primary wide" onClick={() => setQuit(false)}>Je continue</button>
            <button className="btn ghost wide danger-text" onClick={onExit}>Quitter la leçon</button>
          </div>
        </div>
      )}
    </div>
  )
}
