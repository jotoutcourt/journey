import { useEffect, useState } from 'react'
import Avatar from './Avatar.jsx'
import TopicIcon from './TopicIcon.jsx'
import ConfirmButton from './ConfirmButton.jsx'
import Mascot from './Mascot.jsx'
import * as api from '../lib/account.js'
import { sendTestPush } from '../lib/push.js'
import { levelInfo } from '../lib/levels.js'

const fmtCode = (c) => (c ? `${c.slice(0, 4)}-${c.slice(4)}` : '…')

function seenLabel(f, now) {
  if (f.online) return 'En ligne'
  if (!f.last_seen) return 'Pas encore connecté'
  const m = Math.max(1, Math.round((now - Date.parse(f.last_seen)) / 60000))
  if (m < 60) return `Vu il y a ${m} min`
  const h = Math.round(m / 60)
  return h < 24 ? `Vu il y a ${h} h` : `Vu il y a ${Math.round(h / 24)} j`
}

/* ---------- Pas de réseau ---------- */
export function Offline({ text }) {
  return (
    <div className="offline-card" role="status">
      <Mascot pose="hors-ligne" size={96} />
      <p>{text}</p>
    </div>
  )
}

/* ---------- Notifications ---------- */
export function PushCard({ status, onEnable, onDisable }) {
  const [test, setTest] = useState(null)
  if (!status || status === 'unsupported') return null
  const runTest = () => {
    setTest('…')
    sendTestPush().then(n => setTest(n === -1 ? 'Attends une minute avant un nouveau test.' : n > 0 ? 'Envoyée ! Elle doit arriver dans quelques secondes.' : 'Ce téléphone n\'est pas inscrit : désactive puis réactive les notifications.'))
      .catch(() => setTest('Envoi impossible : vérifie ta connexion.'))
  }
  return (
    <section className="install-card push-card">
      <h3 className="push-title"><Mascot pose="notification" size={40} /> Notifications</h3>
      {status === 'install-first' && <p>Sur iPhone, les notifications marchent quand Kraken est ajouté à l'écran d'accueil (Safari → Partager → Sur l'écran d'accueil). Ouvre-le ensuite depuis son icône et active-les ici.</p>}
      {status === 'denied' && <p>Les notifications sont bloquées pour Kraken. Tu peux les réautoriser dans les réglages de ton téléphone (Réglages → Notifications → Kraken).</p>}
      {status === 'off' && <>
        <p>Sois prévenu quand un ami te défie, t'invite en direct ou a fini ta partie.</p>
        <button className="btn btn-primary wide" onClick={onEnable}>Activer les notifications</button>
      </>}
      {status === 'on' && <>
        <p>✓ Activées sur cet appareil.</p>
        <button className="btn btn-secondary wide" onClick={runTest} disabled={test === '…'}>M'envoyer une notification test</button>
        {test && test !== '…' && <p className="push-test" role="status">{test}</p>}
        <button className="btn btn-ghost wide" onClick={onDisable}>Désactiver</button>
      </>}
      {status === 'busy' && <p>Un instant…</p>}
    </section>
  )
}

