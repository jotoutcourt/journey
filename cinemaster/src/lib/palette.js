// Couleurs d'une image : on la réduit à 40 × 40 px et on garde les teintes
// les plus présentes parmi les pixels colorés (ni gris, ni trop sombres).
// Sert aux reflets des cartes Rare, qui prennent les couleurs de leur image.
import { useSyncExternalStore } from 'react'

const cache = new Map()   // url → palette (tableau de teintes) ou null
const pending = new Set()
const listeners = new Set()
const notify = () => listeners.forEach(fn => fn())

function hsl(r, g, b) {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  const d = max - min
  if (!d) return [0, 0, l]
  const s = d / (1 - Math.abs(2 * l - 1))
  let h
  if (max === r) h = ((g - b) / d) % 6
  else if (max === g) h = (b - r) / d + 2
  else h = (r - g) / d + 4
  return [(h * 60 + 360) % 360, s, l]
}

// Jusqu'à 3 teintes dominantes, espacées d'au moins 35°.
function extract(img) {
  const size = 40
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  ctx.drawImage(img, 0, 0, size, size)
  const { data } = ctx.getImageData(0, 0, size, size)
  const bins = new Float32Array(36)   // teintes par tranches de 10°
  for (let i = 0; i < data.length; i += 4) {
    const [h, s, l] = hsl(data[i], data[i + 1], data[i + 2])
    if (s < 0.18 || l < 0.12 || l > 0.94) continue
    // les pixels vifs et bien exposés comptent davantage
    bins[Math.floor(h / 10) % 36] += s * (1 - Math.abs(l - 0.55))
  }
  // lissage circulaire : une teinte à cheval sur deux tranches reste une teinte
  const smooth = bins.map((v, i) => v * 2 + bins[(i + 35) % 36] + bins[(i + 1) % 36])
  const order = [...smooth.keys()].sort((a, b) => smooth[b] - smooth[a])
  const total = smooth.reduce((a, b) => a + b, 0)
  const hues = []
  for (const i of order) {
    if (!total || smooth[i] < total * 0.04) break
    const h = i * 10 + 5
    if (hues.every(x => Math.min(Math.abs(x - h), 360 - Math.abs(x - h)) >= 35)) hues.push(h)
    if (hues.length === 3) break
  }
  return hues.length ? hues : null
}

function load(url) {
  if (cache.has(url) || pending.has(url)) return
  pending.add(url)
  const img = new Image()
  img.crossOrigin = 'anonymous'
  img.decoding = 'async'
  img.onload = () => {
    let hues = null
    try { hues = extract(img) } catch { /* image d'un autre site : illisible */ }
    pending.delete(url)
    cache.set(url, hues)
    notify()
  }
  img.onerror = () => { pending.delete(url); cache.set(url, null); notify() }
  img.src = url
}

const subscribe = fn => { listeners.add(fn); return () => listeners.delete(fn) }

// Palette de l'image (ou null tant qu'elle n'est pas prête / sans couleur).
export function usePalette(url) {
  const hues = useSyncExternalStore(subscribe, () => (url ? cache.get(url) ?? null : null))
  if (url && !cache.has(url)) load(url)
  return hues
}

const wrap = h => Math.round(((h % 360) + 360) % 360)
// milieu de deux teintes par le plus court chemin sur le cercle
const mid = (a, b) => wrap(a + ((((b - a) % 360) + 540) % 360 - 180) / 2)

// Bandes holographiques aux couleurs de l'image : ses teintes dominantes,
// en clair lumineux, avec de légers décalages pour garder l'effet irisé.
// Une image d'une seule couleur donne des variations autour de celle-ci.
export function sunpillarFrom(hues) {
  const [a, b, c] = hues
  const base = hues.length === 1 ? [a, a + 22, a - 22]
    : hues.length === 2 ? [a, mid(a, b), b]
      : [a, b, c]
  const stops = [...base, ...base.map(h => h + 12)].map(wrap)
  const col = (h, i) => `hsl(${h} 100% ${i % 2 ? 76 : 70}%) ${5 + i * 5}%`
  return `repeating-linear-gradient(0deg, ${stops.map(col).join(', ')}, hsl(${stops[0]} 100% 70%) 35%)`
}

// Couleurs des textes d'une carte à partir de son image : teinte principale
// pour le nom de la série et le dégradé du nom, seconde teinte (ou la même,
// plus sombre) pour les contours et le bas des dégradés. Saturation et
// luminosité fixées pour rester lisibles sur le cadre clair comme sur l'image.
export function textColorsFrom(hues) {
  const [a, b = a] = hues
  return {
    '--t1': `hsl(${a} 80% 58%)`,
    '--t2': `hsl(${b} 70% 38%)`,
    '--tink': `hsl(${a} 75% 42%)`,
  }
}
