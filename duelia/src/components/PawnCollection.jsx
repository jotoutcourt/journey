// Collection de figurines de la Chasse au Kraken (profil, profil d'un ami)
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import * as api from '../lib/account.js'
import { PAWNS, FREE_PAWNS } from '../lib/traque.js'

export default function PawnCollection({ playerId = null, title = 'Ma collection de pions' }) {
  const [bought, setBought] = useState(null)
  const [sel, setSel] = useState(null)
  useEffect(() => {
    let alive = true
    const req = playerId ? api.playerPawns(playerId) : api.myPawns()
    req.then(r => { if (alive) setBought(Array.isArray(r) ? r : []) }).catch(() => { if (alive) setBought([]) })
    return () => { alive = false }
  }, [playerId])
  if (!bought) return null
  const has = (id) => FREE_PAWNS.includes(id) || bought.includes(id)
  const n = PAWNS.filter(p => has(p.id)).length
  return (
    <>
      <h3 className="sec-title">{title} <small className="pc-count">{n}/{PAWNS.length}</small></h3>
      <section className="pf-card pc-grid">
        {PAWNS.map(p => (
          <figure key={p.id} className={has(p.id) ? '' : 'locked'} title={has(p.id) ? p.name : 'Figurine mystère'} onClick={() => setSel({ ...p, owned: has(p.id) })}>
            <img src={p.img} alt={has(p.id) ? p.name : 'Figurine mystère'} loading="lazy" />
            <figcaption>{has(p.id) ? p.name : '???'}</figcaption>
          </figure>
        ))}
      </section>
      {sel && createPortal(<PawnViewer pawn={sel} onClose={() => setSel(null)} />, document.body)}
      {!playerId && n < PAWNS.length && <p className="pf-note">Les autres figurines se débloquent avec la figurine mystère, dans le salon de la Chasse au Kraken.</p>}
    </>
  )
}

// Figurine en grand : effet résine brillante, inclinaison 3D au doigt (et léger balancement au repos)
function PawnViewer({ pawn, onClose }) {
  const fig = useRef(null)
  const hd = `/traque/pions-hd/${pawn.id}.webp`
  const move = (e) => {
    const el = fig.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const x = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)), y = Math.max(0, Math.min(1, (e.clientY - r.top) / r.height))
    el.style.setProperty('--ry', `${(x - 0.5) * 36}deg`)
    el.style.setProperty('--rx', `${(0.5 - y) * 22}deg`)
    el.style.setProperty('--mx', `${x * 100}%`)
    el.style.setProperty('--my', `${y * 100}%`)
    el.classList.add('held')
  }
  const reset = () => { const el = fig.current; if (el) { el.classList.remove('held'); ['--ry', '--rx', '--mx', '--my'].forEach(k => el.style.removeProperty(k)) } }
  return (
    <div className="pv-backdrop" onClick={onClose}>
      <div className="pv-stage" onClick={e => e.stopPropagation()} onPointerMove={move} onPointerDown={move} onPointerLeave={reset} onPointerUp={reset}>
        <div className={`pv-fig ${pawn.owned ? '' : 'locked'}`} ref={fig} style={{ '--img': `url(${hd})` }}>
          <img src={hd} alt={pawn.owned ? pawn.name : 'Figurine mystère'} draggable="false" />
          {pawn.owned && <i className="pv-gloss" />}
          {pawn.owned && <i className="pv-spec" />}
        </div>
        <span className="pv-shadow" />
        <b className="pv-name">{pawn.owned ? pawn.name : '???'}</b>
        <small className="pv-hint">{pawn.owned ? 'Glisse le doigt pour la faire pivoter' : 'Encore à débloquer avec la figurine mystère'}</small>
      </div>
      <button className="pv-close" onClick={onClose} aria-label="Fermer">×</button>
    </div>
  )
}

// Figurine « résine » (sans interaction) : balancement 3D et reflets, pour les écrans de jeu
export function ResinPawn({ id, className = '' }) {
  const hd = `/traque/pions-hd/${id}.webp`
  return (
    <div className={`pv-fig rp ${className}`} style={{ '--img': `url(${hd})` }}>
      <img src={hd} alt="" draggable="false" />
      <i className="pv-gloss" />
      <i className="pv-spec" />
    </div>
  )
}
