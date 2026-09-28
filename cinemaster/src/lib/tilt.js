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
  // `touch` peut changer ensuite (carte qui devient la carte du dessus)
  let el = null
  let inner = null
  let sheets = []   // { node, kx, ky } : feuilles de reflet
  let faders = []   // calques dont l'opacité dépend de l'intensité
  let raf = 0
  const cur = { ...REST }
  const vel = { x: 0, y: 0, o: 0 }
  let target = { ...REST }
  let finger = false     // un doigt pilote la carte : le gyroscope attend
  let sweepTimer = 0
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

  // Seules les cartes « au doigt » actives écoutent le gyroscope.
  const syncMotion = () => {
    const want = !!el && touch
    if (want && !unsubscribe) unsubscribe = subscribeMotion(onMotion)
    else if (!want && unsubscribe) { unsubscribe(); unsubscribe = null }
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
      if (!node) clearTimeout(sweepTimer)
      el = node
      syncMotion()
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
      clearTimeout(sweepTimer)
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
    // Démonstration : la carte s'incline d'elle-même une fois, pour faire
    // courir la lumière sur son effet (carte brillante qu'on découvre).
    // Le ressort lisse le trajet entre les points ; le doigt l'interrompt.
    sweep: (delay = 0) => {
      if (reduceMotion) return
      clearTimeout(sweepTimer)
      const path = [[0.12, 0.18], [0.88, 0.3], [0.78, 0.86], [0.22, 0.7], [0.5, 0.45]]
      let i = 0
      const next = () => {
        if (!el || finger) return
        if (i === path.length) { leave(); return }
        const [x, y] = path[i++]
        target = { x, y, o: 1 }
        activate()
        kick()
        sweepTimer = setTimeout(next, 240)
      }
      sweepTimer = setTimeout(next, delay)
    },
    setTouch: v => {
      if (touch === v) return
      touch = v
      syncMotion()
      if (!v) leave()
    },
    // Au doigt, la carte revient au repos quand on relâche ; à la souris, elle
    // reste orientée tant que le curseur la survole.
    up: e => { if (e.pointerType !== 'mouse') leave() },
    destroy: () => { cancelAnimationFrame(raf); clearTimeout(sweepTimer) },
  }
}

export function useTilt({ maxTilt = 16, scale = 0.035, touch = false } = {}) {
  const [tilt] = useState(() => createTilt({ maxTilt, scale, touch }))
  useEffect(() => { tilt.setTouch(touch) }, [tilt, touch])
  useEffect(() => () => tilt.destroy(), [tilt])
  return tilt
}