/* ---------- Écran Amis ---------- */
export function FriendsScreen({ online, social, code, initialCode, now, push, onPush, onAdd, onRespond, onRemove, onChallenge, onShareCode, onBack, onOpen }) {
  const [input, setInput] = useState(initialCode || '')
  const [msg, setMsg] = useState(null)
  const [busy, setBusy] = useState(false)
  async function add() {
    setBusy(true)
    const res = await onAdd(input).catch(() => 'offline')
    setBusy(false)
    setMsg({
      requested: 'Demande envoyée ! Ton ami doit l\'accepter.', accepted: 'Vous êtes maintenant amis 🎉', already: 'Vous êtes déjà amis.',
      unknown: 'Aucun joueur avec ce code. Vérifie-le.', self: 'C\'est ton propre code 😄', limit: 'Trop de demandes aujourd\'hui, réessaie demain.',
      offline: 'Pas de connexion, réessaie dans un instant.',
    }[res] || 'Une erreur est survenue.')
    if (res === 'requested' || res === 'accepted' || res === 'already') setInput('')
  }
  const friends = [...(social?.friends || [])].sort((a, b) => (b.online - a.online) || a.name.localeCompare(b.name))
  return (
    <div className="screen friends">
      <header className="top">
        {onBack && <button className="icon-btn" onClick={onBack} aria-label="Retour">←</button>}
        <h1>Amis</h1>
      </header>
      {!online && <Offline text="Pas de connexion au serveur pour l'instant : les amis ont besoin d'Internet." />}

      <section className="friend-code">
        <small>Ton code ami</small>
        <b>{fmtCode(code)}</b>
        <button className="btn btn-secondary wide" onClick={onShareCode} disabled={!code}>📤 Envoyer mon code à un ami</button>
      </section>

      <section className="friend-add">
        <label htmlFor="friend-input">Ajouter un ami avec son code</label>
        <div className="import-row">
          <input id="friend-input" value={input} onChange={e => { setInput(e.target.value.toUpperCase()); setMsg(null) }} placeholder="ABCD-1234" maxLength={12} autoCapitalize="characters" />
          <button className="btn btn-small btn-primary" onClick={add} disabled={busy || input.replace(/[^A-Za-z0-9]/g, '').length !== 8}>Ajouter</button>
        </div>
        {msg && <p className="friend-msg" role="status">{msg}</p>}
      </section>

      {social?.incoming?.length > 0 && <>
        <h3 className="sec-title">Demandes reçues <small>({social.incoming.length})</small></h3>
        <ul className="ch-list">
          {social.incoming.map(f => (
            <li key={f.player_id} className="ch-item unseen">
              <Avatar seed={f.avatar} photo={f.photo} size={44} />
              <div className="ch-info"><b>{f.flag} {f.name}</b><small>Veut devenir ton ami</small></div>
              <div className="ch-actions">
                <button className="btn btn-small btn-primary" onClick={() => onRespond(f, true)}>Accepter</button>
                <button className="btn btn-small btn-ghost" onClick={() => onRespond(f, false)}>Refuser</button>
              </div>
            </li>
          ))}
        </ul>
      </>}

      <h3 className="sec-title">Mes amis <small>({friends.length})</small></h3>
      {friends.length === 0 && online && <Mascot pose="anim" size={120} className="empty-mascot" />}
      {friends.length === 0 && <p className="inbox-empty">Envoie ton code à tes amis, ou entre le leur ci-dessus. Vous pourrez ensuite vous défier directement.</p>}
      <ul className="ch-list">
        {friends.map(f => (
          <li key={f.player_id} className="ch-item">
            <button className="friend-open" onClick={() => onOpen?.(f)} aria-label={`Voir le profil de ${f.name}`}>
              <span className="friend-av">
                <Avatar seed={f.avatar} photo={f.photo} size={44} />
                <i className={`dot ${f.online ? 'on' : 'off'}`} aria-hidden="true" />
              </span>
              <span className="ch-info"><b>{f.flag} {f.name}</b><small>{seenLabel(f, now)}</small></span>
            </button>
            <div className="ch-actions">
              <button className="btn btn-small btn-primary" onClick={() => onChallenge(f)}>Défier</button>
              <button className="btn btn-small btn-ghost" onClick={() => onOpen?.(f)}>Profil</button>
            </div>
          </li>
        ))}
      </ul>

      {social?.outgoing?.length > 0 && <>
        <h3 className="sec-title">Demandes envoyées</h3>
        <ul className="ch-list">
          {social.outgoing.map(f => (
            <li key={f.player_id} className="ch-item">
              <Avatar seed={f.avatar} photo={f.photo} size={44} />
              <div className="ch-info"><b>{f.flag} {f.name}</b><small>En attente de sa réponse</small></div>
              <div className="ch-actions"><button className="btn btn-small btn-ghost" onClick={() => onRemove(f)}>Annuler</button></div>
            </li>
          ))}
        </ul>
      </>}

      <PushCard status={push} onEnable={() => onPush(true)} onDisable={() => onPush(false)} />
    </div>
  )
}

