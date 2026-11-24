// Collection de figurines de la Chasse au Kraken (profil, profil d'un ami)
import { useEffect, useState } from 'react'
import * as api from '../lib/account.js'
import { PAWNS, FREE_PAWNS } from '../lib/traque.js'

export default function PawnCollection({ playerId = null, title = 'Ma collection de pions' }) {
  const [bought, setBought] = useState(null)
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
          <figure key={p.id} className={has(p.id) ? '' : 'locked'} title={has(p.id) ? p.name : 'Figurine mystère'}>
            <img src={p.img} alt={has(p.id) ? p.name : 'Figurine mystère'} loading="lazy" />
            <figcaption>{has(p.id) ? p.name : '???'}</figcaption>
          </figure>
        ))}
      </section>
      {!playerId && n < PAWNS.length && <p className="pf-note">Les autres figurines se débloquent avec la figurine mystère, dans le salon de la Chasse au Kraken.</p>}
    </>
  )
}
