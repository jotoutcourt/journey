import Avatar from './Avatar.jsx'
import TopicIcon from './TopicIcon.jsx'
import AiTag from './AiTag.jsx'
import { lastSeenLabel } from '../lib/challenges.js'
import { LINK_TTL } from '../lib/linkduel.js'
import ConfirmButton from './ConfirmButton.jsx'
import Mascot from './Mascot.jsx'

function ago(ts, now) {
  const m = Math.max(0, Math.round((now - ts) / 60000))
  if (m < 1) return 'à l\'instant'
  if (m < 60) return `il y a ${m} min`
  const h = Math.round(m / 60)
  return h < 24 ? `il y a ${h} h` : `il y a ${Math.round(h / 24)} j`
}

/* ---------- Fenêtre « ce joueur n'est pas en ligne » ---------- */
export function ChallengeSheet({ sheet, onSend, onCancel }) {
  const { opponent, topic, lastSeenMin } = sheet
  return (
    <div className="sheet-backdrop" onClick={onCancel}>
      <div className="sheet" role="dialog" aria-labelledby="sheet-title" onClick={e => e.stopPropagation()}>
        <Avatar seed={opponent.avatar} size={72} ring={opponent.champion ? 'var(--gold)' : 'var(--opp)'} />
        <h2 id="sheet-title">{opponent.flag} {opponent.name} n'est pas en ligne</h2>
        <p className="sheet-sub"><span className="dot off" aria-hidden="true" /> {lastSeenLabel(lastSeenMin)}</p>
        <div className="sheet-topic"><TopicIcon topic={topic} size={28} /> {topic.name}</div>
        <ol className="sheet-steps">
          <li>{opponent.name} reçoit ton défi et peut l'accepter ou le refuser.</li>
          <li>S'il accepte, il joue les 7 questions sans connaître ton score.</li>
          <li>Tu reçois une notification quand il a fini : tu joues à ton tour et tu découvres le résultat.</li>
        </ol>
        <button className="btn btn-primary wide" onClick={onSend}>Envoyer le défi</button>
        <button className="btn btn-ghost wide" onClick={onCancel}>Annuler</button>
      </div>
    </div>
  )
}

/* ---------- Bandeau de notification ---------- */
export function NotifyBanner({ note, onOpen, onClose }) {
  return (
    <div className="notify" role="status">
      <button className="notify-body" onClick={onOpen}>
        <Mascot pose="notification" size={44} className="notify-mascot" />
        <span>{note.text}</span>
      </button>
      <button className="notify-x" onClick={onClose} aria-label="Fermer">✕</button>
    </div>
  )
}

/* ---------- Après avoir joué un défi reçu ---------- */
export function SentScreen({ challenge, topic, onInbox, onHome }) {
  return (
    <div className="screen sent">
      <div className="sent-card">
        <TopicIcon topic={topic} size={72} />
        <h1>Partie envoyée</h1>
        <p>Tu as marqué <b>{challenge.myScore} points</b> sur « {topic.name} ».</p>
        <p className="sent-wait">
          <Avatar seed={challenge.opponent.avatar} size={36} />
          <span>{challenge.opponent.name} doit encore jouer. Tu recevras une notification avec le résultat.</span>
        </p>
      </div>
      <button className="btn btn-primary wide" onClick={onInbox}>Voir mes défis</button>
      <button className="btn btn-ghost wide" onClick={onHome}>Accueil</button>
    </div>
  )
}