/* ---------- Défier un ami : choix du thème et du mode ---------- */
const STAKES = [0, 5, 10, 20, 50]
export function FriendChallengeSheet({ friend, topics, initialTopic, onPick, onCancel, lingots }) {
  const [topic, setTopic] = useState(initialTopic || null)
  const [stake, setStake] = useState(0)
  const max = Math.min(lingots ?? 0, 1000)
  const bump = (d) => setStake(s => Math.max(0, Math.min(max, s + d)))
  return (
    <div className="sheet-backdrop" onClick={onCancel}>
      <div className="sheet friend-sheet" role="dialog" aria-labelledby="fsheet-title" onClick={e => e.stopPropagation()}>
        <Avatar seed={friend.avatar} photo={friend.photo} size={64} ring={friend.online ? 'var(--good, #3ddc84)' : 'var(--opp)'} />
        <h2 id="fsheet-title">Défier {friend.name}</h2>
        {!topic ? <>
          <p className="sheet-sub">Choisis le thème</p>
          <div className="fs-topics">
            {topics.map(t => (
              <button key={t.id} className="fs-topic" onClick={() => setTopic(t)}>
                <TopicIcon topic={t} size={30} /><span>{t.name}</span>
              </button>
            ))}
          </div>
        </> : <>
          <div className="sheet-topic"><TopicIcon topic={topic} size={28} /> {topic.name} <button className="link-btn" onClick={() => setTopic(null)}>changer</button></div>
          <div className="stake-box">
            <p className="stake-title">💰 Miser des lingots en direct <small>(même somme chacun, le gagnant rafle tout)</small></p>
            <div className="stake-chips">
              {STAKES.map(v => <button key={v} className={`stake-chip ${stake === v ? 'on' : ''}`} disabled={v > max} onClick={() => setStake(v)}>{v ? v : 'Sans mise'}</button>)}
            </div>
            <div className="stake-step">
              <button className="stake-btn" onClick={() => bump(-1)} disabled={!stake} aria-label="Miser un lingot de moins">−</button>
              <b><i className="lt-coin" aria-hidden="true" /> {stake} {stake > 1 ? 'lingots' : 'lingot'}</b>
              <button className="stake-btn" onClick={() => bump(1)} disabled={stake >= max} aria-label="Miser un lingot de plus">+</button>
            </div>
            <small className="stake-wallet">Ton trésor : {lingots ?? '…'} lingots{stake > 0 ? ` · ${friend.name} devra aussi en avoir ${stake}` : ''}</small>
          </div>
          {friend.online && <button className="btn btn-primary wide" onClick={() => onPick(topic, 'live', stake)}>⚡ Duel en direct{stake > 0 ? ` · mise ${stake}` : ''} <small>({friend.name} est en ligne)</small></button>}
          <button className={`btn ${friend.online ? 'btn-secondary' : 'btn-primary'} wide`} onClick={() => onPick(topic, 'async')}>📨 Défi différé <small>(sans mise)</small></button>
          {!friend.online && <button className="btn btn-secondary wide" onClick={() => onPick(topic, 'live', stake)}>⚡ Demander un duel en direct{stake > 0 ? ` · mise ${stake}` : ''}</button>}
          <p className="sheet-note">{friend.online
            ? 'En direct : vous jouez en même temps. Différé : tu joues maintenant, il joue quand il veut.'
            : `${friend.name} n'est pas en ligne. Différé : tu joues maintenant, il jouera quand il voudra. En direct : il reçoit une notification et a 2 minutes pour te rejoindre.`}</p>
        </>}
        <button className="btn btn-ghost wide" onClick={onCancel}>Annuler</button>
      </div>
    </div>
  )
}

/* ---------- Bouton « Jouer » d'un thème : contre qui ? ---------- */
export function PlayWhoSheet({ topic, online, hasFriends, onPick, onCancel }) {
  const opts = [
    { key: 'ai', icon: '🤖', title: 'Contre l\'IA', sub: 'Ou un vrai joueur en ligne s\'il y en a un', ok: true },
    { key: 'friend', icon: '⚔️', title: 'Un ami', sub: 'En direct ou en différé, à 2', ok: online },
    { key: 'party', icon: '👥', title: 'Plusieurs amis', sub: 'En direct, de 2 à 4 joueurs', ok: online && hasFriends },
    { key: 'link', icon: '🔗', title: 'Par lien', sub: 'Pour quelqu\'un qui n\'a pas encore l\'appli', ok: true },
  ]
  return (
    <div className="sheet-backdrop" onClick={onCancel}>
      <div className="sheet friend-sheet" role="dialog" aria-labelledby="who-title" onClick={e => e.stopPropagation()}>
        <div className="sheet-topic"><TopicIcon topic={topic} size={28} /> {topic.name}</div>
        <h2 id="who-title">Contre qui ?</h2>
        <ul className="pick-list who-list">
          {opts.map(o => (
            <li key={o.key}>
              <button className="pick-friend" disabled={!o.ok} onClick={() => onPick(o.key)}>
                <span className="who-icon" aria-hidden="true">{o.icon}</span>
                <span className="pf-info"><b>{o.title}</b><small>{o.ok ? o.sub : o.key === 'party' && online ? 'Ajoute d\'abord des amis' : 'Nécessite une connexion'}</small></span>
                <i aria-hidden="true">›</i>
              </button>
            </li>
          ))}
        </ul>
        <button className="link-btn" onClick={onCancel}>Annuler</button>
      </div>
    </div>
  )
}

