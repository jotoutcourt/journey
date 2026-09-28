import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import Pack from './Pack.jsx'
import { PACK_COVERS } from '../lib/packs.js'

const GAP = 0.63        // écart entre deux boosters, en largeur de booster
const STIFFNESS = 0.14
const DAMPING = 0.72

const mod = (v, n) => ((v % n) + n) % n

// Moteur du carrousel : une position continue (0 = 1er booster au centre)
// que le doigt déplace 1:1, puis un ressort qui ramène sur un booster.
// Tout est écrit directement en `transform`/opacité sur les emplacements :
// aucun rendu React pendant le glissement, aucun booster reconstruit.
function createCarousel(n) {
  const slots = []
  let pos = 0
  let vel = 0
  let target = 0
  let raf = 0

  const write = () => {
    for (let i = 0; i < n; i++) {
      const el = slots[i]
      if (!el) continue
      // écart signé le plus court (le carrousel boucle)
      let d = mod(i - pos, n)
      if (d > n / 2) d -= n
      const ad = Math.abs(d)
      const k = Math.min(ad, 1)
      const side = Math.sign(d) * k
      el.style.transform = `translate3d(${(d * GAP * 100).toFixed(2)}%, 0, 0) rotateY(${(-side * 38).toFixed(2)}deg) scale(${(1 - k * 0.3).toFixed(4)})`
      el.style.opacity = ad <= 1 ? '1' : Math.max(0, (1.5 - ad) * 2).toFixed(3)
      el.style.zIndex = String(10 - Math.round(ad * 4))
    }
  }

  const step = () => {
    vel = (vel + (target - pos) * STIFFNESS) * DAMPING
    pos += vel
    if (Math.abs(vel) < 0.0005 && Math.abs(target - pos) < 0.0005) {
      pos = target
      raf = 0
    } else {
      raf = requestAnimationFrame(step)
    }
    write()
  }

  return {
    slots,
    get pos() { return pos },
    get target() { return target },
    // position posée directement (doigt) : le ressort est coupé
    set(p) {
      cancelAnimationFrame(raf)
      raf = 0
      pos = p
      target = p
      vel = 0
      write()
    },
    // glisse jusqu'à la position `p` avec le ressort
    go(p, v = 0) {
      target = p
      vel = v
      if (!raf) raf = requestAnimationFrame(step)
    },
    write,
    destroy: () => cancelAnimationFrame(raf),
  }
}

// Carrousel : le booster choisi au centre, les autres inclinés sur les côtés.
// On le fait glisser au doigt ; toucher un côté l'amène au centre, toucher
// le centre ouvre le booster.
export default function PackCarousel({ current, onChange, onOpen, disabled }) {
  const n = PACK_COVERS.length
  const [engine] = useState(() => createCarousel(n))
  const drag = useRef(null)
  const index = PACK_COVERS.indexOf(current)

  useLayoutEffect(() => {
    engine.set(index)
    return () => engine.destroy()
    // position de départ seulement : ensuite, c'est l'effet ci-dessous
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine])

  // Changement venu de l'extérieur (bouton « Autre booster ») : on y glisse
  // par le plus court chemin.
  useEffect(() => {
    const t = engine.target
    if (mod(Math.round(t), n) === index) return
    let delta = mod(index - Math.round(t), n)
    if (delta > n / 2) delta -= n
    engine.go(Math.round(t) + delta)
  }, [engine, index, n])

  const goTo = (p, v) => {
    engine.go(p, v)
    const cover = PACK_COVERS[mod(p, n)]
    if (cover !== current) onChange(cover)
  }

  const down = e => {
    if (e.button > 0) return
    e.currentTarget.setPointerCapture(e.pointerId)
    const w = engine.slots[0]?.offsetWidth || 200
    drag.current = { x: e.clientX, from: engine.pos, span: w * GAP, moved: false, lx: e.clientX, lt: performance.now(), v: 0, slot: e.target.closest('[data-i]') }
  }
  const move = e => {
    const d = drag.current
    if (!d) return
    const dx = e.clientX - d.x
    if (!d.moved && Math.abs(dx) > 6) d.moved = true
    if (!d.moved) return
    const now = performance.now()
    d.v = (e.clientX - d.lx) / Math.max(1, now - d.lt)  // px/ms
    d.lx = e.clientX
    d.lt = now
    engine.set(d.from - dx / d.span)
  }
  const up = () => {
    const d = drag.current
    drag.current = null
    if (!d) return
    if (!d.moved) {
      // simple toucher
      const i = d.slot ? Number(d.slot.dataset.i) : -1
      if (i < 0) return
      if (i === mod(Math.round(engine.target), n)) onOpen()
      else {
        let delta = mod(i - Math.round(engine.pos), n)
        if (delta > n / 2) delta -= n
        goTo(Math.round(engine.pos) + delta)
      }
      return
    }
    // lâcher : un geste vif passe au suivant, sinon on revient au plus proche
    const pv = -d.v * 1000 / d.span / 60   // vitesse en boosters par image
    let p = Math.round(engine.pos + pv * 6)
    p = Math.max(Math.round(d.from) - 1, Math.min(Math.round(d.from) + 1, p))
    goTo(p, pv * 0.6)
  }

  return (
    <div
      className="carousel"
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}
    >
      {PACK_COVERS.map((cover, i) => (
        <div
          key={cover.id}
          data-i={i}
          ref={el => { engine.slots[i] = el }}
          className="car-slot"
          role="button"
          tabIndex={0}
          aria-label={i === index ? `Ouvrir le booster ${cover.universe.name}` : `Booster ${cover.universe.name}`}
          onKeyDown={e => {
            if (e.key !== 'Enter' && e.key !== ' ') return
            e.preventDefault()
            if (i === index) onOpen()
            else onChange(cover)
          }}
        >
          <Pack cover={cover} disabled={i === index && disabled} />
        </div>
      ))}
    </div>
  )
}
