import { useEffect } from 'react'
import Card from './Card.jsx'
import { RARITIES } from '../lib/rarity.js'

export default function CardModal({ card, count, onClose, onRecycle }) {
  useEffect(() => {
    const onKey = e => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const r = RARITIES[card.rarity]
  return (
    <div className="modal" onClick={onClose}>
      <div className="modal-body" onClick={e => e.stopPropagation()}>
        <div className="modal-card"><Card card={card} /></div>
        <div className="modal-info">
          <span className="rarity-chip" style={{ '--rc': r.color }}>{r.symbol} {r.label}</span>
          <h3>{card.first} {card.last}</h3>
          <p>{card.typeInfo.label} · {card.universe.kind} <em>{card.universe.name}</em></p>
          <p className="muted">Exemplaires : {count}</p>
          <div className="modal-actions">
            {count > 1 && (
              <button className="btn small" onClick={onRecycle}>Recycler 1 doublon (+{r.dust} 🎞️)</button>
            )}
            <button className="btn small" onClick={onClose}>Fermer</button>
          </div>
        </div>
      </div>
    </div>
  )
}
