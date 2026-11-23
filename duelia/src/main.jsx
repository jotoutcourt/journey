import './lib/restoreHash.js'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'
import './theme-abysse.css'
import App from './App.jsx'

// Thème « Abysse » (couleurs de la pieuvre Kraken), appliqué partout
document.documentElement.classList.add('abysse')

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Appli installable et utilisable hors ligne (seulement sur le site public, pas en développement)
if ('serviceWorker' in navigator && import.meta.env.PROD && location.hostname.endsWith('vercel.app')) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}))
}

// Mise à jour automatique : à chaque ouverture ou retour sur l'appli, si une nouvelle version est en ligne, on recharge
// (jamais en pleine partie : l'appli signale quand le joueur est occupé avec window.__dueliaBusy).
if (import.meta.env.PROD && location.hostname.endsWith('vercel.app')) {
  const current = () => document.querySelector('script[type="module"][src]')?.getAttribute('src')
  const check = async () => {
    if (document.hidden || window.__dueliaBusy) return
    try {
      // adresse unique : ni le cache du navigateur ni celui de l'appli hors ligne ne peuvent répondre à sa place
      const html = await (await fetch('/?fresh=' + Date.now(), { cache: 'no-store' })).text()
      const latest = html.match(/<script type="module"[^>]*src="([^"]+)"/)?.[1]
      if (latest && current() && latest !== current()) {
        // garde-fou : jamais deux rechargements de suite pour la même version (si un cache s'entête)
        const key = 'kraken:reloaded'
        let last = null
        try { last = JSON.parse(sessionStorage.getItem(key)) } catch { /* stockage indisponible */ }
        if (last?.to === latest && Date.now() - last.at < 60000) return
        try { sessionStorage.setItem(key, JSON.stringify({ to: latest, at: Date.now() })) } catch { /* idem */ }
        const reg = await navigator.serviceWorker?.getRegistration()
        await reg?.update().catch(() => {})
        location.reload()
      }
    } catch { /* hors ligne */ }
  }
  document.addEventListener('visibilitychange', check)
  window.addEventListener('pageshow', check) // appli restée en mémoire puis rouverte
  window.addEventListener('focus', check)
  window.addEventListener('online', check)
  setTimeout(check, 3000) // au lancement, au cas où une ancienne version aurait été servie
  setInterval(check, 5 * 60 * 1000)
}

// Écran de démarrage : une barre de progression (mise en scène) se remplit en ~3,5 s,
// avec quelques à-coups pour faire « vrai », puis l'écran s'efface en fondu
{
  const splash = document.getElementById('splash')
  if (splash) {
    const fill = splash.querySelector('.bar i'), label = splash.querySelector('.loader b')
    const DURATION = 3500
    // étapes : [moment (0-1), progression (0-1)] — démarrage rapide, deux paliers, sprint final
    const STEPS = [[0, 0], [0.18, 0.34], [0.32, 0.41], [0.5, 0.63], [0.66, 0.7], [0.86, 0.94], [1, 1]]
    const at = (x) => {
      for (let k = 1; k < STEPS.length; k++) {
        const [x0, y0] = STEPS[k - 1], [x1, y1] = STEPS[k]
        if (x <= x1) { const u = (x - x0) / (x1 - x0); return y0 + (y1 - y0) * (1 - (1 - u) * (1 - u)) }
      }
      return 1
    }
    const start = performance.now()
    const tick = () => {
      const p = at(Math.min(1, (performance.now() - start) / DURATION))
      if (fill) fill.style.width = (p * 100).toFixed(1) + '%'
      if (label) label.textContent = Math.round(p * 100) + ' %'
      if (p < 1) return requestAnimationFrame(tick)
      setTimeout(() => {
        splash.classList.add('out')
        setTimeout(() => splash.remove(), 500)
      }, 250)
    }
    requestAnimationFrame(tick)
  }
}
