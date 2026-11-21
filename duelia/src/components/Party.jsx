// Duel quiz à plusieurs (2 à 4 joueurs) : salon, partie en direct, classement.
// Le serveur tient le chrono et compte les points ; l'appli l'interroge en continu.
import { useEffect, useRef, useState } from 'react'
import Avatar from './Avatar.jsx'
import Mascot from './Mascot.jsx'
import TopicIcon from './TopicIcon.jsx'
import QuestionText from './QuestionText.jsx'
import ConfirmButton from './ConfirmButton.jsx'
import * as api from '../lib/account.js'
import { sfx } from '../lib/sound.js'

const COLORS = ['#2ee6c5', '#ff4fd8', '#ffc940', '#5b9cff'] // une couleur par joueur

/* ---------- Invitation reçue ---------- */
export function PartyInviteBanner({ invite, onAccept, onDecline }) {
  const [busy, setBusy] = useState(false)
  return (
    <div className="sheet-backdrop">
      <div className="sheet invite-sheet" role="alertdialog" aria-labelledby="party-inv-title">
        <Avatar seed={invite.from.avatar} photo={invite.from.photo} size={80} ring="var(--opp)" />
        <h2 id="party-inv-title">👥 {invite.from.name} t'invite à une partie à plusieurs</h2>
        <div className="sheet-topic"><TopicIcon topic={{ id: invite.topic_id, ...invite.topic }} size={28} /> {invite.topic.name}</div>
        <button className="btn btn-primary wide" disabled={busy} onClick={async () => { setBusy(true); await onAccept(invite); setBusy(false) }}>{busy ? 'Connexion…' : 'Rejoindre'}</button>
        <button className="btn btn-ghost wide" onClick={() => onDecline(invite)}>Pas maintenant</button>
      </div>
    </div>
  )
}

