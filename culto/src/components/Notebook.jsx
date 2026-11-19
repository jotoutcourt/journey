import { useState } from 'react'
import { THEMES } from '../data/themes.js'
import { share } from '../lib/util.js'
import { Lock, ShareIcon } from './Icons.jsx'

// Le carnet : toutes les « phrases pour briller » débloquées.
export default function Notebook({ s }) {
  const [filter, setFilter] = useState('all')
  const unlocked = THEMES.flatMap(t => t.lessons.filter(l => s.lessons[l.id]).map(l => ({ t, l })))
  const total = THEMES.reduce((n, t) => n + t.lessons.length, 0)
  const shown = filter === 'all' ? unlocked : unlocked.filter(x => x.t.id === filter)
  const themesWith = THEMES.filter(t => unlocked.some(x => x.t.id === t.id))

  return (
    <div className="page">
      <h1 className="page-title">Mon carnet</h1>
      <p className="page-sub">Les phrases à placer en soirée. {unlocked.length}/{total} débloquées.</p>

      {themesWith.length > 1 && (
        <div className="filters">
          <button className={`filter ${filter === 'all' ? 'on' : ''}`} onClick={() => setFilter('all')}>Tout</button>
          {themesWith.map(t => (
            <button key={t.id} className={`filter ${filter === t.id ? 'on' : ''}`} style={{ '--theme': t.color }} onClick={() => setFilter(t.id)}>
              {t.emoji} {t.name}
            </button>
          ))}
        </div>
      )}

      {unlocked.length === 0 ? (
        <div className="empty">
          <div className="big-emoji small"><Lock size={40} /></div>
          <p>Termine ta première leçon pour débloquer ta première phrase pour briller.</p>
        </div>
      ) : (
        <div className="shines">
          {shown.map(({ t, l }) => (
            <article key={l.id} className="shine-card" style={{ '--theme': t.color }}>
              <div className="shine-head">
                <span className="shine-from">{t.emoji} {l.title}</span>
                <button className="icon-btn small" aria-label="Partager" onClick={() => share(l.shine)}><ShareIcon size={18} /></button>
              </div>
              <p>{l.shine}</p>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
