import { useEffect, useState } from 'react'
import Avatar from './Avatar.jsx'
import TopicIcon from './TopicIcon.jsx'
import { leaderboard } from '../lib/bots.js'
import { myPeriodXp, PERIODS } from '../lib/periods.js'
import { meEntry } from '../lib/profile.js'
import { sfx } from '../lib/sound.js'

const ROW = 48 // hauteur d'une ligne du mini-classement, en px
const fmt = (n) => n.toLocaleString('fr-FR')
const SHORT = { week: 'Semaine', month: 'Mois', all: 'Toujours' }

// Rang qui défile de l'ancienne à la nouvelle place.
function useCount(from, to, delay) {
  const [shown, setShown] = useState(from)
  const [done, setDone] = useState(false)
  useEffect(() => {
    let raf
    const t = setTimeout(() => {
      const start = performance.now()
      const step = (now) => {
        const k = Math.min(1, (now - start) / 1000)
        setShown(Math.round(from + (to - from) * (1 - Math.pow(1 - k, 3))))
        if (k < 1) raf = requestAnimationFrame(step)
        else setDone(true)
      }
      raf = requestAnimationFrame(step)
    }, delay)
    return () => { clearTimeout(t); cancelAnimationFrame(raf) }
  }, [from, to, delay])
  return [shown, done]
}

function RankTile({ id, before, after, total, delay }) {
  const climbed = before - after
  const [shown, done] = useCount(before, after, delay)
  const dir = climbed > 0 ? 'up' : climbed < 0 ? 'down' : 'same'
  return (
    <div className={`rs-tile ${dir} ${done ? 'done' : ''} ${after === 1 ? 'first' : ''}`}>
      <small>{SHORT[id]}</small>
      <b>{after === 1 && done ? '👑' : `#${shown}`}</b>
      <span className="rs-delta">{climbed > 0 ? `▲ ${climbed}` : climbed < 0 ? `▼ ${-climbed}` : '='}</span>
      <em>sur {total}</em>
    </div>
  )
}

// Mini-classement autour du joueur : sa ligne glisse de l'ancienne place à la nouvelle.
function Board({ rows, before, after }) {
  const [moved, setMoved] = useState(false)
  useEffect(() => { const t = setTimeout(() => setMoved(true), 450); return () => clearTimeout(t) }, [])
  const idx = after - 1
  const start = Math.max(0, Math.min(idx - 2, rows.length - 5))
  const win = rows.slice(start, start + 5)
  const offset = Math.max(-3, Math.min(3, before - after)) * ROW
  return (
    <ol className="rs-board" style={{ height: win.length * ROW }}>
      {win.map(r => (
        <li key={r.id} className={`rs-row ${r.isMe ? 'me' : ''} ${r.rank <= 3 ? 'top' + r.rank : ''}`}
          style={r.isMe ? { transform: moved ? 'translateY(0)' : `translateY(${offset}px)` } : undefined}>
          <span className="rk">{r.rank}</span>
          <Avatar seed={r.avatar} photo={r.photo} size={32} ring={r.champion ? 'var(--gold)' : undefined} />
          <span className="rs-name">{r.isMe ? 'Toi' : `${r.flag} ${r.name}`}</span>
          <span className="rs-xp">{fmt(r.xp)} <small>XP</small></span>
        </li>
      ))}
    </ol>
  )
}

export default function RankShift({ shift, profile, onClose }) {
  const { topic, before, after, stats } = shift
  const anyUp = PERIODS.some(p => after[p.id] < before[p.id])

  useEffect(() => {
    if (anyUp) sfx.levelUp()
    const id = setTimeout(onClose, 7000)
    return () => clearTimeout(id)
  }, [anyUp, onClose])

  const meRow = { ...meEntry(profile), allXp: stats?.xp || 0 }
  const boards = Object.fromEntries(PERIODS.map(p => [p.id, leaderboard(topic, meRow, myPeriodXp(stats, p.id), p.id)]))
  const week = boards.week
  const climbed = before.week - after.week
  const alone = week.length === 1
  const title = after.week === 1 ? 'Numéro 1 de la semaine !' : climbed > 0 ? `+${climbed} place${climbed > 1 ? 's' : ''} cette semaine` : 'Ton classement'

  return (
    <div className="shift-backdrop" onClick={onClose}>
      <div className="shift" role="dialog" aria-label={`Ton classement sur ${topic.name}`} onClick={e => e.stopPropagation()} style={{ '--c': topic.color }}>
        <div className="rs-head">
          <TopicIcon topic={topic} size={44} />
          <div><small>{topic.name}</small><b>{title}</b></div>
        </div>
        <div className="rs-tiles">
          {PERIODS.map((p, i) => (
            <RankTile key={p.id} id={p.id} before={before[p.id]} after={after[p.id]} total={boards[p.id].length} delay={250 + i * 300} />
          ))}
        </div>
        {alone
          ? <p className="rs-alone">Tu es le seul joueur classé sur ce thème pour l'instant. Invite tes amis à te détrôner !</p>
          : <>
            <p className="rs-sub">Cette semaine · {week.length} joueurs</p>
            <Board rows={week} before={before.week} after={after.week} />
          </>}
        <button className="btn btn-primary wide" onClick={onClose}>Continuer</button>
      </div>
    </div>
  )
}
