import { memo, useEffect, useRef, useState } from 'react'
import { useTilt } from '../lib/tilt.js'
import { packFullKey, packImageKey, useCardImage } from '../lib/images.js'
import { SET } from '../data/cards.js'
import { haptic, sfx } from '../lib/feedback.js'
import { Emblem } from './Brand.jsx'
import './pack.css'

// Illustration du booster : image dédiée (« booster-star-wars.jpg »), sinon
// l'image de la carte de couverture, sinon une affiche générée.
function Art({ card }) {
  const packImg = useCardImage(packImageKey(card.u))
  const cardImg = useCardImage(card.id)
  const img = packImg || cardImg || card.image
  return (
    <div className="pack-art">
      {img
        ? <img src={img} alt="" draggable="false" />
        : (
          <>
            <span className="art-sky" />
            <span className="art-sun" />
            <span className="art-rays" />
            <span className="art-sil" aria-hidden="true">{card.emoji}</span>
            <span className="art-ground" />
            <span className="art-sparkles" />
          </>
        )}
      <span className="art-leaks" />
    </div>
  )
}

// Sachet de booster. Avec `tearable`, on le déchire en glissant
// le doigt le long de la bande pointillée (ou d'un simple toucher).
function Pack({ cover, tearable = false, onTorn, className = '', onClick, disabled, featured = false }) {
  const { attach, move: tiltMove, leave: tiltLeave, up: tiltUp } = useTilt({ maxTilt: 12, scale: 0.025, touch: tearable })
  // Booster complet fourni par le joueur : son image remplace tout le visuel.
  const fullImg = useCardImage(packFullKey(cover.u))
  const [torn, setTorn] = useState(false)
  const [started, setStarted] = useState(false) // la déchirure a commencé (masque l'indice)
  const tearRef = useRef(0)
  const rootRef = useRef(null)
  const drag = useRef(null)
  const anim = useRef(0)

  useEffect(() => () => cancelAnimationFrame(anim.current), [])

  // Progression écrite directement sur les deux morceaux de soudure (et eux
  // seuls) : aucun rendu React ni recalcul de style du reste du sachet.
  const setTear = v => {
    tearRef.current = v
    const t = v.toFixed(4)
    rootRef.current?.querySelectorAll('.pack-head').forEach(h => h.style.setProperty('--tear', t))
    if (v > 0.05 && !started) setStarted(true)
  }
  const setRef = node => {
    rootRef.current = node
    attach(node)
  }

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
    sfx.tear()
    haptic('medium')
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
      ref={setRef}
      className={`pack ${fullImg ? 'is-full' : ''} ${tearable ? 'is-tearable' : ''} ${torn ? 'is-torn' : ''} ${disabled ? 'is-disabled' : ''} ${className}`}
      style={{ '--c1': cover.universe.c1, '--c2': cover.universe.c2, ...(fullImg && { '--full': `url("${fullImg}")` }) }}
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
      <div className="pack-shadow" aria-hidden="true" />
      <div className="pack-tilt">
        {/* soudure du haut, en deux morceaux : la partie déjà déchirée se soulève */}
        <div className="pack-head pack-head-rest"><span className="crimp" /></div>
        <div className="pack-head pack-head-torn"><span className="crimp" /></div>

        <div className="pack-light" aria-hidden="true" />

        <div className="pack-body">
          {!fullImg && (
            <>
              <Art card={cover} />
              <div className="pack-band pack-band-top">
                <span className="pack-logo"><Emblem /><span>Pop<b>Card</b></span></span>
                <span className="pack-code">{SET.code}</span>
              </div>
              <span className="pack-stripe" />
              <div className="pack-titles">
                <span className="pack-kicker">Booster thématique</span>
                <span className="pack-title" data-text={cover.universe.name}>{cover.universe.name}</span>
              </div>
              <div className="pack-band pack-band-bottom"><span>{SET.name} · 5 cartes</span></div>
            </>
          )}
          <span className="crimp crimp-bottom" />
          <div className="pack-pillow" />
          <div className="pack-gloss"><i className="sheet" /></div>
          <div className="pack-holo" data-o><i className="sheet" /></div>
          <div className="pack-glare" data-o><i className="sheet" /></div>
        </div>

        {featured && <span className="pack-featured" aria-label="Booster vedette">★ Vedette</span>}

        {tearable && !torn && !started && (
          <div className="tear-hint" aria-hidden="true"><span /></div>
        )}
      </div>
    </div>
  )
}

// Mémorisé : quand l'écran se met à jour (booster choisi, jauge…), les
// sachets dont rien ne change ne sont pas recalculés.
export default memo(Pack)
