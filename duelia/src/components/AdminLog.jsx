import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { adminActivity } from '../lib/account.js'

// Historique caché (réservé au créateur) : tout ce qui se passe sur l'appli, jour par jour
const FILTERS = [['', 'Tout'], ['compte', 'Comptes'], ['social', 'Amis'], ['duel', 'Duels'], ['chasse', 'Chasse'], ['jeu', 'Trappes'], ['achat', 'Achats'], ['theme', 'Thèmes']]
const DAYS = [1, 7, 30]

export default function AdminLog({ onClose }) {
  const [days, setDays] = useState(7)
  const [data, setData] = useState(null)
  const [err, setErr] = useState(null)
  const [filter, setFilter] = useState('')
  useEffect(() => {
    let alive = true
    adminActivity(days).then(d => { if (alive) { setData(d); setErr(null) } }).catch(e => { if (alive) setErr(String(e?.message || e)) })
    return () => { alive = false }
  }, [days])
  const events = (data?.events || []).filter(e => !filter || e.k === filter)
  const byDay = []
  for (const e of events) {
    const day = new Date(e.at).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
    if (byDay.at(-1)?.day !== day) byDay.push({ day, list: [] })
    byDay.at(-1).list.push(e)
  }
  const st = data?.stats
  return createPortal(
    <div className="admin-log" role="dialog" aria-label="Historique de l'appli">
      <header>
        <button className="icon-btn" onClick={onClose} aria-label="Fermer">←</button>
        <h1>🕵️ Historique</h1>
        <div className="al-days">{DAYS.map(d => <button key={d} className={d === days ? 'on' : ''} onClick={() => setDays(d)}>{d === 1 ? '24 h' : `${d} j`}</button>)}</div>
      </header>
      {err ? <p className="al-empty">{err.includes('réservé') ? 'Accès réservé.' : `Erreur : ${err}`}</p>
        : !data ? <p className="al-empty">Chargement…</p>
          : <>
            <div className="al-stats">
              <div><b>{st.players}</b><small>joueurs</small></div>
              <div><b>{st.new}</b><small>nouveaux</small></div>
              <div><b>{st.today}</b><small>actifs 24 h</small></div>
              <div><b>{st.online}</b><small>en ligne</small></div>
              <div><b>{st.push}</b><small>notifs</small></div>
            </div>
            <div className="al-filters">{FILTERS.map(([k, l]) => <button key={k} className={k === filter ? 'on' : ''} onClick={() => setFilter(k)}>{l}</button>)}</div>
            <div className="al-list">
              {!byDay.length && <p className="al-empty">Rien sur cette période.</p>}
              {byDay.map(g => (
                <section key={g.day}>
                  <h2>{g.day}</h2>
                  {g.list.map((e, i) => (
                    <div key={i} className="al-row">
                      <span className="al-ico">{e.i}</span>
                      <p>{e.t}</p>
                      <time>{new Date(e.at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</time>
                    </div>
                  ))}
                </section>
              ))}
            </div>
          </>}
    </div>,
    document.body,
  )
}
