// Musiques originales générées en direct (Web Audio), sans aucun fichier.
// intro()    : boucle électro nerveuse pour le face-à-face, impact au moment du « VS ».
// thinking() : nappe de réflexion sous tension pendant qu'on répond, qui s'accélère à la fin du chrono.
// Chaque fonction renvoie stop(), qui coupe la musique en fondu.
import { audioFor } from './sound.js'

const NOTE = (n) => 440 * Math.pow(2, (n - 69) / 12) // numéro MIDI → fréquence

function master(ctx, level) {
  const g = ctx.createGain()
  g.gain.setValueAtTime(0.0001, ctx.currentTime)
  g.gain.exponentialRampToValueAtTime(level, ctx.currentTime + 0.08)
  g.connect(ctx.destination)
  return g
}

function stopper(ctx, out, extra = () => {}) {
  let done = false
  return () => {
    if (done) return
    done = true
    extra()
    try {
      const t = ctx.currentTime
      out.gain.cancelScheduledValues(t)
      out.gain.setValueAtTime(Math.max(out.gain.value, 0.0001), t)
      out.gain.exponentialRampToValueAtTime(0.0001, t + 0.3)
      setTimeout(() => out.disconnect(), 400)
    } catch { /* déjà coupé */ }
  }
}

function voice(ctx, dest, { type = 'sine', freq, t, dur, gain = 0.1, attack = 0.005, glideTo, detune = 0 }) {
  const o = ctx.createOscillator(), g = ctx.createGain()
  o.type = type
  o.detune.value = detune
  o.frequency.setValueAtTime(freq, t)
  if (glideTo) o.frequency.exponentialRampToValueAtTime(glideTo, t + dur)
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(gain, t + attack)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  o.connect(g).connect(dest)
  o.start(t); o.stop(t + dur + 0.05)
}

let noiseBuf = null
function noise(ctx, dest, { t, dur, gain = 0.1, type = 'highpass', freq = 6000 }) {
  if (!noiseBuf) {
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate)
    const d = noiseBuf.getChannelData(0)
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
  }
  const src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain()
  src.buffer = noiseBuf
  f.type = type; f.frequency.value = freq
  g.gain.setValueAtTime(gain, t)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  src.connect(f).connect(g).connect(dest)
  src.start(t); src.stop(t + dur + 0.05)
}

const kick = (ctx, dest, t, gain = 0.5) => voice(ctx, dest, { freq: 130, glideTo: 38, t, dur: 0.16, gain })

/* ---------- Intro électrique du face-à-face ---------- */
export function intro(seconds = 2.9, big = false) {
  const ctx = audioFor('music')
  if (!ctx) return () => {}
  const out = master(ctx, big ? 0.55 : 0.46)
  const t0 = ctx.currentTime + 0.03
  const bpm = big ? 150 : 140
  const s16 = 60 / bpm / 4
  const steps = Math.floor((seconds - 0.25) / s16)

  // Basse en arpège à travers un filtre qui s'ouvre (effet « électrique » qui monte)
  const filter = ctx.createBiquadFilter()
  filter.type = 'lowpass'; filter.Q.value = 9
  filter.frequency.setValueAtTime(260, t0)
  filter.frequency.exponentialRampToValueAtTime(big ? 4200 : 3000, t0 + seconds - 0.3)
  filter.connect(out)
  // Motif original sur 16 doubles-croches (ré mineur), décalé d'une octave sur la 2e moitié
  const riff = [38, 38, 50, 38, 45, 38, 48, 38, 41, 38, 50, 38, 45, 48, 50, 53]
  for (let i = 0; i < steps; i++) {
    const t = t0 + i * s16
    const n = riff[i % 16] + (i >= 16 && big ? 12 : 0)
    voice(ctx, filter, { type: 'sawtooth', freq: NOTE(n), t, dur: s16 * 0.9, gain: 0.16, detune: -6 })
    voice(ctx, filter, { type: 'square', freq: NOTE(n), t, dur: s16 * 0.7, gain: 0.07, detune: 7 })
    if (i % 4 === 0) kick(ctx, out, t, 0.55)                        // grosse caisse
    if (i % 2 === 1) noise(ctx, out, { t, dur: 0.03, gain: 0.05 })  // charleston
    if (i % 8 === 4) noise(ctx, out, { t, dur: 0.14, gain: 0.16, type: 'bandpass', freq: 1800 }) // caisse claire
  }
  // Impact au moment où le « VS » tombe (~0,7 s) : boum grave + éclat
  const hit = t0 + 0.68
  voice(ctx, out, { freq: 90, glideTo: 30, t: hit, dur: 0.6, gain: 0.6 })
  noise(ctx, out, { t: hit, dur: 0.9, gain: 0.22, freq: 3000 })
  ;[62, 65, 69].forEach(n => voice(ctx, out, { type: 'sawtooth', freq: NOTE(n), t: hit, dur: 0.5, gain: 0.05 }))
  // Montée finale vers la première question
  const rise = t0 + seconds - 0.9
  voice(ctx, out, { type: 'sawtooth', freq: 220, glideTo: 1320, t: rise, dur: 0.8, gain: 0.04 })
  noise(ctx, out, { t: rise, dur: 0.85, gain: 0.04, freq: 2000 })

  const stop = stopper(ctx, out)
  const auto = setTimeout(stop, seconds * 1000)
  return () => { clearTimeout(auto); stop() }
}

