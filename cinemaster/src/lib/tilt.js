// Inclinaison 3D amortie par ressort : la carte suit le pointeur avec inertie
// puis revient doucement au repos. Les valeurs sont écrites en variables CSS
// directement sur l'élément (aucun re-render React pendant l'animation).
import { useEffect, useState } from 'react'

const STIFFNESS = 0.075
const DAMPING = 0.78
const REST = { x: 0.5, y: 0.5, o: 0 }

function createTilt(maxTilt) {
  let el = null
  let raf = 0
  const cur = { ...REST }
  const vel = { x: 0, y: 0, o: 0 }
  let target = { ...REST }

  const write = () => {
    const { x, y, o } = cur
    const st = el.style
    st.setProperty('--mx', `${(x * 100).toFixed(2)}%`)
    st.setProperty('--my', `${(y * 100).toFixed(2)}%`)
    st.setProperty('--bgx', `${(35 + x * 30).toFixed(2)}%`)
    st.setProperty('--bgy', `${(30 + y * 40).toFixed(2)}%`)
    st.setProperty('--rx', `${((0.5 - y) * maxTilt).toFixed(2)}deg`)
    st.setProperty('--ry', `${((x - 0.5) * maxTilt * 1.15).toFixed(2)}deg`)
    st.setProperty('--hyp', Math.min(1, Math.hypot(x - 0.5, y - 0.5) * 2).toFixed(3))
    st.setProperty('--o', o.toFixed(3))
  }

  const step = () => {
    if (!el) { raf = 0; return }
    let moving = false
    for (const k of ['x', 'y', 'o']) {
      vel[k] = (vel[k] + (target[k] - cur[k]) * STIFFNESS) * DAMPING
      cur[k] += vel[k]
      if (Math.abs(vel[k]) > 0.0004 || Math.abs(target[k] - cur[k]) > 0.0004) moving = true
    }
    write()
    if (moving) {
      raf = requestAnimationFrame(step)
    } else {
      raf = 0
      if (target.o === 0) el.classList.remove('is-active')
    }
  }

  const kick = () => { if (!raf) raf = requestAnimationFrame(step) }

  const leave = () => {
    target = { ...REST }
    kick()
  }

  return {
    attach: node => { el = node },
    move: e => {
      if (!el) return
      const r = el.getBoundingClientRect()
      target = {
        x: Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)),
        y: Math.min(1, Math.max(0, (e.clientY - r.top) / r.height)),
        o: 1,
      }
      el.classList.add('is-active')
      kick()
    },
    leave,
    // Au doigt, la carte revient au repos quand on relâche ; à la souris, elle
    // reste orientée tant que le curseur la survole.
    up: e => { if (e.pointerType !== 'mouse') leave() },
    destroy: () => cancelAnimationFrame(raf),
  }
}

export function useTilt({ maxTilt = 16 } = {}) {
  const [tilt] = useState(() => createTilt(maxTilt))
  useEffect(() => () => tilt.destroy(), [tilt])
  return tilt
}
