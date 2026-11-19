import { Bolt, Flame, Heart } from './Icons.jsx'
import { dayKey, heartsAt, streakNow } from '../lib/store.js'

export default function TopBar({ s, now }) {
  const streak = streakNow(s, dayKey(new Date(now)))
  const doneToday = s.streak.last === dayKey(new Date(now))
  const hearts = heartsAt(s, now).n
  return (
    <header className="topbar">
      <div className="brand">Culto<span className="brand-dot">.</span></div>
      <div className="stats">
        <span className={`pill streak ${doneToday ? 'lit' : ''}`} title="Série de jours"><Flame size={20} />{streak}</span>
        <span className="pill xp" title="XP total"><Bolt size={18} />{s.xp}</span>
        <span className="pill hearts" title="Vies"><Heart size={19} />{hearts}</span>
      </div>
    </header>
  )
}
