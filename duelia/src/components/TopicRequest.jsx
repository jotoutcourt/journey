import { useEffect, useState } from 'react'

// Fenêtre « Demander un thème » : proposer un sujet et soutenir ceux des autres joueurs
export default function TopicRequestSheet({ online, api, onClose }) {
  const [name, setName] = useState('')
  const [details, setDetails] = useState('')
  const [msg, setMsg] = useState(null)
  const [busy, setBusy] = useState(false)
  const [list, setList] = useState(null)
  const load = () => api.list().then(l => setList(Array.isArray(l) ? l : [])).catch(() => setList([]))
  useEffect(() => { if (online) load() }, [online]) // eslint-disable-line react-hooks/exhaustive-deps

  async function send() {
    setBusy(true)
    const res = await api.request(name.trim(), details.trim()).catch(() => 'offline')
    setBusy(false)
    setMsg({
      created: 'Merci ! Ta demande est enregistrée. Les autres joueurs peuvent la soutenir.',
      voted: 'Ce thème était déjà demandé : ton vote a été ajouté.',
      limit: 'Tu as déjà fait beaucoup de demandes aujourd\'hui, réessaie demain.',
      offline: 'Pas de connexion, réessaie dans un instant.',
    }[res] || 'Une erreur est survenue.')
    if (res === 'created' || res === 'voted') { setName(''); setDetails(''); load() }
  }

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet req-sheet" role="dialog" aria-labelledby="req-title" onClick={e => e.stopPropagation()}>
        <h2 id="req-title">💡 Demander un thème</h2>
        {!online ? <p className="sheet-sub">Il faut une connexion Internet pour envoyer une demande.</p> : <>
          <p className="sheet-sub">Quel sujet aimerais-tu voir dans Duelia ?</p>
          <input className="req-input" value={name} maxLength={60} placeholder="Ex. : Les Simpson, la F1, Star Wars…"
            onChange={e => { setName(e.target.value); setMsg(null) }} />
          <textarea className="req-input" value={details} maxLength={300} rows={2} placeholder="Précisions (facultatif) : période, personnages, niveau…"
            onChange={e => setDetails(e.target.value)} />
          <button className="btn btn-primary wide" disabled={busy || name.trim().length < 2} onClick={send}>{busy ? 'Envoi…' : 'Envoyer ma demande'}</button>
          {msg && <p className="friend-msg" role="status">{msg}</p>}

          <h3 className="sec-title">Demandes des joueurs</h3>
          {list === null && <p className="sheet-note">Chargement…</p>}
          {list?.length === 0 && <p className="sheet-note">Aucune demande pour l'instant : sois le premier !</p>}
          <ul className="req-list">
            {list?.map(r => (
              <li key={r.id}>
                <div><b>{r.name}</b>{r.details && <small>{r.details}</small>}<small>par {r.by_name}</small></div>
                <button className={`btn btn-small ${r.voted ? 'btn-ghost' : 'btn-secondary'}`} disabled={r.voted}
                  onClick={() => api.vote(r.id).then(load).catch(() => setMsg('Pas de connexion.'))}>
                  {r.voted ? '✓' : '+1'} · {r.votes}
                </button>
              </li>
            ))}
          </ul>
        </>}
        <button className="btn btn-ghost wide" onClick={onClose}>Fermer</button>
      </div>
    </div>
  )
}
