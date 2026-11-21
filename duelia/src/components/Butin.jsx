// « Le Butin » : mode coopératif à deux, chacun sur son téléphone.
import { useEffect, useRef, useState } from 'react'
import Avatar from './Avatar.jsx'
import Mascot from './Mascot.jsx'
import ConfirmButton from './ConfirmButton.jsx'
import * as api from '../lib/account.js'
import { gold, move, placed, rankFor, RANKS, START, ROUNDS } from '../lib/butin.js'
import { sfx } from '../lib/sound.js'

const LETTERS = ['A', 'B', 'C', 'D']

/* ---------- Accueil du mode : règles, choix du coéquipier, classement des duos ---------- */
export function ButinHome({ online, friends, onInvite, onBack, onAddFriend }) {
  const [board, setBoard] = useState(null)
  const [busy, setBusy] = useState(null)
  useEffect(() => {
    if (!online) return
    let alive = true
    api.getDuoBoard().then(b => { if (alive) setBoard(b) }).catch(() => {})
    return () => { alive = false }
  }, [online])
  const list = [...(friends || [])].sort((a, b) => (b.online - a.online) || a.name.localeCompare(b.name))
  return (
    <div className="screen butin-home">
      <header className="top"><button className="back" onClick={onBack} aria-label="Retour">←</button><h1>Le Butin</h1></header>
      <section className="butin-hero">
        <div className="butin-chest" aria-hidden="true">💰</div>
        <p><b>À deux, chacun sur son téléphone.</b> Vous partagez un trésor de <b>{gold(START)} pièces d'or</b> en {START} lingots.</p>
        <ol className="butin-rules">
          <li>À chaque question, répartissez ensemble vos lingots sur les réponses. Vous voyez en direct ce que fait l'autre.</li>
          <li>Il faut <b>toujours laisser au moins une réponse vide</b>. Les lingots non posés sont perdus.</li>
          <li>Le Kraken engloutit les lingots posés sur les mauvaises réponses. Survivez aux {ROUNDS} questions !</li>
        </ol>
      </section>

      <h3 className="sec-title">Choisis ton coéquipier</h3>
      {!online && <p className="inbox-empty">Ce mode se joue en ligne : vérifie ta connexion.</p>}
      {online && list.length === 0 && (
        <div className="inbox-empty">
          <p>Ajoute d'abord un ami pour chasser le trésor à deux.</p>
          <button className="btn btn-secondary wide" onClick={onAddFriend}>Ajouter un ami</button>
        </div>
      )}
      {online && list.length > 0 && (
        <ul className="pick-list">
          {list.map(f => (
            <li key={f.player_id}>
              <button className="pick-friend" disabled={!!busy} onClick={async () => { setBusy(f.player_id); try { await onInvite(f) } finally { setBusy(null) } }}>
                <Avatar seed={f.avatar} photo={f.photo} size={44} ring={f.online ? 'var(--good, #3ddc84)' : undefined} />
                <span className="pf-info"><b>{f.flag} {f.name}</b><small>{busy === f.player_id ? 'Invitation…' : f.online ? '● En ligne' : 'Hors ligne · recevra une notification'}</small></span>
                <i aria-hidden="true">›</i>
              </button>
            </li>
          ))}
        </ul>
      )}

      {board?.mine?.length > 0 && <>
        <h3 className="sec-title">Tes meilleurs butins</h3>
        <ul className="butin-board">
          {board.mine.map((x, i) => (
            <li key={i}><Avatar seed={x.partner.avatar} photo={x.partner.photo} size={32} /><span>avec <b>{x.partner.name}</b></span><b className="bb-gold">{rankFor(x.best)?.icon || '🦴'} {gold(x.best)}</b></li>
          ))}
        </ul>
      </>}
      {board?.top?.length > 0 && <>
        <h3 className="sec-title">Meilleurs duos</h3>
        <ol className="butin-board">
          {board.top.map((x, i) => (
            <li key={i} className={x.mine ? 'mine' : ''}>
              <span className="bb-rank">{i + 1}</span>
              <span className="bb-duo"><Avatar seed={x.a.avatar} photo={x.a.photo} size={28} /><Avatar seed={x.b.avatar} photo={x.b.photo} size={28} /></span>
              <span>{x.a.name} & {x.b.name}</span>
              <b className="bb-gold">{gold(x.best)}</b>
            </li>
          ))}
        </ol>
      </>}
    </div>
  )
}

