import { useState } from 'react'
import { CARDS, UNIVERSES } from '../data/cards.js'
import { ALL_UNIVERSES, START_UNIVERSES, suggested } from '../lib/universes.js'
import { SeriesCover } from './Collection.jsx'
import { haptic, sfx } from '../lib/feedback.js'

const COUNT = Object.fromEntries(ALL_UNIVERSES.map(u => [u, CARDS.filter(c => c.u === u).length]))

// Choix des univers : 5 au départ, puis un de plus à chaque série complétée.
export default function UniversePicker({ state, need, onConfirm }) {
  const chosen = state.universes || []
  const start = chosen.length === 0
  const [picked, setPicked] = useState(() => (start ? suggested(state.owned).slice(0, need) : []))
  const options = ALL_UNIVERSES.filter(u => !chosen.includes(u))

  const toggle = u => setPicked(p => {
    if (p.includes(u)) return p.filter(x => x !== u)
    if (p.length >= need) return need === 1 ? [u] : p   // un seul à choisir : on remplace
    haptic('light')
    return [...p, u]
  })

  const confirm = () => {
    sfx.claim()
    haptic('medium')
    onConfirm(picked)
  }

  return (
    <div className="picker-screen" role="dialog" aria-modal="true" aria-label="Choix des univers">
      <header className="picker-head">
        {start
          ? (
            <>
              <p className="eyebrow">Bienvenue dans PopCard</p>
              <h2>Choisis tes {START_UNIVERSES} univers</h2>
              <p className="muted">Tes boosters ne contiendront que des cartes de ces univers.
                Complète une collection (toutes les cartes sauf les Gold) pour débloquer un univers de plus.</p>
            </>
          )
          : (
            <>
              <p className="eyebrow">Collection complète !</p>
              <h2>Tu débloques {need > 1 ? `${need} nouveaux univers` : 'un nouvel univers'}</h2>
              <p className="muted">Choisis {need > 1 ? 'lesquels' : 'lequel'} ajouter à tes boosters.</p>
            </>
          )}
      </header>

      <div className="picker-grid">
        {options.map(u => {
          const on = picked.includes(u)
          const full = !on && picked.length >= need && need > 1
          return (
            <button
              key={u}
              className={`picker-tile ${on ? 'is-on' : ''} ${full ? 'is-full' : ''}`}
              style={{ '--c1': UNIVERSES[u].c1, '--c2': UNIVERSES[u].c2 }}
              onClick={() => toggle(u)}
              aria-pressed={on}
            >
              <SeriesCover u={u} />
              <span className="picker-text">
                <span className="series-kind">{UNIVERSES[u].kind}</span>
                <span className="picker-name">{UNIVERSES[u].name}</span>
                <span className="picker-count">{COUNT[u]} cartes</span>
              </span>
              <span className="picker-check" aria-hidden="true">✓</span>
            </button>
          )
        })}
      </div>

      <footer className="picker-foot">
        <button className="pill-btn primary big" disabled={picked.length !== need} onClick={confirm}>
          {picked.length === need ? 'C’est parti !' : `Encore ${need - picked.length} à choisir`}
        </button>
      </footer>
    </div>
  )
}
