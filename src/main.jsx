import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { I18nProvider } from './i18n/index.jsx'

// ── Scroll reveal (MutationObserver for dynamic React content) ─────────────
const observer = new IntersectionObserver(
  entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('revealed') }),
  { threshold: 0.08 }
)

const mutObs = new MutationObserver(() => {
  document.querySelectorAll('.reveal:not(.revealed)').forEach(el => observer.observe(el))
})
mutObs.observe(document.body, { childList: true, subtree: true })

// ──────────────────────────────────────────────────────────────────────────
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <I18nProvider>
      <App />
    </I18nProvider>
  </StrictMode>,
)
