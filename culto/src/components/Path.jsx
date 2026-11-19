import { useState } from 'react'
import { THEMES, ALL_SHINES } from '../data/themes.js'
import { dayKey, heartsAt } from '../lib/store.js'
import { fmtWait } from '../lib/useNow.js'
import { lessonState } from '../lib/progress.js'
import { share } from '../lib/util.js'
import { Check, Lock, ShareIcon, Sparkle, Star } from './Icons.jsx'

const OFFSETS = [0, 52, 0, -52]

export default function Path({ s, now, onStart }) {
  const [picked, setPicked] = useState(null) // { theme, index }
  const today = dayKey(new Date(now))
  const dayXp = s.days[today] || 0
  const goalPct = Math.min(1, dayXp / s.goal)
  const daySeed = Math.floor(new Date(now).setHours(0, 0, 0, 0) / 864e5)
  const fact = ALL_SHINES[daySeed % ALL_SHINES.length]

  // la prochaine leçon conseillée : la première ouverte, thème après thème
  let nextId = null
  for (const t of THEMES) {
    const k = t.lessons.findIndex((_, i) => lessonState(s, t, i) === 'open')
    if (k >= 0) { nextId = t.lessons[k].id; break }
  }

  return (
    <div className="page">
      <section className="goal-card">
        <div className="goal-ring" style={{ '--p': goalPct }}>
          <span>{goalPct >= 1 ? '🎉' : `${Math.round(goalPct * 100)}%`}</span>
        </div>
        <div className="goal-info">
          <div className="goal-title">{goalPct >= 1 ? 'Objectif du jour atteint !' : 'Objectif du jour'}</div>
          <div className="goal-sub">{dayXp} / {s.goal} XP</div>
          <div className="bar thin"><div className="bar-fill gold" style={{ width: `${goalPct * 100}%` }} /></div>
        </div>
      </section>

      <section className="fact-card" style={{ '--theme': fact.theme.color }}>
        <div className="fact-head">
          <span className="fact-tag"><Sparkle size={15} /> Le fait du jour</span>
          <button className="icon-btn small" aria-label="Partager" onClick={() => share(fact.text)}><ShareIcon size={18} /></button>
        </div>
        <p className="fact-text">{fact.text}</p>
        <div className="fact-from">{fact.theme.emoji} {fact.theme.name} · {fact.lesson.title}</div>
      </section>

      {THEMES.map((theme, ti) => {
        const doneCount = theme.lessons.filter(l => s.lessons[l.id]).length
        const all = doneCount === theme.lessons.length
        return (
          <section key={theme.id} className="unit" style={{ '--theme': theme.color }}>
            <div className="unit-banner">
              <div>
                <div className="unit-kicker">Unité {ti + 1}</div>
                <div className="unit-name">{theme.name}</div>
              </div>
              <div className="unit-emoji">{theme.emoji}</div>
              <div className="unit-progress">{doneCount}/{theme.lessons.length}</div>
            </div>
            <div className="nodes">
              {theme.lessons.map((lesson, li) => {
                const st = lessonState(s, theme, li)
                const stars = s.lessons[lesson.id]?.stars || 0
                const isNext = lesson.id === nextId
                return (
                  <div key={lesson.id} className="node-wrap" style={{ transform: `translateX(${OFFSETS[li % 4]}px)` }}>
                    {isNext && <div className="node-bubble">Commencer</div>}
                    <button className={`node ${st} ${isNext ? 'next' : ''}`} onClick={() => setPicked({ theme, index: li })}
                      aria-label={lesson.title}>
                      {st === 'locked' ? <Lock size={28} /> : st === 'done' ? <Check size={34} /> : <Star size={34} />}
                    </button>
                    {st === 'done' && (
                      <div className="node-stars">
                        {[1, 2, 3].map(n => <span key={n} className={n <= stars ? 'on' : ''}><Star size={14} /></span>)}
                      </div>
                    )}
                  </div>
                )
              })}
              <div className="node-wrap" style={{ transform: `translateX(${OFFSETS[theme.lessons.length % 4]}px)` }}>
                <div className={`trophy ${all ? 'won' : ''}`}>🏆</div>
              </div>
            </div>
          </section>
        )
      })}
      <p className="path-end">De nouvelles unités arrivent bientôt ✨</p>

      {picked && (
        <LessonSheet s={s} now={now} {...picked} onClose={() => setPicked(null)}
          onStart={() => { const p = picked; setPicked(null); onStart(p.theme, p.theme.lessons[p.index]) }} />
      )}
    </div>
  )
}

function LessonSheet({ s, now, theme, index, onClose, onStart }) {
  const lesson = theme.lessons[index]
  const st = lessonState(s, theme, index)
  const h = heartsAt(s, now)
  const stars = s.lessons[lesson.id]?.stars || 0
  return (
    <div className="sheet-wrap" onClick={onClose}>
      <div className="sheet" style={{ '--theme': theme.color }} onClick={e => e.stopPropagation()}>
        <div className="sheet-kicker">{theme.emoji} {theme.name} · Leçon {index + 1}</div>
        <h3 className="sheet-title">{lesson.title}</h3>
        {st === 'locked' ? (
          <>
            <p className="lead">Termine « {theme.lessons[index - 1].title} » pour débloquer cette leçon.</p>
            <button className="btn ghost wide" onClick={onClose}>D'accord</button>
          </>
        ) : h.n <= 0 ? (
          <>
            <p className="lead">Tu n'as plus de vies. Prochaine vie dans {fmtWait(h.next - now)} — ou va dans « Réviser » pour en regagner.</p>
            <button className="btn ghost wide" onClick={onClose}>Compris</button>
          </>
        ) : (
          <>
            <ul className="sheet-list">
              <li>📖 {lesson.cards.length} fiches à lire</li>
              <li>❓ {lesson.questions.length} questions</li>
              <li>✨ 1 phrase pour briller en société</li>
            </ul>
            {st === 'done' && (
              <div className="sheet-stars">
                {[1, 2, 3].map(n => <span key={n} className={n <= stars ? 'on' : ''}><Star size={22} /></span>)}
              </div>
            )}
            <button className="btn theme wide" onClick={onStart}>{st === 'done' ? 'Refaire la leçon' : 'Commencer'}</button>
          </>
        )}
      </div>
    </div>
  )
}
