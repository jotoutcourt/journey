// La Traque du Kraken : salon (invitations, robots, spécialités) puis plateau en direct.
// Le serveur tient tout le jeu ; l'appli l'interroge chaque seconde et anime ce qui change.
import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import Avatar from './Avatar.jsx'
import TopicIcon from './TopicIcon.jsx'
import QuestionText from './QuestionText.jsx'
import ConfirmButton from './ConfirmButton.jsx'
import { ResinPawn } from './PawnCollection.jsx'
import * as api from '../lib/account.js'
import { sfx } from '../lib/sound.js'
import { useGroupVoice } from '../lib/groupVoice.js'
import { BOARD_PTS, BOARD_RATIO } from '../lib/traqueBoard.js'
import { SEAT_COLORS, pickGeneral, FREE_PAWNS, PAWN_PRICE, ITEMS, ITEM_COST, CELL_ICON, CELL_LABEL, buildPool, topicMeta, randomTopics, PAWNS, pawnImg } from '../lib/traque.js'

const errText = (e) => (e?.message || '').replace(/^.*?: /, '') || 'Pas de connexion.'

/* ---------- Invitation reçue ---------- */
export function TraqueInviteBanner({ invite, onAccept, onDecline }) {
  const [busy, setBusy] = useState(false)
  return (
    <div className="sheet-backdrop">
      <div className="sheet invite-sheet" role="alertdialog" aria-labelledby="tq-inv-title">
        <Avatar seed={invite.from.avatar} photo={invite.from.photo} size={80} ring="var(--opp)" />
        <h2 id="tq-inv-title">🐙 {invite.from.name} t'invite à la Chasse au Kraken</h2>
        <p className="sheet-sub">Un jeu de plateau en direct, jusqu'à 4 joueurs : le premier à tuer le Kraken vole son trésor.</p>
        <button className="btn btn-primary wide" disabled={busy} onClick={async () => { setBusy(true); await onAccept(invite); setBusy(false) }}>{busy ? 'Connexion…' : 'Rejoindre'}</button>
        <button className="btn btn-ghost wide" onClick={() => onDecline(invite)}>Pas maintenant</button>
      </div>
    </div>
  )
}

/* ---------- Écran principal ---------- */
export function Traque({ gameId, topics, friends = [], onExit, onWallet }) {
  const [v, setV] = useState(null)
  const [err, setErr] = useState(null)
  const [toast, setToast] = useState(null)
  const verRef = useRef(-1)
  const officials = useMemo(() => topics.filter(t => t.official && t.questions.length >= 30 && !t.questions[0]?.img), [topics])

  useEffect(() => {
    let alive = true, inflight = false
    const poll = async () => {
      if (inflight || document.hidden) return
      inflight = true
      try {
        const nv = await api.getTraque(gameId)
        if (!alive) return
        if (!nv) { setErr('Cette partie n\'existe plus.'); return }
        if (nv.version !== verRef.current || nv.data?.left_ms != null) { verRef.current = nv.version; setV(nv) }
        setErr(null)
      } catch { if (alive) setErr('Connexion perdue… on réessaie.') } finally { inflight = false }
    }
    poll()
    const iv = setInterval(poll, 1000)
    return () => { alive = false; clearInterval(iv) }
  }, [gameId])

  const act = async (fn) => {
    try { const nv = await fn(); if (nv) { verRef.current = nv.version; setV(nv) } }
    catch (e) { setToast(errText(e)); setTimeout(() => setToast(null), 2600) }
  }

  // vocal : ouvert dès le salon et gardé pendant toute la partie (chacun raccroche quand il veut à la fin)
  const [hungUp, setHungUp] = useState(false)
  const meP = v?.players.find(p => p.seat === v.me)
  const peers = v ? v.players.filter(p => p.player_id && p.seat !== v.me && p.status === 'joined').map(p => p.player_id) : []
  const voice = useGroupVoice(gameId, meP?.player_id, peers, !!v && ['lobby', 'playing', 'paused', 'done'].includes(v.status) && !hungUp && !!meP && peers.length > 0)
  const vc = { voice, peers, hungUp, onHangUp: () => setHungUp(true) }

  // fin de partie : le portefeuille se met à jour
  useEffect(() => { if (v?.status === 'done') onWallet?.() }, [v?.status]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!v) return <div className="screen traque center"><div className="spinner" /><p className="muted">{err || 'Plongée vers le Kraken…'}</p></div>
  if (v.status === 'cancelled') return (
    <div className="screen traque center"><p>La partie a été annulée.</p><button className="btn btn-primary" onClick={onExit}>Retour</button></div>
  )
  const body = v.status === 'paused'
    ? <PausedRoom v={v} gameId={gameId} act={act} onExit={onExit} vc={vc} />
    : v.status === 'lobby'
    ? <TraqueLobby v={v} gameId={gameId} officials={officials} topics={topics} friends={friends} act={act} onExit={onExit} onWallet={onWallet} vc={vc} />
    : <TraqueBoard v={v} gameId={gameId} act={act} onExit={onExit} vc={vc} />
  return <>{body}{toast && <div className="toast" role="status">{toast}</div>}</>
}

/* ---------- Partie en pause : on attend que tout le monde revienne ---------- */
function PausedRoom({ v, gameId, act, onExit, vc }) {
  const { voice, peers } = vc
  const back = v.back || []
  const humans = v.players.filter(p => p.player_id && p.status === 'joined')
  const meBack = back.includes(v.me)
  const [now] = useState(() => Date.now())
  const days = v.paused_at ? Math.max(0, 7 - Math.floor((now - Date.parse(v.paused_at)) / 86400000)) : 7
  return (
    <div className="screen traque lobby">
      <header className="top">
        <button className="icon-btn" onClick={onExit} aria-label="Plus tard">←</button>
        <h1>Partie en pause</h1>
      </header>
      <p className="tq-pitch">Tour {v.round} · trésor de {v.treasure} lingots. La chasse reprend dès que tout le monde est revenu{days < 7 ? ` (encore ${days} jour${days > 1 ? 's' : ''})` : ''}.</p>
      <ul className="tq-seats">
        {humans.map(p => (
          <li key={p.seat} style={{ '--c': SEAT_COLORS[p.seat] }} className={voice.speaking[p.seat === v.me ? 'me' : p.player_id] ? 'speaking' : ''}>
            <img className="tq-seat-pawn" src={pawnImg(p.pawn, p.seat)} alt="" />
            <div className="tq-seat-txt"><b>{bare(p.name)}{p.seat === v.me ? ' (toi)' : ''}</b>
              <small>{back.includes(p.seat) ? '✅ Prêt à reprendre' : p.seat === v.me ? '⏸️ En pause' : '⏳ Pas encore revenu'} · case {p.pos} · {p.pearls} perles</small></div>
          </li>
        ))}
      </ul>
      {peers.length > 0 && <div className="tq-lobby-voice">
        <button className={`tq-round-btn mic ${voice.mic}`} onClick={voice.toggleMic} disabled={voice.mic === 'asking' || voice.mic === 'unsupported'} aria-label="Micro">
          {{ on: '🎙️', muted: '🔇', asking: '⏳', denied: '🚫', unsupported: '🚫' }[voice.mic] || '🎙️'}</button>
        <span><b>Vocal</b><small>Discutez en attendant les autres.</small></span>
        {voice.needTap && <button className="btn btn-small btn-ghost" onClick={voice.unlock}>🔊 Entendre</button>}
      </div>}
      <div className="tq-dock">
        {!meBack
          ? <button className="kh-play wide" onClick={() => act(() => api.traqueBack(gameId))}>▶️ Je suis prêt à reprendre</button>
          : v.host && back.length < humans.length
          ? <ConfirmButton className="kh-play wide" onConfirm={() => act(() => api.traqueResumeNow(gameId))} confirmLabel="Les absents seront joués par des robots, sûr ?">▶️ Reprendre sans les absents</ConfirmButton>
          : <p className="tq-wait">{back.length < humans.length ? '⏳ La chasse reprend dès que tout le monde est là.' : '▶️ C\'est reparti !'}</p>}
      </div>
    </div>
  )
}

