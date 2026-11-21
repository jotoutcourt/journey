// « Le Butin » : mode coopératif à deux, chacun sur son téléphone.
import { useEffect, useRef, useState } from 'react'
import Avatar from './Avatar.jsx'
import Mascot from './Mascot.jsx'
import ConfirmButton from './ConfirmButton.jsx'
import * as api from '../lib/account.js'
import { gold, move, placed, rankFor, RANKS, START, ROUNDS } from '../lib/butin.js'
import { sfx } from '../lib/sound.js'
import { useDuoVoice } from '../lib/voice.js'

const LETTERS = ['A', 'B', 'C', 'D']

// Ce que dit le Kraken à la révélation
const HAPPY = ['Hé hé, ça c\'est à moi !', 'Merci pour l\'or, petits voleurs !', 'Une caisse de plus pour moi !', 'Je savais que vous vous tromperiez !']
const GLEE = ['Mwahaha ! Tout est à moi !', 'Rendez-moi tout… voilà, c\'est fait !', 'Vous pensiez vraiment m\'avoir ?', 'Mon trésor, mon précieux trésor !']
const SAD = ['Grrr… rien dans mes tentacules !', 'Comment ont-ils su ?!', 'Ce n\'est que partie remise…', 'Rendez-moi mon or, voleurs !']

