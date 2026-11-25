// Petits effets sonores synthétisés (aucun fichier audio).
let ctx = null
let enabled = true
let musicOn = true
export const setSound = (on) => { enabled = on }
export const setMusic = (on) => { musicOn = on }

// Contexte audio partagé avec la musique (créé au premier son, après un geste du joueur).
export function audioFor(kind = 'sfx') {
  if (!enabled || (kind === 'music' && !musicOn)) return null
  try {
    ctx = ctx || new (window.AudioContext || window.webkitAudioContext)()
    if (ctx.state === 'suspended') ctx.resume()
    return ctx
  } catch { return null }
}

function tone(freq, dur = 0.12, type = 'sine', gain = 0.12, delay = 0, to = null) {
  if (!enabled) return
  try {
    ctx = ctx || new (window.AudioContext || window.webkitAudioContext)()
    if (ctx.state === 'suspended') ctx.resume()
    const t0 = ctx.currentTime + delay
    const o = ctx.createOscillator(), g = ctx.createGain()
    o.type = type
    o.frequency.setValueAtTime(freq, t0)
    if (to) o.frequency.exponentialRampToValueAtTime(to, t0 + dur)
    g.gain.setValueAtTime(0.0001, t0)
    g.gain.exponentialRampToValueAtTime(gain, t0 + 0.01)
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
    o.connect(g).connect(ctx.destination)
    o.start(t0)
    o.stop(t0 + dur + 0.02)
  } catch { /* audio indisponible */ }
}

// Petit claquement (bruit filtré), pour le dé qui roule
function knock(delay = 0, gain = 0.25, freq = 1800) {
  if (!enabled) return
  try {
    ctx = ctx || new (window.AudioContext || window.webkitAudioContext)()
    if (ctx.state === 'suspended') ctx.resume()
    const t0 = ctx.currentTime + delay, len = Math.floor(ctx.sampleRate * 0.04)
    const buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0)
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3)
    const src = ctx.createBufferSource(), bp = ctx.createBiquadFilter(), g = ctx.createGain()
    src.buffer = buf; bp.type = 'bandpass'; bp.frequency.value = freq; bp.Q.value = 2.5; g.gain.value = gain
    src.connect(bp).connect(g).connect(ctx.destination); src.start(t0)
  } catch { /* audio indisponible */ }
}

// Durée du suspense avant la révélation du Kraken (ms)
export const SUSPENSE_MS = 2600

// Bruit filtré plus long (tonnerre, coup sourd, pièces)
function noise(dur, { delay = 0, gain = 0.3, type = 'lowpass', freq = 400, to = null, q = 0.7 } = {}) {
  if (!enabled) return
  try {
    ctx = ctx || new (window.AudioContext || window.webkitAudioContext)()
    if (ctx.state === 'suspended') ctx.resume()
    const t0 = ctx.currentTime + delay, len = Math.floor(ctx.sampleRate * dur)
    const buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0)
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1
    const src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain()
    src.buffer = buf; f.type = type; f.frequency.setValueAtTime(freq, t0); f.Q.value = q
    if (to) f.frequency.exponentialRampToValueAtTime(to, t0 + dur)
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(gain, t0 + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
    src.connect(f).connect(g).connect(ctx.destination); src.start(t0); src.stop(t0 + dur + 0.05)
  } catch { /* audio indisponible */ }
}

