import { useState } from 'react'
import Card, { CardBack } from './Card.jsx'
import { RARITIES, rarityRank } from '../lib/rarity.js'

// Déroulé : pack fermé → déchirure → cartes révélées une à une → récapitulatif.
export default function BoosterOpening({ cards, isNew, onDone, onAgain, canOpenAgain }) {
  const [stage, setStage] = useState('pack') // pack | tearing | reveal | summary
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)

  const tear = () => {
    setStage('tearing')
    setTimeout(() => setStage('reveal'), 900)
  }

  const current = cards[index]

  const advance = () => {
    if (!flipped) return setFlipped(true)
    if (index + 1 >= cards.length) return setStage('summary')
    setIndex(index + 1)
    setFlipped(false)
  }

  if (stage === 'pack' || stage === 'tearing') {
    return (
      <div className="opening">
        <button className={`pack ${stage === 'tearing' ? 'is-tearing' : ''}`} onClick={tear} disabled={stage === 'tearing'}>
          <span className="pack-top" />
          <span className="pack-body">
            <span className="pack-logo"><small>Ciné</small>Master</span>
            <span className="pack-set">Série 1 · Premières Séances</span>
            <span className="pack-icons">🎬 🍿 🎞️</span>
            <span className="pack-count">5 cartes</span>
          </span>
        </button>
        <p className="hint">{stage === 'pack' ? 'Touche le booster pour l’ouvrir' : '…'}</p>
      </div>
    )
  }

  if (stage === 'reveal') {
    const r = RARITIES[current.rarity]
    const special = rarityRank(current.rarity) >= rarityRank('holo')
    return (
      <div className="opening">
        <div className="reveal-progress">
          {cards.map((c, i) => (
            <span key={i} className={i < index ? 'done' : i === index ? 'now' : ''} />
          ))}
        </div>

        <div
          className={`reveal-stage ${flipped && special ? `burst burst-${current.rarity}` : ''}`}
          onClick={advance}
        >
          <div className={`flipper ${flipped ? 'is-flipped' : ''}`} key={index}>
            <div className="flip-back"><CardBack /></div>
            <div className="flip-front"><Card card={current} /></div>
          </div>
        </div>

        <p className="hint">
          {flipped
            ? <>
                <span className="rarity-chip" style={{ '--rc': r.color }}>{r.symbol} {r.label}</span>
                {isNew(current.id) && <span className="new-chip">NOUVELLE</span>}
              </>
            : 'Touche pour retourner la carte'}
        </p>
        <button className="link-btn" onClick={() => setStage('summary')}>Tout révéler</button>
      </div>
    )
  }

  return (
    <div className="opening summary">
      <h2>Ton booster</h2>
      <div className="summary-grid">
        {cards.map((c, i) => (
          <div key={i} className="summary-item" style={{ animationDelay: `${i * 80}ms` }}>
            {isNew(c.id) && <span className="new-chip floating">NEW</span>}
            <Card card={c} />
          </div>
        ))}
      </div>
      <div className="summary-actions">
        {canOpenAgain && <button className="btn primary" onClick={onAgain}>Ouvrir un autre booster</button>}
        <button className="btn" onClick={onDone}>Voir ma collection</button>
      </div>
    </div>
  )
}