/* ---------- Salon ---------- */
function TraqueLobby({ v, gameId, officials, topics, friends, act, onExit, onWallet, vc }) {
  const { voice, peers } = vc
  // figurines achetées par le joueur (les 4 premières sont offertes)
  const [owned, setOwned] = useState(null)
  const [buying, setBuying] = useState(false)
  const [buyErr, setBuyErr] = useState('')
  const [won, setWon] = useState(null)
  useEffect(() => { api.myPawns().then(r => setOwned(Array.isArray(r) ? r : [])).catch(() => setOwned([])) }, [])
  const hasPawn = (id) => FREE_PAWNS.includes(id) || (owned || []).includes(id)
  const lockedLeft = PAWNS.filter(pw => !hasPawn(pw.id)).length
  async function buy() {
    setBuyErr(''); setBuying(true)
    try {
      const r = await api.buyRandomPawn()
      setOwned(Array.isArray(r?.pawns) ? r.pawns : []); setBuying(false); onWallet?.()
      setWon(PAWNS.find(pw => pw.id === r.pawn) || null)
      await act(() => api.setTraquePawn(gameId, r.pawn).then(() => api.getTraque(gameId)))
    } catch (e) { setBuying(false); setBuyErr(/lingots/.test(e?.message || '') ? 'Pas assez de lingots 😕' : 'Achat impossible, réessaie.') }
  }
  const [picking, setPicking] = useState(false)
  const [inviting, setInviting] = useState(false)
  const [botLevel, setBotLevel] = useState(null)
  const [starting, setStarting] = useState(false)
  const me = v.players.find(p => p.seat === v.me)
  const seats = [0, 1, 2, 3, 4, 5, 6, 7].map(s => v.players.find(p => p.seat === s && p.status !== 'declined'))
  const active = v.players.filter(p => ['joined', 'bot'].includes(p.status))
  const ready = active.length >= 2 && active.every(p => p.topics?.length === 3)

  async function start() {
    setStarting(true)
    // spécialités connues de l'hôte : les siennes et celles des robots (celles des autres joueurs sont secrètes, ils envoient eux-mêmes leurs questions)
    const specs = [...new Set(active.flatMap(p => p.topics.map(t => t.id)).filter(Boolean))]
    const general = pickGeneral(topics, specs)
    const ids = [...new Set([...specs, ...general])]
    const meta = Object.fromEntries(ids.map(id => topics.find(t => t.id === id)).filter(Boolean).map(t => [t.id, topicMeta(t)]))
    await act(() => api.startTraque(gameId, meta, general, buildPool(topics, ids)))
    setStarting(false)
  }

  const myPawn = me?.pawn || PAWNS[v.me % PAWNS.length].id
  const [pawnSheet, setPawnSheet] = useState(false)
  const [seatMenu, setSeatMenu] = useState(false)
  return (
    <div className="screen traque lobby tq-lobby2">
      <header className="top">
        <QuitButton className="icon-btn" label="←" onQuit={() => { api.leaveTraque(gameId).catch(() => {}); onExit() }} />
        <h1>La Chasse au Kraken</h1>
      </header>
      <p className="tq-pitch">De 2 à 8 joueurs : remplissez le trésor pendant les trêves… et soyez le premier à tuer le Kraken pour tout rafler.</p>

      {/* 8 places en carrés */}
      <ul className="tq-seats8">
        {seats.map((p, s) => (
          <li key={s} style={{ '--c': SEAT_COLORS[s] }} className={`${p ? '' : 'empty'} ${p?.player_id && (p.seat === v.me ? voice.speaking.me : voice.speaking[p.player_id]) ? 'speaking' : ''}`}>
            {p ? <>
              {p.bot ? <img className="ts-pawn" src={pawnImg(p.pawn, p.seat)} alt="" /> : <span className="ts-av"><Avatar seed={p.avatar} photo={p.photo} size={40} /><img className="ts-mini" src={pawnImg(p.pawn, p.seat)} alt="" /></span>}
              <b>{p.seat === v.me ? 'Toi' : bare(p.name).split(' ')[0]}</b>
              <small>{p.status === 'invited' ? '⏳ invité' : p.topics?.length === 3 ? (p.bot ? `🤖 ${p.bot}` : '✅ prêt') : '✏️ choisit'}</small>
              {v.host && s !== 0 && <button className="ts-x" aria-label="Retirer" onClick={() => act(() => api.removeTraqueSeat(gameId, s).then(() => api.getTraque(gameId)))}>×</button>}
            </> : v.host
              ? <button className="ts-add" onClick={() => setSeatMenu(true)} aria-label="Ajouter un joueur">+</button>
              : <small className="muted">libre</small>}
          </li>
        ))}
      </ul>

      {/* vocal dès le salon : on discute en attendant le lancement */}
      <div className="tq-lobby-voice compact">
        {peers.length > 0 ? <>
          <button className={`tq-round-btn mic ${voice.mic}`} onClick={voice.toggleMic} disabled={voice.mic === 'asking' || voice.mic === 'unsupported'} aria-label="Micro">
            {{ on: '🎙️', muted: '🔇', asking: '⏳', denied: '🚫', unsupported: '🚫' }[voice.mic] || '🎙️'}</button>
          <span><b>{voice.mic === 'on' ? 'Micro allumé' : voice.mic === 'muted' ? 'Micro coupé' : voice.mic === 'denied' ? 'Micro refusé' : 'Vocal du salon'}</b>
            <small>{voice.mic === 'denied' ? 'Autorise le micro dans les réglages.' : 'Discutez en attendant le lancement.'}</small></span>
          {voice.needTap && <button className="btn btn-small btn-ghost" onClick={voice.unlock}>🔊</button>}
        </> : <span><b>🎙️ Vocal du salon</b><small>Il s'active dès qu'un ami a rejoint.</small></span>}
      </div>

      <h3 className="tq-ready-title">Pour être paré, choisis ton pion et tes spécialités</h3>
      <div className="tq-two">
        <button className="tq-sq" onClick={() => setPawnSheet(true)}>
          <span className="tq-sq-art"><ResinPawn id={myPawn} /></span>
          <b>Mon pion</b><small>{PAWNS.find(x => x.id === myPawn)?.name}</small>
        </button>
        <button className={`tq-sq ${me?.topics?.length === 3 ? '' : 'todo'}`} onClick={() => setPicking(true)}>
          <span className="tq-sq-art topics">{me?.topics?.length === 3 ? me.topics.map(t => <TopicIcon key={t.id} topic={t} size={42} />) : <em>3</em>}</span>
          <b>Mes spécialités</b><small>{me?.topics?.length === 3 ? me.topics.map(t => t.name).join(' · ') : 'À choisir'}</small>
        </button>
      </div>

      <div className="tq-dock">
        {v.host
          ? <button className="kh-play wide" disabled={!ready || starting} onClick={start}>{starting ? 'Préparation du plateau…' : ready ? '🐙 Lancer la chasse' : active.length < 2 ? 'Ajoute un ami ou un robot' : 'En attente des spécialités…'}</button>
          : <p className="tq-wait">⏳ L'hôte lance la partie dès que tout le monde est prêt.</p>}
      </div>

      {seatMenu && (
        <div className="sheet-backdrop tq-top" onClick={() => setSeatMenu(false)}>
          <div className="sheet" onClick={e => e.stopPropagation()}>
            <h2>Ajouter un joueur</h2>
            <button className="btn btn-gold wide" onClick={() => { setSeatMenu(false); setInviting(true) }}>👥 Inviter un ami</button>
            <button className="btn btn-secondary wide" style={{ marginTop: 8 }} onClick={() => { setSeatMenu(false); setBotLevel('pick') }}>🤖 Ajouter un robot</button>
            <button className="btn btn-ghost wide" onClick={() => setSeatMenu(false)}>Annuler</button>
          </div>
        </div>
      )}
      {pawnSheet && (
        <div className="sheet-backdrop tq-top" onClick={() => setPawnSheet(false)}>
          <div className="sheet tq-pawn-sheet" onClick={e => e.stopPropagation()}>
            <h2>Mon pion</h2>
            <div className="tq-pawn-grid">
              {PAWNS.map(pw => {
                const taken = v.players.find(p => p.pawn === pw.id && p.seat !== v.me && ['joined', 'bot', 'invited'].includes(p.status))
                const mineOk = hasPawn(pw.id)
                return (
                  <button key={pw.id} className={`${myPawn === pw.id ? 'on' : ''} ${mineOk ? '' : 'locked'}`} disabled={!!taken || !mineOk}
                    title={taken ? `Prise par ${taken.name}` : mineOk ? pw.name : 'Figurine mystère'}
                    onClick={() => act(() => api.setTraquePawn(gameId, pw.id).then(() => api.getTraque(gameId)))}>
                    <img src={pw.img} alt={mineOk ? pw.name : 'Figurine mystère'} />
                    <small>{mineOk ? pw.name : '???'}</small>
                  </button>
                )
              })}
            </div>
            {owned && lockedLeft > 0 && <div className="tq-pawn-buy on">
              <span className="tq-mystery">🎁</span>
              <span><b>Figurine mystère</b><small>{buyErr || `Une figurine au hasard parmi les ${lockedLeft} que tu n'as pas encore.`}</small></span>
              <button className="btn btn-small btn-gold" disabled={buying} onClick={buy}><i className="lt-coin" aria-hidden="true" /> {PAWN_PRICE}</button>
            </div>}
            <button className="btn btn-ghost wide" onClick={() => setPawnSheet(false)}>Fermer</button>
          </div>
        </div>
      )}
      {won && <Gumball pawn={won} onClose={() => setWon(null)} />}
      {picking && <TopicPicker officials={officials} initial={me?.topics || []} onCancel={() => setPicking(false)}
        onDone={(list) => { setPicking(false); act(() => api.setTraqueTopics(gameId, list, buildPool(topics, list.map(t => t.id))).then(() => api.getTraque(gameId))) }} />}
      {inviting && (
        <div className="sheet-backdrop" onClick={() => setInviting(false)}>
          <div className="sheet" onClick={e => e.stopPropagation()}>
            <h2>Inviter un ami</h2>
            {friends.length === 0 && <p className="muted">Ajoute d'abord des amis dans l'onglet Amis.</p>}
            <ul className="tq-friends">
              {friends.filter(f => !v.players.some(p => p.player_id === f.player_id && ['invited', 'joined'].includes(p.status))).map(f => (
                <li key={f.player_id}><button onClick={() => { setInviting(false); act(() => api.inviteTraque(gameId, f.player_id).then(() => api.getTraque(gameId))) }}>
                  <Avatar seed={f.avatar} photo={f.photo} size={34} /><span>{f.name}</span>{f.online && <i className="tq-online" />}
                </button></li>
              ))}
            </ul>
            <button className="btn btn-ghost wide" onClick={() => setInviting(false)}>Fermer</button>
          </div>
        </div>
      )}
      {botLevel && (
        <div className="sheet-backdrop" onClick={() => setBotLevel(null)}>
          <div className="sheet" onClick={e => e.stopPropagation()}>
            <h2>🤖 Niveau du robot</h2>
            {[['facile', 'Facile', 'Se trompe souvent (45 % de bonnes réponses)'], ['moyen', 'Moyen', 'Un joueur correct (65 %)'], ['expert', 'Expert', 'Redoutable (85 %)']].map(([k, n, d]) => (
              <button key={k} className="tq-level" onClick={() => { setBotLevel(null); act(() => api.addTraqueBot(gameId, k, randomTopics(officials)).then(() => api.getTraque(gameId))) }}>
                <b>{n}</b><small>{d}</small>
              </button>
            ))}
            <button className="btn btn-ghost wide" onClick={() => setBotLevel(null)}>Annuler</button>
          </div>
        </div>
      )}
    </div>
  )
}

function TopicPicker({ officials, initial, onDone, onCancel }) {
  const [sel, setSel] = useState(initial.map(t => t.id))
  const [q, setQ] = useState('')
  const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  const list = officials.filter(t => !q || norm(t.name).includes(norm(q)))
  const toggle = (id) => setSel(s => s.includes(id) ? s.filter(x => x !== id) : s.length >= 3 ? s : [...s, id])
  return (
    <div className="sheet-backdrop" onClick={onCancel}>
      <div className="sheet tq-picker" onClick={e => e.stopPropagation()}>
        <h2>Choisis 3 spécialités ({sel.length}/3)</h2>
        <input className="search" placeholder="Rechercher un thème…" value={q} onChange={e => setQ(e.target.value)} />
        <div className="tq-pick-grid">
          {list.map(t => (
            <button key={t.id} className={`tq-pick ${sel.includes(t.id) ? 'on' : ''}`} onClick={() => toggle(t.id)}>
              <TopicIcon topic={t} size={34} /><span>{t.name}</span>
            </button>
          ))}
        </div>
        <button className="btn btn-primary wide" disabled={sel.length !== 3} onClick={() => onDone(sel.map(id => topicMeta(officials.find(t => t.id === id))))}>Valider</button>
      </div>
    </div>
  )
}

/* ---------- Plateau ---------- */
function useTicker(ms, deps) {
  const [left, setLeft] = useState(ms)
  useEffect(() => {
    if (ms == null) return
    const end = Date.now() + ms
    const iv = setInterval(() => setLeft(Math.max(0, end - Date.now())), 200)
    return () => clearInterval(iv)
  }, deps) // eslint-disable-line react-hooks/exhaustive-deps
  return ms == null ? null : left
}

function TraqueBoard({ v, gameId, act, onExit, vc }) {
  const [bag, setBag] = useState(false)
  const [target, setTarget] = useState(null) // objet en attente d'une cible
  const me = v.players.find(p => p.seat === v.me)
  const turnP = v.players.find(p => p.seat === v.turn)
  const myTurn = v.turn === v.me
  const d = v.data || {}
  const left = useTicker(d.left_ms, [v.version, v.phase, d.idx, d.reveal])
  // annonce en grand quand quelqu'un utilise un objet (vol, ancre, échange, double dé)
  const [flash, setFlash] = useState(null)
  const seenFlash = useRef(null)
  const fl = d.flash
  useEffect(() => {
    if (!fl?.id || seenFlash.current === fl.id) return
    seenFlash.current = fl.id
    setTimeout(() => setFlash(fl), 0)
    setTimeout(() => setFlash(x => (x?.id === fl.id ? null : x)), 4000)
  }, [fl])
  // voix : une connexion vers chaque autre joueur humain encore là
  // la voix reste ouverte après la victoire, pour débriefer : chacun raccroche quand il veut
  const { voice, peers, hungUp, onHangUp } = vc

  // animation des pions : on avance case par case
  const [shown, setShown] = useState(() => Object.fromEntries(v.players.map(p => [p.seat, p.pos])))
  // après un lancer normal : on montre d'abord le dé, il disparaît, puis le pion avance
  const rolled = v.phase === 'show' && (v.data?.dice || []).length > 0
  const [diceOn, setDiceOn] = useState(false)
  useEffect(() => {
    if (!rolled) return
    setTimeout(() => setDiceOn(true), 0)
    const id = setTimeout(() => setDiceOn(false), 1300)
    return () => clearTimeout(id)
  }, [v.version, rolled])
  useEffect(() => {
    const goal = Object.fromEntries(v.players.map(p => [p.seat, p.pos]))
    let iv = null
    const go = () => { iv = setInterval(() => {
      setShown(cur => {
        let moved = false
        const next = { ...cur }
        for (const s in goal) {
          const c = next[s] ?? goal[s]
          if (c !== goal[s]) { next[s] = c + Math.sign(goal[s] - c); moved = true }
        }
        if (!moved) clearInterval(iv)
        return moved ? next : cur
      })
    }, 170) }
    const wait = setTimeout(go, rolled ? 1400 : 0)
    return () => { clearTimeout(wait); clearInterval(iv) }
  }, [v.version]) // eslint-disable-line react-hooks/exhaustive-deps

  // un « tok » à chaque case franchie par un pion
  const prevShown = useRef(shown)
  useEffect(() => {
    const before = prevShown.current
    prevShown.current = shown
    if (before !== shown && Object.keys(shown).some(k => before[k] !== undefined && before[k] !== shown[k])) { try { sfx.step?.() } catch { /* son facultatif */ } }
  }, [shown])

  // petits sons
  const lastPhase = useRef(null)
  useEffect(() => {
    if (lastPhase.current === v.phase + d.idx + d.reveal) return
    lastPhase.current = v.phase + d.idx + d.reveal
    try {
      if (v.phase === 'show') sfx.dice?.()
      if (v.phase === 'quiz' && d.reveal) (d.ans?.[v.me]?.[d.idx]?.[0] === d.c ? sfx.good : sfx.bad)?.()
      if (v.phase === 'done') sfx.levelUp?.()
    } catch { /* sons facultatifs */ }
  }, [v.phase, d.idx, d.reveal]) // eslint-disable-line react-hooks/exhaustive-deps

  const topicOf = (id) => v.topics?.[id] || { id, name: id }
  const owners = (id) => v.players.filter(p => p.topics?.some(t => t.id === id)).map(p => p.seat)

  return (
    <div className="screen traque game">
      <PathBoard v={v} shown={shown} topicOf={topicOf} owners={owners} zoom={rolled && !diceOn} />

      {/* HUD du haut : une colonne propre, sans chevauchement */}
      <i className="tq-veil" aria-hidden="true" />
      <div className="tq-hud">
      <div className="tq-hud-top">
        <div className="tq-me-card" style={{ '--c': SEAT_COLORS[v.me] }}>
          <span className="tq-ring"><Avatar seed={me?.avatar} photo={me?.photo} size={38} /></span>
          <div><b>{me?.name}</b><small><Pearl /> {me?.pearls ?? 0} · case {me?.pos ?? 0}{me?.items?.length ? ` · 🎒 ${me.items.length}` : ''}{me?.bubble ? ' · 🫧' : ''}{me?.ghost ? ' · 👻 fantôme' : ''}</small></div>
        </div>
        <div className="tq-hud-right">
          <div className="tq-treasure" title="Trésor du Kraken"><span><img src="/traque/ico/case-chest.webp" alt="" /> <b>{v.treasure}</b></span></div>
          {peers.length > 0 && <button className={`tq-round-btn mic ${voice.mic}`} onClick={voice.toggleMic} disabled={voice.mic === 'asking' || voice.mic === 'unsupported'} aria-label="Micro">
            {{ on: '🎙️', muted: '🔇', asking: '⏳', denied: '🚫', unsupported: '🚫' }[voice.mic] || '🎙️'}</button>}
          {v.status === 'playing' && !v.pause && <button className="tq-round-btn" aria-label="Reprendre plus tard" title="Reprendre plus tard"
            disabled={v.phase !== 'roll'} onClick={() => act(() => api.traquePauseAsk(gameId))}>⏸️</button>}
          <QuitButton className="tq-round-btn" label="✕" inGame onQuit={() => { api.leaveTraque(gameId).catch(() => {}); onExit() }} />
        </div>
      </div>
      <div className="tq-banner">
        {v.phase === 'haunt' && myTurn ? <><b>👻 À toi de hanter !</b><small>Choisis un joueur : il reculera du résultat du dé{left != null ? ` · ${Math.ceil(left / 1000)} s` : ''}</small></>
          : v.phase === 'haunt' ? <><b>👻 {bare(turnP?.name)} hante le plateau…</b><small>Qui va reculer ?</small></>
          : v.phase === 'roll' && myTurn ? <><b>À toi de jouer !</b><small>Lance le dé pour avancer{left != null ? ` · ${Math.ceil(left / 1000)} s` : ''}</small></>
          : v.phase === 'done' ? <b>Partie terminée</b>
          : <><b style={{ color: SEAT_COLORS[v.turn] }}>{myTurn ? 'Ton tour' : `Au tour de ${turnP?.name?.replace(/ \((facile|moyen|expert)\)$/, '') || '…'}`}</b><small>{bare((v.log || []).slice(-1)[0]?.t)}</small></>}
      </div>
      <ul className="tq-others">
        {v.players.filter(p => p.status !== 'declined' && p.seat !== v.me).map(p => (
          <li key={p.seat} style={{ '--c': SEAT_COLORS[p.seat] }} className={`${p.seat === v.turn ? 'turn' : ''} ${p.status === 'left' ? 'gone' : ''} ${voice.speaking[p.player_id] ? 'speaking' : ''}`}>
            {p.bot ? <img src={pawnImg(p.pawn, p.seat)} alt="" /> : <Avatar seed={p.avatar} photo={p.photo} size={26} />}
            <span><b>{p.name.replace(/ \((facile|moyen|expert)\)$/, '')}</b><small><Pearl /> {p.pearls} · {p.pos}{p.skip ? ' ⚓' : ''}{voice.peerMic[p.player_id] ? ' 🎙️' : ''}</small></span>
          </li>
        ))}
      </ul>
      </div>
      {voice.needTap && <button className="link-btn tq-tap" onClick={voice.unlock}>🔊 Touche ici pour entendre les autres</button>}
      {v.pause && v.status === 'playing' && (
        (v.pause.yes || []).includes(v.me)
          ? <div className="tq-pause-ask mine">⏸️ Pause proposée · en attente des autres joueurs…</div>
          : <div className="tq-pause-ask">
              <b>⏸️ {bare(v.players.find(p => p.seat === v.pause.by)?.name)} propose de reprendre la partie plus tard</b>
              <small>Tout est sauvegardé, la partie vous attendra 7 jours.</small>
              <span><button className="btn btn-small btn-gold" onClick={() => act(() => api.traquePauseVote(gameId, true))}>D'accord</button>
                <button className="btn btn-small btn-ghost" onClick={() => act(() => api.traquePauseVote(gameId, false))}>On continue</button></span>
            </div>)}

      {/* HUD du bas */}
      <div className="tq-hud-bottom">
        <div className="tq-round-card"><img src="/mascotte/pirate.webp" alt="" /><span><b>Tour {v.round}</b><small>{v.players.length} joueurs</small></span></div>
        <div className="tq-hud-actions">
          {v.phase === 'roll' && myTurn && <>
            <button className="tq-round-btn bag" onClick={() => setBag(true)} disabled={!me?.items?.length} aria-label="Mon sac"><img src="/traque/ico/case-shop.webp" alt="" /><i>{me?.items?.length || 0}</i></button>
            <button className="tq-dice-btn" onClick={() => act(() => api.traqueRoll(gameId))}><Die /><b>Lancer le dé</b></button>
          </>}
        </div>
      </div>

      {flash && <div className="tq-flash" key={flash.id} onClick={() => setFlash(null)}>
        <Obj k={flash.k} />
        <p>{bare(flash.t).replace(/^\S+ /, '')}{flash.to === v.me && <b>{{ vol: 'On t\'a volé ! 😱', ancre: 'Tu passes ton prochain tour…', echange: 'Ta place a changé !' }[flash.k]}</b>}</p>
      </div>}

      {/* Moments forts au centre de l'écran */}
      {v.phase === 'show' && diceOn && (d.dice || []).length > 0 && <div className="tq-center"><div className="tq-dice">{d.dice.map((n, i) => <DieFace key={i} n={n} />)}</div></div>}
      {v.phase === 'event' && (d.reveal ? <Reveal ids={d.reveal} topicOf={topicOf} /> : d.fx?.duel ? <DuelDice key={d.text} v={v} d={d} /> : <EventView key={d.text} d={d} />)}
      {v.phase === 'haunt' && d.seat === v.me && <Haunt v={v} onPick={(s) => act(() => api.traqueHaunt(gameId, s))} />}
      {v.phase === 'pick' && <Cursed v={v} d={d} left={left} onPick={(i) => act(() => api.traqueCursed(gameId, i))} />}
      {v.phase === 'duelroll' && <DuelResult key={`${d.winner}-${d.loser}`} v={v} d={d} onRoll={() => act(() => api.traqueRoll(gameId))} />}

      {v.phase === 'intro' && <Intro v={v} d={d} left={left} topicOf={topicOf} onReady={() => act(() => api.traqueReady(gameId))} />}
      {v.phase === 'shop' && <Shop v={v} d={d} me={me} left={left} onBuy={(k) => act(() => api.traqueBuy(gameId, k))} onLeave={() => act(() => api.traqueShopLeave(gameId))} />}
      {v.phase === 'quiz' && <div className="tq-quiz-wrap"><Quiz v={v} d={d} left={left} me={me} topicOf={topicOf} onAnswer={(i) => act(() => api.traqueAnswer(gameId, d.idx, i))}
        onJoker={() => act(() => api.traqueUse(gameId, 'joker'))} /></div>}
      {v.phase === 'done' && <div className="tq-quiz-wrap"><Finale v={v} onExit={onExit} voice={peers.length > 0 && !hungUp ? voice : null} onHangUp={onHangUp} /></div>}

      {bag && <Bag me={me} v={v} onClose={() => setBag(false)}
        onUse={(k) => { if (ITEMS[k].target) { setTarget(k); setBag(false) } else { setBag(false); act(() => api.traqueUse(gameId, k)) } }} />}
      {target && (
        <div className="sheet-backdrop" onClick={() => setTarget(null)}>
          <div className="sheet" onClick={e => e.stopPropagation()}>
            <h2><Obj k={target} /> {ITEMS[target].name} : sur qui ?</h2>
            {v.players.filter(p => p.seat !== v.me && ['joined', 'bot', 'left'].includes(p.status)).map(p => (
              <button key={p.seat} className="tq-level" style={{ '--c': SEAT_COLORS[p.seat] }} onClick={() => { const k = target; setTarget(null); act(() => api.traqueUse(gameId, k, p.seat)) }}>
                <b>{p.name}</b><small>case {p.pos} · <Pearl /> {p.pearls}</small>
              </button>
            ))}
            <button className="btn btn-ghost wide" onClick={() => setTarget(null)}>Annuler</button>
          </div>
        </div>
      )}
    </div>
  )
}

// Plateau illustré : les cases sont posées sur les emplacements peints de l'image
function PathBoard({ v, shown, topicOf, owners, zoom }) {
  const ref = useRef(null)
  const touchedAt = useRef(0)
  const last = BOARD_PTS.length - 1
  const at = (i) => BOARD_PTS[Math.min(last, Math.max(0, i))]
  const followSeat = v.phase === 'duelroll' ? v.data?.loser : v.data?.seat ?? v.turn
  const followPos = shown[followSeat] ?? v.players.find(p => p.seat === followSeat)?.pos ?? 0
  // la caméra suit le pion qui bouge, sauf si on vient de faire défiler soi-même
  useEffect(() => {
    const el = ref.current
    if (!el || Date.now() - touchedAt.current < 4000) return
    const track = el.firstChild
    const [x, y] = at(followPos)
    el.scrollTo({ left: Math.max(0, x * track.offsetWidth - el.clientWidth / 2), top: Math.max(0, y * track.offsetHeight - el.clientHeight * 0.55), behavior: touchedAt.current ? 'smooth' : 'auto' })
    if (!touchedAt.current) touchedAt.current = 1
  }, [followPos, followSeat]) // eslint-disable-line react-hooks/exhaustive-deps
  const mark = () => { touchedAt.current = Date.now() }
  // lancer normal : la caméra zoome sur le pion pendant qu'il avance, puis revient à la normale
  const [zx, zy] = at(followPos)
  return (
    <div className="tq-path" ref={ref} onTouchStart={mark} onWheel={mark} onPointerDown={mark}>
      <div className={`tq-track ${zoom ? 'zoom' : ''}`} style={{ aspectRatio: BOARD_RATIO, transformOrigin: `${zx * 100}% ${zy * 100}%` }}>
        {/* décor : tentacules qui sortent de l'eau, requin qui dort à côté de sa case */}
        <img className="tq-deco tent l" src="/traque/deco-tentacule.webp" alt="" style={{ left: '1%', top: '60%' }} />
        <img className="tq-deco tent r" src="/traque/deco-tentacule.webp" alt="" style={{ left: '84%', top: '45%' }} />
        {(() => {
          const k = (v.board || []).findIndex(c => c.t === 'shark')
          if (k < 0) return null
          const [x, y] = at(k)
          return <img className="tq-deco shark" src="/traque/requin-dort.webp" alt="" style={{ left: x < 0.5 ? '2%' : '80%', top: `${y * 100 - 2}%` }} />
        })()}
        {v.board.slice(0, BOARD_PTS.length).map((c, i) => {
          if (c.t === 'lair') return null
          const [x, y] = at(i)
          const t = c.topic ? topicOf(c.topic) : null
          const own = c.t === 'spec' ? owners(c.topic) : []
          return (
            <Fragment key={i}>
              {/* teinte fondue dans la pierre peinte (garde les reflets et l'ombre de l'illustration) */}
              {c.t !== 'general' && <i className={`tq-tint t-${c.t}`} style={{ left: `${x * 100}%`, top: `${y * 100}%`, '--oc': own.length ? SEAT_COLORS[own[0]] : undefined }} />}
              <div className={`tq-slot t-${c.t}`} style={{ left: `${x * 100}%`, top: `${y * 100}%`, '--oc': own.length ? SEAT_COLORS[own[0]] : undefined }}
                title={c.t === 'spec' || c.t === 'general' ? `${CELL_LABEL[c.t]} · ${t?.name}` : CELL_LABEL[c.t]}>
                {CASE_IMG.has(c.t) ? <img className="tq-cimg" src={`/traque/ico/case-${c.t}.webp`} alt="" draggable="false" /> : <span className="tq-ico">{CELL_ICON[c.t] ?? '?'}</span>}
                {c.t === 'spec' && t?.icon && <span className="tq-tile-topic">{t.icon}</span>}
              </div>
            </Fragment>
          )
        })}
        {v.players.filter(p => p.status !== 'declined').map((p, _, all) => {
          const pos = shown[p.seat] ?? p.pos
          const [x, y] = at(pos)
          // seul sur sa case : pile au centre
          const mates = all.filter(q => (shown[q.seat] ?? q.pos) === pos)
          const k = mates.findIndex(q => q.seat === p.seat)
          // plusieurs pions sur la même case : simplement côte à côte (un socle d'écart), centrés sur la case
          const off = [(k - (mates.length - 1) / 2) * Math.min(6.4, 30 / mates.length), 0]
          return <img key={p.seat} src={pawnImg(p.pawn, p.seat)} alt="" className={`tq-figure ${p.seat === v.turn ? 'active' : ''} ${p.ghost ? 'ghost' : ''}`}
            style={{ '--c': SEAT_COLORS[p.seat], left: `${x * 100 + off[0]}%`, top: `${y * 100 + off[1]}%` }} />
        })}
      </div>
    </div>
  )
}

// Cadre illustré (coraux, bulles) : titre dans la plaque du haut, contenu au centre, bouton dans la plaque du bas
// Dé en relief (faces à points)
const TITLE_IMG = { duel: '/traque/titre-duel.webp', truce: '/traque/titre-treve.webp', final: '/traque/titre-final2.webp' }
const bare = (s) => (s || '').replace(/ \((facile|moyen|expert)\)/g, '')
const Pearl = () => <img className="tq-pearl" src="/traque/perle.webp" alt="perles" />

// Résultat du dé : la face vierge illustrée + les points
const PIPS = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] }
function DieFace({ n }) {
  return <span className="tq-dieface" aria-label={`Dé : ${n}`}>{Array.from({ length: 9 }, (_, i) => <i key={i} className={PIPS[n]?.includes(i) ? 'on' : ''} />)}</span>
}