// Tentacule qui surgit du pont pour reprendre les lingots d'une mauvaise réponse
function Tentacle() {
  return (
    <svg className="tentacle" viewBox="0 0 60 150" aria-hidden="true">
      <defs>
        <linearGradient id="tg" x1="0" x2="1"><stop offset="0" stopColor="#7a35e0" /><stop offset="0.5" stopColor="#b276ff" /><stop offset="1" stopColor="#6a2bd1" /></linearGradient>
      </defs>
      <path d="M14 150 C 10 110, 6 80, 14 52 C 20 30, 40 18, 46 30 C 52 42, 40 52, 32 46 C 26 41, 30 34, 36 36 C 30 44, 28 70, 34 100 C 38 120, 42 136, 44 150 Z" fill="url(#tg)" stroke="#4a1a99" strokeWidth="2" />
      {[[22, 120], [20, 100], [19, 80], [22, 62], [30, 48]].map(([x, y], i) => <circle key={i} cx={x + 8} cy={y} r={4 - i * 0.4} fill="#e2c6ff" stroke="#7a35e0" strokeWidth="1" />)}
    </svg>
  )
}

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
  useEffect(() => { ['/decor/butin-fond.webp', '/decor/tentacule-anim.webp'].forEach(src => { new Image().src = src }) }, [])
  const list = [...(friends || [])].sort((a, b) => (b.online - a.online) || a.name.localeCompare(b.name))
  return (
    <div className="screen butin-home">
      <header className="top"><button className="back" onClick={onBack} aria-label="Retour">←</button><h1>Le Butin</h1></header>
      <section className="butin-hero">
        <Mascot pose="pirate-anim" size={230} className="butin-pirate" />
        <p><b>Volez le trésor du Kraken, à deux !</b> Vous venez de lui dérober <b>{START} lingots d'or</b>… mais il veut les récupérer.</p>
        <ol className="butin-rules">
          <li>À chaque question, cachez ensemble vos lingots dans les caisses des réponses. Chacun voit en direct ce que fait l'autre.</li>
          <li>Il faut <b>toujours laisser au moins une caisse vide</b>. Les lingots non cachés sont repris.</li>
          <li>Ses tentacules fouillent les caisses des mauvaises réponses et reprennent l'or. Tenez {ROUNDS} questions pour repartir avec le butin !</li>
        </ol>
      </section>

      <h3 className="sec-title">Choisis ton coéquipier</h3>
      {!online && <p className="inbox-empty">Ce mode se joue en ligne : vérifie ta connexion.</p>}
      {online && list.length === 0 && (
        <div className="inbox-empty">
          <p>Ajoute d'abord un ami pour voler le trésor à deux.</p>
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
        <Mascot pose="pirate" size={110} />
        <h2 id="duo-inv-title">💰 {invite.from.name} t'invite au Butin</h2>
        <p className="sheet-sub">Volez le trésor du Kraken ensemble : vous cachez vos lingots à deux, en direct.</p>
        <button className="btn btn-gold wide" disabled={busy} onClick={async () => { setBusy(true); await onAccept(invite); setBusy(false) }}>{busy ? 'Connexion…' : 'On y va !'}</button>
        <button className="btn btn-ghost wide" onClick={() => onDecline(invite)}>Pas maintenant</button>
      </div>
    </div>
  )
}

/* ---------- Micro : parler à son coéquipier ---------- */
function VoiceBar({ voice, partner, compact, hangUp }) {
  const { mic, link, partnerMic, needTap, toggleMic, unlock, hang } = voice
  const label = compact
    ? { off: '🎙️ Micro', asking: '🎙️…', on: '🎙️ On', muted: '🔇 Off', denied: '🎙️ ✕', unsupported: '🎙️ ✕' }[mic]
    : { off: '🎙️ Activer mon micro', asking: '🎙️ Autorisation…', on: '🎙️ Micro ouvert', muted: '🔇 Micro coupé', denied: '🎙️ Micro refusé', unsupported: '🎙️ Indisponible' }[mic]
  let note = null
  if (mic === 'denied') note = 'Autorise le micro pour Kraken dans les réglages du téléphone (Safari › Micro), puis réessaie.'
  else if (mic === 'unsupported') note = 'Ce navigateur ne permet pas la voix.'
  else if (link === 'failed') note = 'Connexion vocale impossible sur ce réseau (essayez en Wi-Fi).'
  else if ((mic === 'on' || mic === 'muted') && link !== 'connected') note = partnerMic ? 'Connexion de la voix…' : `En attente du micro de ${partner.name}…`
  return (
    <div className={`voice-bar ${compact ? 'compact' : ''}`}>
      <button className={`voice-btn ${mic}`} onClick={toggleMic} disabled={mic === 'asking' || mic === 'unsupported'} aria-label={mic === 'on' ? 'Couper mon micro' : 'Activer mon micro'}>{label}</button>
      {hangUp && (mic === 'on' || mic === 'muted') && <button className="voice-btn hang" onClick={hang}>📞 Raccrocher</button>}
      {needTap && <button className="voice-btn tap" onClick={unlock}>🔊 Entendre {partner.name}</button>}
      {note && <small className="voice-note">{note}</small>}
    </div>
  )
}

/* ---------- La partie ---------- */
export function ButinGame({ gameId, me, onExit, onReplay, replayInvite, onAcceptReplay }) {
  const [state, setView] = useState(null) // état du serveur, avec l'heure de réception
  // la partie affichée est toujours celle demandée (le composant reste monté d'une partie à l'autre pour garder la voix)
  const view = state && state.id === gameId ? state : null
  // canal vocal : celui de la première partie avec ce coéquipier, conservé quand on rejoue ensemble
  const [room, setRoom] = useState(null)
  const [now, setNow] = useState(0)
  const [draft, setDraft] = useState(null) // { round, placement, at } : ce que je viens de faire, avant confirmation
  const [failed, setFailed] = useState(0)
  const queue = useRef(Promise.resolve())
  const voice = useDuoVoice(room?.id, room ? !room.host : true, !!room)

  // Interroge le serveur en continu (la partie avance toute seule côté serveur)
  useEffect(() => {
    let alive = true, busy = false
    const poll = async () => {
      if (busy) return
      busy = true
      try {
        const v = await api.getDuo(gameId)
        if (alive && v) {
          setView({ ...v, at: Date.now() }); setFailed(0)
          if (['playing', 'done'].includes(v.status) && v.voice_id) setRoom(r => (r && r.id === v.voice_id ? r : { id: v.voice_id, host: !!v.voice_host }))
        }
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
        {room && <VoiceBar voice={voice} partner={partner} hangUp />}
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
        {/* le Kraken est le méchant : il boude quand vous repartez avec de l'or, il jubile quand il a tout récupéré */}
        <Mascot pose={view.status === 'left' ? 'neutre' : view.bank > 0 ? 'defaite' : 'victoire'} size={170} />
        <h1>{view.status === 'left' ? (view.left_by_me ? 'Partie quittée' : `${partner.name} a quitté la partie`) : view.bank > 0 ? 'Butin volé !' : 'Le Kraken a tout récupéré'}</h1>
        {view.status === 'done' && <p className="kraken-says">{view.bank > 0 ? (view.bank >= START ? '« Tout… vous m\'avez TOUT pris ?! »' : '« Grrr… la prochaine fois, je reprends tout ! »') : '« Mwahaha ! Mon or reste avec moi ! »'}</p>}
        {view.status === 'done' && <>
          <div className="butin-final"><small>Butin final</small><b><i className="ingot" /> {gold(view.bank)}</b><span>{rank ? `${rank.icon} ${rank.name}` : 'Rien à ramener cette fois…'}</span></div>
          <div className="butin-duo"><Avatar seed={me.avatar} photo={me.photo} size={56} ring="var(--me)" /><span>&</span><Avatar seed={partner.avatar} photo={partner.photo} size={56} ring="var(--gold)" /></div>
          <VoiceBar voice={voice} partner={partner} hangUp />
          <ol className="butin-history">
            {view.history.map((h, i) => (
              <li key={i}><span>Q{i + 1}</span><i style={{ width: `${(h.kept / START) * 100}%` }} /><b className={h.kept === h.before ? 'ok' : h.kept ? 'mid' : 'ko'}>{h.kept}/{h.before}</b></li>
            ))}
          </ol>
          <p className="butin-ranks">{RANKS.map(r => <span key={r.min} className={view.bank >= r.min ? 'on' : ''}>{r.icon}</span>)}</p>
        </>}
        <div className="results-dock">
          {replayInvite && replayInvite.from?.player_id === partner.player_id
            ? <button className="btn btn-gold" onClick={() => onAcceptReplay(replayInvite)}>🔁 {partner.name} veut rejouer : go !</button>
            : <button className="btn btn-gold" onClick={() => onReplay(partner, room?.id)}>Rejouer ensemble</button>}
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

  const micIcon = { on: '🎙️', muted: '🔇', asking: '⏳', denied: '🚫', unsupported: '🚫' }[voice.mic] || '🎙️'
  const voiceNote = voice.mic === 'denied' ? 'Micro refusé : autorise-le dans les réglages du téléphone (Safari › Micro).'
    : voice.link === 'failed' ? 'Connexion vocale impossible sur ce réseau (essayez en Wi-Fi).'
      : (voice.mic === 'on' || voice.mic === 'muted') && voice.link !== 'connected' ? (voice.partnerMic ? 'Connexion de la voix…' : `En attente du micro de ${partner.name}…`) : null

  return (
    <div className={`butin-game loot ${reveal ? 'reveal' : ''}`}>
      <header className="lt-top">
        <ConfirmButton className="lt-quit" onConfirm={() => { api.leaveDuo(gameId).catch(() => {}); onExit() }} confirmLabel="Quitter ?">✕</ConfirmButton>
        <div className="lt-bank">
          <small>Votre butin</small>
          <b><i className="lt-coin" aria-hidden="true" />{gold(view.bank)}</b>
        </div>
        <div className={`lt-timer ${secs <= 10 && !reveal ? 'hurry' : ''}`}>{reveal ? '⏸' : secs}</div>
      </header>

      <div className="lt-team">
        <div className={`lt-player me ${view.ready_me ? 'ready' : ''} ${voice.speaking.me ? 'speaking' : ''}`}>
          <Avatar seed={me.avatar} photo={me.photo} size={30} />
          <span>Toi{view.ready_me ? ' ✓' : ''}</span>
          <button className={`lt-mic ${voice.mic}`} onClick={voice.toggleMic} disabled={voice.mic === 'asking' || voice.mic === 'unsupported'}
            aria-label={voice.mic === 'on' ? 'Couper mon micro' : 'Activer mon micro'}>{micIcon}</button>
        </div>
        <div className={`lt-player mate ${view.ready_partner ? 'ready' : ''} ${voice.speaking.partner ? 'speaking' : ''}`}>
          <Avatar seed={partner.avatar} photo={partner.photo} size={30} />
          <span>{partner.name}{view.ready_partner ? ' ✓' : ''}</span>
          {voice.partnerMic && <i className="lt-mic-on" aria-label="Micro ouvert">🎙️</i>}
        </div>
      </div>
      {(voiceNote || voice.needTap) && (
        <p className="lt-voice-note">{voiceNote}{voice.needTap && <button className="link-btn" onClick={voice.unlock}>🔊 entendre {partner.name}</button>}</p>
      )}

      <div className="lt-topic">Question {view.round + 1}/{view.rounds}{q?.topic ? ` · ${q.topic.icon} ${q.topic.name}` : ''}</div>
      <h2 className="lt-question">{q?.q}</h2>

      {/* Les tentacules du Kraken rôdent derrière les caisses */}
      <div className="lt-stage">
        <div className="lt-tentacles" aria-hidden="true">
          <img className="real-tentacle tl" src="/decor/tentacule-anim.webp" alt="" draggable="false" />
          <img className="real-tentacle tr" src="/decor/tentacule-anim.webp" alt="" draggable="false" />
        </div>
        <div className={`lt-grid n${q?.options.length || 4}`}>
          {q?.options.map((o, i) => {
            const n = placement[i] || 0
            const cls = reveal ? (i === q.correct ? 'ok' : n ? 'sunk' : 'open') : n ? 'has' : ''
            return (
              <div key={i} className={`lt-card ${cls}`}>
                <button className="lt-card-main" onClick={() => edit(i, 1)} disabled={reveal} aria-label={`${LETTERS[i]} : ${o}, ${n} lingots. Toucher pour ajouter un lingot`}>
                  <span className="lt-head"><span className="lt-letter">{LETTERS[i]}</span><span className="lt-text">{o}</span></span>
                  <span className="lt-tray">
                    <span className="lt-gold" aria-hidden="true">
                      {Array.from({ length: n }, (_, k) => <i key={k} className="lt-ingot" style={{ '--k': k }} />)}
                    </span>
                    {n > 0 && <span className="lt-count">{n}</span>}
                    <Tentacle />
                  </span>
                </button>
                {!reveal && <>
                  <button className="lt-step minus" onClick={() => edit(i, -1)} disabled={!n} aria-label="Retirer un lingot">−</button>
                  <button className="lt-step plus" onClick={() => edit(i, 5)} disabled={!free} aria-label="Ajouter cinq lingots">+5</button>
                </>}
              </div>
            )
          })}
        </div>
      </div>

      {!reveal ? (
        <div className="lt-dock">
          <p className={`lt-free ${free ? 'warn' : ''}`}>
            {free ? <>Encore <b>{free} lingot{free > 1 ? 's' : ''}</b> à cacher, sinon le Kraken les reprend.</> : 'Tous les lingots sont cachés.'}
            {placed(placement) > 0 && <button className="link-btn" onClick={clearAll}>tout reprendre</button>}
          </p>
          <button className={`btn ${view.ready_me ? 'btn-ghost' : 'btn-gold'} wide`} onClick={() => send(() => api.duoReady(gameId, view.round, !view.ready_me))}>
            {view.ready_me ? (view.ready_partner ? 'C\'est parti…' : `En attente de ${partner.name}… (annuler)`) : view.ready_partner ? `${partner.name} est prêt·e : on valide !` : 'On valide ✓'}
          </button>
        </div>
      ) : (
        <div className={`lt-dock lt-bubble ${lost ? 'happy' : 'sad'}`} role="status">
          <Mascot pose={lost ? 'pirate' : 'defaite'} size={86} className="lt-bubble-kraken" />
          <div>
            <b>{lost === 0 ? 'Rien repris ! Bien joué 🎉' : h.kept === 0 ? <>Le Kraken reprend <em>tout</em></> : <>Le Kraken reprend <em>{gold(lost)}</em></>}</b>
            <small>« {(lost === 0 ? SAD : h.kept === 0 ? GLEE : HAPPY)[view.round % 4]} »</small>
          </div>
        </div>
      )}
    </div>
  )
}
