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

// Mise à jour automatique : au retour sur l'appli, si une nouvelle version est en ligne, on recharge
// (jamais en pleine partie : l'appli signale quand le joueur est occupé avec window.__dueliaBusy).
if (import.meta.env.PROD && location.hostname.endsWith('vercel.app')) {
  const current = () => document.querySelector('script[type="module"][src]')?.getAttribute('src')
  const check = async () => {
    if (document.hidden || window.__dueliaBusy) return
    try {
      const html = await (await fetch('/', { cache: 'no-store' })).text()
      const latest = html.match(/<script type="module"[^>]*src="([^"]+)"/)?.[1]
      if (latest && current() && latest !== current()) {
        const reg = await navigator.serviceWorker?.getRegistration()
        await reg?.update().catch(() => {})
        location.reload()
      }
    } catch { /* hors ligne */ }
  }
  document.addEventListener('visibilitychange', check)
  setInterval(check, 10 * 60 * 1000)
}

// Écran de démarrage : reste au moins 2 s (le temps de voir les bulles), puis s'efface en fondu
{
  const splash = document.getElementById('splash')
  if (splash) {
    const shown = performance.now()
    const hide = () => setTimeout(() => {
      splash.classList.add('out')
      setTimeout(() => splash.remove(), 500)
    }, Math.max(0, 2000 - (performance.now() - shown)))
    requestAnimationFrame(() => requestAnimationFrame(hide))
  }
}
