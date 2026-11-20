import { useEffect, useState } from 'react'
import Avatar from './Avatar.jsx'
import AiTag from './AiTag.jsx'
import TopicIcon from './TopicIcon.jsx'
import { leaderboard } from '../lib/bots.js'
import { myPeriodXp, PERIODS } from '../lib/periods.js'
import { meEntry } from '../lib/profile.js'
import { sfx } from '../lib/sound.js'

const ROW = 46 // hauteur d'une ligne, en px
const fmt = (n) => n.toLocaleString('fr-FR')

function ShiftCard({ label, before, after, rows, delay }) {
  const climbed = before - after // > 0 : on est monté
  const [moved, setMoved] = useState(false)
  const [shown, setShown] = useState(before)

  // Après un court délai, la ligne du joueur glisse jusqu'à sa nouvelle place et le rang défile.
  useEffect(() => {
    let raf
    const t = setTimeout(() => {
      setMoved(true)
      const start = performance.now()
      const step = (now) => {
        const k = Math.min(1, (now - start) / 1100)
        setShown(Math.round(before + (after - before) * (1 - Math.pow(1 - k, 3))))
        if (k < 1) raf = requestAnimationFrame(step)
      }
      raf = requestAnimationFrame(step)
    }, delay)
    return () => { clearTimeout(t); cancelAnimationFrame(raf) }
  }, [before, after, delay])

  const idx = after - 1
  const start = Math.max(0, Math.min(idx - 2, rows.length - 5))
  const win = rows.slice(start, start + 5)
  const offset = Math.max(-3, Math.min(3, climbed)) * ROW

  return (
    <section className="shift-card">
      <header>
        <b>{label}</b>
        <span className={`shift-delta ${climbed > 0 ? 'up' : climbed < 0 ? 'down' : ''}`}>
          {climbed > 0 ? `▲ ${climbed} place${climbed > 1 ? 's' : ''}` : climbed < 0 ? `▼ ${-climbed} place${climbed < -1 ? 's' : ''}` : '= stable'}
        </span>
      </header>
      <ol className="shift-rows" style={{ height: win.length * ROW }}>
        {win.map(r => (
          <li key={r.id} className={`shift-row ${r.isMe ? 'me' : ''}`}
            style={r.isMe ? { transform: moved ? 'translateY(0)' : `translateY(${offset}px)` } : undefined}>
            <span className="rk">{r.isMe ? shown : r.rank}</span>
            <Avatar seed={r.avatar} photo={r.photo} size={30} />
            <span className="sr-name">{r.flag} {r.isMe ? 'Toi' : r.name}<AiTag on={r.ai} /></span>
            <span className="sr-xp">{fmt(r.xp)}</span>
          </li>
        ))}
      </ol>
    </section>
  )
}

export default function RankShift({ shift, profile, onClose }) {
  const { topic, before, after, stats } = shift
  const anyUp = PERIODS.some(p => after[p.id] < before[p.id])

  useEffect(() => {
    if (anyUp) sfx.levelUp()
    const id = setTimeout(onClose, 6500)
    return () => clearTimeout(id)
  }, [anyUp, onClose])

  const meRow = { ...meEntry(profile), allXp: stats?.xp || 0 }
  return (
    <div className="shift-backdrop" onClick={onClose}>
      <div className="shift" role="dialog" aria-label={`Ton classement sur ${topic.name}`} onClick={e => e.stopPropagation()}>
        <div className="shift-head">
          <TopicIcon topic={topic} size={40} />
          <div><small>Ton classement</small><b>{topic.name}</b></div>
        </div>
        {PERIODS.map((p, i) => (
          <ShiftCard key={p.id} label={p.label} before={before[p.id]} after={after[p.id]} delay={350 + i * 450}
            rows={leaderboard(topic, meRow, myPeriodXp(stats, p.id), p.id)} />
        ))}
        <button className="btn btn-primary wide" onClick={onClose}>Continuer</button>
      </div>
    </div>
  )
}
