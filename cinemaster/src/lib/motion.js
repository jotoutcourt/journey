// Gyroscope du téléphone : l'inclinaison de l'appareil oriente les reflets des
// cartes, comme une vraie carte holo qu'on penche sous la lumière.
//
// Un seul écouteur pour toute l'appli ; chaque carte abonnée reçoit une
// position (x, y entre 0 et 1, 0.5 = à plat). La position « neutre » suit
// lentement la façon dont on tient le téléphone : seul le mouvement compte.
// Sur iPhone, l'accès aux capteurs se demande au premier toucher de l'écran.

const RANGE = 22       // degrés d'inclinaison pour aller d'un bord à l'autre
const SMOOTH = 0.25    // lissage du capteur (0 = figé, 1 = brut)
const DRIFT = 0.012    // vitesse à laquelle la position neutre rattrape la main

const subs = new Set()
let started = false
let base = null
const pos = { x: 0.5, y: 0.5 }

const clamp = v => Math.min(1, Math.max(0, v))

function screenAngle() {
  const a = screen.orientation?.angle ?? window.orientation ?? 0
  return ((a % 360) + 360) % 360
}

function onOrientation(e) {
  if (e.beta == null || e.gamma == null) return
  // gauche/droite et avant/arrière selon l'orientation de l'écran
  let h = e.gamma
  let v = e.beta
  const a = screenAngle()
  if (a === 90) { h = e.beta; v = -e.gamma }
  else if (a === 270) { h = -e.beta; v = e.gamma }
  else if (a === 180) { h = -e.gamma; v = -e.beta }

  if (!base) base = { h, v }
  base.h += (h - base.h) * DRIFT
  base.v += (v - base.v) * DRIFT

  const tx = clamp(0.5 + (h - base.h) / (RANGE * 2))
  const ty = clamp(0.5 + (v - base.v) / (RANGE * 2))
  pos.x += (tx - pos.x) * SMOOTH
  pos.y += (ty - pos.y) * SMOOTH
  for (const fn of subs) fn(pos.x, pos.y)
}

function listen() {
  window.addEventListener('deviceorientation', onOrientation)
}

function start() {
  if (started || typeof window === 'undefined' || !('DeviceOrientationEvent' in window)) return
  // uniquement sur les écrans tactiles : pas de gyroscope utile sur ordinateur
  if (!matchMedia('(pointer: coarse)').matches) return
  started = true
  const ask = DeviceOrientationEvent.requestPermission
  if (typeof ask !== 'function') { listen(); return }
  // iOS : la demande doit partir d'un vrai toucher (pas de la fin d'un
  // défilement, que l'iPhone refuse). Tant qu'elle n'a pas abouti, on la
  // refait au toucher suivant.
  let asking = false
  let done = false
  const stop = () => {
    done = true
    window.removeEventListener('touchend', onTap, true)
    window.removeEventListener('click', onTap, true)
  }
  const onTap = () => {
    if (asking || done) return
    asking = true
    ask.call(DeviceOrientationEvent)
      .then(r => {
        if (r === 'granted') listen()
        stop()                    // accordé ou refusé : c'est tranché
      })
      .catch(() => {})            // geste non retenu : on réessaiera
      .finally(() => { asking = false })
  }
  window.addEventListener('touchend', onTap, true)
  window.addEventListener('click', onTap, true)
}

export function subscribeMotion(fn) {
  start()
  subs.add(fn)
  return () => subs.delete(fn)
}
