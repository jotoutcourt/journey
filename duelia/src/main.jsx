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
