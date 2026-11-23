// Missions quotidiennes : 3 missions par jour, la progression et les récompenses sont vérifiées par le serveur.
import { useState } from 'react'
import * as api from '../lib/account.js'
import { isDone, missionsToClaim } from '../lib/missions.js'

export function MissionsChip({ data, onOpen }) {
  if (!data?.missions) return null
  const done = data.missions.filter(m => m.claimed).length
  const ready = missionsToClaim(data)
  return (
    <button className={`missions-chip ${ready ? 'ready' : ''}`} onClick={onOpen}>
      <span aria-hidden="true">🎯</span>Missions {done}/{data.missions.length}
      {ready > 0 && <i className="mc-badge">{ready}</i>}
    </button>
  )
}

function resetLabel(resetAt) {
  const ms = new Date(resetAt) - Date.now()
  if (!(ms > 0)) return 'bientôt'
  const h = Math.floor(ms / 3600000), m = Math.floor((ms % 3600000) / 60000)
  return h > 0 ? `${h} h ${String(m).padStart(2, '0')}` : `${m} min`
}

export function MissionsSheet({ data, onClose, onClaimed, onToast }) {
  const [busy, setBusy] = useState(null)
  const claim = async (m) => {
    setBusy(m.code)
    try {
      const r = await api.claimMission(m.code)
      onClaimed(m.code, r?.lingots)
      onToast?.(`💰 +${m.reward} lingots !`)
    } catch {
      onToast?.('Impossible de récupérer la récompense : vérifie ta connexion.')
    }
    setBusy(null)
  }
  const all = data.missions.every(m => m.claimed)
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet missions-sheet" role="dialog" aria-label="Missions du jour" onClick={e => e.stopPropagation()}>
        <h2>🎯 Missions du jour</h2>
        <p className="sheet-sub">{all ? 'Bravo, tout est fait ! ' : ''}Nouvelles missions dans {resetLabel(data.reset_at)}</p>
        <ul className="missions-list">
          {data.missions.map(m => (
            <li key={m.code} className={m.claimed ? 'claimed' : isDone(m) ? 'done' : ''}>
              <span className="ms-icon" aria-hidden="true">{m.icon}</span>
              <div className="ms-body">
                <b>{m.label}</b>
                <div className="ms-track"><i style={{ width: `${(m.progress / m.target) * 100}%` }} /></div>
                <small>{m.progress.toLocaleString('fr-FR')} / {m.target.toLocaleString('fr-FR')}</small>
              </div>
              {m.claimed
                ? <span className="ms-ok">✓</span>
                : <button className={`ms-claim ${isDone(m) ? '' : 'locked'}`} disabled={!isDone(m) || busy === m.code} onClick={() => claim(m)}>
                  <i className="lt-coin" aria-hidden="true" />+{m.reward}
                </button>}
            </li>
          ))}
        </ul>
        <button className="btn btn-ghost wide" onClick={onClose}>Fermer</button>
      </div>
    </div>
  )
}
