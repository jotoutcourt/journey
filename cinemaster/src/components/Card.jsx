import { useRef } from 'react'
import { RARITIES } from '../lib/rarity.js'
import { SET, SET_SIZE } from '../data/cards.js'
import './card.css'

const ILLUSTRATOR = 'JoDNR'

// Illustration générée quand la carte n'a pas d'image : dégradé de l'univers,
// motif selon le type et pictogramme central.
function Art({ card }) {
  if (card.image) return <img className="art-img" src={card.image} alt="" draggable="false" />
  return (
    <div className={`art-gen art-${card.type.toLowerCase()}`}>
      <div className="art-rays" />
      <div className="art-bokeh" />
      <span className="art-emoji" aria-hidden="true">{card.emoji}</span>
    </div>
  )
}

function Name({ card, full }) {
  // Prénom vertical façon « ARIZONA » : le nom part de la 2e lettre qu'il partage
  // (A-R-IZONA → ROBBINS). Sinon on retombe sur l'affichage classique.
  const first = card.first.toUpperCase()
  const last = card.last.toUpperCase()
  if (full && card.vertical && first[1] === last[0]) {
    return (
      <div className="card-name vertical">
        {[...first].map((l, i) => (
          <span key={i} className="v-row">
            {l}{i === 1 && <span className="v-last">{last.slice(1)}</span>}
          </span>
        ))}
      </div>
    )
  }
  return (
    <div className={`card-name${card.caps ? ' caps' : ''}`}>
      <span className="n-first">{card.first}</span>
      <span className="n-last">{card.last}</span>
    </div>
  )
}

export function CardBack({ className = '' }) {
  return (
    <div className={`card card-back ${className}`}>
      <div className="card-tilt">
        <div className="back-face">
          <div className="back-ring" />
          <div className="back-logo">
            <span>Ciné</span><strong>Master</strong>
          </div>
          <div className="back-sub">Trading Card Game</div>
        </div>
      </div>
    </div>
  )
}

export default function Card({ card, interactive = true, className = '', onClick, style }) {
  const ref = useRef(null)
  const r = RARITIES[card.rarity]
  const full = r.layout === 'full'

  // L'effet brillant suit le pointeur : on écrit directement des variables CSS
  // sur l'élément pour éviter un re-render React à chaque mouvement.
  const handleMove = e => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const x = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width))
    const y = Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height))
    el.style.setProperty('--mx', `${x * 100}%`)
    el.style.setProperty('--my', `${y * 100}%`)
    el.style.setProperty('--rx', `${(0.5 - y) * 22}deg`)
    el.style.setProperty('--ry', `${(x - 0.5) * 26}deg`)
    el.style.setProperty('--hyp', Math.min(1, Math.hypot(x - 0.5, y - 0.5) * 2))
    el.style.setProperty('--o', 1)
    el.classList.add('is-active')
  }
  const handleLeave = () => {
    const el = ref.current
    if (!el) return
    for (const p of ['--mx', '--my', '--rx', '--ry', '--hyp', '--o']) el.style.removeProperty(p)
    el.classList.remove('is-active')
  }

  const vars = {
    '--c1': card.universe.c1,
    '--c2': card.universe.c2,
    '--ink': card.universe.ink,
    ...style,
  }

  return (
    <div
      ref={ref}
      className={`card rarity-${card.rarity} foil-${r.foil} type-${card.type.toLowerCase()} ${full ? 'layout-full' : 'layout-framed'} ${className}`}
      style={vars}
      onPointerMove={interactive ? handleMove : undefined}
      onPointerLeave={interactive ? handleLeave : undefined}
      onClick={onClick}
    >
      <div className="card-tilt">
        <div className="card-face">
          <div className="foil-under" />

          <div className="card-art">
            <Art card={card} />
            <div className="foil-art" />
          </div>

          <div className="card-content">
            <header className="card-head">
              <span className="type-pill">{card.typeInfo.short}</span>
              <span className="universe">{card.universe.name}</span>
            </header>

            <Name card={card} full={full} />

            <div className="card-spacer" />

            {card.quote && <p className="card-quote">“ {card.quote} ”</p>}

            <div className="card-bars">
              <span className="bar bar-role">{card.role}</span>
              <span className="bar bar-period">{card.period}</span>
            </div>

            <div className="card-credit">
              <span className="illus">Illus. {ILLUSTRATOR}</span>
              <div className="credit-box">
                <small>{card.creditLabel}</small>
                <strong>{card.credit}</strong>
              </div>
            </div>

            <footer className="card-foot">
              <span>{SET.code} · {String(card.number).padStart(3, '0')}/{String(SET_SIZE).padStart(3, '0')}</span>
              <span className="rarity-sym" title={r.label}>{r.symbol}</span>
            </footer>
          </div>

          <div className="foil-over" />
          <div className="glitter" />
          <div className="glare" />
        </div>
      </div>
    </div>
  )
}