function Die() {
  return <img className="tq-die-img" src="/traque/de.webp" alt="" draggable="false" />
}
const CASE_IMG = new Set(['general', 'spec', 'truce', 'chest', 'current', 'tentacle', 'shortcut', 'shop', 'crab', 'bubble', 'cursed', 'puffer', 'whirl', 'shark'])
const OBJ_IMG = ['double', 'ancre', 'joker', 'vol', 'echange']
const Obj = ({ k }) => OBJ_IMG.includes(k) ? <img className="tq-obj" src={`/traque/ico/obj-${k}.webp`} alt="" draggable="false" /> : <span className="tq-obj tq-obj-emo">{ITEMS[k]?.icon || '❔'}</span>

function Frame({ img = '/traque/cadre-duel.webp', title, children, cta, onClose, className = '', badge, hero }) {
  return (
    <div className={`tq-frame ${className}`}>
      <div className="tq-frame-in">{children}</div>
      <img className="tq-frame-img" src={img} alt="" draggable="false" />
      {badge && <img className="tq-frame-badge" src={badge} alt="" draggable="false" />}
      {hero && <div className="tq-frame-hero">{hero}</div>}
      {title && <div className="tq-frame-title">{title}</div>}
      {cta && <div className="tq-frame-cta">{cta}</div>}
      <button className="tq-frame-x" onClick={onClose} aria-label="Fermer" />
    </div>
  )
}

