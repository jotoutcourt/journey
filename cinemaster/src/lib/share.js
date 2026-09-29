// Image de partage d'une carte (1080 × 1350, format Instagram) :
// la carte avec son effet figé en plein reflet, sur le fond de sa série,
// son nom, sa rareté et le logo PopCard.
import { toCanvas } from 'html-to-image'
import { RARITIES } from './rarity.js'

const W = 1080
const H = 1350

function emblem(ctx, cx, cy, s, color) {
  const k = s / 48
  ctx.save()
  ctx.strokeStyle = color
  ctx.fillStyle = color
  ctx.lineWidth = 3.2 * k
  ctx.beginPath(); ctx.arc(cx, cy, 21 * k, 0, Math.PI * 2); ctx.stroke()
  ctx.beginPath(); ctx.arc(cx, cy, 4 * k, 0, Math.PI * 2); ctx.fill()
  for (let a = 0; a < 360; a += 60) {
    const r = (a - 90) * Math.PI / 180
    ctx.beginPath(); ctx.arc(cx + Math.cos(r) * 11.5 * k, cy + Math.sin(r) * 11.5 * k, 4.6 * k, 0, Math.PI * 2); ctx.fill()
  }
  ctx.restore()
}

// Polices de la page, intégrées dans l'image : la capture est une image
// SVG, qui ne peut rien charger d'extérieur. On récupère la feuille Google
// Fonts et on y met chaque fichier de police (jeu latin) en données.
let fontCSS = null
async function embeddedFonts() {
  if (fontCSS) return fontCSS
  const link = document.querySelector('link[href*="fonts.googleapis.com/css2"]')
  if (!link) return (fontCSS = '')
  try {
    const css = await (await fetch(link.href)).text()
    const faces = css.split('@font-face').slice(1)
      .map(f => '@font-face' + f.slice(0, f.indexOf('}') + 1))
      .filter(f => /U\+0000-00FF/.test(f))            // jeu latin seulement
    const toData = async url => {
      const blob = await (await fetch(url)).blob()
      return new Promise(res => { const r = new FileReader(); r.onload = () => res(r.result); r.readAsDataURL(blob) })
    }
    const out = await Promise.all(faces.map(async f => {
      const m = f.match(/url\(([^)]+)\)/)
      return m ? f.replace(m[1], await toData(m[1])) : f
    }))
    fontCSS = out.join('\n')
  } catch {
    fontCSS = ''
  }
  return fontCSS
}

// `node` : la carte affichée hors écran en mode capture.
export async function renderShareImage(node, card) {
  await document.fonts.ready
  const opts = { pixelRatio: 2, cacheBust: false, fontEmbedCSS: await embeddedFonts() }
  // Safari n'affiche pas toujours les images au premier rendu : on en fait deux
  await toCanvas(node, opts).catch(() => null)
  const cardCanvas = await toCanvas(node, opts)

  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  const { c1, c2 } = card.universe

  // fond : dégradé de la série + halo lumineux + rayons
  const bg = ctx.createLinearGradient(0, 0, W, H)
  bg.addColorStop(0, c1)
  bg.addColorStop(1, c2)
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, W, H)
  ctx.fillStyle = 'rgba(255,255,255,.55)'
  ctx.fillRect(0, 0, W, H)
  const halo = ctx.createRadialGradient(W / 2, 560, 60, W / 2, 560, 620)
  halo.addColorStop(0, 'rgba(255,255,255,.95)')
  halo.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = halo
  ctx.fillRect(0, 0, W, H)
  ctx.save()
  ctx.translate(W / 2, 560)
  ctx.fillStyle = 'rgba(255,255,255,.22)'
  for (let i = 0; i < 24; i++) {
    ctx.rotate(Math.PI / 12)
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-40, -900); ctx.lineTo(40, -900); ctx.closePath(); ctx.fill()
  }
  ctx.restore()

  // la carte, légèrement inclinée, avec son ombre
  const cw = 640
  const ch = cw * 88 / 63
  ctx.save()
  ctx.translate(W / 2, 110 + ch / 2)
  ctx.rotate(-3 * Math.PI / 180)
  // l'ombre suit la forme de la carte (coins arrondis compris)
  ctx.shadowColor = 'rgba(20, 25, 45, .45)'
  ctx.shadowBlur = 60
  ctx.shadowOffsetY = 28
  ctx.drawImage(cardCanvas, -cw / 2, -ch / 2, cw, ch)
  ctx.restore()

  // textes
  const r = RARITIES[card.rarity]
  const font = "'Bricolage Grotesque', system-ui, sans-serif"
  ctx.textAlign = 'center'
  ctx.fillStyle = '#23262f'
  ctx.font = `800 54px ${font}`
  ctx.fillText(`${card.first} ${card.last}`.trim(), W / 2, 1100, W - 120)
  ctx.font = `700 32px ${font}`
  ctx.fillStyle = '#4a5063'
  ctx.fillText(`${r.symbol} ${r.label} · ${card.universe.name}`, W / 2, 1152, W - 120)

  // logo PopCard
  ctx.font = `800 40px ${font}`
  const label = 'PopCard'
  const tw = ctx.measureText(label).width
  const lx = W / 2 - (tw + 56) / 2
  emblem(ctx, lx + 20, 1250, 44, '#8b6cf0')
  ctx.textAlign = 'left'
  ctx.fillStyle = '#23262f'
  ctx.fillText('Pop', lx + 56, 1264)
  ctx.fillStyle = '#8b6cf0'
  ctx.fillText('Card', lx + 56 + ctx.measureText('Pop').width, 1264)

  return new Promise(resolve => canvas.toBlob(resolve, 'image/png'))
}

// Partage natif (menu du téléphone) si possible ; sinon `false`.
export async function shareBlob(blob, card) {
  const file = new File([blob], `popcard-${card.id}.png`, { type: 'image/png' })
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: `${card.first} ${card.last}`, text: 'Regarde ma carte PopCard !' })
      return true
    } catch (e) {
      if (e?.name === 'AbortError') return true   // partage annulé par le joueur
    }
  }
  return false
}
