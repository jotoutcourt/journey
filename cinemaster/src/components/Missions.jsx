import { msUntilTomorrow, rewardLabel } from '../lib/missions.js'
import { Icon } from './Icons.jsx'
import { haptic, sfx } from '../lib/feedback.js'

function formatLeft(ms) {
  const h = Math.floor(ms / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  return h ? `${h} h ${String(m).padStart(2, '0')}` : `${m} min`
}

// Missions du jour : progression, puis bouton pour récupérer la récompense.
export default function Missions({ missions, now, onClaim }) {
  if (!missions?.list) return null
  const list = missions.list
  const done = list.filter(m => missions.claimed[m.id]).length

  return (
    <section className="panel missions" aria-label="Missions du jour">
      <header className="missions-head">
        <h3>Missions du jour</h3>
        <span className="missions-left"><Icon name="clock" /> {formatLeft(msUntilTomorrow(now))}</span>
      </header>
      <ul>
        {list.map(m => {
          const p = missions.progress[m.id] || 0
          const claimed = !!missions.claimed[m.id]
          const ready = p >= m.goal && !claimed
          return (
            <li key={m.id} className={`mission ${ready ? 'is-ready' : ''} ${claimed ? 'is-claimed' : ''}`}>
              <div className="mission-text">
                <span className="mission-label">{m.label}</span>
                <span className="mission-bar"><i style={{ width: `${(p / m.goal) * 100}%` }} /></span>
              </div>
              {claimed
                ? <span className="mission-done" aria-label="Récupérée">✓</span>
                : ready
                  ? <button className="mission-claim" onClick={() => { sfx.claim(); haptic('medium'); onClaim(m.id) }}>{rewardLabel(m.reward)}</button>
                  : (
                    <span className="mission-reward">
                      <small>{p}/{m.goal}</small>
                      {rewardLabel(m.reward)}
                    </span>
                  )}
            </li>
          )
        })}
      </ul>
      {done === list.length && <p className="missions-all">Toutes les missions sont faites, reviens demain !</p>}
    </section>
  )
}
