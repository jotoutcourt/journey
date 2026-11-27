import { useState } from 'react'
import { reportQuestion } from '../lib/account.js'

// Petit bouton « ⚠️ » pour signaler une question erronée : un appui ouvre le choix du motif, un second envoie.
const REASONS = [['reponse', 'Mauvaise réponse'], ['formulation', 'Faute ou question mal posée'], ['doublon', 'Question en double'], ['autre', 'Autre souci']]

export default function ReportButton({ topic, question, answer }) {
  const [open, setOpen] = useState(false)
  const [state, setState] = useState(null) // null | 'sending' | 'ok' | 'err'
  if (!question) return null
  if (state === 'ok') return <span className="rp-done">✓ Merci, c'est signalé</span>
  async function send(reason) {
    setState('sending')
    try { await reportQuestion(topic || '', question, answer || '', reason); setState('ok'); setOpen(false) } catch { setState('err') }
  }
  return (
    <span className="rp">
      <button className="rp-btn" onClick={(e) => { e.stopPropagation(); setOpen(o => !o) }} aria-label="Signaler une erreur dans cette question">⚠️ Signaler</button>
      {open && (
        <span className="rp-menu" onClick={e => e.stopPropagation()}>
          {REASONS.map(([k, l]) => <button key={k} disabled={state === 'sending'} onClick={() => send(k)}>{l}</button>)}
          {state === 'err' && <small>Envoi impossible, réessaie.</small>}
        </span>
      )}
    </span>
  )
}
