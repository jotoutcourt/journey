import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Card from './Card.jsx'
import { renderShareImage, shareBlob } from '../lib/share.js'

// Partage d'une carte : on fabrique l'image, on l'affiche, puis le joueur
// la partage (menu du téléphone) ou l'enregistre. Le menu de partage doit
// partir d'un toucher : d'où l'aperçu entre la fabrication et l'envoi.
export default function ShareCard({ card }) {
  const [phase, setPhase] = useState('idle')   // idle | rendering | ready | error
  const [image, setImage] = useState(null)    // { blob, url }
  const stage = useRef(null)

  useEffect(() => {
    if (phase !== 'rendering') return
    let cancelled = false
    // deux images d'attente : la carte hors écran est posée et ses images décodées
    requestAnimationFrame(() => requestAnimationFrame(async () => {
      try {
        const node = stage.current?.querySelector('.card')
        await Promise.all([...(node?.querySelectorAll('img') || [])].map(i => i.decode?.().catch(() => {})))
        const blob = await renderShareImage(node, card)
        if (!cancelled) {
          setImage({ blob, url: URL.createObjectURL(blob) })
          setPhase('ready')
        }
      } catch {
        if (!cancelled) setPhase('error')
      }
    }))
    return () => { cancelled = true }
  }, [phase, card])

  useEffect(() => () => { if (image) URL.revokeObjectURL(image.url) }, [image])

  const close = () => { setPhase('idle'); setImage(null) }

  return (
    <>
      <button className="btn small primary" onClick={() => setPhase('rendering')} disabled={phase === 'rendering'}>
        {phase === 'rendering' ? 'Préparation…' : 'Partager'}
      </button>

      {phase === 'rendering' && createPortal(
        <div className="share-stage" ref={stage} aria-hidden="true">
          <Card card={card} interactive={false} className="is-capture" />
        </div>,
        document.body,
      )}

      {phase === 'error' && <p className="error">Impossible de préparer l’image. Réessaie.</p>}

      {phase === 'ready' && image && createPortal(
        <div className="share-sheet" onClick={close}>
          <div className="share-body" onClick={e => e.stopPropagation()}>
            <img src={image.url} alt={`Carte ${card.first} ${card.last}`} />
            <p className="muted small">Sur téléphone, tu peux aussi appuyer longuement sur l’image pour l’enregistrer.</p>
            <div className="modal-actions">
              <button className="btn small primary" onClick={async () => { if (!(await shareBlob(image.blob, card))) document.getElementById('share-save')?.click() }}>
                Partager
              </button>
              <a id="share-save" className="btn small" href={image.url} download={`popcard-${card.id}.png`}>Enregistrer</a>
              <button className="btn small" onClick={close}>Fermer</button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  )
}
