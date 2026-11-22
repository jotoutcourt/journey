// Musique d'ambiance des menus et de l'accueil (coupée pendant les parties).
// - Le fichier est téléchargé dès l'écran de chargement (puis gardé en cache par l'appli).
// - Elle démarre en fondu dès que le téléphone l'autorise : tout de suite quand c'est permis,
//   sinon au tout premier toucher (iPhone : le son n'est jamais permis avant un geste).
// - Le son passe par Web Audio pour que le volume soit respecté sur iPhone.
import { audioFor } from './sound.js'

const FILE = '/musique/menu.mp3'
const VOL = 0.28
let el = null, gain = null, want = false, stopTimer = null, src = null

// Téléchargement immédiat (pendant l'écran de chargement), en entier : lecture fluide et mise en cache
function load() {
  src = src || fetch(FILE).then(r => (r.ok ? r.blob() : Promise.reject(new Error('musique')))).then(b => URL.createObjectURL(b)).catch(() => FILE)
  return src
}

function element() {
  if (!el) {
    el = new Audio(); el.loop = true; el.preload = 'auto'
    load().then(u => { el.src = u; if (want) start() })
  }
  return el
}

function route() {
  if (gain) return
  const ctx = audioFor()
  if (!ctx) return
  try { gain = ctx.createGain(); gain.gain.value = 0; ctx.createMediaElementSource(el).connect(gain).connect(ctx.destination) } catch { gain = null }
}

function fade(to, secs) {
  if (!gain) { if (el) el.volume = Math.min(1, to / VOL); return }
  const ctx = gain.context, now = ctx.currentTime
  gain.gain.cancelScheduledValues(now); gain.gain.setValueAtTime(gain.gain.value, now); gain.gain.linearRampToValueAtTime(to, now + secs)
}

function start() {
  if (!want || document.hidden) return
  element()
  if (!el.src) return // le fichier arrive : on relancera dès qu'il est là
  route()
  clearTimeout(stopTimer)
  if (!el.paused) { fade(VOL, 1.5); return }
  if (gain) gain.gain.value = 0; else el.volume = 0
  el.play().then(() => fade(VOL, 2.2)).catch(() => { /* lecture bloquée : on réessaie au premier toucher */ })
}
function stop() {
  if (!el) return
  fade(0, 0.8)
  clearTimeout(stopTimer)
  stopTimer = setTimeout(() => el.pause(), 900)
}

export function setMenuMusic(on) {
  if (on === want) return
  want = on
  on ? start() : stop()
}

if (typeof document !== 'undefined') {
  element() // dès le chargement de l'appli
  const kick = () => { if (want && (!el || el.paused || (gain && gain.context.state !== 'running'))) start() }
  // le tout premier geste (même pendant l'écran de chargement) suffit à lancer la musique
  for (const ev of ['pointerdown', 'touchstart', 'keydown']) document.addEventListener(ev, kick, { capture: true, passive: true })
  document.addEventListener('visibilitychange', () => { if (document.hidden) { if (el) el.pause() } else if (want) start() })
}