function Intro(props) {
  if (props.d.kind === 'duel') return <DuelIntro {...props} />
  return <IntroFrame {...props} />
}

// Annonce de duel : éclair, tonnerre, les deux figurines en grand face à face
function DuelIntro({ v, d, left, topicOf, onReady }) {
  const t = topicOf(d.topic)
  const [a, b] = (d.seats || []).map(s => v.players.find(p => p.seat === s))
  const ready = d.ready || []
  const mine = d.seats?.includes(v.me)
  useEffect(() => { const id = setTimeout(() => { try { sfx.thunder?.() } catch { /* son facultatif */ } }, 250); return () => clearTimeout(id) }, [])
  const side = (p, cls) => p && (
    <div className={`dz-side ${cls}`} style={{ '--c': SEAT_COLORS[p.seat] }}>
      <ResinPawn id={p.pawn || PAWNS[p.seat % PAWNS.length].id} />
      <b>{p.seat === v.me ? 'Toi' : bare(p.name)}{ready.includes(p.seat) || p.bot ? ' ✓' : ''}</b>
    </div>
  )
  return (
    <div className="tq-center dz">
      <i className="dz-flash" />
      <svg className="dz-bolt" viewBox="0 0 60 140" aria-hidden="true"><path d="M38 0 8 78h20L14 140 52 52H32L46 0z" /></svg>
      <img className="dz-title" src="/traque/titre-duel.webp" alt="Duel !" />
      <div className="dz-topic"><TopicIcon topic={t} size={30} /> {t.name}</div>
      <div className="dz-arena">{side(a, 'l')}<span className="dz-vs">VS</span>{side(b, 'r')}</div>
      <p className="dz-rule">{d.count} questions · le perdant recule</p>
      {mine && !ready.includes(v.me)
        ? <button className="kh-play dz-go" onClick={onReady}>Je suis prêt ! ⚡{left != null ? ` ${Math.ceil(left / 1000)} s` : ''}</button>
        : <p className="dz-wait">{mine ? 'En attente de l\'adversaire…' : 'Tu regardes le duel'}{left != null ? ` · ${Math.ceil(left / 1000)} s` : ''}</p>}
    </div>
  )
}

