// Petits effets sonores synthétisés (aucun fichier audio).
let ctx = null
let enabled = true
export const setSound = (on) => { enabled = on }

function tone(freq, dur = 0.12, type = 'sine', gain = 0.12, delay = 0) {
  if (!enabled) return
  try {
    ctx = ctx || new (window.AudioContext || window.webkitAudioContext)()
    if (ctx.state === 'suspended') ctx.resume()
    const t0 = ctx.currentTime + delay
    const o = ctx.createOscillator(), g = ctx.createGain()
    o.type = type
    o.frequency.setValueAtTime(freq, t0)
    g.gain.setValueAtTime(0.0001, t0)
    g.gain.exponentialRampToValueAtTime(gain, t0 + 0.01)
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
    o.connect(g).connect(ctx.destination)
    o.start(t0)
    o.stop(t0 + dur + 0.02)
  } catch { /* audio indisponible */ }
}

export const sfx = {
  tap: () => tone(660, 0.05, 'triangle', 0.06),
  tick: () => tone(880, 0.04, 'square', 0.03),
  good: () => { tone(740, 0.1, 'triangle'); tone(1110, 0.16, 'triangle', 0.1, 0.08) },
  bad: () => { tone(220, 0.18, 'sawtooth', 0.06); tone(180, 0.22, 'sawtooth', 0.05, 0.1) },
  oppScore: () => tone(420, 0.06, 'sine', 0.05),
  // Roulement puis impact : pour les duels contre (ou entre) membres du top 10
  bigVs: () => {
    for (let i = 0; i < 10; i++) tone(90 + i * 6, 0.08, 'triangle', 0.05 + i * 0.006, i * 0.07)
    tone(65, 0.6, 'sawtooth', 0.09, 0.75); tone(130, 0.5, 'square', 0.05, 0.75); tone(523, 0.4, 'triangle', 0.07, 0.8)
  },
  vs: () => { tone(196, 0.25, 'sawtooth', 0.05); tone(392, 0.3, 'triangle', 0.08, 0.15) },
  win: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.2, 'triangle', 0.1, i * 0.11)),
  lose: () => [392, 330, 262].forEach((f, i) => tone(f, 0.25, 'sine', 0.08, i * 0.14)),
  levelUp: () => [784, 988, 1175, 1568].forEach((f, i) => tone(f, 0.18, 'square', 0.04, i * 0.08)),
}
