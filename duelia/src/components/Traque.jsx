// La Traque du Kraken : salon (invitations, robots, spécialités) puis plateau en direct.
// Le serveur tient tout le jeu ; l'appli l'interroge chaque seconde et anime ce qui change.
import { useEffect, useMemo, useRef, useState } from 'react'
import Avatar from './Avatar.jsx'
import TopicIcon from './TopicIcon.jsx'
import QuestionText from './QuestionText.jsx'
import ConfirmButton from './ConfirmButton.jsx'
import * as api from '../lib/account.js'
import { sfx } from '../lib/sound.js'
import { useGroupVoice } from '../lib/groupVoice.js'
import { BOARD_PTS, BOARD_RATIO } from '../lib/traqueBoard.js'
import { SEAT_COLORS, GENERAL_TOPICS, ITEMS, ITEM_COST, CELL_ICON, CELL_LABEL, buildPool, topicMeta, randomTopics, PAWNS, pawnImg } from '../lib/traque.js'

const errText = (e) => (e?.message || '').replace(/^.*?: /, '') || 'Pas de connexion.'
const GLYPH = { general: '?', spec: '★', tentacle: '☠', shortcut: '⇈', current: '≋' }

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

  // fin de partie : le portefeuille se met à jour
  useEffect(() => { if (v?.status === 'done') onWallet?.() }, [v?.status]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!v) return <div className="screen traque center"><div className="spinner" /><p className="muted">{err || 'Plongée vers le Kraken…'}</p></div>
  if (v.status === 'cancelled') return (
    <div className="screen traque center"><p>La partie a été annulée.</p><button className="btn btn-primary" onClick={onExit}>Retour</button></div>
  )
  const body = v.status === 'lobby'
    ? <TraqueLobby v={v} gameId={gameId} officials={officials} topics={topics} friends={friends} act={act} onExit={onExit} />
    : <TraqueBoard v={v} gameId={gameId} act={act} onExit={onExit} />
  return <>{body}{toast && <div className="toast" role="status">{toast}</div>}</>
}

