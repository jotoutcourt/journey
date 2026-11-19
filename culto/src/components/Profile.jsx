import { useState } from 'react'
import { THEMES } from '../data/themes.js'
import { dayKey, levelOf, resetAll, setGoal, setSound, streakNow } from '../lib/store.js'
import { Bolt, Flame } from './Icons.jsx'
import { GOALS } from '../lib/goals.js'

const WEEK = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

function badges(s) {
  const done = Object.keys(s.lessons).length
  const themesTouched = THEMES.filter(t => t.lessons.some(l => s.lessons[l.id])).length
  const themesDone = THEMES.filter(t => t.lessons.every(l => s.lessons[l.id])).length
  const total = THEMES.reduce((n, t) => n + t.lessons.length, 0)
  return [
    { e: '🌱', name: 'Premier pas', desc: 'Terminer une leçon', ok: done >= 1 },
    { e: '🔥', name: 'Sur sa lancée', desc: '3 jours de série', ok: s.streak.best >= 3 },
    { e: '📅', name: 'Une semaine', desc: '7 jours de série', ok: s.streak.best >= 7 },
    { e: '💯', name: 'Sans faute', desc: 'Une leçon parfaite', ok: s.perfect >= 1 },
    { e: '🧭', name: 'Touche-à-tout', desc: '5 thèmes explorés', ok: themesTouched >= 5 },
    { e: '🏆', name: 'Spécialiste', desc: 'Finir un thème', ok: themesDone >= 1 },
    { e: '🎓', name: 'Érudit', desc: 'Atteindre 500 XP', ok: s.xp >= 500 },
    { e: '📚', name: 'Encyclopédie', desc: 'Toutes les leçons', ok: done >= total },
  ]
}

export default function Profile({ s, now }) {
  const [confirm, setConfirm] = useState(false)
  const lvl = levelOf(s.xp)
  const date = new Date(now)
  const streak = streakNow(s, dayKey(date))
  const accuracy = s.answered ? Math.round((s.correct / s.answered) * 100) : 0
  const lessonsDone = Object.keys(s.lessons).length

  // 7 derniers jours, de lundi à dimanche de la semaine en cours
  const monday = new Date(date); monday.setHours(0, 0, 0, 0)
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7))
  const week = WEEK.map((d, i) => {
    const day = new Date(monday); day.setDate(monday.getDate() + i)
    const k = dayKey(day)
    return { d, xp: s.days[k] || 0, today: k === dayKey(date), future: day > date }
  })
  const maxXp = Math.max(s.goal, ...week.map(w => w.xp))

  return (
    <div className="page">
      <h1 className="page-title">Profil</h1>

      <section className="level-card">
        <div className="level-badge">{lvl.index}</div>
        <div className="level-info">
          <div className="level-kicker">Niveau {lvl.index}</div>
          <div className="level-name">{lvl.name}</div>
          <div className="bar thin"><div className="bar-fill gold" style={{ width: `${lvl.progress * 100}%` }} /></div>
          <div className="level-next">{lvl.next ? `${lvl.next.xp - s.xp} XP avant « ${lvl.next.name} »` : 'Niveau maximum atteint !'}</div>
        </div>
      </section>

      <section className="tiles">
        <div className="tile"><span className="tile-ico flame"><Flame /></span><b>{streak}</b><small>jours de série</small></div>
        <div className="tile"><span className="tile-ico bolt"><Bolt /></span><b>{s.xp}</b><small>XP au total</small></div>
        <div className="tile"><span className="tile-ico">📘</span><b>{lessonsDone}</b><small>leçons</small></div>
        <div className="tile"><span className="tile-ico">🎯</span><b>{accuracy}%</b><small>de réussite</small></div>
      </section>

      <section className="panel">
        <div className="panel-title">Cette semaine</div>
        <div className="week">
          {week.map((w, i) => (
            <div key={i} className={`week-col ${w.today ? 'today' : ''}`}>
              <div className="week-bar-box">
                <div className={`week-bar ${w.xp >= s.goal ? 'met' : ''}`} style={{ height: `${w.future ? 0 : Math.max(w.xp ? 8 : 3, (w.xp / maxXp) * 100)}%` }} />
              </div>
              <span className="week-xp">{w.xp || ''}</span>
              <span className="week-d">{w.d}</span>
            </div>
          ))}
        </div>
        <div className="panel-foot">Record de série : {s.streak.best} jour{s.streak.best > 1 ? 's' : ''}</div>
      </section>

      <section className="panel">
        <div className="panel-title">Succès</div>
        <div className="badges">
          {badges(s).map(b => (
            <div key={b.name} className={`badge ${b.ok ? 'ok' : ''}`}>
              <span className="badge-e">{b.e}</span>
              <b>{b.name}</b>
              <small>{b.desc}</small>
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="panel-title">Objectif quotidien</div>
        <div className="goal-options">
          {GOALS.map(g => (
            <button key={g.xp} className={`goal-opt ${s.goal === g.xp ? 'on' : ''}`} onClick={() => setGoal(g.xp)}>
              <b>{g.label}</b><small>{g.xp} XP</small>
            </button>
          ))}
        </div>
        <label className="toggle-row">
          <span>Sons et vibrations</span>
          <input type="checkbox" checked={s.sound} onChange={e => setSound(e.target.checked)} />
          <span className="toggle" />
        </label>
      </section>

      {confirm ? (
        <div className="panel danger-panel">
          <p>Effacer toute ta progression ? C'est définitif.</p>
          <div className="row">
            <button className="btn ghost" onClick={() => setConfirm(false)}>Annuler</button>
            <button className="btn bad" onClick={() => { resetAll(); setConfirm(false) }}>Tout effacer</button>
          </div>
        </div>
      ) : (
        <button className="link-btn" onClick={() => setConfirm(true)}>Réinitialiser ma progression</button>
      )}
      <p className="hint-text">Ta progression est enregistrée sur ce téléphone.</p>
    </div>
  )
}