/* ---------- Depuis un thème : choisir l'ami à défier ---------- */
export function PickFriendSheet({ topic, friends, online, onPick, onLink, onAdd, onCancel }) {
  const list = [...(friends || [])].sort((a, b) => (b.online - a.online) || a.name.localeCompare(b.name))
  return (
    <div className="sheet-backdrop" onClick={onCancel}>
      <div className="sheet friend-sheet" role="dialog" aria-labelledby="pick-title" onClick={e => e.stopPropagation()}>
        <div className="sheet-topic"><TopicIcon topic={topic} size={28} /> {topic.name}</div>
        <h2 id="pick-title">Défier un ami</h2>
        {!online && <p className="sheet-sub">Pas de connexion : tu peux quand même défier quelqu'un par lien.</p>}
        {online && list.length === 0 && <>
          <Mascot pose="anim" size={96} />
          <p className="sheet-sub">Tu n'as pas encore d'amis sur Kraken. Envoie-leur un défi par lien : en le relevant, ils deviennent tes amis.</p>
        </>}
        {online && list.length > 0 && (
          <ul className="pick-list">
            {list.map(f => (
              <li key={f.player_id}>
                <button className="pick-friend" onClick={() => onPick(f)}>
                  <Avatar seed={f.avatar} photo={f.photo} size={44} ring={f.online ? 'var(--good, #3ddc84)' : undefined} />
                  <span className="pf-info"><b>{f.flag} {f.name}</b><small>{f.online ? '● En ligne' : 'Hors ligne'}</small></span>
                  <i aria-hidden="true">›</i>
                </button>
              </li>
            ))}
          </ul>
        )}
        <button className={`btn ${online && list.length > 0 ? 'btn-ghost' : 'btn-primary'} wide`} onClick={onLink}>🔗 Défier par lien</button>
        {online && list.length === 0 && <button className="btn btn-ghost wide" onClick={onAdd}>Ajouter un ami avec son code</button>}
        <button className="link-btn" onClick={onCancel}>Annuler</button>
      </div>
    </div>
  )
}

/* ---------- En attente que l'ami accepte le duel en direct ---------- */
export function InviteWaiting({ friend, topic, status, startedAt, onCancel, onAsync, stake = 0, error }) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => { const id = setInterval(() => setNow(Date.now()), 500); return () => clearInterval(id) }, [])
  const left = Math.max(0, 120 - Math.floor((now - startedAt) / 1000))
  const over = status === 'declined' || status === 'expired' || status === 'failed'
  return (
    <div className="matchmaking">
      <TopicIcon topic={topic} size={80} />
      <h2>{topic.name}</h2>
      <div className={`radar live ${over ? 'found' : ''}`}>
        <span /><span /><span />
        <Avatar seed={friend.avatar} photo={friend.photo} size={96} className="found-av" />
      </div>
      {stake > 0 && <p className="stake-badge"><i className="lt-coin" aria-hidden="true" /> Mise : {stake} lingots chacun</p>}
      {!over && <p className="mm-status">En attente de <b>{friend.name}</b>… <b>{left} s</b></p>}
      {status === 'declined' && <p className="mm-status">{friend.name} ne peut pas jouer maintenant.</p>}
      {status === 'expired' && <p className="mm-status">{friend.name} n'a pas répondu à temps.</p>}
      {status === 'failed' && <p className="mm-status">{error || 'Invitation impossible (connexion ?).'}</p>}
      {over && <button className="btn btn-primary" onClick={onAsync}>📨 Lui envoyer un défi différé</button>}
      <button className="btn btn-ghost" onClick={onCancel}>{over ? 'Retour' : 'Annuler'}</button>
    </div>
  )
}

