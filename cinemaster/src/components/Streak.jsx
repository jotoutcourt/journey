import { STREAK_REWARDS, streakInfo } from '../lib/streak.js'
import { rewardLabel } from '../lib/missions.js'
import { Icon } from './Icons.jsx'
import { haptic, sfx } from '../lib/feedback.js'

// Série de connexions : 7 cases, la récompense du jour à récupérer.
export default function Streak({ state, now, onClaim }) {
  const info = streakInfo(state, now)
  const doneUpTo = info.claimed ? info.slot : info.slot - 1
  const days = info.claimed ? info.count : info.count - 1
  const reward = STREAK_REWARDS[info.slot]
  return (
    <section className={`panel streak ${info.claimed ? '' : 'is-ready'}`} aria-label="Série de connexions">
      <header className="missions-head">
        <h3>Série de connexions</h3>
        {days > 0 && <span className="streak-count">🔥 {days} jour{days > 1 ? 's' : ''}</span>}
      </header>
      <ol className="streak-days">
        {STREAK_REWARDS.map((r, i) => (
          <li key={i} className={`${i <= doneUpTo ? 'is-done' : ''} ${i === info.slot ? 'is-today' : ''} ${r.booster ? 'is-big' : ''}`}>
            <span className="streak-day">J{i + 1}</span>
            <span className="streak-reward">{i <= doneUpTo ? '✓' : r.booster ? <Icon name="pack" /> : r.dust}</span>
          </li>
        ))}
      </ol>
      {info.claimed
        ? <p className="streak-note">Reviens demain pour le jour {(info.slot + 1) % 7 + 1} !</p>
        : (
          <>
            {info.broken && <p className="streak-note">Ta série est repartie à zéro : ne rate pas de jour !</p>}
            <button className="pill-btn primary" onClick={() => { sfx.claim(); haptic('medium'); onClaim() }}>
              Récupérer : {rewardLabel(reward)}
            </button>
          </>
        )}
    </section>
  )
}
