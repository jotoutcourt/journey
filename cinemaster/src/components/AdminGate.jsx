import { useState } from 'react'
import { Icon } from './Icons.jsx'

// Empreinte SHA-256 du mot de passe de l'Atelier (le mot de passe lui-même
// n'est pas dans le code). C'est un verrou d'interface : la vraie protection
// des images partagées vient des droits de la page (seul l'admin peut écrire).
const PASSWORD_HASH = '091bc1e1284f9d48883b4ba278ccffaaa0d71363a2fab8de3ef63871658f54e3'
const KEY = 'cinemaster:atelier'

async function sha256(text) {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return [...new Uint8Array(bytes)].map(b => b.toString(16).padStart(2, '0')).join('')
}

function remembered() {
  try { return localStorage.getItem(KEY) === PASSWORD_HASH } catch { return false }
}

export default function AdminGate({ children }) {
  const [unlocked, setUnlocked] = useState(remembered)
  const [value, setValue] = useState('')
  const [error, setError] = useState(false)

  if (unlocked) return children

  const submit = async e => {
    e.preventDefault()
    if (await sha256(value.trim()) === PASSWORD_HASH) {
      try { localStorage.setItem(KEY, PASSWORD_HASH) } catch { /* session seulement */ }
      setUnlocked(true)
    } else {
      setError(true)
    }
  }

  return (
    <form className="panel gate" onSubmit={submit}>
      <span className="gate-icon"><Icon name="lock" /></span>
      <h2>Atelier</h2>
      <p>Espace réservé à l’admin : les images déposées ici deviennent celles de tous les joueurs.</p>
      <label htmlFor="atelier-password" className="gate-label">Mot de passe</label>
      <input
        id="atelier-password"
        type="password"
        autoComplete="current-password"
        value={value}
        onChange={e => { setValue(e.target.value); setError(false) }}
        className={error ? 'has-error' : ''}
      />
      {error && <p className="error">Mot de passe incorrect.</p>}
      <button className="pill-btn primary" type="submit" disabled={!value}>Entrer</button>
    </form>
  )
}