/* ---------- Onglet Défis : une seule liste (défis entre amis, contre des joueurs, par lien) ---------- */
export function Inbox({ st, topics, now, onAccept, onReject, onPlay, onResult, onDismiss, onResend, onCancel, friend, footer }) {
  const byId = (id) => topics.find(t => t.id === id)
  const items = []

  // Défis locaux (joueurs du classement, liens)
  for (const c of st.challenges || []) {
    const topic = byId(c.topicId) || (c.topicMeta && { ...c.topicMeta, questions: [] }) || { id: 'lien', name: 'Défi par lien', icon: '🔗', color: '#7c5cff' }
    let group = null, line = '', actions = null
    if (c.dir === 'out' && c.status === 'your_turn') {
      group = 'play'; line = 'A fini sa partie. Score caché jusqu\'à ce que tu joues'
      actions = <button className="btn btn-small btn-primary" onClick={() => onPlay(c)}>Jouer</button>
    } else if (c.dir === 'in' && c.status === 'pending') {
      group = 'play'; line = 'Te défie. Accepte pour jouer sans voir son score'
      actions = <><button className="btn btn-small btn-primary" onClick={() => onAccept(c)}>Accepter</button><button className="btn btn-small btn-ghost" onClick={() => onReject(c)}>Refuser</button></>
    } else if (c.status === 'done') {
      const r = c.result
      group = 'results'; line = `${r.outcome === 'win' ? 'Victoire' : r.outcome === 'lose' ? 'Défaite' : 'Égalité'} ${r.myScore}–${r.oppScore}${r.total ? ` · +${r.total} XP` : ''}`
      actions = <button className="btn btn-small btn-secondary" onClick={() => onResult(c)}>Voir</button>
    } else if (c.status === 'waiting-link') {
      const left = Math.max(0, c.createdAt + LINK_TTL - now)
      const d = Math.floor(left / 86400000), h = Math.ceil((left % 86400000) / 3600000)
      group = 'wait'; line = `Tu as marqué ${c.myScore} pts · lien valable ${d > 0 ? `${d} j` : `${h} h`}`
      actions = <><button className="btn btn-small btn-ghost" onClick={() => onResend(c)}>Renvoyer</button><ConfirmButton className="btn btn-small btn-ghost danger" onConfirm={() => onCancel(c)} confirmLabel="Sûr ?">Annuler</ConfirmButton></>
    } else if ((['pending', 'accepted'].includes(c.status) && c.dir === 'out') || c.status === 'waiting') {
      group = 'wait'
      line = c.status === 'pending' ? 'Défi envoyé, en attente de réponse' : c.status === 'accepted' ? 'A accepté, joue sa partie…' : `Tu as marqué ${c.myScore} pts · en attente de sa partie`
    } else if (c.status === 'rejected' || c.status === 'expired') {
      group = 'closed'; line = c.status === 'rejected' ? 'A refusé ton défi' : 'Personne n\'a relevé ce défi en 7 jours'
      actions = <button className="btn btn-small btn-ghost" onClick={() => onDismiss(c)}>OK</button>
    }
    if (!group) continue
    const o = c.opponent
    const unnamed = c.status === 'waiting-link' && o.id === 'ami' && o.name === 'Ton ami'
    items.push({
      id: c.id, group, line, actions, topic, when: c.playedAt || c.createdAt, unseen: c.unseen,
      avatar: o.avatar, photo: o.photo, champion: o.champion,
      name: unnamed ? 'Défi par lien' : `${o.flag ? o.flag + ' ' : ''}${c.status === 'waiting-link' ? 'Pour ' : ''}${o.name}`,
      ai: o.ai || /^[\w-]+:\d+$/.test(o.id || ''), link: c.dir?.startsWith('link'),
    })
  }

  // Défis entre amis (serveur)
  for (const c of friend?.list || []) {
    let group = null, line = '', actions = null
    const pending = c.status === 'pending'
    if (pending && c.dir === 'in') {
      group = 'play'; line = 'Te défie. Son score reste caché jusqu\'à la fin'
      actions = <><button className="btn btn-small btn-primary" onClick={() => friend.onPlay(c)}>Jouer</button><button className="btn btn-small btn-ghost" onClick={() => friend.onDecline(c)}>Refuser</button></>
    } else if (pending && c.dir === 'out') {
      group = 'wait'; line = `Tu as marqué ${c.my_score} pts · en attente de sa partie`
      actions = <ConfirmButton className="btn btn-small btn-ghost danger" onConfirm={() => friend.onCancel(c)} confirmLabel="Sûr ?">Annuler</ConfirmButton>
    } else if (c.status === 'done') {
      const r = friend.results?.[c.id]
      const v = c.my_score > c.their_score ? 'Victoire' : c.my_score < c.their_score ? 'Défaite' : 'Égalité'
      group = 'results'; line = `${v} ${c.my_score}–${c.their_score}${r?.total ? ` · +${r.total} XP` : ''}`
      actions = <button className="btn btn-small btn-secondary" onClick={() => friend.onSee(c)}>Voir</button>
    } else if (['declined', 'expired', 'cancelled'].includes(c.status) && !(c.dir === 'in' && c.status === 'cancelled')) {
      group = 'closed'
      line = c.status === 'declined' ? (c.dir === 'out' ? 'A refusé ton défi' : 'Tu as refusé ce défi') : c.status === 'expired' ? 'Pas joué en 7 jours' : 'Défi annulé'
    }
    if (!group) continue
    if (c.their_msg) line = <>{line}<span className="ch-their-msg">💬 « {c.their_msg} »</span></>
    items.push({
      id: 'f-' + c.id, group, line, actions, topic: { id: c.topic_id, ...c.topic }, when: Date.parse(c.answered_at || c.created_at), unseen: group === 'play',
      avatar: c.opponent.avatar, photo: c.opponent.photo, name: `${c.opponent.flag ? c.opponent.flag + ' ' : ''}${c.opponent.name}`,
    })
  }

  const LIMIT = { results: 20, closed: 8 }
  const groups = [
    { key: 'play', title: 'À toi de jouer' },
    { key: 'wait', title: 'En attente' },
    { key: 'results', title: 'Résultats' },
    { key: 'closed', title: 'Refusés ou expirés' },
  ].map(g => ({ ...g, items: items.filter(x => x.group === g.key).sort((a, b) => b.when - a.when).slice(0, LIMIT[g.key] || 99) }))
    .filter(g => g.items.length)

  return (
    <div className="screen inbox">
      <header className="top"><h1>Défis</h1></header>
      {groups.length === 0 && (
        <div className="inbox-empty">
          <Mascot pose="anim" size={120} className="empty-mascot" />
          <p><b>Aucun défi pour l'instant.</b></p>
          <p>Ouvre un thème et appuie sur « Défier un ami ». Les défis que tu reçois arrivent ici.</p>
        </div>
      )}
      {groups.map(g => (
        <section key={g.key}>
          <h3 className="sec-title">{g.title} <small>({g.items.length})</small></h3>
          <ul className="ch-list">
            {g.items.map(x => (
              <li key={x.id} className={`ch-item ${x.unseen ? 'unseen' : ''} g-${g.key}`}>
                <Avatar seed={x.avatar} photo={x.photo} size={44} ring={x.champion ? 'var(--gold)' : undefined} />
                <div className="ch-info">
                  <b>{x.name}{x.champion ? ' 👑' : ''}<AiTag on={x.ai} />{x.link && <span className="ch-link" title="Défi par lien"> 🔗</span>}</b>
                  <small className="ch-topic"><TopicIcon topic={x.topic} size={16} /> {x.topic.name} · {ago(x.when, now)}</small>
                  <small>{x.line}</small>
                </div>
                {x.actions && <div className="ch-actions">{x.actions}</div>}
              </li>
            ))}
          </ul>
        </section>
      ))}
      {footer}
    </div>
  )
}
