import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './app.css'
import App from './App.jsx'
import { installSparkleTexture } from './lib/sparkle.js'

// Application mobile : pas de zoom (pincement, double-tap, champ de saisie)
// pour que l'écran reste fixe pendant les gestes de jeu.
const VIEWPORT = 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover'
let meta = document.querySelector('meta[name="viewport"]')
if (!meta) {
  meta = document.createElement('meta')
  meta.name = 'viewport'
  document.head.appendChild(meta)
}
meta.setAttribute('content', VIEWPORT)

installSparkleTexture()

// Safari ignore user-scalable=no pour le pincement : on bloque le geste.
document.addEventListener('gesturestart', e => e.preventDefault(), { passive: false })

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