function IntroFrame({ v, d, left, topicOf, onReady }) {
  const t = topicOf(d.topic)
  const who = (d.seats || []).map(s => v.players.find(p => p.seat === s)).filter(Boolean)
  const mine = d.seats?.includes(v.me)
  const ready = d.ready || []
  const reason = d.ctx?.reason
  const info = d.kind === 'duel' ? ['⚔️', 'Duel !', `${d.count} questions · le perdant recule`]
    : d.kind === 'truce' ? ['🤝', 'Trêve !', `${d.count} questions ensemble · on remplit le trésor`]
    : d.kind === 'final' ? ['🐙', 'Combat final !', '4 bonnes réponses sur 5 pour tuer le Kraken']
    : reason === 'own' ? ['⭐', 'Ta spécialité !', 'Réussis : +3 cases et +3 perles']
    : reason === 'shortcut' ? ['🚪', 'Raccourci !', 'Réussis : tu sautes 5 cases']
    : reason === 'shark' ? ['🦈', 'Le requin !', '2 questions de survie : une seule bonne réponse suffit pour lui échapper']
    : ['❓', 'Question !', 'Juste : +2 perles · faux : -1 case']
  const [nope, setNope] = useState(false)
  return (
    <div className="tq-center dim">
      <div className="tq-intro-stack">
      {TITLE_IMG[d.kind] && <img className="tq-title-img" src={TITLE_IMG[d.kind]} alt={info[1]} />}
      <Frame className={`k-${d.kind} ${d.kind === 'solo' ? 'solo' : ''}`} title={d.kind === 'solo' ? null : TITLE_IMG[d.kind] ? t.name : info[1]}
        hero={d.kind === 'solo' && who[0] ? <ResinPawn id={who[0].pawn || PAWNS[who[0].seat % PAWNS.length].id} className="tq-hero" /> : null}
        badge={d.kind !== 'solo' ? null : reason === 'shark' ? '/traque/requin-attaque.webp' : `/traque/ico/case-${reason === 'own' ? 'spec' : reason === 'shortcut' ? 'shortcut' : 'general'}.webp`}
        onClose={() => { setNope(true); setTimeout(() => setNope(false), 2200) }}
        cta={mine && !ready.includes(v.me)
          ? <button onClick={onReady}>Je suis prêt ! ⚡{left != null ? ` ${Math.ceil(left / 1000)} s` : ''}</button>
          : <span>{mine ? 'En attente des autres…' : 'Tu regardes'}{left != null ? ` · ${Math.ceil(left / 1000)} s` : ''}</span>}>
        {!TITLE_IMG[d.kind] && <div className={`tq-intro-topic ${d.kind === 'solo' ? 'big' : ''}`}><TopicIcon topic={t} size={d.kind === 'solo' ? 40 : 22} /> {t.name}</div>}
        {d.kind !== 'solo' && <div className={`tq-intro-who n${who.length}`}>
          {who.map((p, i) => <span key={p.seat} style={{ '--c': SEAT_COLORS[p.seat] }} className={ready.includes(p.seat) || p.bot ? 'ok' : ''}>
            {i > 0 && d.kind === 'duel' && <em>VS</em>}
            <img src={pawnImg(p.pawn, p.seat)} alt="" /><small>{p.seat === v.me ? 'Toi' : p.name.replace(/ \((facile|moyen|expert)\)$/, '').split(' ')[0]}{ready.includes(p.seat) || p.bot ? ' ✓' : ''}</small>
          </span>)}
        </div>}
        <p className="tq-intro-txt">{info[2]}</p>
        {nope && <p className="tq-nope">On ne fuit pas le Kraken 😈</p>}
      </Frame>
      </div>
    </div>
  )
}

