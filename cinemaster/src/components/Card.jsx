import { RARITIES } from '../lib/rarity.js'
import { SET, SET_SIZE } from '../data/cards.js'
import { useCardImage } from '../lib/images.js'
import { useTilt } from '../lib/tilt.js'
import { Emblem } from './Brand.jsx'
import './card.css'

const ILLUSTRATOR = 'JoDNR'

// Illustration générée quand la carte n'a pas d'image : dégradé de l'univers,
// motif selon le type et pictogramme central.
// Priorité : image ajoutée dans l'Atelier, puis `image` du fichier de données.
function Art({ card }) {
  const custom = useCardImage(card.id)
  const src = custom || card.image
  if (src) return <img className="art-img" src={src} alt="" draggable="false" />
  return (
    <div className={`art-gen art-${card.type.toLowerCase()}`}>
      <div className="art-rays" />
      <div className="art-sun" />
      <span className="art-emoji" aria-hidden="true">{card.emoji}</span>
      <div className="art-halftone" />
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
          <div className="back-rays" />
          <div className="back-frame">
            <Emblem className="back-emblem" />
            <div className="back-logo">Ciné<b>Master</b></div>
            <div className="back-sub">Série 1 · Premières Séances</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Card({ card, interactive = true, className = '', onClick, style, maxTilt }) {
  const { attach, move: tiltMove, leave: tiltLeave, up: tiltUp } = useTilt({ maxTilt })
  const r = RARITIES[card.rarity]
  const full = r.layout === 'full'

  const vars = {
    '--c1': card.universe.c1,
    '--c2': card.universe.c2,
    '--ink': card.universe.ink,
    ...style,
  }

  const handlers = interactive ? {
    onPointerMove: tiltMove,
    onPointerLeave: tiltLeave,
    onPointerUp: tiltUp,
    onPointerCancel: tiltLeave,
  } : {}

  return (
    <div
      ref={attach}
      className={`card rarity-${card.rarity} foil-${r.foil} type-${card.type.toLowerCase()} ${full ? 'layout-full' : 'layout-framed'} ${className}`}
      style={vars}
      onClick={onClick}
      {...handlers}
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