export const sfx = {
  // rire moqueur du Kraken : « ha ha ha » qui descend
  laugh: () => { [520, 470, 420, 360].forEach((f, i) => { tone(f, 0.13, 'sawtooth', 0.05, i * 0.16, f * 0.8); tone(f * 2, 0.1, 'sine', 0.02, i * 0.16) }) },
  // éclair + tonnerre (annonce de duel)
  thunder: () => { noise(0.12, { gain: 0.5, type: 'highpass', freq: 2500 }); noise(1.8, { delay: 0.05, gain: 0.45, freq: 900, to: 60 }); tone(45, 1.4, 'sawtooth', 0.05, 0.08, 30) },
  // coup de poing qui éjecte le perdant
  punch: () => { noise(0.18, { gain: 0.6, freq: 600, to: 80 }); tone(110, 0.2, 'sine', 0.2, 0, 50); noise(0.5, { delay: 0.1, gain: 0.12, type: 'bandpass', freq: 1800, to: 400, q: 1.5 }) },
  // caisse enregistreuse (achat en boutique)
  cash: () => { knock(0, 0.25, 3000); knock(0.06, 0.2, 2500); tone(1568, 0.5, 'sine', 0.08, 0.12); tone(2093, 0.6, 'sine', 0.07, 0.16); tone(2637, 0.5, 'triangle', 0.04, 0.2) },
  // pluie d'or (trêve)
  coins: (n = 6) => { for (let i = 0; i < n; i++) { const f = 2200 + Math.random() * 1600; tone(f, 0.12, 'triangle', 0.05, i * 0.08); tone(f * 1.5, 0.08, 'sine', 0.03, i * 0.08 + 0.02) } },
  // le Kraken encaisse un coup / se régénère
  hit: () => { noise(0.25, { gain: 0.35, freq: 500, to: 90 }); tone(160, 0.2, 'square', 0.05, 0, 70) },
  heal: () => { tone(330, 0.6, 'sine', 0.07, 0, 660); tone(495, 0.6, 'sine', 0.05, 0.1, 990) },
  // décompte avant la révélation : « bip » pour 3, 2, 1, et un « bip » plus aigu et plus long pour 0
  count: (n) => { n > 0 ? tone(660, 0.14, 'square', 0.06) : (tone(990, 0.35, 'square', 0.07), tone(1320, 0.35, 'sine', 0.04, 0.02)) },
  // carte qui se retourne : petit « flap » de papier + note qui monte
  flip: () => { knock(0, 0.14, 2600); knock(0.05, 0.1, 1800); tone(520, 0.12, 'triangle', 0.05, 0.03, 880) },
  // dé qui roule sur la table puis s'arrête : chocs de plus en plus espacés, et un dernier « clac »
  dice: () => {
    let t = 0, gap = 0.045
    for (let i = 0; i < 9; i++) { knock(t, 0.16 + Math.random() * 0.1, 1400 + Math.random() * 1400); t += gap; gap *= 1.22 }
    knock(t + 0.03, 0.3, 900); tone(180, 0.08, 'sine', 0.08, t + 0.03)
  },
  // pas d'un pion sur le plateau : petit « tok » de bois, légèrement différent à chaque case
  step: () => { const f = 480 + Math.random() * 120; tone(f, 0.05, 'triangle', 0.09); tone(f / 2, 0.07, 'sine', 0.06, 0.005) },
  // Petit « pop » doux sur chaque bouton
  click: () => { tone(560, 0.07, 'sine', 0.07, 0, 340); tone(1200, 0.03, 'triangle', 0.02) },
  // Suspense : battements de cœur qui accélèrent sur un grondement qui monte, puis silence avant le verdict
  suspense: () => {
    tone(55, 2.4, 'sawtooth', 0.035, 0, 95)
    tone(110, 2.4, 'triangle', 0.03, 0, 190)
    let t = 0, gap = 0.5
    while (t < 2.25) {
      tone(70, 0.12, 'sine', 0.22, t, 45); tone(62, 0.1, 'sine', 0.16, t + 0.13, 40)
      tone(1500, 0.03, 'square', 0.018, t + gap / 2)
      t += gap; gap = Math.max(0.17, gap * 0.8)
    }
  },
  // Les lingots tombent dans les abysses
  drop: () => { tone(700, 0.5, 'triangle', 0.07, 0, 120); tone(90, 0.35, 'sine', 0.2, 0.42, 40) },
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

// Répliques du Kraken (fichiers audio), décodées une fois puis rejouées par Web Audio
const VOICES = { tout: '/voix/ciao-les-minables.mp3', partie: '/voix/pauvre-idiot.mp3' }
const voiceCache = {}
function loadVoice(key) {
  const c = audioFor()
  if (!c || !VOICES[key]) return Promise.resolve(null)
  voiceCache[key] = voiceCache[key] || fetch(VOICES[key]).then(r => r.arrayBuffer())
    .then(b => new Promise((ok, ko) => c.decodeAudioData(b, ok, ko))).catch(() => { delete voiceCache[key]; return null })
  return voiceCache[key]
}
export const preloadVoices = () => { Object.keys(VOICES).forEach(loadVoice) }
export function krakenSays(key, gain = 0.9) {
  loadVoice(key).then(buf => {
    const c = audioFor()
    if (!buf || !c) return
    const src = c.createBufferSource(), g = c.createGain()
    g.gain.value = gain; src.buffer = buf; src.connect(g).connect(c.destination); src.start()
  })
}
