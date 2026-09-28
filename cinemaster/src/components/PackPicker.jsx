import { useEffect, useRef, useState } from 'react'
import Pack from './Pack.jsx'
import './picker.css'

const COUNT = 8
const STEP = 360 / COUNT
const AUTO_SPEED = 9      // degrés par seconde quand personne ne touche
const DRAG_RATIO = 0.32   // degrés par pixel glissé
const FRICTION = 0.94

// Plusieurs exemplaires du booster tournent en cercle : on fait tourner le
// cercle en glissant, puis on touche celui qu'on veut ouvrir.
export default function PackPicker({ cover, onPick }) {
  const ring = useRef(null)
  const items = useRef([])
  const motion = useRef({ angle: 0, vel: 0, dragging: false, moved: 0, lastX: 0, lastT: 0, target: null })
  const [chosen, setChosen] = useState(null)

  useEffect(() => {
    let raf = 0
    let prev = performance.now()
    const tick = now => {
      const m = motion.current
      const dt = Math.min(0.05, (now - prev) / 1000)
      prev = now
      if (m.target !== null) {
        // le booster choisi revient face à nous
        m.angle += (m.target - m.angle) * 0.12
      } else if (!m.dragging) {
        m.vel *= FRICTION
        m.angle += m.vel + (Math.abs(m.vel) < 0.2 ? AUTO_SPEED * dt : 0)
      }
      const el = ring.current
      if (el) {
        const radius = el.offsetWidth * 1.4
        el.style.transform = `translateZ(${-radius}px) rotateY(${m.angle}deg)`
        items.current.forEach((it, i) => {
          if (!it) return
          it.style.transform = `rotateY(${i * STEP}deg) translateZ(${radius}px)`
          // les boosters de derrière s'estompent
          const rel = ((((i * STEP + m.angle) % 360) + 540) % 360) - 180
          const front = Math.cos((rel * Math.PI) / 180)
          // les boosters de dos (moitié arrière du cercle) sont masqués
          it.style.opacity = front < -0.05 ? '0' : String(0.45 + 0.55 * front)
          it.style.pointerEvents = front < 0.3 ? 'none' : 'auto'
          it.style.zIndex = String(Math.round(front * 100) + 100)
        })
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  const down = e => {
    if (chosen !== null) return
    const m = motion.current
    m.dragging = true
    m.moved = 0
    m.lastX = e.clientX
    m.lastT = performance.now()
    m.vel = 0
    const move = ev => {
      const dx = ev.clientX - m.lastX
      const now = performance.now()
      m.angle += dx * DRAG_RATIO
      m.vel = (dx * DRAG_RATIO) * Math.min(1, 16 / Math.max(1, now - m.lastT))
      m.moved += Math.abs(dx)
      m.lastX = ev.clientX
      m.lastT = now
    }
    const up = () => {
      m.dragging = false
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)
  }

  const pick = i => {
    const m = motion.current
    if (chosen !== null || m.moved > 8) return
    // angle le plus proche qui amène ce booster face à nous
    const base = -i * STEP
    m.target = base + Math.round((m.angle - base) / 360) * 360
    m.vel = 0
    setChosen(i)
    setTimeout(onPick, 900)
  }

  return (
    <div className={`picker ${chosen !== null ? 'has-chosen' : ''}`}>
      <p className="picker-title">Touche le booster que tu veux ouvrir</p>
      <div className="picker-stage" onPointerDown={down}>
        <div className="picker-ring" ref={ring}>
          {Array.from({ length: COUNT }, (_, i) => (
            <button
              key={i}
              ref={el => { items.current[i] = el }}
              className={`picker-item ${chosen === i ? 'is-chosen' : ''}`}
              onClick={() => pick(i)}
              aria-label={`Booster ${i + 1}`}
            >
              <Pack cover={cover} />
            </button>
          ))}
        </div>
      </div>
      <p className="hint">Glisse pour faire tourner</p>
    </div>
  )
}