function Quiz({ v, d, left, me, topicOf, onAnswer, onJoker }) {
  // combat final : on compte les coups portés au Kraken (4 bonnes réponses pour le tuer)
  const [hitMap, setHitMap] = useState({})
  const hitNow = d.kind === 'final' && d.reveal && d.ans?.[d.seats?.[0]]?.[d.idx]?.[0] === d.c
  const hits = Object.entries(hitMap).filter(([k, x]) => x && Number(k) !== d.idx).length + (hitNow ? 1 : 0)
  // trêve : lingots gagnés sur cette question (1 par bonne réponse, +2 si tout le monde a juste)
  const goldNow = d.kind === 'truce' && d.reveal ? (() => { const ok = (d.seats || []).filter(s => d.ans?.[s]?.[d.idx]?.[0] === d.c).length; return ok + (ok === (d.seats || []).length && ok > 0 ? 2 : 0) })() : 0
  useEffect(() => {
    if (!d.reveal) return
    try {
      if (d.kind === 'truce' && goldNow > 0) sfx.coins?.(Math.min(10, goldNow + 2))
      if (d.kind === 'final' && hitNow) sfx.hit?.()
    } catch { /* son facultatif */ }
    if (d.kind === 'final') setTimeout(() => setHitMap(m => ({ ...m, [d.idx]: hitNow })), 0)
  }, [d.reveal, d.idx]) // eslint-disable-line react-hooks/exhaustive-deps
  const mine = d.ans?.[v.me]?.[d.idx]
  const inIt = d.seats?.includes(v.me)
  const picked = Array.isArray(mine) ? mine[0] : null
  const total = d.hard ? 9000 : 12000
  const label = { solo: d.ctx?.reason === 'own' ? '⭐ Ta spécialité' : d.ctx?.reason === 'shortcut' ? '🚪 Raccourci' : d.ctx?.reason === 'shark' ? '🦈 Survie' : '❓ Question', duel: '⚔️ Duel', truce: '🤝 Trêve : remplissez le trésor !', final: '🐙 Combat final' }[d.kind]
  const who = d.seats?.map(s => s === v.me ? 'Toi' : bare(v.players.find(p => p.seat === s)?.name)).join(' vs ')
  const t = topicOf(d.topic)
  return (
    <div className={`tq-quiz k-${d.kind}`}>
      {d.kind === 'final' && <KrakenHP hp={4 - hits} />}
      {d.kind === 'truce' && d.reveal && goldNow > 0 && <GoldRain key={d.idx} n={goldNow} />}
      <div className="tq-quiz-head">
        <span>{label}{d.count > 1 ? ` · ${d.idx + 1}/${d.count}` : ''}</span>
        <small><TopicIcon topic={t} size={16} /> {t.name}</small>
        {(d.kind === 'duel' || !inIt) && <small className="tq-quiz-who">{who}</small>}
      </div>
      {!d.reveal && left != null && <div className="tq-timer"><i style={{ width: `${Math.min(100, (left / total) * 100)}%` }} /></div>}
      <p className="tq-q"><QuestionText text={d.q} /></p>
      <div className="tq-opts">
        {(d.o || []).map((o, i) => {
          const removed = d.removed?.includes(i)
          const cls = d.reveal ? (i === d.c ? 'good' : i === picked ? 'bad' : '') : i === picked ? 'picked' : ''
          const pickers = d.reveal ? d.seats.filter(s => d.ans?.[s]?.[d.idx]?.[0] === i) : []
          return (
            <button key={i} className={`tq-opt ${cls}`} disabled={!inIt || d.reveal || picked != null || removed} style={removed ? { opacity: 0.25 } : undefined} onClick={() => onAnswer(i)}>
              {o}
              {pickers.length > 0 && <span className="tq-pickers">{pickers.map(s => <i key={s} style={{ background: SEAT_COLORS[s] }} />)}</span>}
            </button>
          )
        })}
      </div>
      <div className="tq-quiz-foot">
        {inIt && !d.reveal && picked == null && d.kind !== 'truce' && me?.items?.includes('joker') && !d.removed && <button className="btn btn-small btn-secondary" onClick={onJoker}><Obj k="joker" /> Joker 50/50</button>}
        {!d.reveal && <span className="tq-answered">{d.seats.map(s => <i key={s} title={v.players.find(p => p.seat === s)?.name} className={d.ans?.[s]?.[d.idx] ? 'ok' : ''} style={{ '--c': SEAT_COLORS[s] }} />)}</span>}
        {!inIt && !d.reveal && <small className="muted">Tu regardes…</small>}
      </div>
    </div>
  )
}

function Bag({ me, v, onClose, onUse }) {
  const mine = [...new Set(me?.items || [])]
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet tq-bag" onClick={e => e.stopPropagation()}>
        <h2><img className="tq-obj" src="/traque/ico/case-shop.webp" alt="" /> Mon sac · <Pearl /> {me?.pearls} perles</h2>
        <p className="sheet-sub">Les objets s'achètent dans les boutiques 🏪 du plateau. Utilise-les avant de lancer le dé (le joker, pendant une question).</p>
        <ul>
          {mine.length === 0 && <li><span className="tq-it-ico">🫙</span><div><b>Sac vide</b><small>Arrête-toi à une boutique pour acheter des objets.</small></div><span /></li>}
          {mine.map(k => {
            const it = ITEMS[k]
            const have = (me?.items || []).filter(x => x === k).length
            return (
              <li key={k}>
                <span className="tq-it-ico"><Obj k={k} /></span>
                <div><b>{it.name}{have > 1 ? ` ×${have}` : ''}</b><small>{it.desc}</small></div>
                <div className="tq-it-btns">
                  {k !== 'joker' && !ITEMS[k]?.passive && !me?.ghost && v.phase === 'roll' && v.turn === v.me ? <button className="btn btn-small btn-gold" onClick={() => onUse(k)}>Utiliser</button> : <small className="muted">{k === 'joker' ? 'en question' : ITEMS[k]?.passive ? 'automatique' : ''}</small>}
                </div>
              </li>
            )
          })}
        </ul>
        <button className="btn btn-ghost wide" onClick={onClose}>Fermer</button>
      </div>
    </div>
  )
}

