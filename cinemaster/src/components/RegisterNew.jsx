import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Card from './Card.jsx'
import { CARDS, UNIVERSES } from '../data/cards.js'
import './register.css'

const FLY_WIDTH = 190      // taille de départ de la carte en vol (px)
const FLIGHT_MS = 560      // durée d'un vol
const STAGGER_MS = 170     // décalage entre deux départs : les vols se chevauchent
const START_MS = 220       // pause avant le premier départ d'une série
const NEXT_GROUP_MS = 420  // pause avant la série suivante

// Une carte en vol : elle apparaît au centre, puis file vers son emplacement.
// Animation Web Animations (transform + opacité uniquement) : aucune repeinte.
function Flight({ card, getSlot, onLanded }) {
  const ref = useRef(null)

  useLayoutEffect(() => {
    const el = ref.current
    const slot = getSlot()
    if (!el || !slot) { onLanded(); return }
    const r = slot.getBoundingClientRect()
    const w = Math.min(FLY_WIDTH, window.innerWidth * 0.5)
    const h = w * 88 / 63
    const left = (window.innerWidth - w) / 2
    const top = (window.innerHeight - h) / 2
    Object.assign(el.style, { left: `${left}px`, top: `${top}px`, width: `${w}px` })
    const end = `translate3d(${r.left - left}px, ${r.top - top}px, 0) scale(${r.width / w})`
    const anim = el.animate([
      { transform: 'translate3d(0, 30px, 0) scale(.82)', opacity: 0, offset: 0 },
      { transform: 'translate3d(0, 0, 0) scale(1)', opacity: 1, offset: 0.2 },
      { transform: end, opacity: 1, offset: 1 },
    ], { duration: FLIGHT_MS, easing: 'cubic-bezier(.3, .7, .2, 1)', fill: 'forwards' })
    anim.onfinish = onLanded
    return () => { anim.onfinish = null; anim.cancel() }
    // un vol ne se relance jamais : dépendances volontairement vides
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return createPortal(
    <div className="dex-flyer" ref={ref} aria-hidden="true">
      <Card card={card} interactive={false} />
    </div>,
    document.body,
  )
}

// Après l'ouverture : les nouvelles cartes s'envolent en rafale vers leurs
// emplacements dans la grille de leur série, qui se complète sous les yeux du joueur.
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
  const [flights, setFlights] = useState([])       // cartes actuellement en vol
  const [flash, setFlash] = useState(() => new Set()) // emplacements qui viennent d'être remplis
  const [finished, setFinished] = useState(false)
  const slots = useRef(new Map())
  const timers = useRef([])

  const group = groups[g]
  const later = (fn, ms) => timers.current.push(setTimeout(fn, ms))

  useEffect(() => {
    const list = timers.current
    return () => list.forEach(clearTimeout)
  }, [])

  // Lance toute la série en rafale : un départ toutes les STAGGER_MS.
  useEffect(() => {
    if (!group) return
    const first = slots.current.get(group.list[0].id)
    first?.scrollIntoView({ block: 'center', behavior: 'smooth' })
    const ids = []
    group.list.forEach((card, i) => {
      ids.push(setTimeout(() => {
        const slot = slots.current.get(card.id)
        // emplacement hors de l'écran : on le ramène doucement dans le champ
        const r = slot?.getBoundingClientRect()
        if (r && (r.top < 60 || r.bottom > window.innerHeight - 60)) {
          slot.scrollIntoView({ block: 'center', behavior: 'smooth' })
        }
        setFlights(f => [...f, card])
      }, START_MS + i * STAGGER_MS))
    })
    return () => ids.forEach(clearTimeout)
  }, [group])

  const landed = card => {
    setFlights(f => f.filter(c => c.id !== card.id))
    setPlaced(p => new Set(p).add(card.id))
    setFlash(s => new Set(s).add(card.id))
    later(() => setFlash(s => { const n = new Set(s); n.delete(card.id); return n }), 900)
  }

  // Série complète : série suivante, ou fin.
  const groupDone = group && group.list.every(c => placed.has(c.id))
  useEffect(() => {
    if (!groupDone) return
    const t = setTimeout(() => {
      if (g + 1 < groups.length) setG(g + 1)
      else setFinished(true)
    }, NEXT_GROUP_MS)
    return () => clearTimeout(t)
  }, [groupDone, g, groups.length])

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
          <span className="register-num" key={count}>{count}</span>
          <span className="register-total">/{universeCards.length}</span>
        </div>
        <div className="register-bar"><i style={{ width: `${pct}%` }} /></div>
      </div>

      <div className="dex-grid" key={`grid-${group.u}`}>
        {universeCards.map(c => (
          <div
            key={c.id}
            ref={el => { if (el) slots.current.set(c.id, el); else slots.current.delete(c.id) }}
            className={`dex-slot ${has(c) ? 'is-filled' : ''} ${flash.has(c.id) ? 'just-placed' : ''} rarity-${c.rarity}`}
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

      {flights.map(card => (
        <Flight key={card.id} card={card} getSlot={() => slots.current.get(card.id)} onLanded={() => landed(card)} />
      ))}
    </div>
  )
}
