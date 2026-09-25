import { useCallback, useEffect, useRef, useState } from 'react'
import Card, { CardBack } from './Card.jsx'
import Pack from './Pack.jsx'
import { RARITIES, rarityRank } from '../lib/rarity.js'
import './booster.css'

// Carte du dessus de la pile : on la fait glisser (ou on la touche) pour
// l'envoyer hors de l'écran et découvrir la suivante.
function Throwable({ children, onTap, onThrown, canThrow }) {
  const ref = useRef(null)
  const drag = useRef(null)

  const fly = useCallback((dir, dy = 0) => {
    const el = ref.current
    if (!el) return
    el.style.transition = 'transform .5s cubic-bezier(.3,.6,.4,1), opacity .5s'
    el.style.transform = `translate(${dir * 120}vw, ${dy}px) rotate(${dir * 38}deg)`
    el.style.opacity = '0'
    setTimeout(onThrown, 260)
  }, [onThrown])

  const down = e => {
    e.currentTarget.setPointerCapture(e.pointerId)
    drag.current = { x: e.clientX, y: e.clientY, lx: e.clientX, lt: performance.now(), vx: 0, moved: false }
    ref.current.style.transition = 'none'
  }
  const move = e => {
    const d = drag.current
    if (!d) return
    const dx = e.clientX - d.x
    const dy = e.clientY - d.y
    if (Math.hypot(dx, dy) > 8) d.moved = true
    const now = performance.now()
    d.vx = (e.clientX - d.lx) / Math.max(1, now - d.lt)
    d.lx = e.clientX
    d.lt = now
    if (d.moved && canThrow) {
      ref.current.style.transform = `translate(${dx}px, ${dy * 0.4}px) rotate(${dx * 0.05}deg)`
    }
  }
  const up = e => {
    const d = drag.current
    drag.current = null
    if (!d) return
    const el = ref.current
    const dx = e.clientX - d.x
    const dy = (e.clientY - d.y) * 0.4
    if (!d.moved) {
      el.style.transform = ''
      onTap(fly)
    } else if (canThrow && (Math.abs(dx) > el.offsetWidth * 0.28 || Math.abs(d.vx) > 0.55)) {
      fly(Math.sign(dx || d.vx), dy)
    } else {
      el.style.transition = 'transform .55s cubic-bezier(.2,1.5,.4,1)'
      el.style.transform = ''
    }
  }

  return (
    <div
      ref={ref}
      className="throwable"
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}
      onTransitionEnd={() => { if (ref.current) ref.current.style.transition = '' }}
    >
      {children}
    </div>
  )
}

export default function BoosterOpening({ cards, cover, isNew, onDone, onAgain, canOpenAgain }) {
  const [stage, setStage] = useState('tear') // tear | extract | reveal | summary
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)

  const lastIndex = cards.length - 1
  const top = cards[index]
  const topHidden = index === lastIndex && !flipped

  const next = useCallback(() => {
    if (index >= lastIndex) setStage('summary')
    else setIndex(i => i + 1)
  }, [index, lastIndex])

  const tap = useCallback(fly => {
    if (topHidden) setFlipped(true)
    else fly(-1)
  }, [topHidden])

  const onTorn = () => {
    setStage('extract')
    setTimeout(() => setStage(s => (s === 'extract' ? 'reveal' : s)), 1700)
  }

  // Clavier : Espace / Entrée / → pour avancer
  useEffect(() => {
    if (stage !== 'reveal') return
    const onKey = e => {
      if (![' ', 'Enter', 'ArrowRight'].includes(e.key)) return
      e.preventDefault()
      if (topHidden) setFlipped(true)
      else next()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [stage, topHidden, next])

  if (stage === 'summary') {
    return (
      <div className="opening summary">
        <h2>Ton booster</h2>
        <div className="summary-grid">
          {cards.map((c, i) => (
            <div key={i} className="summary-item" style={{ animationDelay: `${i * 90}ms` }}>
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

  const r = top && RARITIES[top.rarity]

  return (
    <div className="opening">
      <div className={`booster-stage stage-${stage}`}>
        {stage !== 'tear' && (
          <div className="stack">
            {cards.map((c, j) => {
              const k = j - index
              if (k < 0 || k > 3) return null
              const faceDown = j === lastIndex && !flipped
              const isTop = k === 0 && stage === 'reveal'
              const face = j === lastIndex
                ? (
                  <div className={`flip3d ${faceDown ? '' : 'is-flipped'}`}>
                    <div className="flip3d-back"><CardBack /></div>
                    <div className="flip3d-front"><Card card={c} interactive={isTop && !faceDown} /></div>
                  </div>
                )
                : <Card card={c} interactive={isTop} />
              return (
                <div
                  key={j}
                  className={`stack-card ${isTop && faceDown ? `rare-hint rh-${c.rarity}` : ''} ${isTop && !faceDown && rarityRank(c.rarity) >= rarityRank('holo') && j === lastIndex ? `burst burst-${c.rarity}` : ''}`}
                  style={{ '--k': k, zIndex: 10 - k }}
                >
                  {isTop
                    ? (
                      <Throwable canThrow={!faceDown} onTap={tap} onThrown={next}>{face}</Throwable>
                    )
                    : face}
                </div>
              )
            })}
          </div>
        )}

        {(stage === 'tear' || stage === 'extract') && (
          <div className="pack-sleeve">
            <Pack
              cover={cover}
              tearable={stage === 'tear'}
              onTorn={onTorn}
              className={stage === 'extract' ? 'pack-opened' : ''}
            />
          </div>
        )}
      </div>

      <div className="reveal-info">
        {stage === 'tear' && <p className="hint">Glisse le doigt le long des pointillés pour déchirer</p>}
        {stage === 'extract' && <p className="hint">&nbsp;</p>}
        {stage === 'reveal' && (
          <>
            <div className="reveal-progress">
              {cards.map((_, i) => <span key={i} className={i < index ? 'done' : i === index ? 'now' : ''} />)}
            </div>
            <p className="hint">
              {topHidden
                ? <>Dernière carte : <strong>touche pour la retourner</strong></>
                : <>
                    <span className="rarity-chip" style={{ '--rc': r.color }}>{r.symbol} {r.label}</span>
                    {isNew(top.id) && <span className="new-chip">NOUVELLE</span>}
                  </>}
            </p>
            <p className="hint small">
              {topHidden ? ' ' : index === lastIndex ? 'Glisse pour voir ton booster' : 'Glisse la carte sur le côté pour passer à la suivante'}
            </p>
            <button className="link-btn" onClick={() => setStage('summary')}>Tout révéler</button>
          </>
        )}
      </div>

      {stage === 'reveal' && index > 0 && (
        <div className="tray" aria-label="Cartes déjà vues">
          {cards.slice(0, index).map((c, i) => (
            <div key={i} className="tray-card"><Card card={c} interactive={false} /></div>
          ))}
        </div>
      )}
    </div>
  )
}
