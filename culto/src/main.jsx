import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './app.css'
import App from './App.jsx'

// Safari ignore user-scalable=no pour le pincement : on bloque le geste.
document.addEventListener('gesturestart', e => e.preventDefault(), { passive: false })

// Hors connexion : service worker (pas dans un cadre intégré comme un aperçu).
if (import.meta.env.PROD && 'serviceWorker' in navigator && window.self === window.top) {
  window.addEventListener('load', () => { navigator.serviceWorker.register('/sw.js').catch(() => {}) })
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
