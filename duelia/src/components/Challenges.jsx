import Avatar from './Avatar.jsx'
import TopicIcon from './TopicIcon.jsx'
import { lastSeenLabel } from '../lib/challenges.js'

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
        <span className="notify-icon" aria-hidden="true">{{ incoming: '⚔️', accepted: '✅', rejected: '🚫', your_turn: '🎯', result: '🏁' }[note.kind] || '🔔'}</span>
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

/* ---------- Onglet Défis ---------- */
export function Inbox({ st, topics, now, onAccept, onReject, onPlay, onResult, onDismiss }) {
  const list = st.challenges || []
  const byId = (id) => topics.find(t => t.id === id)
  const groups = [
    { key: 'turn', title: 'À toi de jouer', items: list.filter(c => c.dir === 'out' && c.status === 'your_turn') },
    { key: 'in', title: 'On te défie', items: list.filter(c => c.dir === 'in' && c.status === 'pending') },
    { key: 'results', title: 'Résultats', items: list.filter(c => c.status === 'done') },
    { key: 'wait', title: 'En attente', items: list.filter(c => ['pending', 'accepted'].includes(c.status) && c.dir === 'out' || c.status === 'waiting') },
    { key: 'rejected', title: 'Refusés', items: list.filter(c => c.status === 'rejected') },
  ].filter(g => g.items.length)

  const statusLine = (c) => {
    if (c.dir === 'out' && c.status === 'pending') return 'Défi envoyé, en attente de réponse'
    if (c.dir === 'out' && c.status === 'accepted') return 'A accepté, joue sa partie…'
    if (c.dir === 'out' && c.status === 'your_turn') return `A fini sa partie. Score caché jusqu'à ce que tu joues`
    if (c.dir === 'in' && c.status === 'pending') return 'Te défie. Accepte pour jouer sans voir son score'
    if (c.status === 'waiting') return `Tu as joué (${c.myScore} pts). En attente de sa partie`
    if (c.status === 'rejected') return 'A refusé ton défi'
    if (c.status === 'done') {
      const r = c.result
      return `${r.outcome === 'win' ? 'Victoire' : r.outcome === 'lose' ? 'Défaite' : 'Égalité'} ${r.myScore}–${r.oppScore} · +${r.total} XP`
    }
    return ''
  }

  return (
    <div className="screen inbox">
      <header className="top"><h1>Défis</h1></header>
      {groups.length === 0 && (
        <div className="inbox-empty">
          <p><b>Aucun défi pour l'instant.</b></p>
          <p>Ouvre le classement d'un thème et appuie sur « Défier ». Si le joueur n'est pas en ligne, il recevra ton défi et jouera de son côté. Les autres joueurs peuvent aussi te défier : leurs défis arrivent ici.</p>
        </div>
      )}
      {groups.map(g => (
        <section key={g.key}>
          <h3 className="sec-title">{g.title} <small>({g.items.length})</small></h3>
          <ul className="ch-list">
            {g.items.map(c => {
              const topic = byId(c.topicId)
              if (!topic) return null
              return (
                <li key={c.id} className={`ch-item ${c.unseen ? 'unseen' : ''} st-${c.status}`}>
                  <Avatar seed={c.opponent.avatar} size={44} ring={c.opponent.champion ? 'var(--gold)' : undefined} />
                  <div className="ch-info">
                    <b>{c.opponent.flag} {c.opponent.name}{c.opponent.champion ? ' 👑' : ''}</b>
                    <small className="ch-topic"><TopicIcon topic={topic} size={16} /> {topic.name} · {ago(c.playedAt || c.createdAt, now)}</small>
                    <small>{statusLine(c)}</small>
                  </div>
                  <div className="ch-actions">
                    {g.key === 'turn' && <button className="btn btn-small btn-primary" onClick={() => onPlay(c)}>Jouer</button>}
                    {g.key === 'in' && <>
                      <button className="btn btn-small btn-primary" onClick={() => onAccept(c)}>Accepter</button>
                      <button className="btn btn-small btn-ghost" onClick={() => onReject(c)}>Refuser</button>
                    </>}
                    {g.key === 'results' && <button className="btn btn-small btn-secondary" onClick={() => onResult(c)}>Voir</button>}
                    {g.key === 'rejected' && <button className="btn btn-small btn-ghost" onClick={() => onDismiss(c)}>OK</button>}
                  </div>
                </li>
              )
            })}
          </ul>
        </section>
      ))}
    </div>
  )
}
