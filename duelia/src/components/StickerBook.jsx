// Livre de stickers : des pages où le joueur colle lui-même les stickers qu'il a débloqués.
// Un sticker collé ne bouge plus. Les amis peuvent feuilleter le livre (lecture seule).
import { useEffect, useRef, useState } from 'react'
import * as api from '../lib/account.js'
import { STICKERS, STICKER_LEVEL, stickerById, saveSticker } from '../lib/stickers.js'

const SIZE = 0.36 // largeur d'un sticker, en part de la largeur de la page

export default function StickerBook({ playerId, title, editable, topics = [], onBack, onToast }) {
  const [book, setBook] = useState(null)
  const [error, setError] = useState(false)
  const [page, setPage] = useState(0)
  const [draft, setDraft] = useState(null) // sticker en cours de placement { id, x, y, rot }
  const [zoom, setZoom] = useState(null) // sticker affiché en grand
  const [saving, setSaving] = useState(false)
  const pageRef = useRef(null)
  const drag = useRef(null)

  const load = () => api.getStickerBook(playerId).then(b => { setBook(b || { placed: [], unlocked: [] }); setError(!b) }).catch(() => setError(true))
  useEffect(() => {
    load()
    // juste après un déblocage, l'XP peut mettre quelques secondes à arriver sur le serveur
    const t = setTimeout(load, 5000)
    return () => clearTimeout(t)
  }, [playerId]) // eslint-disable-line react-hooks/exhaustive-deps

  const placed = book?.placed || []
  const pages = Math.max(2, ...placed.map(p => p.page + 2))
  const toPlace = editable ? (book?.unlocked || []).filter(id => !placed.some(p => p.id === id) && stickerById(id)) : []
  const owned = new Set([...placed.map(p => p.id), ...(book?.unlocked || [])])

  const start = (id) => {
    setDraft({ id, x: 0.5, y: 0.45, rot: (id.charCodeAt(0) % 3 - 1) * 6 })
    setZoom(null)
  }
  const pointFrom = (e) => {
    const r = pageRef.current.getBoundingClientRect()
    return { x: Math.min(0.92, Math.max(0.08, (e.clientX - r.left) / r.width)), y: Math.min(0.9, Math.max(0.1, (e.clientY - r.top) / r.height)) }
  }
  const onDown = (e) => { if (!draft) return; drag.current = true; e.currentTarget.setPointerCapture?.(e.pointerId); setDraft(d => ({ ...d, ...pointFrom(e) })) }
  const onMove = (e) => { if (drag.current && draft) setDraft(d => ({ ...d, ...pointFrom(e) })) }
  const onUp = () => { drag.current = false }

  const stick = async () => {
    setSaving(true)
    try {
      await api.placeSticker(draft.id, page, draft.x, draft.y, draft.rot)
      setBook(b => ({ ...b, placed: [...b.placed, { ...draft, page }] }))
      setDraft(null)
      onToast?.('✨ Sticker collé !')
    } catch (e) {
      onToast?.(/débloqué/.test(e?.message || '') ? 'Ce sticker n\'est pas encore débloqué sur le serveur : réessaie dans un instant.' : 'Impossible de coller le sticker : vérifie ta connexion.')
    }
    setSaving(false)
  }
  const download = async (s) => {
    try { const r = await saveSticker(s); if (r === 'downloaded') onToast?.('Sticker téléchargé 📥') } catch { onToast?.('Téléchargement impossible.') }
  }
  const topicName = (id) => topics.find(t => t.id === id)?.name || id

  return (
    <div className="screen sticker-book">
      <header className="top"><button className="icon-btn" onClick={onBack} aria-label="Retour">←</button><h1 className="ellipsis">{title}</h1></header>
      {error && !book?.placed?.length && <p className="inbox-empty">Livre indisponible pour l'instant (connexion ?).</p>}

      <div className="sb-nav">
        <button className="stake-btn" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0 || !!draft} aria-label="Page précédente">‹</button>
        <span>Page {page + 1} / {pages}</span>
        <button className="stake-btn" onClick={() => setPage(p => Math.min(pages - 1, p + 1))} disabled={page >= pages - 1 || !!draft} aria-label="Page suivante">›</button>
      </div>

      <div className={`sb-page ${draft ? 'placing' : ''}`} ref={pageRef}
        onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}>
        {placed.filter(p => p.page === page).map(p => {
          const s = stickerById(p.id)
          if (!s) return null
          return <button key={p.id} className="sb-sticker" onClick={() => !draft && setZoom(s)}
            style={{ left: `${p.x * 100}%`, top: `${p.y * 100}%`, width: `${SIZE * 100}%`, transform: `translate(-50%, -50%) rotate(${p.rot}deg)` }}>
            <img src={s.img} alt={s.name} draggable="false" />
          </button>
        })}
        {draft && (
          <div className="sb-sticker draft" style={{ left: `${draft.x * 100}%`, top: `${draft.y * 100}%`, width: `${SIZE * 100}%`, transform: `translate(-50%, -50%) rotate(${draft.rot}deg)` }}>
            <img src={stickerById(draft.id).img} alt="" draggable="false" />
          </div>
        )}
        {!draft && !placed.some(p => p.page === page) && <p className="sb-empty">{editable ? 'Page vierge : colle ici tes prochains stickers.' : 'Page vierge.'}</p>}
      </div>

      {draft ? (
        <div className="sb-draft-bar">
          <p>Fais glisser le sticker sur la page. Une fois collé, il ne bougera plus !</p>
          <div className="sb-rot">
            <button className="stake-btn" onClick={() => setDraft(d => ({ ...d, rot: Math.max(-30, d.rot - 5) }))} aria-label="Tourner à gauche">↺</button>
            <button className="stake-btn" onClick={() => setDraft(d => ({ ...d, rot: Math.min(30, d.rot + 5) }))} aria-label="Tourner à droite">↻</button>
          </div>
          <button className="btn btn-gold wide" onClick={stick} disabled={saving}>{saving ? 'Collage…' : 'Coller ici'}</button>
          <button className="btn btn-ghost wide" onClick={() => setDraft(null)}>Annuler</button>
        </div>
      ) : toPlace.length > 0 && (
        <section className="sb-tray">
          <h3 className="sec-title">À coller ({toPlace.length})</h3>
          <div className="sb-tray-list">
            {toPlace.map(id => { const s = stickerById(id); return (
              <button key={id} className="sb-tray-item" onClick={() => start(id)}><img src={s.img} alt="" /><span>{s.name}</span></button>
            ) })}
          </div>
          <small>Choisis une page, touche un sticker puis place-le où tu veux.</small>
        </section>
      )}

      {!draft && (
        <section className="sb-collection">
          <h3 className="sec-title">Collection · {STICKERS.filter(s => owned.has(s.id)).length} / {STICKERS.length}</h3>
          <div className="sb-grid">
            {STICKERS.map(s => owned.has(s.id)
              ? <button key={s.id} className="sb-card" onClick={() => setZoom(s)}><img src={s.img} alt="" /><b>{s.name}</b></button>
              : <div key={s.id} className="sb-card locked"><img src={s.img} alt="" /><b>???</b><small>Niveau {STICKER_LEVEL} en {topicName(s.topic)}</small></div>)}
          </div>
        </section>
      )}

      {zoom && (
        <div className="sheet-backdrop" onClick={() => setZoom(null)}>
          <div className="sheet sb-zoom" role="dialog" aria-label={zoom.name} onClick={e => e.stopPropagation()}>
            <img src={zoom.png} alt={zoom.name} />
            <h2>{zoom.name}</h2>
            <p className="sheet-sub">Débloqué au niveau {STICKER_LEVEL} du thème {topicName(zoom.topic)}</p>
            <button className="btn btn-primary wide" onClick={() => download(zoom)}>📥 Télécharger le sticker</button>
            <small className="sb-tip">Sur iPhone : « Enregistrer l'image », puis dans Photos, appuie longuement sur la pieuvre pour en faire un autocollant.</small>
            <button className="btn btn-ghost wide" onClick={() => setZoom(null)}>Fermer</button>
          </div>
        </div>
      )}
    </div>
  )
}
