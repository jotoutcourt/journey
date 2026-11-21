import { useEffect, useState } from 'react'
import Avatar from './Avatar.jsx'
import TopicIcon from './TopicIcon.jsx'
import ConfirmButton from './ConfirmButton.jsx'
import Mascot from './Mascot.jsx'

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
  if (!status || status === 'unsupported') return null
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
        <button className="btn btn-ghost wide" onClick={onDisable}>Désactiver</button>
      </>}
      {status === 'busy' && <p>Un instant…</p>}
    </section>
  )
}

/* ---------- Écran Amis ---------- */
export function FriendsScreen({ online, social, code, initialCode, now, push, onPush, onAdd, onRespond, onRemove, onChallenge, onShareCode, onBack }) {
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
            <span className="friend-av">
              <Avatar seed={f.avatar} photo={f.photo} size={44} />
              <i className={`dot ${f.online ? 'on' : 'off'}`} aria-hidden="true" />
            </span>
            <div className="ch-info"><b>{f.flag} {f.name}</b><small>{seenLabel(f, now)}</small></div>
            <div className="ch-actions">
              <button className="btn btn-small btn-primary" onClick={() => onChallenge(f)}>Défier</button>
              <ConfirmButton className="btn btn-small btn-ghost danger" onConfirm={() => onRemove(f)} confirmLabel="Retirer ?">✕</ConfirmButton>
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
export function FriendChallengeSheet({ friend, topics, initialTopic, onPick, onCancel }) {
  const [topic, setTopic] = useState(initialTopic || null)
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
          {friend.online && <button className="btn btn-primary wide" onClick={() => onPick(topic, 'live')}>⚡ Duel en direct <small>({friend.name} est en ligne)</small></button>}
          <button className={`btn ${friend.online ? 'btn-secondary' : 'btn-primary'} wide`} onClick={() => onPick(topic, 'async')}>📨 Défi différé</button>
          <p className="sheet-note">{friend.online
            ? 'En direct : vous jouez en même temps. Différé : tu joues maintenant, il joue quand il veut.'
            : `${friend.name} n'est pas en ligne : tu joues maintenant, il jouera quand il voudra et tu recevras le résultat.`}</p>
        </>}
        <button className="btn btn-ghost wide" onClick={onCancel}>Annuler</button>
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
                  <span><b>{f.flag} {f.name}</b><small>{f.online ? '● En ligne' : 'Hors ligne'}</small></span>
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
export function InviteWaiting({ friend, topic, status, startedAt, onCancel, onAsync }) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => { const id = setInterval(() => setNow(Date.now()), 500); return () => clearInterval(id) }, [])
  const left = Math.max(0, 60 - Math.floor((now - startedAt) / 1000))
  const over = status === 'declined' || status === 'expired' || status === 'failed'
  return (
    <div className="matchmaking">
      <TopicIcon topic={topic} size={80} />
      <h2>{topic.name}</h2>
      <div className={`radar live ${over ? 'found' : ''}`}>
        <span /><span /><span />
        <Avatar seed={friend.avatar} photo={friend.photo} size={96} className="found-av" />
      </div>
      {!over && <p className="mm-status">En attente de <b>{friend.name}</b>… <b>{left} s</b></p>}
      {status === 'declined' && <p className="mm-status">{friend.name} ne peut pas jouer maintenant.</p>}
      {status === 'expired' && <p className="mm-status">{friend.name} n'a pas répondu à temps.</p>}
      {status === 'failed' && <p className="mm-status">Invitation impossible (connexion ?).</p>}
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
        <button className="btn btn-primary wide" disabled={busy} onClick={async () => { setBusy(true); await onAccept(invite); setBusy(false) }}>{busy ? 'Connexion…' : 'Jouer maintenant'}</button>
        <button className="btn btn-ghost wide" onClick={() => onDecline(invite)}>Pas maintenant</button>
      </div>
    </div>
  )
}

/* ---------- Défi envoyé à un ami ---------- */
export function FriendSent({ friend, topic, score, failed, onRetry, onInbox, onHome }) {
  return (
    <div className="screen link-screen">
      <div className="link-card">
        <Avatar seed={friend.avatar} photo={friend.photo} size={80} ring="var(--opp)" />
        <h1>{failed ? 'Envoi impossible' : failed === false ? `Défi envoyé à ${friend.name}` : 'Envoi du défi…'}</h1>
        <div className="sheet-topic"><TopicIcon topic={topic} size={24} /> {topic.name}</div>
        <p>Tu as marqué <b>{score} points</b>. {failed ? 'Vérifie ta connexion et réessaie.' : `Ton score reste caché : ${friend.name} le découvrira à la fin de sa partie, et tu recevras le résultat dans Défis.`}</p>
      </div>
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
