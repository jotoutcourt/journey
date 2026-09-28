// Sons et vibrations du jeu.
// Les sons sont synthétisés à la volée (Web Audio) : aucun fichier à charger,
// ça marche hors connexion. Vibrations : API du téléphone quand elle existe
// (Android) ; sur iPhone, l'astuce de l'interrupteur système (iOS 18+), qui ne
// fonctionne qu'en réponse directe à un geste.
import { useSyncExternalStore } from 'react'

const KEY = 'popcard:fx'
const listeners = new Set()
let settings = { sound: true, haptics: true }
try { settings = { ...settings, ...JSON.parse(localStorage.getItem(KEY) || '{}') } } catch { /* défaut */ }

export function setFeedback(patch) {
  settings = { ...settings, ...patch }
  try { localStorage.setItem(KEY, JSON.stringify(settings)) } catch { /* ignore */ }
  listeners.forEach(fn => fn())
}
export function useFeedbackSettings() {
  return useSyncExternalStore(fn => { listeners.add(fn); return () => listeners.delete(fn) }, () => settings)
}

// ─── Audio ────────────────────────────────────────────────────────────────
let ctx = null
let noiseBuf = null
function audio() {
  if (!settings.sound) return null
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return null
    ctx = new AC()
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate)
    const d = noiseBuf.getChannelData(0)
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
  }
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}
// iOS n'autorise le son qu'après un geste : on réveille l'audio au 1er toucher.
if (typeof window !== 'undefined') {
  const unlock = () => { if (settings.sound) audio(); window.removeEventListener('pointerdown', unlock, true) }
  window.addEventListener('pointerdown', unlock, true)
}

// Souffle filtré (papier, glissé) : fréquence qui balaie de f0 à f1
function noise(a, { dur, f0, f1, q = 1, gain = 0.3, type = 'bandpass', at = 0 }) {
  const t = a.currentTime + at
  const src = a.createBufferSource()
  src.buffer = noiseBuf
  const filter = a.createBiquadFilter()
  filter.type = type
  filter.Q.value = q
  filter.frequency.setValueAtTime(f0, t)
  filter.frequency.exponentialRampToValueAtTime(f1, t + dur)
  const g = a.createGain()
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(gain, t + Math.min(0.03, dur / 4))
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  src.connect(filter).connect(g).connect(a.destination)
  src.start(t, Math.random() * 0.5)
  src.stop(t + dur + 0.05)
}

// Note cristalline (sinus + harmonique douce)
function tone(a, { freq, dur = 0.5, gain = 0.12, at = 0, type = 'sine' }) {
  const t = a.currentTime + at
  const g = a.createGain()
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(gain, t + 0.012)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  g.connect(a.destination)
  for (const [mult, level] of [[1, 1], [2, 0.25], [3, 0.08]]) {
    const o = a.createOscillator()
    const og = a.createGain()
    o.type = type
    o.frequency.value = freq * mult
    og.gain.value = level
    o.connect(og).connect(g)
    o.start(t)
    o.stop(t + dur + 0.05)
  }
}

const NOTE = n => 440 * 2 ** ((n - 69) / 12)   // numéro MIDI → Hz

export const sfx = {
  tear() {
    const a = audio(); if (!a) return
    noise(a, { dur: 0.32, f0: 900, f1: 4200, q: 0.9, gain: 0.35 })
    noise(a, { dur: 0.12, f0: 5000, f1: 2500, q: 2, gain: 0.12, at: 0.22 })
  },
  swipe() {
    const a = audio(); if (!a) return
    noise(a, { dur: 0.2, f0: 2500, f1: 800, q: 0.7, gain: 0.14 })
  },
  flip() {
    const a = audio(); if (!a) return
    noise(a, { dur: 0.09, f0: 3000, f1: 1500, q: 1.5, gain: 0.12 })
    tone(a, { freq: 880, dur: 0.08, gain: 0.05, type: 'triangle' })
  },
  pop() {
    const a = audio(); if (!a) return
    tone(a, { freq: NOTE(84 + Math.floor(Math.random() * 3) * 2), dur: 0.14, gain: 0.05 })
  },
  // Carte brillante révélée : plus c'est rare, plus l'arpège est riche
  reveal(rarity) {
    const a = audio(); if (!a) return
    const seq = {
      rare: [76, 81],
      holo: [72, 76, 79, 84],
      ultra: [72, 76, 79, 84, 88, 91],
      secrete: [69, 73, 76, 81, 85, 88, 93],
    }[rarity]
    if (!seq) return
    seq.forEach((n, i) => tone(a, { freq: NOTE(n), dur: 0.9, gain: 0.09, at: i * 0.075 }))
    if (rarity === 'ultra' || rarity === 'secrete') {
      noise(a, { dur: 1.2, f0: 7000, f1: 11000, q: 3, gain: 0.05, type: 'bandpass', at: 0.1 })
    }
  },
  claim() {
    const a = audio(); if (!a) return
    tone(a, { freq: NOTE(83), dur: 0.18, gain: 0.08 })
    tone(a, { freq: NOTE(88), dur: 0.5, gain: 0.08, at: 0.08 })
  },
}

// ─── Vibrations ───────────────────────────────────────────────────────────
let iosSwitch = null
function iosTick() {
  if (!iosSwitch) {
    const label = document.createElement('label')
    label.setAttribute('aria-hidden', 'true')
    label.style.cssText = 'position:fixed;width:1px;height:1px;opacity:0;pointer-events:none;overflow:hidden'
    const input = document.createElement('input')
    input.type = 'checkbox'
    input.setAttribute('switch', '')
    label.appendChild(input)
    document.body.appendChild(label)
    iosSwitch = label
  }
  iosSwitch.click()
}

const PATTERNS = { light: 8, medium: 18, heavy: [28, 50, 40] }

export function haptic(kind = 'light') {
  if (!settings.haptics) return
  if (navigator.vibrate) {
    navigator.vibrate(PATTERNS[kind])
  } else if (/iPhone|iPad/.test(navigator.userAgent)) {
    iosTick()
    if (kind === 'heavy') { setTimeout(iosTick, 90); setTimeout(iosTick, 180) }
  }
}
