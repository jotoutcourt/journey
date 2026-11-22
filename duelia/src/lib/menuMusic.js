// Musique d'ambiance des menus et de l'accueil (coupée pendant les parties).
// Le son passe par Web Audio pour que le volume soit respecté sur iPhone.
import { audioFor } from './sound.js'

const VOL = 0.28
let el = null, gain = null, want = false, stopTimer = null

function setup() {
  if (!el) { el = new Audio('/musique/menu.mp3'); el.loop = true; el.preload = 'auto'; el.volume = 1 }
  if (!gain) {
    const ctx = audioFor()
    if (!ctx) return null
    try { gain = ctx.createGain(); gain.gain.value = 0; ctx.createMediaElementSource(el).connect(gain).connect(ctx.destination) } catch { gain = null }
  }
  return el
}

function fade(to) {
  if (!gain) { if (el) el.volume = Math.min(1, to / VOL); return }
  const ctx = gain.context, now = ctx.currentTime
  gain.gain.cancelScheduledValues(now); gain.gain.setValueAtTime(gain.gain.value, now); gain.gain.linearRampToValueAtTime(to, now + (to ? 2.5 : 0.8))
}

function start() {
  if (!want || document.hidden) return
  if (!setup()) return
  clearTimeout(stopTimer)
  el.play().then(() => fade(VOL)).catch(() => { /* lecture bloquée : on réessaiera au prochain toucher */ })
}
function stop() {
  if (!el) return
  fade(0)
  clearTimeout(stopTimer)
  stopTimer = setTimeout(() => el.pause(), 900)
}

export function setMenuMusic(on) {
  if (on === want) return
  want = on
  on ? start() : stop()
}

if (typeof document !== 'undefined') {
  // iPhone : la lecture n'est permise qu'après un geste du joueur
  document.addEventListener('pointerdown', () => { if (want && (!el || el.paused)) start() }, true)
  document.addEventListener('visibilitychange', () => { if (document.hidden) { if (el) el.pause() } else if (want) start() })
}
