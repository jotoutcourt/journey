import { useEffect, useState } from 'react'
import Card from './Card.jsx'
import { RARITIES } from '../lib/rarity.js'
import { removeImage, setImage, useCardImage } from '../lib/images.js'

export default function CardModal({ card, count, edit, onClose, onRecycle }) {
  const custom = useCardImage(card.id)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const onKey = e => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const pick = async e => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setBusy(true)
    setError('')
    try {
      await setImage(card.id, file)
    } catch {
      setError('Impossible de lire cette image. Essaie un fichier JPG ou PNG.')
    }
    setBusy(false)
  }

  const r = RARITIES[card.rarity]
  return (
    <div className="modal" onClick={onClose}>
      <div className="modal-body" onClick={e => e.stopPropagation()}>
        <div className="modal-card"><Card card={card} maxTilt={24} /></div>
        <div className="modal-info">
          <span className="rarity-chip" style={{ '--rc': r.color }}>{r.symbol} {r.label}</span>
          <h3>{card.first} {card.last}</h3>
          <p>{card.typeInfo.label} · {card.universe.kind} <em>{card.universe.name}</em></p>
          {!edit && <p className="muted">Exemplaires : {count}</p>}
          <p className="muted small">Fais glisser la carte pour jouer avec les reflets.</p>

          <div className="modal-actions">
            <label className={`btn small ${edit ? 'primary' : ''}`} htmlFor="card-image-input">
              {busy ? 'Enregistrement…' : custom ? 'Changer l’image' : 'Ajouter une image'}
            </label>
            <input id="card-image-input" type="file" accept="image/*" hidden onChange={pick} disabled={busy} />
            {custom && <button className="btn small" onClick={() => removeImage(card.id)}>Retirer l’image</button>}
          </div>
          {error && <p className="error">{error}</p>}

          <div className="modal-actions">
            {!edit && count > 1 && (
              <button className="btn small" onClick={onRecycle}>Recycler 1 doublon (+{r.dust} pellicules)</button>
            )}
            <button className="btn small" onClick={onClose}>Fermer</button>
          </div>
        </div>
      </div>
    </div>
  )
}