function Shop({ v, d, me, left, onBuy, onLeave }) {
  const cell = v.board[d.cell] || {}
  // achat réussi : un nouvel objet est apparu dans le sac → bulle de confirmation et bruit de caisse
  const [got, setGot] = useState(null)
  const prevItems = useRef(me?.items || [])
  const items = me?.items
  useEffect(() => {
    const before = prevItems.current, now = items || []
    prevItems.current = now
    if (d.seat !== v.me || now.length <= before.length) return
    const k = now.find((x, i) => now.filter(y => y === x).length > before.filter(y => y === x).length && now.indexOf(x) === i) || now[now.length - 1]
    try { sfx.cash?.() } catch { /* son facultatif */ }
    setTimeout(() => setGot(k), 0)
    const id = setTimeout(() => setGot(null), 2200)
    return () => clearTimeout(id)
  }, [items]) // eslint-disable-line react-hooks/exhaustive-deps
  const mine = d.seat === v.me
  const who = v.players.find(p => p.seat === d.seat)
  const price = (k) => { const base = ITEM_COST[k] + (cell.k || 0); return d.discount ? Math.ceil(base / 2) : base }
  return (
    <div className="tq-center dim">
      <Frame img="/traque/cadre-boutique.webp" className="shop" title="Boutique" onClose={mine ? onLeave : () => {}}
        cta={mine ? <button onClick={onLeave}>{d.rest > 0 ? `Continuer · ${d.rest} case${d.rest > 1 ? 's' : ''}` : 'Fermer'}</button> : <span>{who?.name} fait ses courses…</span>}>
        <p className="tq-shop-info">{mine ? <><Pearl /> <b>{me?.pearls}</b> perles · sac {me?.items?.length || 0}/3</> : `${who?.name} choisit`}{left != null ? ` · ${Math.ceil(left / 1000)} s` : ''}</p>
        {d.discount && mine && <p className="tq-shop-promo">🎯 Pile dessus : 1er achat à moitié prix !</p>}
        {got && <div className="tq-shop-got" key={got + (me?.items?.length || 0)}><Obj k={got} /><b>{ITEMS[got]?.name} ajouté à ton sac !</b></div>}
        <div className="tq-shop-grid">
          {(cell.items || []).map(k => (
            <div key={k} className="tq-shop-card">
              <b>{ITEMS[k].name}</b>
              <span className="tq-shop-ico"><Obj k={k} /></span>
              <small>{ITEMS[k].desc}</small>
              <button disabled={!mine || (me?.pearls || 0) < price(k) || (me?.items?.length || 0) >= 3} onClick={() => onBuy(k)}><Pearl /> {price(k)}</button>
            </div>
          ))}
        </div>
      </Frame>
    </div>
  )
}

