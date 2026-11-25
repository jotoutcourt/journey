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

// Actualité commune (défi lancé, relevé, refusé, résultat vu), racontée du point de vue de chacun
function eventText(m, name) {
  const p = m.payload || {}, t = p.topic || 'un thème'
  if (p.ev === 'challenge') return m.mine ? `⚔️ Tu as lancé un défi à ${name} en ${t}` : `⚔️ ${name} t'a lancé un défi en ${t}`
  if (p.ev === 'played') {
    const mine = m.mine ? p.to : p.from, theirs = m.mine ? p.from : p.to
    return m.mine ? `🎯 Tu as relevé le défi de ${name} en ${t} (${mine}–${theirs})` : `🎯 ${name} a relevé ton défi en ${t} (${theirs}–${mine})`
  }
  if (p.ev === 'declined') return m.mine ? `🙅 Tu as refusé le défi en ${t}` : `🙅 ${name} a refusé ton défi en ${t}`
  if (p.ev === 'live') {
    const mine = m.mine ? p.a : p.b, theirs = m.mine ? p.b : p.a
    const iQuit = p.forfeit && (p.forfeit === 'a') === m.mine
    if (p.forfeit) return iQuit ? `🏳️ Duel en direct en ${t} : tu as abandonné face à ${name}` : `🏆 Duel en direct en ${t} : ${name} a abandonné, tu gagnes !`
    return mine > theirs ? `🏆 Duel en direct en ${t} : tu gagnes ${mine}–${theirs} contre ${name}`
      : mine < theirs ? `⚡ Duel en direct en ${t} : ${name} gagne ${theirs}–${mine}` : `🤝 Duel en direct en ${t} : égalité ${mine}–${theirs}`
  }
  if (p.ev === 'seen') return m.mine ? `👀 Tu as vu le résultat en ${t}` : `👀 ${name} vient de voir le résultat en ${t}`
  return m.body
}

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
                  <small>{c.last ? (c.last.kind === 'event' ? eventText(c.last, c.peer.name) : `${c.last.mine ? 'Toi : ' : ''}${c.last.kind === 'invite' ? '🎮 ' : ''}${c.last.body}`) : c.peer.online ? 'En ligne · dis bonjour 👋' : 'Dis bonjour 👋'}</small>
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
  const lastMine = [...msgs].reverse().find(m => m.mine && m.kind !== 'event')
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
              {m.kind === 'event' ? <div className="ct-event">
                <span>{eventText(m, p.name)}</span>
                {!m.mine && ['challenge', 'played'].includes(m.payload?.ev) && <button className="btn btn-small btn-ghost" onClick={onOpenInbox}>{m.payload.ev === 'challenge' ? 'Jouer' : 'Voir'}</button>}
                <small>{hhmm(m.created_at)}</small>
              </div> :
              <div className={`ct-bubble ${m.mine ? 'mine' : ''} ${m.kind}`}>
                <span>{m.body}</span>
                {m.kind === 'invite' && !m.mine && m.payload?.type === 'traque' && <button className="btn btn-small btn-gold" onClick={() => onJoinTraque(m.payload.game)}>🐙 Rejoindre la chasse</button>}
                {m.kind === 'invite' && !m.mine && m.payload?.type === 'duel' && !m.payload?.live && <button className="btn btn-small btn-gold" onClick={onOpenInbox}>⚔️ Voir le défi</button>}
                <small>{hhmm(m.created_at)}</small>
              </div>}
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

// Barre de chat pendant un duel en direct : les messages passent par le chat principal
const DUEL_EMOJIS = ['😡', '🐙', '🥰', '🤨', '🤓']
export function DuelChat({ peer, voice }) {
  const [since] = useState(() => Date.now() - 2000)
  const [msgs, setMsgs] = useState([])
  const [text, setText] = useState('')
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    let alive = true
    const load = () => api.chatThread(peer.player_id).then(r => {
      if (alive && r) setMsgs((r.messages || []).filter(m => m.kind === 'text' && Date.parse(m.created_at) >= since))
    }).catch(() => {})
    load()
    const id = setInterval(() => { load(); setNow(Date.now()) }, 2000)
    return () => { alive = false; clearInterval(id) }
  }, [peer.player_id, since])
  async function send(e, emoji) {
    e?.preventDefault?.()
    const b = (emoji || text).trim()
    if (!b) return
    if (!emoji) setText('')
    try { const r = await api.chatSend(peer.player_id, b); if (r) setMsgs((r.messages || []).filter(m => m.kind === 'text' && Date.parse(m.created_at) >= since)) } catch { /* réseau */ }
  }
  // les 3 derniers messages, visibles 8 secondes
  const shown = msgs.filter(m => now - Date.parse(m.created_at) < 8000).slice(-3)
  return (
    <div className="duel-chat">
      <div className="dc-msgs">{shown.map(m => <span key={m.id} className={m.mine ? 'mine' : ''}>{m.mine ? '' : `${peer.name} : `}{m.body}</span>)}</div>
      <div className="dc-emojis">
        {voice && <button type="button" className={`dc-mic ${voice.mic}`} onClick={voice.toggleMic} disabled={voice.mic === 'asking' || voice.mic === 'unsupported'} aria-label="Micro">
          {{ on: '🎙️', muted: '🔇', asking: '⏳', denied: '🚫', unsupported: '🚫' }[voice.mic] || '🎙️'}</button>}
        {voice?.needTap && <button type="button" className="dc-mic" onClick={voice.unlock} aria-label="Entendre">🔊</button>}
        {DUEL_EMOJIS.map(em => <button key={em} type="button" onClick={() => send(null, em)}>{em}</button>)}
      </div>
      <form onSubmit={send}>
        <input value={text} onChange={e => setText(e.target.value.slice(0, 200))} placeholder={`Message à ${peer.name}…`} enterKeyHint="send" />
        <button type="submit" disabled={!text.trim()} aria-label="Envoyer">➤</button>
      </form>
    </div>
  )
}
