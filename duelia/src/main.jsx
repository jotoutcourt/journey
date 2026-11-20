import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Appli installable et utilisable hors ligne (seulement sur le site public, pas en développement)
if ('serviceWorker' in navigator && import.meta.env.PROD && location.hostname.endsWith('vercel.app')) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}))
}
