import { useEffect } from 'react'
import { share } from '../lib/util.js'
import { sfx } from '../lib/feedback.js'
import { Bolt, Flame, ShareIcon, Sparkle, Star } from './Icons.jsx'

const CONFETTI = Array.from({ length: 28 }, (_, i) => ({
  left: (i * 37) % 100,
  delay: (i % 7) * 0.12,
  dur: 1.8 + (i % 5) * 0.25,
  color: ['#F2B430', '#E85D75', '#3D7DD8', '#2BB673', '#7A5CD6'][i % 5],
  rot: (i * 53) % 360,
}))

export default function Result({ r, onContinue }) {
  useEffect(() => { sfx.done() }, [])
  const streakUp = r.streakAfter > r.streakBefore
  const goalJustMet = r.dayXp >= r.goal && r.dayXp - r.xp < r.goal

  return (
    <div className="result" style={{ '--theme': r.color }}>
      <div className="confetti" aria-hidden="true">
        {CONFETTI.map((c, i) => (
          <i key={i} style={{ left: `${c.left}%`, background: c.color, animationDelay: `${c.delay}s`, animationDuration: `${c.dur}s`, rotate: `${c.rot}deg` }} />
        ))}
      </div>

      <div className="result-body">
        <div className="big-emoji pop">{r.emoji}</div>
        <h1 className="title">{r.title}</h1>
        {r.stars != null && (
          <div className="result-stars">
            {[1, 2, 3].map(n => <span key={n} className={n <= r.stars ? 'on' : ''} style={{ animationDelay: `${0.3 + n * 0.15}s` }}><Star size={40} /></span>)}
          </div>
        )}

        <div className="result-tiles">
          <div className="rtile gold"><span>XP gagnés</span><b><Bolt size={20} />{r.xp}</b></div>
          <div className="rtile green"><span>Réussite</span><b>{r.accuracy}%</b></div>
          <div className={`rtile orange ${streakUp ? 'bump' : ''}`}><span>Série</span><b><Flame size={20} />{r.streakAfter}</b></div>
        </div>

        {streakUp && (
          <p className="result-note">🔥 {r.streakAfter === 1 ? 'Ta série commence aujourd\'hui. Reviens demain pour la prolonger !' : `${r.streakAfter} jours d'affilée, continue comme ça !`}</p>
        )}
        {goalJustMet && <p className="result-note">🎉 Objectif du jour atteint !</p>}

        {r.shine && (
          <section className="shine-box">
            <div className="shine-label"><Sparkle size={16} /> À placer en soirée</div>
            <p>{r.shine}</p>
            <button className="share-btn" onClick={() => share(r.shine)}><ShareIcon size={18} /> Partager</button>
          </section>
        )}
      </div>

      <footer className="result-foot">
        <button className="btn primary wide" onClick={onContinue}>Continuer</button>
      </footer>
    </div>
  )
}
