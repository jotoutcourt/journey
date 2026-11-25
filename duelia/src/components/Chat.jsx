// Chat entre amis : liste des conversations et fil d'une conversation (messages privés, invitations à jouer)
import { useEffect, useRef, useState } from 'react'
import Avatar from './Avatar.jsx'
import * as api from '../lib/account.js'

const hhmm = (t) => new Date(t).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
function when(t) {
  const d = new Date(t), now = new Date()
  if (d.toDateString() === now.toDateString()) return hhmm(t)
  const y = new Date(now); y.setDate(now.getDate() - 1)
  if (d.toDateString() === y.toDateString()) return 'Hier'
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}
const dayLabel = (t) => { const w = when(t); return /:/.test(w) ? 'Aujourd\'hui' : w }

export function ChatList({ onOpen, onAddFriend }) {
  const [list, setList] = useState(null)
  useEffect(() => {
    let alive = true
    const load = () => { if (!document.hidden) api.chatList().then(r => { if (alive) setList(Array.isArray(r) ? r : []) }).catch(() => { if (alive) setList(l => l || []) }) }
    load()
    const id = setInterval(load, 8000)
    return () => { alive = false; clearInterval(id) }
  }, [])
  return (
    <div className="screen chat-list">
      <header className="top"><h1>Chat</h1></header>
      {!list ? <div className="center"><div className="spinner" /></div>
        : list.length === 0 ? <div className="chat-empty"><p>💬 Ajoute des amis pour discuter avec eux.</p><button className="btn btn-gold" onClick={onAddFriend}>Ajouter un ami</button></div>
        : <ul className="chat-rows">
          {list.map(c => (
            <li key={c.peer.player_id}>
              <button onClick={() => onOpen(c.peer)} className={c.unread > 0 ? 'unread' : ''}>
                <span className="cr-av"><Avatar seed={c.peer.avatar} photo={c.peer.photo} size={48} />{c.peer.online && <i className="cr-on" />}</span>
                <span className="cr-txt">
                  <b>{c.peer.name}</b>
                  <small>{c.last ? `${c.last.mine ? 'Toi : ' : ''}${c.last.kind === 'invite' ? '🎮 ' : ''}${c.last.body}` : c.peer.online ? 'En ligne · dis bonjour 👋' : 'Dis bonjour 👋'}</small>
                </span>
                <span className="cr-side">{c.last && <small>{when(c.last.at)}</small>}{c.unread > 0 && <i className="cr-badge">{c.unread}</i>}</span>
              </button>
            </li>
          ))}
        </ul>}
    </div>
  )
}

export function ChatThread({ peer, onBack, onChallenge, onTraque, onJoinTraque, onOpenInbox }) {
  const [data, setData] = useState(null)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [menu, setMenu] = useState(false)
  const [err, setErr] = useState('')
  const end = useRef(null)
  const lastId = useRef(0)
  useEffect(() => {
    let alive = true
    const load = () => { if (!document.hidden) api.chatThread(peer.player_id).then(r => { if (alive && r) setData(r) }).catch(() => {}) }
    load()
    const id = setInterval(load, 2500)
    return () => { alive = false; clearInterval(id) }
  }, [peer.player_id])
  const msgs = data?.messages || []
  const top = msgs.length ? msgs[msgs.length - 1].id : 0
  useEffect(() => { if (top !== lastId.current) { lastId.current = top; end.current?.scrollIntoView({ block: 'end', behavior: 'smooth' }) } }, [top])
  async function send(body = text, kind = 'text', payload = null) {
    const b = body.trim()
    if (!b || sending) return
    setSending(true); setErr('')
    try { const r = await api.chatSend(peer.player_id, b, kind, payload); if (r) setData(r); if (kind === 'text') setText('') }
    catch (e) { setErr(/doucement/.test(e?.message || '') ? 'Doucement, tu envoies trop de messages 😅' : 'Envoi impossible, vérifie ta connexion.') }
    finally { setSending(false) }
  }
  const p = data?.peer || peer
  const lastMine = [...msgs].reverse().find(m => m.mine)
  return (
    <div className="screen chat-thread">
      <header className="top ct-head">
        <button className="icon-btn" onClick={onBack} aria-label="Retour">←</button>
        <Avatar seed={p.avatar} photo={p.photo} size={36} />
        <span className="ct-who"><b>{p.name}</b><small>{p.online ? '🟢 En ligne' : 'Hors ligne'}</small></span>
      </header>
      <div className="ct-msgs">
        {!data && <div className="center"><div className="spinner" /></div>}
        {data && msgs.length === 0 && <p className="ct-hint">Commence la conversation avec {p.name} 👋</p>}
        {msgs.map((m, i) => {
          const newDay = i === 0 || dayLabel(m.created_at) !== dayLabel(msgs[i - 1].created_at)
          return (
            <div key={m.id}>
              {newDay && <p className="ct-day">{dayLabel(m.created_at)}</p>}
              <div className={`ct-bubble ${m.mine ? 'mine' : ''} ${m.kind}`}>
                <span>{m.body}</span>
                {m.kind === 'invite' && !m.mine && m.payload?.type === 'traque' && <button className="btn btn-small btn-gold" onClick={() => onJoinTraque(m.payload.game)}>🐙 Rejoindre la chasse</button>}
                {m.kind === 'invite' && !m.mine && m.payload?.type === 'duel' && <button className="btn btn-small btn-gold" onClick={onOpenInbox}>⚔️ Voir le défi</button>}
                <small>{hhmm(m.created_at)}</small>
              </div>
              {lastMine && m.id === lastMine.id && data.seen >= m.id && <p className="ct-seen">Vu</p>}
            </div>
          )
        })}
        <div ref={end} />
      </div>
      {menu && <div className="ct-menu">
        <button onClick={() => { setMenu(false); onChallenge(p) }}>⚔️ Lancer un défi en duel</button>
        {onTraque && <button onClick={async () => { setMenu(false); const game = await onTraque(p); if (game) send(`🐙 Viens chasser le Kraken avec moi !`, 'invite', { type: 'traque', game }) }}>🐙 Inviter à la Chasse au Kraken</button>}
      </div>}
      {err && <p className="ct-err">{err}</p>}
      <form className="ct-input" onSubmit={e => { e.preventDefault(); send() }}>
        <button type="button" className="ct-play" onClick={() => setMenu(m => !m)} aria-label="Inviter à jouer">🎮</button>
        <input value={text} onChange={e => setText(e.target.value.slice(0, 1000))} placeholder="Écris un message…" enterKeyHint="send" />
        <button type="submit" className="ct-send" disabled={!text.trim() || sending} aria-label="Envoyer">➤</button>
      </form>
    </div>
  )
}
