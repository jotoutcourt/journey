// Petits sons et vibrations, générés à la volée (aucun fichier audio).
import { getState } from './store.js'

let ctx = null
function audio() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return null
    ctx = new AC()
  }
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

function tones(notes) {
  if (!getState().sound) return
  const ac = audio()
  if (!ac) return
  let t = ac.currentTime
  for (const [freq, dur, type = 'sine', vol = 0.16] of notes) {
    const o = ac.createOscillator(), g = ac.createGain()
    o.type = type
    o.frequency.value = freq
    g.gain.setValueAtTime(0, t)
    g.gain.linearRampToValueAtTime(vol, t + 0.015)
    g.gain.exponentialRampToValueAtTime(0.001, t + dur)
    o.connect(g).connect(ac.destination)
    o.start(t)
    o.stop(t + dur + 0.02)
    t += dur * 0.75
  }
}

const buzz = p => { try { navigator.vibrate?.(p) } catch { /* rien */ } }

export const sfx = {
  tap: () => { tones([[660, 0.05, 'triangle', 0.06]]) },
  good: () => { tones([[784, 0.12], [1175, 0.22]]); buzz(15) },
  bad: () => { tones([[220, 0.16, 'square', 0.06], [185, 0.24, 'square', 0.06]]); buzz([30, 40, 30]) },
  done: () => { tones([[523, 0.12], [659, 0.12], [784, 0.12], [1047, 0.35]]); buzz([20, 30, 40]) },
}