/* ---------- Invitation reçue ---------- */
export function DuoInviteBanner({ invite, onAccept, onDecline }) {
  const [busy, setBusy] = useState(false)
  return (
    <div className="sheet-backdrop">
      <div className="sheet invite-sheet" role="alertdialog" aria-labelledby="duo-inv-title">
        <Avatar seed={invite.from.avatar} photo={invite.from.photo} size={80} ring="var(--gold)" />
        <h2 id="duo-inv-title">💰 {invite.from.name} t'invite au Butin</h2>
        <p className="sheet-sub">Chassez le trésor ensemble : vous répartissez vos lingots à deux, en direct.</p>
        <button className="btn btn-gold wide" disabled={busy} onClick={async () => { setBusy(true); await onAccept(invite); setBusy(false) }}>{busy ? 'Connexion…' : 'On y va !'}</button>
        <button className="btn btn-ghost wide" onClick={() => onDecline(invite)}>Pas maintenant</button>
      </div>
    </div>
  )
}

/* ---------- La partie ---------- */
export function ButinGame({ gameId, me, onExit, onReplay }) {
  const [view, setView] = useState(null) // état du serveur, avec l'heure de réception
  const [now, setNow] = useState(0)
  const [draft, setDraft] = useState(null) // { round, placement, at } : ce que je viens de faire, avant confirmation
  const [failed, setFailed] = useState(0)
  const queue = useRef(Promise.resolve())

  // Interroge le serveur en continu (la partie avance toute seule côté serveur)
  useEffect(() => {
    let alive = true, busy = false
    const poll = async () => {
      if (busy) return
      busy = true
      try {
        const v = await api.getDuo(gameId)
        if (alive && v) { setView({ ...v, at: Date.now() }); setFailed(0) }
      } catch { if (alive) setFailed(f => f + 1) } finally { busy = false }
    }
    poll()
    const a = setInterval(poll, 700)
    const b = setInterval(() => setNow(Date.now()), 250)
    return () => { alive = false; clearInterval(a); clearInterval(b) }
  }, [gameId])

  // Sons : révélation et fin
  const phaseKey = view ? `${view.status}:${view.round}:${view.phase}` : ''
  useEffect(() => {
    if (!view || view.phase !== 'reveal' || view.status !== 'playing') return
    const h = view.history?.[view.round]
    if (h) (h.kept === h.before ? sfx.good : h.kept > 0 ? sfx.good : sfx.bad)()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phaseKey])
  useEffect(() => {
    if (view?.status === 'done') (view.bank > 0 ? sfx.win : sfx.lose)()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view?.status])

  const send = (fn) => { queue.current = queue.current.then(fn).then(v => { if (v) setView({ ...v, at: Date.now() }) }).catch(() => {}) }

  if (!view) {
    return <div className="screen butin-game center"><Mascot pose="attente" size={200} /><p className="muted">{failed > 3 ? 'Connexion difficile…' : 'Connexion au trésor…'}</p><button className="btn btn-ghost" onClick={onExit}>Retour</button></div>
  }
  const partner = view.partner || { name: 'Ton coéquipier' }

  // Invitation envoyée : on attend la réponse
  if (view.status === 'invited' || ['declined', 'expired', 'cancelled'].includes(view.status)) {
    const left = Math.max(0, Math.ceil((60000 - (now - Date.parse(view.created_at || 0))) / 1000))
    const over = view.status !== 'invited'
    return (
      <div className="matchmaking butin-wait">
        <Avatar seed={partner.avatar} photo={partner.photo} size={96} ring="var(--gold)" />
        <h2>{partner.name}</h2>
        {!over && <Mascot pose="attente" size={220} className="radar-mascot wait" />}
        <p className="mm-status">{view.status === 'declined' ? `${partner.name} ne peut pas jouer maintenant.` : view.status === 'expired' ? `${partner.name} n'a pas répondu à temps.` : view.status === 'cancelled' ? 'Invitation annulée.' : `Invitation envoyée… ${left} s`}</p>
        {!over && <p className="mm-hint">{partner.name} a 60 secondes pour accepter.</p>}
        {!over
          ? <button className="btn btn-ghost" onClick={() => { api.leaveDuo(gameId).catch(() => {}); onExit() }}>Annuler</button>
          : <button className="btn btn-primary" onClick={onExit}>Retour</button>}
      </div>
    )
  }

  // Partie terminée
  if (view.status === 'done' || view.status === 'left') {
    const rank = rankFor(view.bank)
    return (
      <div className="screen butin-end">
        <Mascot pose={view.status === 'left' ? 'defaite' : view.bank > 0 ? 'victoire' : 'defaite'} size={170} />
        <h1>{view.status === 'left' ? (view.left_by_me ? 'Partie quittée' : `${partner.name} a quitté la partie`) : view.bank > 0 ? 'Trésor sauvé !' : 'Le Kraken a tout pris'}</h1>
        {view.status === 'done' && <>
          <div className="butin-final"><small>Butin final</small><b>🪙 {gold(view.bank)}</b><span>{rank ? `${rank.icon} ${rank.name}` : 'Rien à ramener cette fois…'}</span></div>
          <div className="butin-duo"><Avatar seed={me.avatar} photo={me.photo} size={56} ring="var(--me)" /><span>&</span><Avatar seed={partner.avatar} photo={partner.photo} size={56} ring="var(--gold)" /></div>
          <ol className="butin-history">
            {view.history.map((h, i) => (
              <li key={i}><span>Q{i + 1}</span><i style={{ width: `${(h.kept / START) * 100}%` }} /><b className={h.kept === h.before ? 'ok' : h.kept ? 'mid' : 'ko'}>{h.kept}/{h.before}</b></li>
            ))}
          </ol>
          <p className="butin-ranks">{RANKS.map(r => <span key={r.min} className={view.bank >= r.min ? 'on' : ''}>{r.icon}</span>)}</p>
        </>}
        <div className="results-dock">
          <button className="btn btn-gold" onClick={() => onReplay(partner)}>Rejouer ensemble</button>
          <button className="btn btn-secondary" onClick={onExit}>Terminer</button>
        </div>
      </div>
    )
  }

  // En jeu
  const q = view.question
  const reveal = view.phase === 'reveal'
  const useDraft = draft && draft.round === view.round && !reveal && now - draft.at < 1500
  const placement = useDraft ? draft.placement : view.placement
  const free = view.bank - placed(placement)
  const left = Math.max(0, view.left_ms - (now - view.at))
  const secs = Math.ceil(left / 1000)
  const h = reveal ? view.history?.[view.round] : null
  const lost = h ? h.before - h.kept : 0

  const edit = (idx, delta) => {
    if (reveal) return
    const next = move(placement, idx, delta, view.bank)
    if (next === placement) { navigator.vibrate?.(30); return }
    sfx.tap()
    setDraft({ round: view.round, placement: next, at: now })
    send(() => api.duoPlace(gameId, view.round, next))
  }
  const clearAll = () => {
    const next = placement.map(() => 0)
    setDraft({ round: view.round, placement: next, at: now })
    send(() => api.duoPlace(gameId, view.round, next))
  }

  return (
    <div className={`butin-game ${reveal ? 'reveal' : ''}`}>
      <img className="duel-deco" src="/decor/tentacules.webp" alt="" aria-hidden="true" draggable="false" />
      <header className="bg-top">
        <ConfirmButton className="bg-quit" onConfirm={() => { api.leaveDuo(gameId).catch(() => {}); onExit() }} confirmLabel="Quitter ?">✕</ConfirmButton>
        <div className="bg-round">Question {view.round + 1}/{view.rounds}</div>
        <div className={`bg-timer ${secs <= 10 && !reveal ? 'hurry' : ''}`}>{reveal ? '⏸' : secs}</div>
      </header>

      <div className="bg-treasure">
        <small>Votre trésor</small>
        <b>🪙 {gold(view.bank)}</b>
        <div className="bg-bars" aria-hidden="true">{Array.from({ length: START }, (_, i) => <i key={i} className={i < view.bank ? 'on' : ''} />)}</div>
      </div>

      <div className="bg-team">
        <span className={`bg-mate ${view.ready_me ? 'ready' : ''}`}><Avatar seed={me.avatar} photo={me.photo} size={34} ring="var(--me)" />Toi {view.ready_me ? '✓' : ''}</span>
        <span className={`bg-mate ${view.ready_partner ? 'ready' : ''}`}><Avatar seed={partner.avatar} photo={partner.photo} size={34} ring="var(--gold)" />{partner.name} {view.ready_partner ? '✓' : ''}</span>
      </div>

      {q?.topic && <div className="bg-topic">{q.topic.icon} {q.topic.name}</div>}
      <h2 className="bg-question">{q?.q}</h2>

      <div className="bg-options">
        {q?.options.map((o, i) => {
          const n = placement[i] || 0
          const cls = reveal ? (i === q.correct ? 'ok' : n ? 'sunk' : 'dim') : n ? 'has' : ''
          return (
            <div key={i} className={`bg-opt ${cls}`}>
              <button className="bg-opt-main" onClick={() => edit(i, 1)} disabled={reveal}>
                <span className="bg-letter">{LETTERS[i]}</span>
                <span className="bg-text">{o}</span>
                <span className="bg-stack" aria-label={`${n} lingots`}>{n > 0 && <><i className="ingot" />×{n}</>}</span>
              </button>
              {!reveal && <div className="bg-steps">
                <button onClick={() => edit(i, -1)} disabled={!n} aria-label="Retirer un lingot">−</button>
                <button onClick={() => edit(i, 5)} disabled={!free} aria-label="Ajouter cinq lingots">+5</button>
              </div>}
            </div>
          )
        })}
      </div>

      {!reveal ? (
        <div className="bg-dock">
          <p className={`bg-free ${free ? 'warn' : ''}`}>
            {free ? <>Encore <b>{free} lingot{free > 1 ? 's' : ''}</b> à poser : sinon ils seront perdus.</> : 'Tous les lingots sont posés.'}
            {placed(placement) > 0 && <button className="link-btn" onClick={clearAll}>tout reprendre</button>}
          </p>
          <button className={`btn ${view.ready_me ? 'btn-ghost' : 'btn-gold'} wide`} onClick={() => send(() => api.duoReady(gameId, view.round, !view.ready_me))}>
            {view.ready_me ? (view.ready_partner ? 'C\'est parti…' : `En attente de ${partner.name}… (annuler)`) : view.ready_partner ? `${partner.name} est prêt·e : on valide !` : 'On valide ✓'}
          </button>
        </div>
      ) : (
        <div className="bg-dock bg-verdict" role="status">
          {lost === 0 ? <b className="good">Rien perdu ! Bien joué 🎉</b>
            : h.kept === 0 ? <b className="bad">Le Kraken a tout englouti… 🐙</b>
              : <b className="bad">Le Kraken a englouti {gold(lost)} pièces</b>}
          <small>{view.bank > 0 && view.round + 1 < view.rounds ? 'Question suivante dans un instant…' : 'Fin de la chasse au trésor…'}</small>
        </div>
      )}
    </div>
  )
}
