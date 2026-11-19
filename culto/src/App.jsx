import { useState } from 'react'
import { ALL_QUESTIONS, LESSON_INDEX, QUESTION_INDEX, THEMES } from './data/themes.js'
import { completeOnboarding, dayKey, finishSession, getState, useStore } from './lib/store.js'
import { seeded, shuffle } from './lib/util.js'
import { useNow } from './lib/useNow.js'
import { prepare } from './lib/questions.js'
import TopBar from './components/TopBar.jsx'
import Path from './components/Path.jsx'
import Practice from './components/Practice.jsx'
import Notebook from './components/Notebook.jsx'
import Profile from './components/Profile.jsx'
import Lesson from './components/Lesson.jsx'
import Result from './components/Result.jsx'
import Onboarding from './components/Onboarding.jsx'
import { Path as PathIcon, Sparkle, Target, User } from './components/Icons.jsx'

const qStep = (q, withFrom = false) => {
  const { theme } = LESSON_INDEX[q.lessonId]
  return { kind: 'q', q, opts: prepare(q), key: q.id, from: withFrom ? `${theme.emoji} ${theme.name}` : null }
}

function lessonSession(theme, lesson) {
  return {
    mode: 'lesson', theme, lesson, color: theme.color, emoji: theme.emoji,
    steps: [
      ...lesson.cards.map((card, i) => ({ kind: 'card', card, key: `${lesson.id}-c${i}` })),
      ...lesson.questions.map(q => qStep(q)),
    ],
  }
}

function challengeSession(day) {
  const pick = shuffle(ALL_QUESTIONS, seeded(`defi-${day}`)).slice(0, 8)
  return { mode: 'challenge', day, color: '#F2B430', emoji: '🎯', steps: pick.map(q => qStep(q, true)) }
}

function reviewSession(ids) {
  const qs = shuffle(ids.map(id => QUESTION_INDEX[id]).filter(Boolean)).slice(0, 10)
  return { mode: 'review', color: '#7A5CD6', emoji: '🧠', steps: qs.map(q => qStep(q, true)) }
}

function practiceSession(s) {
  const done = new Set(Object.keys(s.lessons))
  const pool = done.size ? ALL_QUESTIONS.filter(q => done.has(q.lessonId)) : ALL_QUESTIONS.filter(q => q.lessonId.endsWith('-0'))
  return { mode: 'practice', color: '#1F9E89', emoji: '🔁', steps: shuffle(pool).slice(0, 8).map(q => qStep(q, true)) }
}

const TABS = [
  { id: 'path', label: 'Parcours', Icon: PathIcon },
  { id: 'practice', label: 'Réviser', Icon: Target },
  { id: 'notebook', label: 'Carnet', Icon: Sparkle },
  { id: 'profile', label: 'Profil', Icon: User },
]

export default function App() {
  const s = useStore()
  const now = useNow()
  const [tab, setTab] = useState('path')
  const [session, setSession] = useState(null)
  const [result, setResult] = useState(null)

  const startLesson = (theme, lesson) => setSession(lessonSession(theme, lesson))

  const done = ({ questions, missed }) => {
    const sess = session
    const right = questions - missed
    const accuracy = Math.round((right / questions) * 100)
    const perfect = missed === 0
    let xp, title, stars = null, shine = null, lessonId = null, challengeDay = null
    if (sess.mode === 'lesson') {
      xp = 10 + right + (perfect ? 5 : 0)
      stars = accuracy === 100 ? 3 : accuracy >= 66 ? 2 : 1
      title = perfect ? 'Sans faute !' : 'Leçon terminée !'
      shine = sess.lesson.shine
      lessonId = sess.lesson.id
    } else if (sess.mode === 'challenge') {
      const first = getState().challenge !== sess.day
      xp = right * 2 + (first ? 10 : 0)
      title = 'Défi relevé !'
      challengeDay = sess.day
    } else {
      xp = right + 3
      title = sess.mode === 'review' ? 'Révision terminée !' : 'Entraînement terminé !'
    }
    const r = finishSession({ xp, lessonId, stars: stars || 0, perfect: sess.mode === 'lesson' && perfect, challengeDay })
    setResult({ ...r, xp, title, stars, shine, accuracy, color: sess.color, emoji: perfect ? '🏆' : sess.emoji })
    setSession(null)
  }

  if (!s.onboarded) {
    return <Onboarding onFinish={goal => { completeOnboarding(goal); startLesson(THEMES[0], THEMES[0].lessons[0]) }} />
  }
  if (result) return <Result r={result} onContinue={() => { setResult(null); window.scrollTo(0, 0) }} />
  if (session) return <Lesson key={session.steps[0]?.key + session.mode} session={session} onExit={() => setSession(null)} onDone={done} />

  return (
    <div className="app">
      <TopBar s={s} now={now} />
      {tab === 'path' && <Path s={s} now={now} onStart={startLesson} />}
      {tab === 'practice' && (
        <Practice s={s} now={now}
          onChallenge={() => setSession(challengeSession(dayKey(new Date())))}
          onReview={() => s.mistakes.length && setSession(reviewSession(s.mistakes))}
          onPractice={() => setSession(practiceSession(s))} />
      )}
      {tab === 'notebook' && <Notebook s={s} />}
      {tab === 'profile' && <Profile s={s} now={now} />}

      <nav className="tabbar">
        {TABS.map(({ id, label, Icon }) => (
          <button key={id} className={`tab ${tab === id ? 'on' : ''}`} onClick={() => { setTab(id); window.scrollTo(0, 0) }}>
            <Icon />
            <span>{label}</span>
            {id === 'practice' && s.mistakes.length > 0 && <i className="tab-dot" />}
          </button>
        ))}
      </nav>
    </div>
  )
}