/* ---------- Salon ---------- */
function TraqueLobby({ v, gameId, officials, topics, friends, act, onExit }) {
  const [picking, setPicking] = useState(false)
  const [inviting, setInviting] = useState(false)
  const [botLevel, setBotLevel] = useState(null)
  const [starting, setStarting] = useState(false)
  const me = v.players.find(p => p.seat === v.me)
  const seats = [0, 1, 2, 3].map(s => v.players.find(p => p.seat === s && p.status !== 'declined'))
  const active = v.players.filter(p => ['joined', 'bot'].includes(p.status))
  const ready = active.length >= 2 && active.every(p => p.topics?.length === 3)

  async function start() {
    setStarting(true)
    const specs = [...new Set(active.flatMap(p => p.topics.map(t => t.id)))]
    const general = GENERAL_TOPICS.filter(id => topics.some(t => t.id === id))
    const ids = [...new Set([...specs, ...general])]
    const meta = Object.fromEntries(ids.map(id => topics.find(t => t.id === id)).filter(Boolean).map(t => [t.id, topicMeta(t)]))
    await act(() => api.startTraque(gameId, meta, general, buildPool(topics, ids)))
    setStarting(false)
  }

  return (
    <div className="screen traque lobby">
      <header className="top">
        <ConfirmButton className="icon-btn" onConfirm={() => { api.leaveTraque(gameId).catch(() => {}); onExit() }} confirmLabel="Quitter ?">←</ConfirmButton>
        <h1>La Chasse au Kraken</h1>
      </header>
      <p className="tq-pitch">De 2 à 4 joueurs. Avancez sur le plateau, remplissez ensemble le trésor pendant les trêves… et soyez le premier à tuer le Kraken pour tout rafler.</p>

      <ul className="tq-seats">
        {seats.map((p, s) => (
          <li key={s} style={{ '--c': SEAT_COLORS[s] }} className={p ? '' : 'empty'}>
            {p ? <>
              <img className="tq-seat-pawn" src={pawnImg(p.pawn, p.seat)} alt="" />
              <div className="tq-seat-txt">
                <b>{p.bot ? '🤖 ' : ''}{p.name}{p.seat === v.me ? ' (toi)' : ''}</b>
                <small>{p.status === 'invited' ? 'Invitation envoyée…' : p.topics?.length === 3 ? p.topics.map(t => t.name).join(' · ') : 'Choisit ses spécialités…'}</small>
              </div>
              {v.host && s !== 0 && <button className="tq-x" aria-label="Retirer" onClick={() => act(() => api.removeTraqueSeat(gameId, s).then(() => api.getTraque(gameId)))}>×</button>}
            </> : v.host ? (
              <div className="tq-seat-add">
                <button className="btn btn-small btn-secondary" onClick={() => setInviting(true)}>👥 Inviter</button>
                <button className="btn btn-small btn-ghost" onClick={() => setBotLevel('pick')}>🤖 Robot</button>
              </div>
            ) : <small className="muted">Place libre</small>}
          </li>
        ))}
      </ul>

      <section className="tq-mine">
        <h3 className="sec-title">Ta figurine</h3>
        <div className="tq-pawn-pick">
          {PAWNS.map(pw => {
            const taken = v.players.find(p => p.pawn === pw.id && p.seat !== v.me && ['joined', 'bot', 'invited'].includes(p.status))
            return (
              <button key={pw.id} className={`${(me?.pawn || PAWNS[v.me % PAWNS.length].id) === pw.id ? 'on' : ''}`} disabled={!!taken} title={taken ? `Prise par ${taken.name}` : pw.name}
                onClick={() => act(() => api.setTraquePawn(gameId, pw.id).then(() => api.getTraque(gameId)))}>
                <img src={pw.img} alt={pw.name} />
              </button>
            )
          })}
        </div>
      </section>

      <section className="tq-mine">
        <h3 className="sec-title">Tes 3 spécialités</h3>
        <p className="muted small">Sur le plateau, leurs cases te font avancer plus vite… et si un adversaire tombe dessus, tu peux le défier en duel.</p>
        <div className="tq-chips">
          {(me?.topics || []).map(t => <span key={t.id} className="tq-chip"><TopicIcon topic={t} size={22} /> {t.name}</span>)}
          <button className="btn btn-small btn-gold" onClick={() => setPicking(true)}>{me?.topics?.length === 3 ? 'Changer' : 'Choisir mes 3 thèmes'}</button>
        </div>
      </section>

      <div className="tq-dock">
        {v.host
          ? <button className="kh-play wide" disabled={!ready || starting} onClick={start}>{starting ? 'Préparation du plateau…' : ready ? '🐙 Lancer la chasse' : active.length < 2 ? 'Ajoute un ami ou un robot' : 'En attente des spécialités…'}</button>
          : <p className="tq-wait">⏳ L'hôte lance la partie dès que tout le monde est prêt.</p>}
      </div>

      {picking && <TopicPicker officials={officials} initial={me?.topics || []} onCancel={() => setPicking(false)}
        onDone={(list) => { setPicking(false); act(() => api.setTraqueTopics(gameId, list).then(() => api.getTraque(gameId))) }} />}
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

function TraqueBoard({ v, gameId, act, onExit }) {
  const [bag, setBag] = useState(false)
  const [target, setTarget] = useState(null) // objet en attente d'une cible
  const me = v.players.find(p => p.seat === v.me)
  const turnP = v.players.find(p => p.seat === v.turn)
  const myTurn = v.turn === v.me
  const d = v.data || {}
  const left = useTicker(d.left_ms, [v.version, v.phase, d.idx, d.reveal])
  // voix : une connexion vers chaque autre joueur humain encore là
  const peers = v.players.filter(p => p.player_id && p.seat !== v.me && p.status === 'joined').map(p => p.player_id)
  const voice = useGroupVoice(gameId, me?.player_id, peers, v.status === 'playing' && !!me && peers.length > 0)

  // animation des pions : on avance case par case
  const [shown, setShown] = useState(() => Object.fromEntries(v.players.map(p => [p.seat, p.pos])))
  useEffect(() => {
    const goal = Object.fromEntries(v.players.map(p => [p.seat, p.pos]))
    const iv = setInterval(() => {
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
    }, 170)
    return () => clearInterval(iv)
  }, [v.version]) // eslint-disable-line react-hooks/exhaustive-deps

  // petits sons
  const lastPhase = useRef(null)
  useEffect(() => {
    if (lastPhase.current === v.phase + d.idx + d.reveal) return
    lastPhase.current = v.phase + d.idx + d.reveal
    try {
      if (v.phase === 'show') sfx.tap?.()
      if (v.phase === 'quiz' && d.reveal) (d.ans?.[v.me]?.[d.idx]?.[0] === d.c ? sfx.good : sfx.bad)?.()
      if (v.phase === 'done') sfx.levelUp?.()
    } catch { /* sons facultatifs */ }
  }, [v.phase, d.idx, d.reveal]) // eslint-disable-line react-hooks/exhaustive-deps

  const topicOf = (id) => v.topics?.[id] || { id, name: id }
  const owners = (id) => v.players.filter(p => p.topics?.some(t => t.id === id)).map(p => p.seat)

  return (
    <div className="screen traque game">
      <PathBoard v={v} shown={shown} topicOf={topicOf} owners={owners} />

      {/* HUD du haut */}
      <div className="tq-hud-top">
        <div className="tq-me-card" style={{ '--c': SEAT_COLORS[v.me] }}>
          <img src={pawnImg(me?.pawn, v.me)} alt="" />
          <div><b>{me?.name}</b><small>🦪 {me?.pearls ?? 0} · case {me?.pos ?? 0}{me?.items?.length ? ` · 🎒 ${me.items.length}` : ''}</small></div>
        </div>
        <div className="tq-hud-right">
          <div className="tq-treasure" title="Trésor du Kraken"><span>💰 <b>{v.treasure}</b></span></div>
          {peers.length > 0 && <button className={`tq-round-btn mic ${voice.mic}`} onClick={voice.toggleMic} disabled={voice.mic === 'asking' || voice.mic === 'unsupported'} aria-label="Micro">
            {{ on: '🎙️', muted: '🔇', asking: '⏳', denied: '🚫', unsupported: '🚫' }[voice.mic] || '🎙️'}</button>}
          <ConfirmButton className="tq-round-btn" onConfirm={() => { api.leaveTraque(gameId).catch(() => {}); onExit() }} confirmLabel="Quitter ?">✕</ConfirmButton>
        </div>
      </div>
      <div className="tq-banner">
        {v.phase === 'roll' && myTurn ? <><b>À toi de jouer !</b><small>Lance le dé pour avancer{left != null ? ` · ${Math.ceil(left / 1000)} s` : ''}</small></>
          : v.phase === 'done' ? <b>Partie terminée</b>
          : <><b style={{ color: SEAT_COLORS[v.turn] }}>{myTurn ? 'Ton tour' : `Au tour de ${turnP?.name?.replace(/ \((facile|moyen|expert)\)$/, '') || '…'}`}</b><small>{(v.log || []).slice(-1)[0]?.t}</small></>}
      </div>
      <ul className="tq-others">
        {v.players.filter(p => p.status !== 'declined' && p.seat !== v.me).map(p => (
          <li key={p.seat} style={{ '--c': SEAT_COLORS[p.seat] }} className={`${p.seat === v.turn ? 'turn' : ''} ${p.status === 'left' ? 'gone' : ''} ${voice.speaking[p.player_id] ? 'speaking' : ''}`}>
            <img src={pawnImg(p.pawn, p.seat)} alt="" />
            <span><b>{p.name.replace(/ \((facile|moyen|expert)\)$/, '')}</b><small>🦪 {p.pearls} · {p.pos}{p.skip ? ' ⚓' : ''}{voice.peerMic[p.player_id] ? ' 🎙️' : ''}</small></span>
          </li>
        ))}
      </ul>
      {voice.needTap && <button className="link-btn tq-tap" onClick={voice.unlock}>🔊 Touche ici pour entendre les autres</button>}

      {/* HUD du bas */}
      <div className="tq-hud-bottom">
        <div className="tq-round-card"><img src="/mascotte/pirate.webp" alt="" /><span><b>Tour {v.round}</b><small>{v.players.length} joueurs</small></span></div>
        <div className="tq-hud-actions">
          {v.phase === 'roll' && myTurn && <>
            <button className="tq-round-btn bag" onClick={() => setBag(true)} disabled={!me?.items?.length} aria-label="Mon sac">🎒<i>{me?.items?.length || 0}</i></button>
            <button className="tq-dice-btn" onClick={() => act(() => api.traqueRoll(gameId))}><span className="tq-die big">⚄</span><b>Lancer le dé</b></button>
          </>}
          {v.phase === 'duelroll' && d.winner === v.me &&
            <button className="tq-dice-btn" onClick={() => act(() => api.traqueRoll(gameId))}><span className="tq-die big">⚄</span><b>Dé du duel</b></button>}
        </div>
      </div>

      {/* Moments forts au centre de l'écran */}
      {v.phase === 'show' && (d.dice || []).length > 0 && <div className="tq-center"><div className="tq-dice">{d.dice.map((n, i) => <span key={i} className="tq-die">{n}</span>)}</div></div>}
      {v.phase === 'event' && <div className="tq-center"><p className="tq-event">{d.text}</p></div>}
      {v.phase === 'duelroll' && d.winner !== v.me && <div className="tq-center"><p className="tq-event">🎲 {v.players.find(p => p.seat === d.winner)?.name} lance le dé du duel… {v.players.find(p => p.seat === d.loser)?.name} va reculer !</p></div>}
      {v.phase === 'intro' && <Intro v={v} d={d} left={left} topicOf={topicOf} onReady={() => act(() => api.traqueReady(gameId))} />}
      {v.phase === 'shop' && <div className="tq-quiz-wrap"><Shop v={v} d={d} me={me} left={left} onBuy={(k) => act(() => api.traqueBuy(gameId, k))} onLeave={() => act(() => api.traqueShopLeave(gameId))} /></div>}
      {v.phase === 'quiz' && <div className="tq-quiz-wrap"><Quiz v={v} d={d} left={left} me={me} topicOf={topicOf} onAnswer={(i) => act(() => api.traqueAnswer(gameId, d.idx, i))}
        onJoker={() => act(() => api.traqueUse(gameId, 'joker'))} /></div>}
      {v.phase === 'done' && <div className="tq-quiz-wrap"><Finale v={v} onExit={onExit} /></div>}

      {bag && <Bag me={me} v={v} onClose={() => setBag(false)}
        onUse={(k) => { if (ITEMS[k].target) { setTarget(k); setBag(false) } else { setBag(false); act(() => api.traqueUse(gameId, k)) } }} />}
      {target && (
        <div className="sheet-backdrop" onClick={() => setTarget(null)}>
          <div className="sheet" onClick={e => e.stopPropagation()}>
            <h2>{ITEMS[target].icon} {ITEMS[target].name} : sur qui ?</h2>
            {v.players.filter(p => p.seat !== v.me && ['joined', 'bot', 'left'].includes(p.status)).map(p => (
              <button key={p.seat} className="tq-level" style={{ '--c': SEAT_COLORS[p.seat] }} onClick={() => { const k = target; setTarget(null); act(() => api.traqueUse(gameId, k, p.seat)) }}>
                <b>{p.name}</b><small>case {p.pos} · 🦪 {p.pearls}</small>
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
function PathBoard({ v, shown, topicOf, owners }) {
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
  return (
    <div className="tq-path" ref={ref} onTouchStart={mark} onWheel={mark} onPointerDown={mark}>
      <div className="tq-track" style={{ aspectRatio: BOARD_RATIO }}>
        {v.board.slice(0, BOARD_PTS.length).map((c, i) => {
          if (c.t === 'lair') return null
          const [x, y] = at(i)
          const t = c.topic ? topicOf(c.topic) : null
          const own = c.t === 'spec' ? owners(c.topic) : []
          return (
            <div key={i} className={`tq-slot t-${c.t}`} style={{ left: `${x * 100}%`, top: `${y * 100}%`, '--oc': own.length ? SEAT_COLORS[own[0]] : undefined }}
              title={c.t === 'spec' || c.t === 'general' ? `${CELL_LABEL[c.t]} · ${t?.name}` : CELL_LABEL[c.t]}>
              <span className="tq-ico">{GLYPH[c.t] ?? CELL_ICON[c.t] ?? '?'}</span>
              {c.t === 'spec' && <small className="tq-tile-topic">{t?.icon}</small>}
            </div>
          )
        })}
        {v.players.filter(p => p.status !== 'declined').map(p => {
          const [x, y] = at(shown[p.seat] ?? p.pos)
          const off = [[-2.4, -0.4], [2.4, -0.4], [-1.2, 0.5], [1.2, 0.5]][p.seat]
          return <img key={p.seat} src={pawnImg(p.pawn, p.seat)} alt="" className={`tq-figure ${p.seat === v.turn ? 'active' : ''}`}
            style={{ '--c': SEAT_COLORS[p.seat], left: `${x * 100 + off[0]}%`, top: `${y * 100 + off[1]}%` }} />
        })}
      </div>
    </div>
  )
}

function Intro({ v, d, left, topicOf, onReady }) {
  const t = topicOf(d.topic)
  const who = (d.seats || []).map(s => v.players.find(p => p.seat === s)).filter(Boolean)
  const mine = d.seats?.includes(v.me)
  const ready = d.ready || []
  const reason = d.ctx?.reason
  const info = d.kind === 'duel' ? ['⚔️', 'Duel !', `${d.count} questions en même temps. Le gagnant lance le dé, le perdant recule d'autant.`]
    : d.kind === 'truce' ? ['🤝', 'Trêve !', `${d.count} questions pour tout le monde. Chaque bonne réponse remplit le trésor du Kraken… que seul le vainqueur emportera.`]
    : d.kind === 'final' ? ['🐙', 'Combat final !', '5 questions, dont tes spécialités. 4 bonnes réponses pour tuer le Kraken, sinon il te recrache 6 cases en arrière.']
    : reason === 'own' ? ['⭐', 'Ta spécialité !', 'Question plus rapide (9 s). Réussis : +3 cases et +3 perles.']
    : reason === 'shortcut' ? ['🚪', 'Raccourci !', 'Question difficile (9 s). Réussis : tu sautes 5 cases.']
    : ['❓', 'Question !', 'Bonne réponse : +2 perles. Erreur : tu recules d\'une case.']
  return (
    <div className="tq-center dim">
      <div className={`tq-intro k-${d.kind}`}>
        <span className="tq-intro-ico">{info[0]}</span>
        <h2>{info[1]}</h2>
        <div className="tq-intro-topic"><TopicIcon topic={t} size={26} /> {t.name}</div>
        <div className="tq-intro-who">
          {who.map((p, i) => <span key={p.seat} style={{ '--c': SEAT_COLORS[p.seat] }} className={ready.includes(p.seat) || p.bot ? 'ok' : ''}>
            {i > 0 && d.kind === 'duel' && <em>VS</em>}
            <img src={pawnImg(p.pawn, p.seat)} alt="" /><small>{p.seat === v.me ? 'Toi' : p.name.replace(/ \((facile|moyen|expert)\)$/, '')}{ready.includes(p.seat) || p.bot ? ' ✓' : ''}</small>
          </span>)}
        </div>
        <p>{info[2]}</p>
        {mine && !ready.includes(v.me)
          ? <button className="kh-play wide" onClick={onReady}>Je suis prêt !{left != null ? ` · ${Math.ceil(left / 1000)} s` : ''}</button>
          : <p className="tq-wait">{mine ? 'En attente des autres…' : 'Tu regardes : prépare-toi à voir la réponse !'}{left != null ? ` · ${Math.ceil(left / 1000)} s` : ''}</p>}
      </div>
    </div>
  )
}

function Quiz({ v, d, left, me, topicOf, onAnswer, onJoker }) {
  const mine = d.ans?.[v.me]?.[d.idx]
  const inIt = d.seats?.includes(v.me)
  const picked = Array.isArray(mine) ? mine[0] : null
  const total = d.hard ? 9000 : 12000
  const label = { solo: d.ctx?.reason === 'own' ? '⭐ Ta spécialité' : d.ctx?.reason === 'shortcut' ? '🚪 Raccourci' : '❓ Question', duel: '⚔️ Duel', truce: '🤝 Trêve : remplissez le trésor !', final: '🐙 Combat final' }[d.kind]
  const who = d.seats?.map(s => v.players.find(p => p.seat === s)?.name).join(' vs ')
  const t = topicOf(d.topic)
  return (
    <div className={`tq-quiz k-${d.kind}`}>
      <div className="tq-quiz-head">
        <span>{label}{d.count > 1 ? ` · ${d.idx + 1}/${d.count}` : ''}</span>
        <small><TopicIcon topic={t} size={16} /> {t.name}{d.kind === 'duel' ? ` · ${who}` : !inIt ? ` · ${who}` : ''}</small>
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
        {inIt && !d.reveal && picked == null && d.kind !== 'truce' && me?.items?.includes('joker') && !d.removed && <button className="btn btn-small btn-secondary" onClick={onJoker}>🃏 Joker 50/50</button>}
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
        <h2>🎒 Mon sac · 🦪 {me?.pearls} perles</h2>
        <p className="sheet-sub">Les objets s'achètent dans les boutiques 🏪 du plateau. Utilise-les avant de lancer le dé (le joker, pendant une question).</p>
        <ul>
          {mine.length === 0 && <li><span className="tq-it-ico">🫙</span><div><b>Sac vide</b><small>Arrête-toi à une boutique pour acheter des objets.</small></div><span /></li>}
          {mine.map(k => {
            const it = ITEMS[k]
            const have = (me?.items || []).filter(x => x === k).length
            return (
              <li key={k}>
                <span className="tq-it-ico">{it.icon}</span>
                <div><b>{it.name}{have > 1 ? ` ×${have}` : ''}</b><small>{it.desc}</small></div>
                <div className="tq-it-btns">
                  {k !== 'joker' && v.phase === 'roll' && v.turn === v.me ? <button className="btn btn-small btn-gold" onClick={() => onUse(k)}>Utiliser</button> : <small className="muted">{k === 'joker' ? 'en question' : ''}</small>}
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
  const mine = d.seat === v.me
  const who = v.players.find(p => p.seat === d.seat)
  const price = (k) => { const base = ITEM_COST[k] + (cell.k || 0); return d.discount ? Math.ceil(base / 2) : base }
  return (
    <div className="tq-shop">
      <div className="tq-shop-head">
        <b>🏪 Boutique {['du récif', 'des épaves', 'des abysses', 'du Kraken'][cell.k] || ''}</b>
        <small>{mine ? `🦪 ${me?.pearls} perles · sac ${me?.items?.length || 0}/3` : `${who?.name} fait ses courses…`}{left != null ? ` · ${Math.ceil(left / 1000)} s` : ''}</small>
      </div>
      {d.discount && mine && <p className="tq-shop-promo">🎯 Tombé pile dessus : ton premier achat est à moitié prix !</p>}
      <ul>
        {(cell.items || []).map(k => (
          <li key={k}>
            <span className="tq-it-ico">{ITEMS[k].icon}</span>
            <div><b>{ITEMS[k].name}</b><small>{ITEMS[k].desc}</small></div>
            {mine
              ? <button className="btn btn-small btn-gold" disabled={(me?.pearls || 0) < price(k) || (me?.items?.length || 0) >= 3} onClick={() => onBuy(k)}>🦪 {price(k)}</button>
              : <span className="tq-price">🦪 {price(k)}</span>}
          </li>
        ))}
      </ul>
      {mine && <button className="kh-play wide" onClick={onLeave}>{d.rest > 0 ? `Continuer (${d.rest} case${d.rest > 1 ? 's' : ''} restante${d.rest > 1 ? 's' : ''})` : 'Sortir de la boutique'}</button>}
    </div>
  )
}

function Finale({ v, onExit }) {
  const w = v.players.find(p => p.seat === v.winner)
  const mine = v.players.find(p => p.seat === v.me)
  return (
    <div className="tq-finale">
      <h2>🏆 {v.winner === v.me ? 'Tu as tué le Kraken !' : `${w?.name} a tué le Kraken !`}</h2>
      <p>Trésor volé : <b>{v.treasure} lingots</b></p>
      <ul>
        {[...v.players].filter(p => p.status !== 'declined').sort((a, b) => (b.seat === v.winner) - (a.seat === v.winner) || b.pos - a.pos).map(p => (
          <li key={p.seat} style={{ '--c': SEAT_COLORS[p.seat] }}><b>{p.name}</b><span>{p.bot ? '—' : `+${p.reward} lingots`}</span></li>
        ))}
      </ul>
      {mine && !mine.bot && <p className="muted small">Les perles restantes sont converties : 10 perles = 1 lingot.</p>}
      <button className="kh-play wide" onClick={onExit}>Retour à l'accueil</button>
    </div>
  )
}
