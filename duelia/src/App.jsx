import { useCallback, useEffect, useMemo, useState } from 'react'
import { OFFICIAL_TOPICS, COMMUNITY_SEED } from './data/topics.js'
import { loadState, saveState, emptyState, encodeTopic, decodeTopic } from './lib/store.js'
import { findOpponent, getCommunity, leaderboard } from './lib/bots.js'
import { myPeriodXp } from './lib/periods.js'
import { setSound } from './lib/sound.js'
import { pick } from './lib/rng.js'
import Duel from './components/Duel.jsx'
import { buildQuestions } from './lib/duel.js'
import Results from './components/Results.jsx'
import { Home, Topics, TopicPage, Ranking, Matchmaking, CreateTopic, Profile, Onboarding } from './components/Screens.jsx'

// Un thème partagé par lien (#t=…) est importé au chargement.
const SHARED = (() => {
  const m = location.hash.match(/#t=([\w-]+)/)
  if (!m) return null
  history.replaceState(null, '', location.pathname + location.search)
  return decodeTopic(m[1])
})()

function initialState() {
  const s = loadState()
  if (SHARED && !s.custom.some(t => t.id === SHARED.id)) s.custom = [SHARED, ...s.custom]
  return s
}

const TABS = [
  { name: 'home', label: 'Accueil', icon: <path d="M4 11l8-7 8 7v9h-5v-6H9v6H4z" /> },
  { name: 'topics', label: 'Thèmes', icon: <><rect x="4" y="4" width="7" height="7" rx="2" /><rect x="13" y="4" width="7" height="7" rx="2" /><rect x="4" y="13" width="7" height="7" rx="2" /><rect x="13" y="13" width="7" height="7" rx="2" /></> },
  { name: 'create', label: 'Créer', icon: <path d="M12 4v16M4 12h16" strokeWidth="2.6" /> },
  { name: 'profile', label: 'Profil', icon: <><circle cx="12" cy="8" r="4" /><path d="M4 20c1-4 4-6 8-6s7 2 8 6" /></> },
]

export default function App() {
  const [st, setSt] = useState(initialState)
  const [route, setRoute] = useState(() => (SHARED ? { name: 'topic', id: SHARED.id } : { name: 'home' }))

  useEffect(() => { saveState(st) }, [st])
  useEffect(() => { setSound(st.settings.sound) }, [st.settings.sound])

  const update = useCallback((fn) => setSt(s => fn(s) ?? emptyState()), [])
  const topics = useMemo(() => [...OFFICIAL_TOPICS, ...COMMUNITY_SEED, ...st.custom], [st.custom])
  const byId = useCallback((id) => topics.find(t => t.id === id), [topics])

  const go = useCallback((r) => {
    if (r.name === 'match') {
      const topic = byId(r.id)
      const xp = st.topicStats[r.id]?.xp || 0
      let opponent = r.opponent
      if (!opponent && r.opponentId) {
        const bots = getCommunity(topic)
        const b = bots.find(x => x.id === r.opponentId)
        opponent = { ...b, champion: b === bots[0] }
      }
      opponent ??= findOpponent(topic, xp, { forceChampion: r.forceChampion })
      r = { ...r, opponent }
    }
    setRoute(r)
    window.scrollTo(0, 0)
  }, [byId, st.topicStats])

  const quickDuel = () => {
    const pool = st.follows.length ? st.follows : topics.filter(t => t.official).map(t => t.id)
    go({ name: 'match', id: pick(pool) })
  }

  const topic = route.id ? byId(route.id) : null
  const me = st.profile

  const startDuel = useCallback(() => {
    setRoute(r => ({ ...r, name: 'duel', questions: buildQuestions(topics.find(x => x.id === r.id), st.topicStats[r.id]?.seen) }))
  }, [topics, st.topicStats])

  const finishDuel = useCallback(({ myScore, oppScore, log, questions }) => {
    const r = route, t = byId(r.id)
    const outcome = myScore > oppScore ? 'win' : myScore < oppScore ? 'lose' : 'draw'
    const allRight = log.me.every(m => m && m.pts > 0)
    const bonuses = { finish: 40, victory: outcome === 'win' ? 100 : outcome === 'draw' ? 50 : 0, perfect: allRight ? 30 : 0 }
    const total = myScore + bonuses.finish + bonuses.victory + bonuses.perfect
    const prev = st.topicStats[r.id] || { xp: 0, played: 0, wins: 0, seen: [] }
    const seen = [...new Set([...(prev.seen || []), ...questions.map(q => q.idx)])]
    // Journal des gains (40 derniers jours) pour les classements de la semaine et du mois
    const now = Date.now()
    const xpLog = [...(prev.log || []).filter(e => now - e.at < 40 * 86400000), { at: now, xp: total }]
    const next = { xp: prev.xp + total, played: prev.played + 1, wins: prev.wins + (outcome === 'win' ? 1 : 0), seen, log: xpLog }
    const meRow = { name: me.name, avatar: me.avatar, allXp: next.xp }
    const ranks = Object.fromEntries(['week', 'month', 'all'].map(k => {
      const rows = leaderboard(t, meRow, myPeriodXp(next, k), k)
      return [k, rows.find(x => x.isMe).rank]
    }))
    setSt(s => ({
      ...s,
      xp: s.xp + total,
      topicStats: { ...s.topicStats, [r.id]: next },
      history: [{ topicId: t.id, topicName: t.name, oppName: r.opponent.name, oppAvatar: r.opponent.avatar, champion: r.opponent.champion, myScore, oppScore, outcome, at: Date.now() }, ...s.history].slice(0, 30),
    }))
    setRoute({
      ...r, name: 'results',
      data: { outcome, myScore, oppScore, opponent: r.opponent, topic: t, bonuses, total, before: prev.xp, after: prev.xp + total, log, questions, ranks },
    })
  }, [route, byId, st.topicStats, me])

  const quitDuel = useCallback(() => {
    setRoute(r => ({ name: 'topic', id: r.id }))
  }, [])

  const toggleFollow = (id) => update(s => ({ ...s, follows: s.follows.includes(id) ? s.follows.filter(x => x !== id) : [...s.follows, id] }))

  const saveTopic = (t) => {
    update(s => {
      const exists = s.custom.some(x => x.id === t.id)
      return {
        ...s,
        custom: exists ? s.custom.map(x => x.id === t.id ? t : x) : [t, ...s.custom],
        follows: s.follows.includes(t.id) ? s.follows : [...s.follows, t.id],
      }
    })
    go({ name: 'topic', id: t.id })
  }

  const importTopic = (t) => {
    update(s => s.custom.some(x => x.id === t.id) ? s : { ...s, custom: [t, ...s.custom] })
    go({ name: 'topic', id: t.id })
  }

  const deleteTopic = (t) => {
    update(s => ({ ...s, custom: s.custom.filter(x => x.id !== t.id), follows: s.follows.filter(x => x !== t.id) }))
    go({ name: 'topics' })
  }

  const [toast, setToast] = useState(null)
  useEffect(() => {
    if (!toast) return
    const id = setTimeout(() => setToast(null), 2600)
    return () => clearTimeout(id)
  }, [toast])

  const shareText = async (text, url) => {
    const full = url ? `${text} ${url}` : text
    // Copie d'abord (dans le geste de l'utilisateur), puis feuille de partage si elle existe.
    let copied = false
    try { await navigator.clipboard.writeText(full); copied = true } catch { /* refusé */ }
    try { if (navigator.share) { await navigator.share({ title: 'Duelia', text, url }); return } } catch { /* refusé ou annulé */ }
    setToast(copied ? 'Lien copié, colle-le à tes amis' : "Impossible de copier sur cet appareil")
  }

  const shareTopic = (t) => {
    const url = `${location.origin}${location.pathname}#t=${encodeTopic(t)}`
    shareText(`Viens me défier sur mon thème « ${t.name} » !`, url)
  }

  if (!me) {
    return (
      <div className="app">
        <Onboarding topics={topics} onDone={({ name, avatar, follows }) => {
          update(s => ({ ...s, profile: { id: Math.random().toString(36).slice(2), name, avatar, createdAt: Date.now() }, follows: [...new Set([...s.follows, ...follows, ...(SHARED ? [SHARED.id] : [])])] }))
        }} />
      </div>
    )
  }

  const meForDuel = { ...me, topicXp: st.topicStats[route.id]?.xp || 0 }
  const fullscreen = ['match', 'duel', 'results'].includes(route.name)
  let view
  switch (route.name) {
    case 'topics': view = <Topics topics={topics} go={go} importTopic={importTopic} />; break
    case 'topic': view = topic ? <TopicPage st={st} topic={topic} go={go} toggleFollow={toggleFollow} shareTopic={shareTopic} deleteTopic={deleteTopic} /> : null; break
    case 'ranking': view = <Ranking st={st} topic={topic} go={go} />; break
    case 'create': view = <CreateTopic key={route.id || 'new'} st={st} existing={route.id ? topic : null} onSave={saveTopic} go={go} />; break
    case 'profile': view = <Profile st={st} topics={topics} update={update} go={go} />; break
    case 'match': view = <Matchmaking topic={topic} opponent={route.opponent} onReady={startDuel} onCancel={() => go({ name: 'topic', id: topic.id })} />; break
    case 'duel': view = <Duel key={route.questions.map(q => q.idx).join()} topic={topic} me={meForDuel} opponent={route.opponent} questions={route.questions} onFinish={finishDuel} onQuit={quitDuel} />; break
    case 'results': view = (
      <Results data={route.data} me={me}
        onRematch={() => go({ name: 'match', id: topic.id, opponent: route.opponent })}
        onAnother={() => go({ name: 'match', id: topic.id })}
        onTopic={() => go({ name: 'topic', id: topic.id })}
        onShare={() => shareText(`${route.data.outcome === 'win' ? 'Victoire' : 'Duel'} ${route.data.myScore}–${route.data.oppScore} contre ${route.opponent.name} sur « ${topic.name} » dans Duelia !`)} />
    ); break
    default: view = <Home st={st} topics={topics} go={go} quickDuel={quickDuel} />
  }
  if (!view) view = <Home st={st} topics={topics} go={go} quickDuel={quickDuel} />

  return (
    <div className={`app ${fullscreen ? 'full' : ''}`}>
      <main key={route.name + (route.id || '')} className="view">{view}</main>
      {toast && <div className="toast" role="status">{toast}</div>}
      {!fullscreen && (
        <nav className="tabbar">
          {TABS.map(t => (
            <button key={t.name} className={route.name === t.name || (t.name === 'topics' && ['topic', 'ranking'].includes(route.name)) ? 'on' : ''}
              onClick={() => go({ name: t.name })}>
              <svg viewBox="0 0 24 24">{t.icon}</svg>
              <span>{t.label}</span>
            </button>
          ))}
        </nav>
      )}
    </div>
  )
}