/* ---------- Invitation reçue ---------- */
export function LiveInviteBanner({ invite, onAccept, onDecline }) {
  const [busy, setBusy] = useState(false)
  return (
    <div className="sheet-backdrop">
      <div className="sheet invite-sheet" role="alertdialog" aria-labelledby="inv-title">
        <Avatar seed={invite.from.avatar} photo={invite.from.photo} size={80} ring="var(--opp)" />
        <h2 id="inv-title">⚡ {invite.from.name} t'invite en direct</h2>
        <div className="sheet-topic"><TopicIcon topic={{ id: invite.topic_id, ...invite.topic }} size={28} /> {invite.topic.name}</div>
        {invite.stake > 0 && <p className="stake-badge"><i className="lt-coin" aria-hidden="true" /> Mise : {invite.stake} lingots chacun · le gagnant rafle {invite.stake * 2}</p>}
        <button className="btn btn-primary wide" disabled={busy} onClick={async () => { setBusy(true); await onAccept(invite); setBusy(false) }}>{busy ? 'Connexion…' : invite.stake > 0 ? `Relever le défi (${invite.stake} lingots)` : 'Jouer maintenant'}</button>
        <button className="btn btn-ghost wide" onClick={() => onDecline(invite)}>Pas maintenant</button>
      </div>
    </div>
  )
}

