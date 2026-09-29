import { startTransition, useEffect, useLayoutEffect, useRef, useState } from 'react'
import Pack from './Pack.jsx'

const GAP = 1.08       // écart entre deux boosters, en largeur de booster
const OMEGA = 13       // raideur du ressort (rad/s) : arrêt en ~0,45 s
const MAX_DT = 1 / 30

const mod = (v, n) => ((v % n) + n) % n

// Moteur du carrousel : une position continue (0 = 1er booster au centre)
// que le doigt déplace 1:1. Au lâcher, un ressort à amortissement critique
// (calculé selon le temps écoulé, donc identique à 60 ou 120 Hz) fait
// coulisser la rangée jusqu'au booster visé, sans rebond ni à-coup.
// Tout est écrit directement en `transform`/opacité sur les emplacements :
// aucun rendu React pendant le mouvement, aucun booster reconstruit.
function createCarousel(n) {
  const slots = []
  let pos = 0
  let vel = 0      // en boosters par seconde
  let target = 0
  let raf = 0
  let last = 0

  const write = () => {
    for (let i = 0; i < n; i++) {
      const el = slots[i]
      if (!el) continue
      // écart signé le plus court (le carrousel boucle)
      let d = mod(i - pos, n)
      if (d > n / 2) d -= n
      const ad = Math.abs(d)
      const k = Math.min(ad, 1)
      el.style.transform = `translate3d(${(d * GAP * 100).toFixed(2)}%, ${(k * 4).toFixed(2)}%, 0) scale(${(1 - k * 0.14).toFixed(4)})`
      el.style.opacity = ad <= 1.2 ? '1' : Math.max(0, (1.5 - ad) / 0.3).toFixed(3)
      el.style.zIndex = String(10 - Math.round(ad * 4))
    }
  }

  const step = now => {
    const dt = Math.min(MAX_DT, (now - last) / 1000 || 1 / 60)
    last = now
    // amortissement critique : x'' = -ω²(x - cible) - 2ω x'
    const acc = -OMEGA * OMEGA * (pos - target) - 2 * OMEGA * vel
    vel += acc * dt
    pos += vel * dt
    if (Math.abs(vel) < 0.002 && Math.abs(target - pos) < 0.0005) {
      pos = target
      vel = 0
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
    // coulisse jusqu'à `p`, en partant de la vitesse `v` (boosters/s)
    go(p, v = vel) {
      target = p
      vel = v
      if (!raf) {
        last = performance.now()
        raf = requestAnimationFrame(step)
      }
    },
    write,
    destroy: () => cancelAnimationFrame(raf),
  }
}

// Carrousel : les boosters alignés sur un rail, le choisi au centre, ses
// voisins qui dépassent sur les bords.
// On le fait glisser au doigt ; toucher un côté l'amène au centre, toucher
// le centre ouvre le booster.
export default function PackCarousel({ packs: PACK_COVERS, current, onChange, onOpen, disabled }) {
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
    // mise à jour de l'écran (fond, boutons) en tâche de fond : elle ne
    // retient jamais la première image de la glissade
    if (cover !== current) startTransition(() => onChange(cover))
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
    // lâcher : un geste vif passe au suivant, sinon on revient au plus proche ;
    // la rangée repart avec l'élan du doigt
    const pv = -d.v * 1000 / d.span   // vitesse en boosters par seconde
    let p = Math.round(engine.pos + pv * 0.12)
    p = Math.max(Math.round(d.from) - 1, Math.min(Math.round(d.from) + 1, p))
    goTo(p, pv)
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
