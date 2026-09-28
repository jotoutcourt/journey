// Inclinaison 3D amortie par ressort : la carte suit le pointeur avec inertie
// puis revient doucement au repos.
//
// Performance : tout est écrit directement sur les quelques éléments qui
// bougent, en `transform` et en opacité — la carte graphique s'en charge,
// rien n'est redessiné et aucun style n'est recalculé sur le reste de la carte :
// - l'élément incliné (1er enfant) reçoit sa rotation ;
// - chaque feuille de reflet (.sheet) glisse selon son coefficient --kx/--ky
//   (lu une seule fois dans le CSS) ;
// - chaque calque [data-o] reçoit l'intensité --o (il en tire son opacité).
import { useEffect, useState } from 'react'
import { subscribeMotion } from './motion.js'

const STIFFNESS = 0.08
const DAMPING = 0.8
const REST = { x: 0.5, y: 0.5, o: 0 }
const reduceMotion = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches

function createTilt({ maxTilt, scale, touch }) {
  let el = null
  let inner = null
  let sheets = []   // { node, kx, ky } : feuilles de reflet
  let faders = []   // calques dont l'opacité dépend de l'intensité
  let raf = 0
  const cur = { ...REST }
  const vel = { x: 0, y: 0, o: 0 }
  let target = { ...REST }
  let finger = false     // un doigt pilote la carte : le gyroscope attend
  let unsubscribe = null

  const write = () => {
    const { x, y, o } = cur
    const px = x - 0.5
    const py = y - 0.5
    for (const s of sheets) {
      s.node.style.transform = `translate3d(${(px * s.kx).toFixed(2)}%, ${(py * s.ky).toFixed(2)}%, 0)`
    }
    const ov = o.toFixed(3)
    for (const f of faders) f.style.setProperty('--o', ov)
    if (inner && !reduceMotion) {
      const rx = (0.5 - y) * maxTilt
      const ry = (x - 0.5) * maxTilt * 1.15
      inner.style.transform = `rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) scale(${(1 + o * scale).toFixed(4)})`
    }
  }

  const step = () => {
    if (!el) { raf = 0; return }
    let moving = false
    for (const k of ['x', 'y', 'o']) {
      vel[k] = (vel[k] + (target[k] - cur[k]) * STIFFNESS) * DAMPING
      cur[k] += vel[k]
      if (Math.abs(vel[k]) > 0.0005 || Math.abs(target[k] - cur[k]) > 0.0005) moving = true
    }
    write()
    if (moving) {
      raf = requestAnimationFrame(step)
    } else {
      raf = 0
      if (target.o === 0) {
        el.classList.remove('is-active')
        if (inner) inner.style.transform = ''
      }
    }
  }

  const kick = () => { if (!raf) raf = requestAnimationFrame(step) }

  const activate = () => {
    if (el.classList.contains('is-active')) return
    // les feuilles et leurs coefficients sont relevés une fois par activation
    sheets = [...el.querySelectorAll('.sheet')].map(node => {
      const cs = getComputedStyle(node)
      return { node, kx: parseFloat(cs.getPropertyValue('--kx')) || 0, ky: parseFloat(cs.getPropertyValue('--ky')) || 0 }
    })
    faders = [...el.querySelectorAll('[data-o]')]
    el.classList.add('is-active')
  }

  const leave = () => {
    finger = false
    target = { ...REST }
    kick()
  }

  // Téléphone penché : les reflets suivent l'appareil. Plus on penche, plus
  // l'éclat est franc ; à plat, il reste un léger reflet.
  const onMotion = (x, y) => {
    if (!el || finger) return
    const d = Math.hypot(x - 0.5, y - 0.5)
    target = { x, y, o: Math.min(1, 0.45 + d * 2.2) }
    activate()
    kick()
  }

  return {
    attach: node => {
      unsubscribe?.()
      unsubscribe = null
      el = node
      if (node && touch) unsubscribe = subscribeMotion(onMotion)
      inner = node?.firstElementChild ?? null
      sheets = []
      faders = []
    },
    move: e => {
      if (!el) return
      // au doigt, seules les cartes prévues pour (grande carte, ouverture)
      // s'inclinent : dans les grilles, le doigt sert à faire défiler
      if (e.pointerType === 'touch' && !touch) return
      if (e.pointerType === 'touch') finger = true
      const r = el.getBoundingClientRect()
      target = {
        x: Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)),
        y: Math.min(1, Math.max(0, (e.clientY - r.top) / r.height)),
        o: 1,
      }
      activate()
      kick()
    },
    leave,
    // Au doigt, la carte revient au repos quand on relâche ; à la souris, elle
    // reste orientée tant que le curseur la survole.
    up: e => { if (e.pointerType !== 'mouse') leave() },
    destroy: () => cancelAnimationFrame(raf),
  }
}

export function useTilt({ maxTilt = 16, scale = 0.035, touch = false } = {}) {
  const [tilt] = useState(() => createTilt({ maxTilt, scale, touch }))
  useEffect(() => () => tilt.destroy(), [tilt])
  return tilt
}
