// Livre de stickers : des pages où le joueur colle lui-même les stickers qu'il a débloqués.
// Un sticker collé ne bouge plus. Les amis peuvent feuilleter le livre (lecture seule).
import { useEffect, useRef, useState } from 'react'
import * as api from '../lib/account.js'
import { STICKERS, STICKER_LEVEL, stickerById, saveSticker, DECOR, decorById } from '../lib/stickers.js'

const SIZE = 0.36 // largeur d'un sticker, en part de la largeur de la page

export default function StickerBook({ playerId, title, editable, topics = [], onBack, onToast }) {
  const [book, setBook] = useState(null)
  const [error, setError] = useState(false)
  const [page, setPage] = useState(0)
  const [draft, setDraft] = useState(null) // sticker en cours de placement { id, x, y, rot }
  const [zoom, setZoom] = useState(null) // sticker affiché en grand
  const [saving, setSaving] = useState(false)
  const [cover, setCover] = useState('closed') // closed → opening → open
  const [turn, setTurn] = useState('')
  const [picked, setPicked] = useState(null) // décor posé sélectionné (pour le retirer)
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
  const decor = book?.decor || []
  const pages = Math.max(2, ...placed.map(p => p.page + 2), ...decor.map(d => d.page + 2))
  const toPlace = editable ? (book?.unlocked || []).filter(id => !placed.some(p => p.id === id) && stickerById(id)) : []
  const owned = new Set([...placed.map(p => p.id), ...(book?.unlocked || [])])

  const start = (id) => {
    setDraft({ kind: 'sticker', id, x: 0.5, y: 0.45, rot: (id.charCodeAt(0) % 3 - 1) * 6 })
    setZoom(null); setPicked(null)
    setCover('open')
  }
  const startDecor = (id) => {
    setDraft({ kind: 'decor', id, x: 0.5, y: 0.45, rot: 0, size: 0.3 })
    setPicked(null)
    setCover('open')
  }
  const isDecor = draft?.kind === 'decor'
  const draftImg = draft ? (isDecor ? decorById(draft.id)?.img : stickerById(draft.id)?.img) : null
  const draftW = isDecor ? draft.size : SIZE
  const pointFrom = (e) => {
    const r = pageRef.current.getBoundingClientRect()
    return { x: Math.min(0.92, Math.max(0.08, (e.clientX - r.left) / r.width)), y: Math.min(0.9, Math.max(0.1, (e.clientY - r.top) / r.height)) }
  }
  const onDown = (e) => { if (!draft) return; drag.current = true; e.currentTarget.setPointerCapture?.(e.pointerId); setDraft(d => ({ ...d, ...pointFrom(e) })) }
  const onMove = (e) => { if (drag.current && draft) setDraft(d => ({ ...d, ...pointFrom(e) })) }
  const onUp = () => { drag.current = false }

  const stick = async () => {
    setSaving(true)
    if (isDecor) {
      try {
        const id = await api.placeDecor(draft.id, page, draft.x, draft.y, draft.rot, draft.size)
        setBook(b => ({ ...b, decor: [...(b.decor || []), { ...draft, deco: draft.id, id, page }] }))
        setDraft(null)
      } catch (e) {
        onToast?.(/pleine/.test(e?.message || '') ? 'Cette page est pleine de décors : passe à la suivante.' : 'Impossible de poser le décor : vérifie ta connexion.')
      }
      setSaving(false)
      return
    }
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
  const removePicked = async () => {
    const d = picked
    setPicked(null)
    setBook(b => ({ ...b, decor: b.decor.filter(x => x.id !== d.id) }))
    try { await api.removeDecor(d.id) } catch { onToast?.('Impossible de retirer le décor : vérifie ta connexion.'); load() }
  }
  const download = async (s) => {
    try { const r = await saveSticker(s); if (r === 'downloaded') onToast?.('Sticker téléchargé 📥') } catch { onToast?.('Téléchargement impossible.') }
  }
  const openBook = () => {
    if (cover !== 'closed') return
    setCover('opening')
    setTimeout(() => setCover('open'), 900)
  }
  const goPage = (d) => {
    setPicked(null)
    setTurn(d > 0 ? 'turn-next' : 'turn-prev')
    setPage(p => Math.min(pages - 1, Math.max(0, p + d)))
  }
  const topicName = (id) => topics.find(t => t.id === id)?.name || id

  return (
    <div className="screen sticker-book">
      <header className="top"><button className="icon-btn" onClick={onBack} aria-label="Retour">←</button><h1 className="ellipsis">{title}</h1></header>
      {error && !book?.placed?.length && <p className="inbox-empty">Livre indisponible pour l'instant (connexion ?).</p>}

      <div className="sb-nav">
        <button className="stake-btn" onClick={() => goPage(-1)} disabled={page === 0 || !!draft || cover !== 'open'} aria-label="Page précédente">‹</button>
        <span>Page {page + 1} / {pages}</span>
        <button className="stake-btn" onClick={() => goPage(1)} disabled={page >= pages - 1 || !!draft || cover !== 'open'} aria-label="Page suivante">›</button>
      </div>

      <div className="sb-book">
      <img className="sb-spine" src="/book/spine.webp" alt="" draggable="false" />
      <div key={page} className={`sb-page ${draft ? 'placing' : ''} ${turn}`} ref={pageRef}
        onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}>
        {placed.filter(p => p.page === page).map(p => {
          const s = stickerById(p.id)
          if (!s) return null
          return <button key={p.id} className="sb-sticker" onClick={() => !draft && setZoom(s)}
            style={{ left: `${p.x * 100}%`, top: `${p.y * 100}%`, width: `${SIZE * 100}%`, transform: `translate(-50%, -50%) rotate(${p.rot}deg)` }}>
            <img src={s.img} alt={s.name} draggable="false" />
          </button>
        })}
        {decor.filter(d => d.page === page).map(d => {
          const dc = decorById(d.deco)
          if (!dc) return null
          return <button key={d.id} className={`sb-deco ${picked?.id === d.id ? 'picked' : ''}`} disabled={!editable || !!draft} onClick={() => setPicked(p => p?.id === d.id ? null : d)}
            style={{ left: `${d.x * 100}%`, top: `${d.y * 100}%`, width: `${d.size * 100}%`, transform: `translate(-50%, -50%) rotate(${d.rot}deg)` }}>
            <img src={dc.img} alt="" draggable="false" />
          </button>
        })}
        {draft && draftImg && (
          <div className={`${isDecor ? 'sb-deco' : 'sb-sticker'} draft`} style={{ left: `${draft.x * 100}%`, top: `${draft.y * 100}%`, width: `${draftW * 100}%`, transform: `translate(-50%, -50%) rotate(${draft.rot}deg)` }}>
            <img src={draftImg} alt="" draggable="false" />
          </div>
        )}
        {!draft && !placed.some(p => p.page === page) && !decor.some(d => d.page === page) && <p className="sb-empty">{editable ? 'Page vierge : colle ici tes prochains stickers.' : 'Page vierge.'}</p>}
      </div>
      {cover !== 'open' && (
        <button className={`sb-cover ${cover}`} onClick={openBook} aria-label="Ouvrir le livre">
          <span className="sb-cover-hint">Touche pour ouvrir</span>
        </button>
      )}
      </div>

      {draft ? (
        <div className="sb-draft-bar">
          <p>{isDecor ? 'Fais glisser le décor où tu veux. Tu pourras le retirer en le touchant.' : 'Fais glisser le sticker sur la page. Une fois collé, il ne bougera plus !'}</p>
          <div className="sb-rot">
            <button className="stake-btn" onClick={() => setDraft(d => ({ ...d, rot: Math.max(isDecor ? -180 : -30, d.rot - (isDecor ? 15 : 5)) }))} aria-label="Tourner à gauche">↺</button>
            <button className="stake-btn" onClick={() => setDraft(d => ({ ...d, rot: Math.min(isDecor ? 180 : 30, d.rot + (isDecor ? 15 : 5)) }))} aria-label="Tourner à droite">↻</button>
            {isDecor && <>
              <button className="stake-btn" onClick={() => setDraft(d => ({ ...d, size: Math.max(0.1, +(d.size - 0.05).toFixed(2)) }))} aria-label="Plus petit">−</button>
              <button className="stake-btn" onClick={() => setDraft(d => ({ ...d, size: Math.min(0.7, +(d.size + 0.05).toFixed(2)) }))} aria-label="Plus grand">＋</button>
            </>}
          </div>
          <button className="btn btn-gold wide" onClick={stick} disabled={saving}>{saving ? 'Collage…' : isDecor ? 'Poser ici' : 'Coller ici'}</button>
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

      {picked && !draft && (
        <div className="sb-draft-bar">
          <button className="btn btn-ghost danger wide" onClick={removePicked}>🗑 Retirer ce décor</button>
          <button className="btn btn-ghost wide" onClick={() => setPicked(null)}>Annuler</button>
        </div>
      )}

      {editable && !draft && !picked && (
        <section className="sb-tray">
          <h3 className="sec-title">Décors</h3>
          <div className="sb-tray-list">
            {DECOR.map(d => <button key={d.id} className="sb-deco-item" onClick={() => startDecor(d.id)} aria-label="Poser ce décor"><img src={d.img} alt="" /></button>)}
          </div>
          <small>Gratuits et à volonté : touche un décor pour le poser sur la page.</small>
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