/* ---------- Le salon puis la partie ---------- */
export function Party({ partyId, friends, onExit }) {
  const [view, setView] = useState(null)
  const [now, setNow] = useState(0)
  const [err, setErr] = useState(null)
  const [busy, setBusy] = useState(null)

  useEffect(() => {
    let alive = true, inflight = false
    const poll = async () => {
      if (inflight) return
      inflight = true
      try { const v = await api.getParty(partyId); if (alive && v) setView({ ...v, at: Date.now() }) } catch { /* réseau : on réessaie */ } finally { inflight = false }
    }
    poll()
    const a = setInterval(poll, 600)
    const b = setInterval(() => setNow(Date.now()), 200)
    return () => { alive = false; clearInterval(a); clearInterval(b) }
  }, [partyId])

  // sons : décompte, bonne ou mauvaise réponse à la révélation
  const phase = view?.clock?.phase, round = view?.clock?.round
  const prev = useRef('')
  useEffect(() => {
    const key = `${phase}:${round}`
    if (!view || key === prev.current) return
    prev.current = key
    if (phase === 'answer') sfx.tick()
    if (phase === 'reveal' && view.mine) (view.mine.pts > 0 ? sfx.good : sfx.bad)()
    if (phase === 'done' || view.status === 'done') sfx.win()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, round])

  if (!view) return <div className="screen party center"><Mascot pose="attente" size={200} /><p className="muted">Connexion à la partie…</p><button className="btn btn-ghost" onClick={onExit}>Retour</button></div>

  const players = view.players || []
  const colorOf = (pid) => COLORS[Math.max(0, players.findIndex(p => p.card.player_id === pid))] || COLORS[0]
  const leave = () => { api.leaveParty(partyId).catch(() => {}); onExit() }

  if (view.status === 'cancelled') {
    return <div className="screen party center"><Mascot pose="neutre" size={160} /><h2>Partie annulée</h2><button className="btn btn-primary" onClick={onExit}>Retour</button></div>
  }

  /* ----- Salon ----- */
  if (view.status === 'lobby') {
    const joined = players.filter(p => p.status === 'joined')
    const inParty = new Set(players.filter(p => p.status !== 'left').map(p => p.card.player_id))
    const full = players.filter(p => ['invited', 'joined'].includes(p.status)).length >= 4
    const host = players.find(p => p.is_host)
    const list = [...(friends || [])].filter(f => !inParty.has(f.player_id)).sort((a, b) => (b.online - a.online) || a.name.localeCompare(b.name))
    return (
      <div className="screen party lobby">
        <header className="top"><button className="back" onClick={leave} aria-label="Quitter">←</button><h1>Partie à plusieurs</h1></header>
        <div className="sheet-topic"><TopicIcon topic={{ id: view.topic_id, ...view.topic }} size={28} /> {view.topic.name}</div>
        <h3 className="sec-title">Joueurs <small>({joined.length}/4)</small></h3>
        <ul className="party-players">
          {players.filter(p => p.status !== 'left' && p.status !== 'declined').map((p, i) => (
            <li key={p.card.player_id} style={{ '--c': COLORS[i] }}>
              <Avatar seed={p.card.avatar} photo={p.card.photo} size={40} />
              <b>{p.card.name}{p.me ? ' (toi)' : ''}</b>
              <small>{p.is_host ? '👑 Hôte' : p.status === 'joined' ? '✓ Prêt' : '⏳ Invité…'}</small>
            </li>
          ))}
        </ul>
        {view.host ? <>
          {!full && <>
            <h3 className="sec-title">Inviter des amis</h3>
            {list.length === 0 && <p className="inbox-empty">Tous tes amis sont déjà invités, ou ta liste d'amis est vide.</p>}
            <ul className="pick-list">
              {list.map(f => (
                <li key={f.player_id}>
                  <button className="pick-friend" disabled={busy === f.player_id} onClick={async () => {
                    setBusy(f.player_id); setErr(null)
                    try { await api.inviteToParty(partyId, f.player_id) } catch { setErr('Invitation impossible.') }
                    setBusy(null)
                  }}>
                    <Avatar seed={f.avatar} photo={f.photo} size={40} ring={f.online ? 'var(--good, #3ddc84)' : undefined} />
                    <span className="pf-info"><b>{f.flag} {f.name}</b><small>{f.online ? '● En ligne' : 'Hors ligne · recevra une notification'}</small></span>
                    <i aria-hidden="true">{busy === f.player_id ? '…' : '＋'}</i>
                  </button>
                </li>
              ))}
            </ul>
          </>}
          {err && <p className="recover-err">{err}</p>}
          <div className="results-dock">
            <button className="btn btn-gold wide" style={{ gridColumn: '1 / -1' }} disabled={joined.length < 2} onClick={async () => {
              try { const v = await api.startParty(partyId); if (v) setView({ ...v, at: now }) } catch { setErr('Il faut au moins 2 joueurs prêts.') }
            }}>{joined.length < 2 ? 'En attente d\'au moins un ami…' : `⚡ Lancer la partie (${joined.length} joueurs)`}</button>
          </div>
        </> : (
          <div className="party-wait"><Mascot pose="attente" size={170} /><p>En attente que <b>{host?.card.name}</b> lance la partie…</p></div>
        )}
      </div>
    )
  }

  const clk = view.clock || {}
  const left = Math.max(0, (clk.left_ms || 0) - (now - view.at))
  const ranking = [...players].filter(p => p.status === 'joined' || p.score > 0).sort((a, b) => b.score - a.score)

  /* ----- Classement final ----- */
  if (view.status === 'done' || clk.phase === 'done') {
    const medals = ['🥇', '🥈', '🥉', '4ᵉ']
    const meFirst = ranking[0]?.me
    return (
      <div className="screen party-end">
        <Mascot pose={meFirst ? 'victoire' : 'egalite'} size={150} />
        <h1>{meFirst ? 'Victoire !' : 'Partie terminée'}</h1>
        <ol className="party-podium">
          {ranking.map((p, i) => (
            <li key={p.card.player_id} className={p.me ? 'me' : ''} style={{ '--c': colorOf(p.card.player_id) }}>
              <span className="pp-medal">{medals[i] || `${i + 1}ᵉ`}</span>
              <Avatar seed={p.card.avatar} photo={p.card.photo} size={44} />
              <b>{p.card.name}{p.me ? ' (toi)' : ''}</b>
              <span className="pp-score">{p.score} pts</span>
            </li>
          ))}
        </ol>
        <div className="results-dock"><button className="btn btn-primary wide" style={{ gridColumn: '1 / -1' }} onClick={onExit}>Terminer</button></div>
      </div>
    )
  }

  /* ----- Compte à rebours ----- */
  if (clk.phase === 'countdown') {
    const n = Math.ceil(left / 1000)
    return (
      <div className="duel countdown party-count">
        <Mascot pose="combat-anim" size={300} className="count-mascot" />
        <div className="party-vs">{ranking.map(p => <Avatar key={p.card.player_id} seed={p.card.avatar} photo={p.card.photo} size={48} ring={colorOf(p.card.player_id)} />)}</div>
        <div key={n} className={`count-num ${n <= 0 ? 'go' : ''}`}>{n <= 0 ? 'GO !' : n}</div>
      </div>
    )
  }

  /* ----- Question ----- */
  const q = view.question
  const reveal = clk.phase === 'reveal'
  const mine = view.mine
  const answers = view.answers || []
  const pickedBy = (i) => answers.filter(a => a.choice === i)
  const answer = async (i) => {
    if (mine || reveal) return
    sfx.tap()
    setView(v => ({ ...v, mine: { choice: i } }))
    try { const v = await api.partyAnswer(partyId, clk.round, i); if (v) setView({ ...v, at: now }) } catch { /* le prochain relevé dira */ }
  }
  return (
    <div className={`duel party-game ${reveal ? 'reveal' : ''}`}>
      <header className="party-top">
        <ConfirmButton className="lt-quit" onConfirm={leave} confirmLabel="Quitter ?">✕</ConfirmButton>
        <span className="party-round">Question {clk.round + 1}/{view.rounds}</span>
        <span className={`lt-timer ${left < 3500 && !reveal ? 'hurry' : ''}`}>{reveal ? '⏸' : Math.ceil(left / 1000)}</span>
      </header>
      <div className="party-board">
        {players.filter(p => p.status === 'joined').map(p => (
          <div key={p.card.player_id} className={`party-chip ${p.me ? 'me' : ''} ${p.answered && !reveal ? 'answered' : ''}`} style={{ '--c': colorOf(p.card.player_id) }}>
            <Avatar seed={p.card.avatar} photo={p.card.photo} size={32} />
            <span><b>{p.me ? 'Toi' : p.card.name}</b><small>{p.score} pts</small></span>
            {p.answered && !reveal && <i className="pc-done" aria-label="a répondu">✓</i>}
          </div>
        ))}
      </div>
      <h2 className="question"><QuestionText text={q?.q} /></h2>
      <div className="options">
        {q?.options.map((o, i) => {
          let cls = 'opt'
          if (mine?.choice === i) cls += reveal ? (i === q.correct ? ' ok' : ' ko') : ' picked'
          if (reveal && i === q.correct) cls += ' ok'
          if (reveal && i !== q.correct && mine?.choice !== i) cls += ' dim'
          return (
            <button key={i} className={cls} disabled={!!mine || reveal} onClick={() => answer(i)}>
              {o}
              {reveal && pickedBy(i).length > 0 && (
                <span className="party-picks">{pickedBy(i).map(a => {
                  const p = players.find(x => x.card.player_id === a.player_id)
                  return p && <span key={a.player_id} className="pp-pick" style={{ '--c': colorOf(a.player_id) }}><Avatar seed={p.card.avatar} photo={p.card.photo} size={22} />{a.pts > 0 ? `+${a.pts}` : ''}</span>
                })}</span>
              )}
            </button>
          )
        })}
      </div>
      {!reveal && mine && <p className="party-status">Réponse envoyée, on attend les autres…</p>}
    </div>
  )
}
