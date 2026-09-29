// Texture de paillettes générée une seule fois en PNG au lancement.
// (Un SVG avec filtre de bruit serait redessiné par le navigateur à chaque
// mouvement ; une image bitmap reste en cache sur la carte graphique.)
export function installSparkleTexture() {
  try {
    const size = 256
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = size
    const ctx = canvas.getContext('2d')
    let seed = 7
    const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
    for (let i = 0; i < 320; i++) {
      const x = rand() * size
      const y = rand() * size
      const r = 0.4 + rand() * 1.3
      ctx.fillStyle = `rgba(255,255,255,${(0.35 + rand() * 0.65).toFixed(2)})`
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.fill()
      // quelques étoiles à quatre branches
      if (rand() > 0.9) {
        const l = 3 + rand() * 4
        ctx.fillRect(x - l, y - 0.35, l * 2, 0.7)
        ctx.fillRect(x - 0.35, y - l, 0.7, l * 2)
      }
    }
    document.documentElement.style.setProperty('--sparkle-png', `url(${canvas.toDataURL('image/png')})`)
  } catch { /* la texture SVG de repli reste utilisée */ }
}
