import { useState } from 'react'
import { GOALS } from '../lib/goals.js'
import { THEMES } from '../data/themes.js'

export default function Onboarding({ onFinish }) {
  const [step, setStep] = useState(0)
  const [goal, setGoal] = useState(30)

  if (step === 0) {
    return (
      <div className="onboard">
        <div className="ob-orbit" aria-hidden="true">
          {THEMES.map((t, i) => (
            <span key={t.id} style={{ '--i': i, '--n': THEMES.length, background: t.color }}>{t.emoji}</span>
          ))}
          <div className="ob-logo">C<span>.</span></div>
        </div>
        <h1 className="ob-title">Culto<span className="brand-dot">.</span></h1>
        <p className="ob-lead">5 minutes par jour pour briller en société : art, histoire, littérature, sciences, vin… et toujours une anecdote à placer.</p>
        <footer className="ob-foot">
          <button className="btn primary wide" onClick={() => setStep(1)}>C'est parti</button>
        </footer>
      </div>
    )
  }

  return (
    <div className="onboard">
      <div className="ob-q">
        <div className="big-emoji small">🎯</div>
        <h2 className="ob-title small">Quel est ton objectif quotidien ?</h2>
        <p className="ob-lead">Tu pourras le changer à tout moment dans ton profil.</p>
        <div className="ob-goals">
          {GOALS.map(g => (
            <button key={g.xp} className={`ob-goal ${goal === g.xp ? 'on' : ''}`} onClick={() => setGoal(g.xp)}>
              <b>{g.label}</b>
              <span>{g.sub}</span>
              <small>{g.xp} XP</small>
            </button>
          ))}
        </div>
      </div>
      <footer className="ob-foot">
        <button className="btn primary wide" onClick={() => onFinish(goal)}>Commencer ma première leçon</button>
      </footer>
    </div>
  )
}
