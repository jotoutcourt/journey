// Musique d'ambiance des menus et de l'accueil (coupée pendant les parties).
// - Le fichier est téléchargé dès l'écran de chargement (puis gardé en cache par l'appli).
// - Elle démarre en fondu dès que le téléphone l'autorise : tout de suite quand c'est permis,
//   sinon au tout premier toucher (iPhone : le son n'est jamais permis avant un geste).
// - Le son passe par Web Audio pour que le volume soit respecté sur iPhone.
import { audioFor } from './sound.js'

// Deux pistes : les menus, et la Chasse au Kraken (jeu de plateau, volume bas pour laisser passer le vocal)
const TRACKS = { menu: { file: '/musique/menu.mp3', vol: 0.28 }, traque: { file: '/musique/kraken-plateau.mp3', vol: 0.04 } }
let track = 'menu', cur = null // piste voulue / piste chargée dans le lecteur
const blobs = {}
const VOL_OF = () => TRACKS[track].vol
let el = null, gain = null, want = false, stopTimer = null

// Téléchargement en entier (lecture fluide et mise en cache) ; la piste des menus dès l'écran de chargement
function load(t = 'menu') {
  blobs[t] = blobs[t] || fetch(TRACKS[t].file).then(r => (r.ok ? r.blob() : Promise.reject(new Error('musique')))).then(b => URL.createObjectURL(b)).catch(() => TRACKS[t].file)
  return blobs[t]
}
const ready = {} // adresses déjà téléchargées (blob), par piste
const urlOf = (t) => ready[t] || TRACKS[t].file

// Son d'« ambiance » (Safari 17+) : ne coupe pas la musique du joueur (Spotify…), respecte le mode silencieux
// et n'apparaît pas comme un lecteur sur l'écran verrouillé
// (seulement dans les menus : pendant une partie on revient au réglage normal, pour le micro du chat vocal)
const session = (type) => { try { if (navigator.audioSession) navigator.audioSession.type = type } catch { /* rien */ } }

// En arrière-plan : on détache complètement le son, pour que le téléphone n'affiche plus de lecteur
function detach() {
  if (!el) return
  el.pause()
  if (el.getAttribute('src')) { el.removeAttribute('src'); el.load(); cur = null }
  try { if (navigator.mediaSession) { navigator.mediaSession.metadata = null; navigator.mediaSession.playbackState = 'none' } } catch { /* rien */ }
}

function element() {
  if (!el) {
    el = new Audio(); el.loop = true; el.preload = 'auto'
    // si le fichier complet arrive avant que la musique ait démarré, on le prend (lecture plus fluide)
    load('menu').then(u => { ready.menu = u; if (!el.getAttribute('src') && track === 'menu' && !document.hidden) { el.src = u; cur = 'menu' } if (want && el.paused) start() })
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
  if (!gain) { if (el) el.volume = Math.min(1, to / 0.28); return }
  const ctx = gain.context, now = ctx.currentTime
  gain.gain.cancelScheduledValues(now); gain.gain.setValueAtTime(gain.gain.value, now); gain.gain.linearRampToValueAtTime(to, now + secs)
}

function start() {
  if (!want || document.hidden) return
  element()
  // fichier pas encore téléchargé : on le lit directement depuis le serveur, sans attendre
  // (indispensable sur iPhone : la lecture doit démarrer pendant le geste du joueur)
  if (!el.getAttribute('src') || cur !== track) { el.src = urlOf(track); cur = track }
  route()
  clearTimeout(stopTimer)
  if (!el.paused) { fade(VOL_OF(), 1.5); return }
  if (gain) gain.gain.value = 0; else el.volume = 0
  el.play().then(() => fade(VOL_OF(), 1.2)).catch(() => { /* lecture bloquée : on réessaie au premier toucher */ })
}
function stop() {
  if (!el) return
  fade(0, 0.8)
  clearTimeout(stopTimer)
  stopTimer = setTimeout(() => el.pause(), 900)
}

export function setMenuMusic(on, t = 'menu') {
  if (on === want && t === track) return
  const switching = t !== track && el && !el.paused
  track = t; want = on
  // dans les menus, son « d'ambiance » ; sur le plateau, réglage normal (le micro du vocal doit marcher)
  session(on && t === 'menu' ? 'ambient' : 'auto')
  if (on && t !== 'menu') load(t).then(u => { ready[t] = u })
  if (!on) { stop(); return }
  if (switching) {
    // fondu, puis changement de piste
    fade(0, 0.6); clearTimeout(stopTimer)
    stopTimer = setTimeout(() => { el.pause(); cur = null; start() }, 650)
  } else start()
}

if (typeof document !== 'undefined') {
  element() // dès le chargement de l'appli
  const kick = () => { if (want && (!el || el.paused || (gain && gain.context.state !== 'running'))) start() }
  // le tout premier geste (même pendant l'écran de chargement) suffit à lancer la musique
  for (const ev of ['pointerdown', 'touchstart', 'keydown']) document.addEventListener(ev, kick, { capture: true, passive: true })
  document.addEventListener('visibilitychange', () => { if (document.hidden) detach(); else if (want) start() })
  window.addEventListener('pagehide', detach)
}