/* ---------- Petit message à l'autre joueur après un défi différé ---------- */
const QUICK = ['GG 👏', 'Revanche ? 😏', 'Trop facile 😎', 'J\'ai eu chaud 😅', 'Celle-là était dure 🤯']
export function ChallengeMessage({ name, theirMsg, myMsg, onSend, quickOnly = false }) {
  const [text, setText] = useState('')
  const [sent, setSent] = useState(myMsg || null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState(false)
  async function send(msg) {
    const m = msg.trim().slice(0, 140)
    if (!m || busy) return
    setBusy(true); setErr(false)
    try { await onSend(m); setSent(m); setText('') } catch { setErr(true) }
    setBusy(false)
  }
  return (
    <section className="ch-msg">
      {theirMsg && <p className="ch-msg-theirs"><b>{name}</b> : « {theirMsg} »</p>}
      {sent
        ? <p className="ch-msg-sent">✓ Ton message : « {sent} »</p>
        : <>
          <p className="ch-msg-title">💬 Un petit mot pour {name} ?</p>
          <div className="ch-msg-quick">{QUICK.map(q => <button key={q} disabled={busy} onClick={() => send(q)}>{q}</button>)}</div>
          {!quickOnly && <form className="ch-msg-form" onSubmit={e => { e.preventDefault(); send(text) }}>
            <input value={text} maxLength={140} placeholder="Ou écris ton message…" onChange={e => setText(e.target.value)} />
            <button className="btn btn-small btn-primary" disabled={busy || !text.trim()}>Envoyer</button>
          </form>}
          {err && <small className="recover-err">Envoi impossible : vérifie ta connexion.</small>}
        </>}
    </section>
  )
}

// Message de fin de duel en direct : un seul par joueur, et on guette celui de l'adversaire pendant 3 minutes
export function LiveMatchMessage({ matchId, name, quickOnly }) {
  const [msgs, setMsgs] = useState(null)
  useEffect(() => {
    let alive = true
    const load = () => api.getMatchMessages(matchId).then(m => { if (alive && m) setMsgs(m) }).catch(() => {})
    load()
    const iv = setInterval(load, 3000)
    const stop = setTimeout(() => clearInterval(iv), 180000)
    return () => { alive = false; clearInterval(iv); clearTimeout(stop) }
  }, [matchId])
  if (!msgs) return null
  return <ChallengeMessage key={matchId} name={name} theirMsg={msgs.theirs} myMsg={msgs.mine} quickOnly={quickOnly}
    onSend={(m) => api.setMatchMessage(matchId, m)} />
}

// Résultat de la mise d'un duel en direct : le serveur règle le pot, on attend sa réponse
export function LiveBetResult({ matchId, stake, name, onWallet }) {
  const [bet, setBet] = useState(null)
  useEffect(() => {
    let alive = true, iv
    const load = () => api.myMatchBet(matchId).then(b => {
      if (!alive || !b) return
      setBet(b)
      if (b.settled) { clearInterval(iv); if (b.wallet != null) onWallet?.() }
    }).catch(() => {})
    load()
    iv = setInterval(load, 2500)
    const stop = setTimeout(() => clearInterval(iv), 300000)
    return () => { alive = false; clearInterval(iv); clearTimeout(stop) }
  }, [matchId, onWallet])
  const s = bet?.stake ?? stake
  if (!s) return null
  return (
    <section className={`bet-result ${bet?.settled ? (bet.won ? 'won' : bet.draw ? 'draw' : 'lost') : ''}`}>
      {!bet?.settled ? <p>💰 Mise de {s} lingots chacun · en attente de la fin du duel de {name}…</p>
        : bet.won ? <p>🏆 Tu rafles le pot : <b>+{s * 2} lingots</b> !</p>
          : bet.draw ? <p>🤝 Égalité : chacun récupère sa mise de {s} lingots.</p>
            : <p>💸 {name} rafle le pot : tu perds ta mise de <b>{s} lingots</b>.</p>}
      {bet?.settled && bet.wallet != null && <small>Ton trésor : {bet.wallet} lingots</small>}
    </section>
  )
}

/* ---------- Défi envoyé à un ami ---------- */
export function FriendSent({ friend, topic, score, failed, onRetry, onInbox, onHome, onMessage }) {
  return (
    <div className="screen link-screen">
      <div className="link-card">
        <Avatar seed={friend.avatar} photo={friend.photo} size={80} ring="var(--opp)" />
        <h1>{failed ? 'Envoi impossible' : failed === false ? `Défi envoyé à ${friend.name}` : 'Envoi du défi…'}</h1>
        <div className="sheet-topic"><TopicIcon topic={topic} size={24} /> {topic.name}</div>
        <p>Tu as marqué <b>{score} points</b>. {failed ? 'Vérifie ta connexion et réessaie.' : `Ton score reste caché : ${friend.name} le découvrira à la fin de sa partie, et tu recevras le résultat dans Défis.`}</p>
      </div>
      {failed === false && onMessage && <ChallengeMessage name={friend.name} onSend={onMessage} />}
      {failed && <button className="btn btn-primary wide" onClick={onRetry}>Réessayer</button>}
      <button className="btn btn-secondary wide" onClick={onInbox}>Voir mes défis</button>
      <button className="btn btn-ghost wide" onClick={onHome}>Accueil</button>
    </div>
  )
}

/* ---------- Thèmes publiés par les joueurs (dans l'onglet Thèmes) ---------- */
export function SharedTopics({ online, installed, onOpen, onList }) {
  const [q, setQ] = useState('')
  const [list, setList] = useState(null)
  const [opening, setOpening] = useState(null)
  useEffect(() => {
    if (!online) return
    let alive = true
    const id = setTimeout(() => onList(q).then(l => { if (alive) setList(l || []) }).catch(() => { if (alive) setList([]) }), q ? 400 : 0)
    return () => { alive = false; clearTimeout(id) }
  }, [online, q, onList])
  if (!online) return null
  return (
    <section className="shared-topics">
      <h3 className="sec-title">🌍 Publiés par les joueurs</h3>
      <input className="search" placeholder="Chercher un thème publié…" value={q} onChange={e => setQ(e.target.value)} />
      {list === null && <p className="inbox-empty">Chargement…</p>}
      {list?.length === 0 && <p className="inbox-empty">{q ? 'Aucun thème publié ne correspond.' : 'Aucun thème publié pour l\'instant. Publie le tien depuis sa page !'}</p>}
      <div className="grid">
        {list?.map(t => {
          const topic = { id: t.id, ...t.meta }
          return (
            <button key={t.id} className="topic-tile" disabled={opening === t.id}
              onClick={async () => { setOpening(t.id); await onOpen(t.id); setOpening(null) }}>
              <TopicIcon topic={topic} size={76} />
              <b>{t.meta.name}</b>
              <small>{opening === t.id ? 'Ouverture…' : `${t.mine ? 'par toi' : `par ${t.by_name}`} · ${t.n_questions} q.${t.players ? ` · ${t.players} joueur${t.players > 1 ? 's' : ''}` : ''}`}{installed.has(t.id) ? ' · ✓' : ''}</small>
            </button>
          )
        })}
      </div>
    </section>
  )
}

/* ---------- Profil d'un ami ---------- */
export function FriendProfile({ friend, topics, onChallenge, onRemove, onBack, onBook }) {
  const [p, setP] = useState(undefined)
  useEffect(() => {
    let alive = true
    api.getFriendProfile(friend.player_id).then(v => { if (alive) setP(v) }).catch(() => { if (alive) setP(null) })
    return () => { alive = false }
  }, [friend.player_id])
  const card = p?.card || friend
  const lvl = levelInfo(p?.xp || 0)
  const h2h = p?.h2h || { me: 0, them: 0, draws: 0 }
  const fights = h2h.me + h2h.them + h2h.draws
  const byId = (id) => topics.find(t => t.id === id)
  const since = p?.since ? new Date(p.since).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }) : null
  return (
    <div className="screen profile friend-profile">
      <header className="top"><button className="icon-btn" onClick={onBack} aria-label="Retour">←</button><h1>Profil</h1></header>
      <div className="pf-cover">
        <Avatar seed={card.avatar} photo={card.photo} size={112} ring={card.online ? 'var(--good, #3ddc84)' : 'var(--opp)'} />
        <h1 className="pf-name">{card.name}{p && <span className="pf-level">{lvl.level}</span>}</h1>
        {p && <span className="pf-title">{lvl.title}</span>}
        <span className="pf-country">{card.flag} {card.online ? '● En ligne' : since ? `Joue depuis ${since}` : ''}</span>
      </div>
      {card.bio && <p className="pf-bio">{card.bio}</p>}
      {p === undefined && <p className="muted center">Chargement…</p>}
      {p === null && <Offline text="Impossible de charger ce profil pour l'instant." />}
      {p && <>
        <h3 className="sec-title">Vos défis</h3>
        <div className="tp-stats pf-counts">
          <div><small>Toi</small><b className="c-green">{h2h.me}</b></div>
          <div><small>Nuls</small><b className="c-blue">{h2h.draws}</b></div>
          <div><small>{card.name}</small><b className="c-red">{h2h.them}</b></div>
        </div>
        <p className="pf-note center">{fights ? `${fights} défi${fights > 1 ? 's' : ''} terminé${fights > 1 ? 's' : ''} entre vous` : 'Aucun défi terminé entre vous pour l\'instant.'}</p>
        <div className="pf-tiles">
          <div><small>Parties du Kraken</small><b>{p.kraken.games}</b><span>terminées</span></div>
          <div><small>Lingots volés</small><b>{p.kraken.earned}</b><span>au total</span></div>
          <div><small>Votre record à deux</small><b>{p.duo?.best ?? '–'}</b><span>{p.duo ? `en ${p.duo.games} partie${p.duo.games > 1 ? 's' : ''}` : 'jouez ensemble !'}</span></div>
        </div>
        {p.top.length > 0 && <>
          <h3 className="sec-title">Ses thèmes favoris</h3>
          <ul className="pf-topics">
            {p.top.map(t => {
              const topic = byId(t.topic_id)
              const l = levelInfo(t.xp)
              return (
                <li key={t.topic_id}>
                  {topic ? <TopicIcon topic={topic} size={40} /> : <span className="pf-topic-x">🎯</span>}
                  <div><b>{topic?.name || 'Thème perso'}</b><small>Niveau {l.level} · {l.title}</small></div>
                  <span>{t.xp} XP</span>
                </li>
              )
            })}
          </ul>
        </>}
      </>}
      {p && onBook && <button className="btn btn-secondary wide fp-book" onClick={() => onBook(card)}>📖 Voir son livre de stickers</button>}
      {onRemove && <ConfirmButton className="btn btn-ghost danger wide fp-remove" onConfirm={() => onRemove(card)} confirmLabel={`Retirer ${card.name} ? Appuie encore pour confirmer`}>Retirer de mes amis</ConfirmButton>}
      <div className="results-dock"><button className="btn btn-primary wide" style={{ gridColumn: '1 / -1' }} onClick={() => onChallenge(card)}>⚔️ Défier {card.name}</button></div>
    </div>
  )
}
