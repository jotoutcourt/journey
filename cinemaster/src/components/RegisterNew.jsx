import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Card from './Card.jsx'
import { CARDS, UNIVERSES } from '../data/cards.js'
import './register.css'

const FLY_WIDTH = 240

// Après l'ouverture : chaque nouvelle carte s'envole vers son emplacement dans
// la grille de sa série, qui se complète sous les yeux du joueur.
export default function RegisterNew({ cards, ownedBefore, onDone }) {
  // cartes nouvelles, sans doublon, regroupées par univers (ordre de la série)
  const groups = useMemo(() => {
    const unique = [...new Map(cards.map(c => [c.id, c])).values()]
    return Object.keys(UNIVERSES)
      .map(u => ({ u, list: unique.filter(c => c.u === u).sort((a, b) => a.number - b.number) }))
      .filter(gr => gr.list.length)
  }, [cards])

  const [g, setG] = useState(0)
  const [placed, setPlaced] = useState(() => new Set())
  const [flying, setFlying] = useState(null)   // carte en vol
  const [flash, setFlash] = useState(null)     // emplacement qui vient d'être rempli
  const [finished, setFinished] = useState(false)
  const slots = useRef(new Map())
  const flyer = useRef(null)
  const timers = useRef([])

  const group = groups[g]
  const pending = group?.list.find(c => !placed.has(c.id))

  useEffect(() => {
    const list = timers.current
    return () => list.forEach(clearTimeout)
  }, [])

  // Enchaînement : prochaine carte, puis série suivante, puis fin.
  useEffect(() => {
    if (!group || flying || finished) return
    if (pending) {
      const slot = slots.current.get(pending.id)
      slot?.scrollIntoView({ block: 'center', behavior: 'smooth' })
      const t = setTimeout(() => setFlying(pending), placed.size === 0 ? 700 : 380)
      return () => clearTimeout(t)
    }
    const t = setTimeout(() => {
      if (g + 1 < groups.length) setG(g + 1)
      else setFinished(true)
    }, 1100)
    return () => clearTimeout(t)
  }, [group, pending, flying, finished, g, groups.length, placed.size])

  // Vol : la carte part en grand au centre de l'écran et rejoint son emplacement.
  useLayoutEffect(() => {
    if (!flying) return
    const el = flyer.current
    const slot = slots.current.get(flying.id)
    if (!el || !slot) return
    const r = slot.getBoundingClientRect()
    const w = Math.min(FLY_WIDTH, window.innerWidth * 0.6)
    const h = w * 88 / 63
    const left = (window.innerWidth - w) / 2
    const top = (window.innerHeight - h) / 2
    Object.assign(el.style, { left: `${left}px`, top: `${top}px`, width: `${w}px` })
    const end = `translate(${r.left - left}px, ${r.top - top}px) scale(${r.width / w})`
    const anim = el.animate([
      { transform: 'translateY(40px) scale(.7) rotate(-6deg)', opacity: 0, offset: 0 },
      { transform: 'translateY(0) scale(1.04) rotate(0)', opacity: 1, offset: 0.22 },
      { transform: 'translateY(0) scale(1)', opacity: 1, offset: 0.45 },
      { transform: end, opacity: 1, offset: 1 },
    ], { duration: 1250, easing: 'cubic-bezier(.45, 0, .2, 1)', fill: 'forwards' })
    anim.onfinish = () => {
      setPlaced(p => new Set(p).add(flying.id))
      setFlash(flying.id)
      setFlying(null)
      timers.current.push(setTimeout(() => setFlash(f => (f === flying.id ? null : f)), 1200))
    }
    return () => { anim.onfinish = null; anim.cancel() }
  }, [flying])

  const skip = () => {
    timers.current.forEach(clearTimeout)
    onDone()
  }

  if (!group) return null

  const universeCards = CARDS.filter(c => c.u === group.u)
  const has = c => ownedBefore[c.id] || placed.has(c.id)
  const count = universeCards.filter(has).length
  const pct = Math.round((count / universeCards.length) * 100)

  return (
    <div className="register">
      <div className="register-head" key={group.u}>
        <p className="eyebrow">
          {groups.length > 1 ? `Série ${g + 1}/${groups.length} · ` : ''}Nouvelles cartes enregistrées
        </p>
        <h2>{UNIVERSES[group.u].name}</h2>
        <div className="register-count">
          <span className="register-num">{count}</span>
          <span className="register-total">/{universeCards.length}</span>
        </div>
        <div className="register-bar"><i style={{ width: `${pct}%` }} /></div>
      </div>

      <div className="dex-grid" key={`grid-${group.u}`}>
        {universeCards.map(c => (
          <div
            key={c.id}
            ref={el => { if (el) slots.current.set(c.id, el); else slots.current.delete(c.id) }}
            className={`dex-slot ${has(c) ? 'is-filled' : ''} ${flash === c.id ? 'just-placed' : ''} rarity-${c.rarity}`}
          >
            {has(c)
              ? <Card card={c} interactive={false} />
              : <span className="dex-num">{String(c.number).padStart(3, '0')}</span>}
          </div>
        ))}
      </div>

      <div className="register-actions">
        {finished
          ? <button className="btn primary" onClick={onDone}>Voir mon booster</button>
          : <button className="link-btn" onClick={skip}>Passer</button>}
      </div>

      {flying && createPortal(
        <div className="dex-flyer" ref={flyer} aria-hidden="true">
          <Card card={flying} interactive={false} />
        </div>,
        document.body,
      )}
    </div>
  )
}
