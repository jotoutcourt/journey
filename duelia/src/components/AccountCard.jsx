import { useState } from 'react'
import ConfirmButton from './ConfirmButton.jsx'

// Formulaire « J'ai un code de connexion » (premier lancement et profil)
export function RecoverForm({ onRecover, onDone, confirm = false }) {
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(null)
  const ready = code.replace(/[^0-9a-f]/gi, '').length === 20

  async function go() {
    setBusy(true); setMsg(null)
    const res = await onRecover(code)
    setBusy(false)
    if (res === 'ok') { onDone?.(); return }
    setMsg(res === 'bad' ? 'Ce code ne correspond à aucun compte. Vérifie-le (20 caractères, tirets facultatifs).'
      : 'Connexion au serveur impossible. Vérifie ta connexion internet et réessaie.')
  }

  return (
    <div className="recover">
      <label htmlFor="recover-code">Ton code de connexion</label>
      <input id="recover-code" value={code} onChange={e => { setCode(e.target.value.toUpperCase()); setMsg(null) }}
        placeholder="XXXXX-XXXXX-XXXXX-XXXXX" autoCapitalize="characters" autoComplete="off" spellCheck="false" maxLength={29} />
      {confirm
        ? <ConfirmButton className="btn btn-secondary wide" disabled={!ready || busy} onConfirm={go}
            confirmLabel="Remplacer la progression de cet appareil ?">{busy ? 'Connexion…' : 'Me connecter à ce compte'}</ConfirmButton>
        : <button className="btn btn-secondary wide" disabled={!ready || busy} onClick={go}>{busy ? 'Connexion…' : 'Me connecter'}</button>}
      {msg && <p className="recover-err" role="alert">{msg}</p>}
    </div>
  )
}

// Carte « Compte » du profil
export default function AccountCard({ account, onMakeCode, onRecover }) {
  const [code, setCode] = useState(null)
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)
  const [other, setOther] = useState(false)
  const [err, setErr] = useState(null)

  async function makeCode() {
    setBusy(true); setErr(null)
    try { setCode(await onMakeCode()) } catch { setErr('Impossible de créer le code : vérifie ta connexion.') }
    setBusy(false)
  }
  async function copy() {
    try { await navigator.clipboard.writeText(code); setCopied(true) } catch { document.getElementById('my-code')?.select() }
  }

  const online = account.status === 'online'
  return (
    <section className="account-card">
      <header>
        <span className={`dot ${online ? 'on' : 'off'}`} aria-hidden="true" />
        <b>{online ? 'Compte en ligne' : account.status === 'offline' ? 'Hors ligne' : 'Connexion…'}</b>
      </header>
      <p className="acc-sub">
        {online ? 'Ta progression est sauvegardée et tu apparais dans les classements des vrais joueurs.'
          : account.status === 'offline' ? 'Pas de connexion au serveur : tu peux jouer, la sauvegarde reprendra toute seule.'
            : 'Connexion au serveur en cours.'}
      </p>

      {online && !code && (
        <>
          <button className="btn btn-primary wide" onClick={makeCode} disabled={busy}>
            {busy ? 'Création…' : account.hasRecovery ? '🔑 Créer un nouveau code de connexion' : '🔑 Obtenir mon code de connexion'}
          </button>
          <small className="acc-hint">
            {account.hasRecovery
              ? 'Tu as déjà un code. En créer un nouveau annule l\'ancien.'
              : 'Ce code te permet de retrouver ton compte sur un autre téléphone, ou si tu changes d\'appareil.'}
          </small>
        </>
      )}
      {code && (
        <div className="my-code">
          <small>Ton code de connexion</small>
          <input id="my-code" readOnly value={code} onFocus={e => e.target.select()} />
          <button className="btn btn-secondary wide" onClick={copy}>{copied ? '✓ Copié' : 'Copier le code'}</button>
          <p className="acc-warn">⚠️ Note-le maintenant (notes, gestionnaire de mots de passe) : il ne sera plus affiché. Ne le partage avec personne : il donne accès à ton compte.</p>
        </div>
      )}
      {err && <p className="recover-err" role="alert">{err}</p>}

      {!other
        ? <button className="btn btn-ghost wide" onClick={() => setOther(true)}>J'ai déjà un compte sur un autre appareil</button>
        : <RecoverForm onRecover={onRecover} confirm />}
    </section>
  )
}
