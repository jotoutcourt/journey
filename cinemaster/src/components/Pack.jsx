import { useEffect, useRef, useState } from 'react'
import { useTilt } from '../lib/tilt.js'
import { useCardImage } from '../lib/images.js'
import { SET } from '../data/cards.js'
import './pack.css'

function Cover({ card }) {
  const img = useCardImage(card.id) || card.image
  return (
    <div className="pack-cover">
      {img
        ? <img src={img} alt="" draggable="false" />
        : <span className="pack-cover-emoji" aria-hidden="true">{card.emoji}</span>}
    </div>
  )
}

// Paquet de booster en aluminium. Avec `tearable`, on le déchire en glissant
// le doigt le long de la bande pointillée (ou d'un simple toucher).
export default function Pack({ cover, tearable = false, onTorn, className = '', onClick, disabled }) {
  const { attach, move: tiltMove, leave: tiltLeave, up: tiltUp } = useTilt({ maxTilt: 12 })
  const [tear, setTearState] = useState(0)
  const [torn, setTorn] = useState(false)
  const tearRef = useRef(0)
  const drag = useRef(null)
  const anim = useRef(0)

  useEffect(() => () => cancelAnimationFrame(anim.current), [])

  const setTear = v => { tearRef.current = v; setTearState(v) }

  const animateTo = (target, done) => {
    cancelAnimationFrame(anim.current)
    const tick = () => {
      const next = tearRef.current + (target - tearRef.current) * 0.2
      if (Math.abs(target - next) < 0.01) {
        setTear(target)
        done?.()
        return
      }
      setTear(next)
      anim.current = requestAnimationFrame(tick)
    }
    anim.current = requestAnimationFrame(tick)
  }

  const finishing = useRef(false)
  const finish = () => {
    if (finishing.current) return
    finishing.current = true
    animateTo(1, () => {
      setTorn(true)
      setTimeout(() => onTorn?.(), 500)
    })
  }

  const down = e => {
    if (!tearable || torn) return
    e.currentTarget.setPointerCapture(e.pointerId)
    drag.current = { x: e.clientX, w: e.currentTarget.getBoundingClientRect().width, moved: false }
  }
  const move = e => {
    tiltMove(e)
    const d = drag.current
    if (!d) return
    const dx = e.clientX - d.x
    if (Math.abs(dx) > 6) d.moved = true
    if (d.moved) {
      cancelAnimationFrame(anim.current)
      setTear(Math.max(tearRef.current, Math.min(1, dx / (d.w * 0.85))))
    }
  }
  const up = e => {
    tiltUp(e)
    const d = drag.current
    drag.current = null
    if (!d || torn) return
    if (!d.moved || tearRef.current > 0.45) finish()
    else animateTo(0)
  }

  return (
    <div
      ref={attach}
      className={`pack ${tearable ? 'is-tearable' : ''} ${torn ? 'is-torn' : ''} ${disabled ? 'is-disabled' : ''} ${className}`}
      style={{ '--c1': cover.universe.c1, '--c2': cover.universe.c2, '--tear': tear }}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}
      onPointerLeave={tiltLeave}
      onClick={onClick}
      role={onClick || tearable ? 'button' : undefined}
      tabIndex={onClick || tearable ? 0 : undefined}
      onKeyDown={e => {
        if (e.key !== 'Enter' && e.key !== ' ') return
        e.preventDefault()
        if (tearable && !torn) finish()
        else onClick?.()
      }}
      aria-label={tearable ? 'Déchirer le booster' : `Booster ${cover.universe.name}`}
    >
      <div className="pack-tilt">
        {/* bande supérieure, en deux morceaux : la partie déjà déchirée se soulève */}
        <div className="pack-head pack-head-rest"><span className="crimp" /></div>
        <div className="pack-head pack-head-torn"><span className="crimp" /></div>

        <div className="pack-body">
          <div className="pack-logo"><small>Ciné</small>Master</div>
          <Cover card={cover} />
          <div className="pack-universe">{cover.universe.name}</div>
          <div className="pack-set">Série {SET.code.slice(1)} · {SET.name}</div>
          <div className="pack-count">5 cartes</div>
          <span className="crimp crimp-bottom" />
        </div>

        <div className="pack-foil" />
        <div className="pack-glare" />

        {tearable && !torn && tear < 0.05 && (
          <div className="tear-hint" aria-hidden="true"><span>✂</span></div>
        )}
      </div>
    </div>
  )
}