/* ---------- Musique de réflexion pendant une question ---------- */
export function thinking(totalMs = 10000) {
  const ctx = audioFor('music')
  if (!ctx) return () => {}
  const out = master(ctx, 0.4)
  const t0 = ctx.currentTime + 0.02
  const end = t0 + totalMs / 1000
  const hurryAt = end - 3

  // Bourdon grave (la + mi) sous un filtre qui s'ouvre quand le temps presse
  const lp = ctx.createBiquadFilter()
  lp.type = 'lowpass'; lp.Q.value = 4
  lp.frequency.setValueAtTime(380, t0)
  lp.frequency.setValueAtTime(380, hurryAt)
  lp.frequency.exponentialRampToValueAtTime(1600, end)
  lp.connect(out)
  const drones = [[45, -8], [45, 8], [52, 0]].map(([n, det]) => {
    const o = ctx.createOscillator(), g = ctx.createGain()
    o.type = 'sawtooth'; o.frequency.value = NOTE(n); o.detune.value = det
    g.gain.setValueAtTime(0.0001, t0)
    g.gain.exponentialRampToValueAtTime(0.05, t0 + 0.6)
    o.connect(g).connect(lp)
    o.start(t0); o.stop(end + 0.5)
    return o
  })

  // Nappe suspendue (accord sans tierce) qui respire lentement
  const pad = ctx.createGain()
  pad.gain.value = 0.0001
  pad.gain.exponentialRampToValueAtTime(0.03, t0 + 1.2)
  pad.connect(out)
  const lfo = ctx.createOscillator(), lfoGain = ctx.createGain()
  lfo.frequency.value = 0.35; lfoGain.gain.value = 0.012
  lfo.connect(lfoGain).connect(pad.gain)
  lfo.start(t0); lfo.stop(end + 0.5)
  const padOsc = [57, 62, 64, 71].map(n => {
    const o = ctx.createOscillator()
    o.type = 'triangle'; o.frequency.value = NOTE(n)
    o.connect(pad); o.start(t0); o.stop(end + 0.5)
    return o
  })

  // Battement de cœur + notes pincées éparses, programmés au fil de l'eau
  const plucks = [81, 76, 79, 74, 81, 84, 79, 76] // motif original, aigu et clairsemé
  let next = t0 + 0.2, beat = 0
  const schedule = () => {
    const horizon = ctx.currentTime + 0.25
    while (next < horizon && next < end) {
      const urgent = next >= hurryAt
      const period = urgent ? 0.36 : 0.72 // le cœur s'emballe dans les 3 dernières secondes
      voice(ctx, out, { freq: 62, glideTo: 40, t: next, dur: 0.14, gain: urgent ? 0.4 : 0.3 })
      voice(ctx, out, { freq: 55, glideTo: 36, t: next + 0.16, dur: 0.12, gain: urgent ? 0.25 : 0.17 })
      if (!urgent && beat % 2 === 0) {
        voice(ctx, out, { type: 'triangle', freq: NOTE(plucks[(beat / 2) % plucks.length]), t: next + 0.36, dur: 0.6, gain: 0.04 })
      }
      if (urgent) noise(ctx, out, { t: next + 0.18, dur: 0.04, gain: 0.04 })
      next += period
      beat++
    }
  }
  schedule()
  const iv = setInterval(schedule, 60)

  return stopper(ctx, out, () => {
    clearInterval(iv)
    const t = ctx.currentTime + 0.35
    ;[...drones, ...padOsc, lfo].forEach(o => { try { o.stop(t) } catch { /* déjà arrêté */ } })
  })
}