// Événement : animation illustrée (si on en a une) au-dessus de la plaque de texte
const CHEST_OPEN = { pearls: '/traque/coffre-perles.webp', item: '/traque/coffre-objet.webp', tentacle: '/traque/coffre-tentacule.webp' }
function eventAnim(d) {
  const fx = d.fx || {}
  if (fx.crab) return ['/traque/anim/crabe.webp', 'anim']
  if (fx.whirl) return ['/traque/anim/tourbillon.webp', 'anim']
  if (fx.puffer) return ['/traque/anim/poisson.webp', 'anim']
  if (fx.cursed != null && fx.box) return [CHEST_OPEN[fx.box[fx.cursed]], 'still']
  if (fx.shark === 'eaten') return ['/traque/requin-attaque.webp', 'still shark']
  if (fx.shark === 'escape' || fx.harpon) return ['/traque/requin-boude.webp', 'still shark']
  if ((d.text || '').startsWith('🌊')) return ['/traque/anim/courant.webp', 'wave']
  return null
}
function EventView({ d }) {
  const [t0] = useState(() => Date.now())
  const a = eventAnim(d)
  const regen = (d.text || '').includes('Kraken recrache')
  // raté sur sa propre spécialité : le Kraken se moque
  const mock = (d.text || '').startsWith('😬')
  useEffect(() => {
    try { if (d.fx?.gold > 0) sfx.coins?.(10); if (regen) setTimeout(() => sfx.heal?.(), 300); if (mock) setTimeout(() => sfx.laugh?.(), 250) } catch { /* son facultatif */ }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="tq-center">
      {a?.[1] === 'wave' && <img className="tq-ev-wave" src={`${a[0]}?t=${t0}`} alt="" />}
      {d.fx?.gold > 0 && <GoldRain n={d.fx.gold} big />}
      <div className="tq-ev-stack">
        {regen && <KrakenHP hp={4} regen />}
        {mock && <div className="tq-mock"><img src="/mascotte/victoire.webp" alt="" /><span>Haha, nulos !</span></div>}
        {a && a[1] !== 'wave' && <img className={`tq-ev-anim ${a[1]}`} src={a[1] === 'anim' ? `${a[0]}?t=${t0}` : a[0]} alt="" />}
        <p className="tq-event">{d.text}</p>
      </div>
    </div>
  )
}

// Figurine mystère : distributeur de boules, la capsule tombe, s'ouvre… et révèle la figurine
const CAPS = ['#ff6fb5', '#7fd4ff', '#ffe066', '#b18cff', '#7dffb0', '#ff9f5a']
function Gumball({ pawn, onClose }) {
  const [balls] = useState(() => Array.from({ length: 16 }, (_, i) => ({ x: 8 + (i % 4) * 22 + Math.random() * 6, y: 10 + Math.floor(i / 4) * 21 + Math.random() * 5, c: CAPS[i % CAPS.length], k: i })))
  useEffect(() => {
    const ts = [setTimeout(() => sfx.dice?.(), 100), setTimeout(() => sfx.flip?.(), 1500), setTimeout(() => sfx.levelUp?.(), 2300)]
    return () => ts.forEach(clearTimeout)
  }, [])
  return (
    <div className="gb" onClick={onClose}>
      <div className="gb-machine" aria-hidden="true">
        <div className="gb-dome">{balls.map(b => <i key={b.k} style={{ left: `${b.x}%`, top: `${b.y}%`, '--bc': b.c }} />)}</div>
        <div className="gb-base"><span className="gb-knob" /><span className="gb-chute" /></div>
      </div>
      <div className="gb-cap"><i className="top" /><i className="bot" /></div>
      <div className="gb-prize" onClick={e => e.stopPropagation()}>
        <div className="gb-fig"><ResinPawn id={pawn.id} /></div>
        <b>🎉 Bravo, tu as obtenu le pion : {pawn.name} !</b>
        <small>Il est équipé pour cette partie.</small>
        <button className="btn btn-gold" onClick={onClose}>Génial !</button>
      </div>
    </div>
  )
}

// Pièces d'or qui tombent, avec le nombre de lingots gagnés
function GoldRain({ n, big = false }) {
  const [coins] = useState(() => Array.from({ length: big ? 26 : 14 }, (_, i) => ({ x: Math.random() * 100, d: Math.random() * (big ? 1.2 : 0.7), s: 0.7 + Math.random() * 0.6, r: Math.random() * 360, k: i })))
  return (
    <div className={`tq-gold ${big ? 'big' : ''}`} aria-hidden="true">
      {coins.map(c => <i key={c.k} style={{ left: `${c.x}%`, animationDelay: `${c.d}s`, '--s': c.s, '--r': `${c.r}deg` }} />)}
      <b>+{n} lingot{n > 1 ? 's' : ''}</b>
    </div>
  )
}

// Barre de vie du Kraken (combat final) : elle baisse à chaque bonne réponse, se remplit s'il recrache le joueur
function KrakenHP({ hp, regen = false }) {
  const [shown, setShown] = useState(regen ? 1 : hp)
  useEffect(() => { const id = setTimeout(() => setShown(hp), regen ? 250 : 0); return () => clearTimeout(id) }, [hp, regen])
  return (
    <div className={`tq-khp ${regen ? 'regen' : ''}`}>
      <span>🐙 Kraken</span>
      <div className="tq-khp-bar"><i style={{ width: `${(Math.max(0, shown) / 4) * 100}%` }} />{[1, 2, 3].map(k => <em key={k} style={{ left: `${k * 25}%` }} />)}</div>
      <small>{regen ? 'Il se régénère !' : shown <= 0 ? 'K.O. !' : `${shown} PV`}</small>
    </div>
  )
}

// Résultat du duel : le gagnant frappe, le perdant est éjecté de l'écran
function DuelResult({ v, d, onRoll }) {
  const w = v.players.find(p => p.seat === d.winner), l = v.players.find(p => p.seat === d.loser)
  const [stage, setStage] = useState(0)
  const [rolling, setRolling] = useState(false)
  useEffect(() => {
    const a = setTimeout(() => { try { sfx.punch?.() } catch { /* son facultatif */ } }, 650)
    const b = setTimeout(() => setStage(1), 1700)
    return () => { clearTimeout(a); clearTimeout(b) }
  }, [])
  if (!w || !l) return null
  const mine = d.winner === v.me
  return (
    <div className="tq-center dr">
      <div className="dr-l" aria-hidden="true"><ResinPawn id={l.pawn || PAWNS[l.seat % PAWNS.length].id} /></div>
      <div className="dr-w" aria-hidden="true"><ResinPawn id={w.pawn || PAWNS[w.seat % PAWNS.length].id} /></div>
      <i className="dr-boom" />
      <p className="dr-score">⚔️ {mine ? 'Tu gagnes' : `${bare(w.name)} gagne`} {(d.score || []).join('–')}{d.tie ? ' au temps' : ''} !</p>
      {stage === 1 && <div className="dr-roll">
        <div className="dr-die"><DieFace n={5} /></div>
        {mine
          ? <button className="kh-play dr-btn" disabled={rolling} onClick={() => { setRolling(true); onRoll() }}>🎲 Lancer le dé</button>
          : <p className="dr-wait">{bare(w.name)} lance le dé…<br /><small>{d.loser === v.me ? 'tu vas' : `${bare(l.name)} va`} reculer d'autant</small></p>}
      </div>}
    </div>
  )
}

// Dé du duel : tout le monde voit le dé rouler à côté du gagnant, puis le résultat
function DuelDice({ v, d }) {
  const n = d.fx?.dice?.[0] || 1
  const w = v.players.find(p => p.seat === d.fx?.by), l = v.players.find(p => p.seat === d.fx?.seat)
  const [face, setFace] = useState(1)
  const [done, setDone] = useState(false)
  useEffect(() => {
    try { sfx.dice?.() } catch { /* son facultatif */ }
    const iv = setInterval(() => setFace(1 + Math.floor(Math.random() * 6)), 90)
    const t = setTimeout(() => { clearInterval(iv); setFace(n); setDone(true) }, 1100)
    return () => { clearInterval(iv); clearTimeout(t) }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="tq-center dr">
      {w && <div className="dr-w still" aria-hidden="true"><ResinPawn id={w.pawn || PAWNS[w.seat % PAWNS.length].id} /></div>}
      <div className="dr-roll"><div className={`dr-die ${done ? 'done' : 'spin'}`}><DieFace key={face} n={face} /></div></div>
      {done && <p className="tq-event dr-res">🎲 {n} ! {l?.seat === v.me ? 'Tu recules' : `${bare(l?.name)} recule`} de {n} case{n > 1 ? 's' : ''}</p>}
    </div>
  )
}

// Quitter la partie : vraie fenêtre de confirmation
function QuitButton({ className, label, onQuit, inGame = false }) {
  const [open, setOpen] = useState(false)
  return <>
    <button className={className} onClick={() => setOpen(true)} aria-label="Quitter">{label}</button>
    {open && <div className="sheet-backdrop tq-top" onClick={() => setOpen(false)}>
      <div className="sheet tq-quit" onClick={e => e.stopPropagation()}>
        <h2>Quitter la chasse ?</h2>
        <p className="sheet-sub">{inGame ? 'Tu abandonnes la partie : un robot prendra ta place. Pour la finir plus tard, utilise plutôt ⏸️ « Reprendre plus tard ».' : 'Tu quittes le salon.'}</p>
        <button className="btn btn-gold wide" onClick={() => { setOpen(false); onQuit() }}>Oui, quitter</button>
        <button className="btn btn-ghost wide" onClick={() => setOpen(false)}>Rester</button>
      </div>
    </div>}
  </>
}

// Lancement : révélation des 8 thèmes du plateau, une carte après l'autre
const REVEAL_START = 3.2 // s : décompte 3, 2, 1, 0 avant que les cartes se retournent
const REVEAL_GAP = 0.75 // s entre deux cartes
function Reveal({ ids, topicOf }) {
  const [n, setN] = useState(3)
  useEffect(() => {
    const ts = [3, 2, 1, 0].map((k, i) => setTimeout(() => { setN(k); try { sfx.count?.(k) } catch { /* son facultatif */ } }, i * 800))
    ts.push(setTimeout(() => setN(null), 3 * 800 + 700))
    // un son à chaque carte retournée, calé sur l'animation
    ids.forEach((_, i) => ts.push(setTimeout(() => { try { sfx.flip?.() } catch { /* son facultatif */ } }, (REVEAL_START + i * REVEAL_GAP + 0.25) * 1000)))
    return () => ts.forEach(clearTimeout)
  }, [ids.length]) // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="tq-center dim">
      {n != null && <div className="tq-countdown" key={n}>{n}</div>}
      <div className="tq-reveal">
        <img className="tq-reveal-title" src="/traque/titre-themes.webp" alt="Les thèmes de la chasse" />
        <div className="tq-reveal-grid">
          {ids.map((id, i) => {
            const t = topicOf(id)
            return <div key={id} className="tq-reveal-card" style={{ '--i': i, '--tc': t.color || '#7b5cff' }}>
              <div className="face"><span>{t.icon}</span><b>{t.name}</b></div>
              <div className="back" />
            </div>
          })}
        </div>
        <p>+ les spécialités de chacun</p>
      </div>
    </div>
  )
}

// Tour du fantôme : il choisit qui hanter (le dé décide de combien de cases la cible recule)
function Haunt({ v, onPick }) {
  const targets = v.players.filter(p => p.seat !== v.me && !p.ghost && ['joined', 'bot', 'left'].includes(p.status))
  return (
    <div className="tq-center dim">
      <div className="tq-cursed tq-haunt">
        <h2>👻 Qui vas-tu hanter ?</h2>
        <p>Il reculera du résultat de ton dé, de 1 à 6 cases.</p>
        <div className="tq-haunt-row">
          {targets.map(p => <button key={p.seat} onClick={() => onPick(p.seat)} style={{ '--c': SEAT_COLORS[p.seat] }}>
            <img src={pawnImg(p.pawn, p.seat)} alt="" /><b>{bare(p.name)}</b><small>case {p.pos}</small>
          </button>)}
        </div>
      </div>
    </div>
  )
}

// Coffre maudit : 3 coffres fermés, un seul choix
function Cursed({ v, d, left, onPick }) {
  const mine = d.seat === v.me
  const who = v.players.find(p => p.seat === d.seat)
  return (
    <div className="tq-center dim">
      <div className="tq-cursed">
        <img className="tq-cursed-title" src="/traque/titre-coffre-maudit.webp" alt="Coffre maudit" />
        <p>{mine ? 'Choisis un coffre : perles, objet… ou tentacule !' : `${bare(who?.name)} choisit un coffre…`}{left != null ? ` · ${Math.ceil(left / 1000)} s` : ''}</p>
        <div className="tq-cursed-row">
          {[0, 1, 2].map(i => <button key={i} disabled={!mine} onClick={() => onPick(i)} style={{ '--i': i }}><img src="/traque/coffre-ferme.webp" alt={`Coffre ${i + 1}`} /></button>)}
        </div>
      </div>
    </div>
  )
}

function Finale({ v, onExit, voice, onHangUp }) {
  const w = v.players.find(p => p.seat === v.winner)
  const mine = v.players.find(p => p.seat === v.me)
  return (
    <div className="tq-finale">
      {v.winner == null
        ? <><h2>🦈 Le Kraken a gagné…</h2><p>Tout le monde a été dévoré. Le trésor de <b>{v.treasure} lingots</b> reste au fond de l'océan.</p></>
        : <><img className="tq-victory" src="/traque/titre-victoire.webp" alt="Victoire !" /><h2>🏆 {v.winner === v.me ? 'Tu as tué le Kraken !' : `${w?.name} a tué le Kraken !`}</h2><p>Trésor volé : <b>{v.treasure} lingots</b></p></>}
      <ul>
        {[...v.players].filter(p => p.status !== 'declined').sort((a, b) => (b.seat === v.winner) - (a.seat === v.winner) || b.pos - a.pos).map(p => (
          <li key={p.seat} style={{ '--c': SEAT_COLORS[p.seat] }}><b>{p.name}</b><span>{p.bot ? '—' : `+${p.reward} lingots`}</span></li>
        ))}
      </ul>
      {mine && !mine.bot && <p className="muted small">Les perles restantes sont converties : 10 perles = 1 lingot.</p>}
      {voice && <div className="tq-finale-voice">
        <button className={`tq-round-btn mic ${voice.mic}`} onClick={voice.toggleMic} disabled={voice.mic === 'asking' || voice.mic === 'unsupported'} aria-label="Micro">
          {{ on: '🎙️', muted: '🔇', asking: '⏳', denied: '🚫', unsupported: '🚫' }[voice.mic] || '🎙️'}</button>
        <span>Le vocal reste ouvert pour débriefer</span>
        <button className="btn btn-small btn-ghost" onClick={onHangUp}>📞 Raccrocher</button>
      </div>}
      <button className="kh-play wide" onClick={onExit}>Retour à l'accueil</button>
    </div>
  )
}
