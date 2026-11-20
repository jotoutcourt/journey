import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { OFFICIAL_TOPICS, COMMUNITY_SEED, STARTER_CREATION, STARTER_CREATIONS } from './data/topics.js'
import { POKEMON_TOPIC } from './data/pokemon.js'
import { loadState, saveState, emptyState, encodeTopic, decodeTopic } from './lib/store.js'
import { findOpponent, getCommunity, leaderboard } from './lib/bots.js'
import { meEntry } from './lib/profile.js'
import { setSound, setMusic } from './lib/sound.js'
import { pick } from './lib/rng.js'
import Duel from './components/Duel.jsx'
import { buildQuestions } from './lib/duel.js'
import Results from './components/Results.jsx'
import { Home, Topics, TopicPage, Ranking, Matchmaking, CreateTopic, Onboarding } from './components/Screens.jsx'
import Profile from './components/Profile.jsx'
import Tower from './components/Tower.jsx'
import { dayKey } from './lib/tower.js'
import { settleDuel, ranksFor } from './lib/rewards.js'
import { presence, createOutgoing, tickChallenges, pendingCount, markPlayed } from './lib/challenges.js'
import { Inbox, ChallengeSheet, NotifyBanner, SentScreen } from './components/Challenges.jsx'
import RankShift from './components/RankShift.jsx'
import { readLinkFromHash, challengeUrl, replyUrl } from './lib/linkduel.js'
import { LinkReady, LinkIntro, LinkReplyIntro } from './components/LinkDuel.jsx'
import { TIME, pointsFor } from './lib/duel.js'

// Un thème partagé par lien (#t=…) est importé au chargement.
const SHARED = (() => {
  const m = location.hash.match(/#t=([\w-]+)/)
  if (!m) return null
  history.replaceState(null, '', location.pathname + location.search)
  return decodeTopic(m[1])
})()

// Un défi par lien (#d=…) ou la réponse d'un ami (#r=…) ouvert au chargement
const LINK = readLinkFromHash()

// Adversaire fictif quand on crée un défi par lien : l'ami jouera plus tard
const FRIEND = { id: 'ami', name: 'Ton ami', avatar: 'ami-mystere', flag: '❔', xp: 0 }

const toLog = (answers, qs) => answers.map((a, i) => ({ ...a, pts: a.choice === qs[i].correct ? pointsFor(a.t, i === qs.length - 1 ? 2 : 1) : 0 }))
const plain = (logMe, n) => Array.from({ length: n }, (_, i) => (logMe[i] ? { choice: logMe[i].choice, t: logMe[i].t } : { choice: -1, t: TIME }))

function initialState() {
  const s = loadState()
  if (SHARED && !s.custom.some(t => t.id === SHARED.id)) s.custom = [SHARED, ...s.custom]
  // Une seule fois : le thème Callie & Arizona rejoint les créations du joueur.
  // S'il le supprime ensuite, il ne revient pas.
  if (!s.starterAdded) {
    if (!s.custom.some(t => t.id === STARTER_CREATION.id)) s.custom = [STARTER_CREATION, ...s.custom]
    if (!s.follows.includes(STARTER_CREATION.id)) s.follows = [...s.follows, STARTER_CREATION.id]
    s.starterAdded = true
    s.starterVersion = 2
  }
  // Mise à jour unique (v2) : questions sur les acteurs remplacées par des questions sur les personnages,
  // sans toucher aux autres modifications du joueur.
  if ((s.starterVersion || 1) < 2) {
    const ACTORS = /actrice|acteur|Ramírez|Capshaw|Shonda Rhimes|Spielberg|Tony Award|« Grey's Anatomy » \?/
    const fresh = STARTER_CREATION.questions
    s.custom = s.custom.map(t => {
      if (t.id !== STARTER_CREATION.id) return t
      const kept = t.questions.filter(q => !ACTORS.test(q.q))
      const have = new Set(kept.map(q => q.q))
      const removed = t.questions.length - kept.length
      const added = fresh.filter(q => !have.has(q.q)).slice(-Math.max(removed, 0))
      return { ...t, questions: [...kept, ...added] }
    })
    s.starterVersion = 2
  }
  // Mise à jour unique (v3) : les thèmes Desperate Housewives et Disney rejoignent les créations du joueur.
  if (s.starterVersion < 3) {
    for (const { topic, since } of STARTER_CREATIONS) {
      if (since < 3 || s.custom.some(t => t.id === topic.id)) continue
      s.custom = [...s.custom, topic]
      if (!s.follows.includes(topic.id)) s.follows = [...s.follows, topic.id]
    }
    s.starterVersion = 3
  }
  return s
}

// Écrans qui font partie de la visite d'un thème (on n'anime le classement qu'en les quittant)
const FLOW = ['topic', 'ranking', 'match', 'duel', 'results', 'create']

const TABS = [
  { name: 'home', label: 'Accueil', icon: <path d="M4 11l8-7 8 7v9h-5v-6H9v6H4z" /> },
  { name: 'topics', label: 'Thèmes', icon: <><rect x="4" y="4" width="7" height="7" rx="2" /><rect x="13" y="4" width="7" height="7" rx="2" /><rect x="4" y="13" width="7" height="7" rx="2" /><rect x="13" y="13" width="7" height="7" rx="2" /></> },
  { name: 'inbox', label: 'Défis', icon: <><path d="M6 4l6 6M18 4l-6 6M4 20l6-6M20 20l-6-6" /><circle cx="12" cy="12" r="2.5" /></> },
  { name: 'create', label: 'Créer', icon: <path d="M12 4v16M4 12h16" strokeWidth="2.6" /> },
  { name: 'profile', label: 'Profil', icon: <><circle cx="12" cy="8" r="4" /><path d="M4 20c1-4 4-6 8-6s7 2 8 6" /></> },
]

export default function App() {
  const [st, setSt] = useState(initialState)
  const viewRef = useRef(null)
  const [route, setRoute] = useState(() => (
    LINK?.kind === 'challenge' ? { name: 'linkintro' }
      : LINK?.kind === 'reply' ? { name: 'linkreply' }
        : SHARED ? { name: 'topic', id: SHARED.id } : { name: 'home' }))
  const [link, setLink] = useState(LINK?.kind === 'challenge' || LINK?.kind === 'reply' ? LINK : null)

  useEffect(() => { saveState(st) }, [st])
  useEffect(() => { setSound(st.settings.sound) }, [st.settings.sound])
  useEffect(() => { setMusic(st.settings.music !== false) }, [st.settings.music])

  const update = useCallback((fn) => setSt(s => fn(s) ?? emptyState()), [])
  // Les thèmes du joueur sont signés de son pseudo actuel
  const myName = st.profile?.name
  const topics = useMemo(() => [
    ...OFFICIAL_TOPICS, POKEMON_TOPIC, ...COMMUNITY_SEED,
    ...st.custom.map(t => (t.own && myName ? { ...t, by: myName } : t)),
  ], [st.custom, myName])
  const byId = useCallback((id) => topics.find(t => t.id === id), [topics])

  // Animation du classement quand on quitte un thème : rangs au moment où l'on y entre
  const [session, setSession] = useState(null) // { topicId, before, played }
  const [shift, setShift] = useState(null)
  const [sheet, setSheet] = useState(null)
  const [notes, setNotes] = useState([])

  const go = useCallback((r) => {
    // Défi par lien : on joue d'abord ses 7 questions, sans adversaire
    if (r.name === 'linkcreate') {
      const t = byId(r.id)
      r = { name: 'duel', id: t.id, opponent: FRIEND, mode: 'blind', linkCreate: true, questions: buildQuestions(t, st.topicStats[t.id]?.seen) }
    }
    // Défier un joueur précis : s'il n'est pas en ligne, on propose un défi différé
    if (r.name === 'match' && !r.live && !r.opponent && (r.opponentId || r.forceChampion)) {
      const topic = byId(r.id)
      const bots = getCommunity(topic)
      const bot = r.opponentId ? bots.find(x => x.id === r.opponentId) : bots[0]
      const p = presence(bot)
      if (!p.online) { setSheet({ topic, opponent: { ...bot, champion: bot === bots[0] }, lastSeenMin: p.lastSeenMin }); return }
    }
    // On quitte le thème en cours : si l'on a joué, on montre l'évolution du classement
    const inFlow = (x, id) => FLOW.includes(x.name) && x.id === id
    if (session && !inFlow(r, session.topicId)) {
      const t = byId(session.topicId)
      const stats = st.topicStats[session.topicId]
      if (t && stats && (stats.played || 0) > session.played) {
        setShift({ topic: t, before: session.before, after: ranksFor(st.profile, t, stats), stats })
      }
      setSession(null)
    }
    if (FLOW.includes(r.name) && r.id && (!session || session.topicId !== r.id || !inFlow(r, session.topicId))) {
      const t = byId(r.id)
      if (t && st.profile && (!session || session.topicId !== r.id)) {
        const stats = st.topicStats[r.id]
        setSession({ topicId: r.id, before: ranksFor(st.profile, t, stats), played: stats?.played || 0 })
      }
    }
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
      // Rang mondial (classement « depuis toujours » du thème) des deux joueurs, pour l'intro du duel
      const rows = leaderboard(topic, { ...meEntry(st.profile), allXp: xp }, xp, 'all')
      const ranks = { me: rows.find(x => x.isMe)?.rank, opp: rows.find(x => x.id === opponent.id)?.rank }
      r = { ...r, opponent, ranks }
    }
    setRoute(r)
    viewRef.current?.scrollTo(0, 0)
  }, [byId, st.topicStats, st.profile, session])

  // Fin d'une ascension : record personnel et tentative du jour (seule la première compte).
  const finishTower = (result, daily) => update(s => {
    const t = s.tower || { runs: 0 }
    const best = !t.best || result.floor > t.best.floor || (result.floor === t.best.floor && result.score > t.best.score)
    const firstToday = daily && t.daily?.day !== dayKey()
    return {
      ...s,
      tower: {
        ...t, runs: (t.runs || 0) + 1,
        best: !daily && best ? { floor: result.floor, score: result.score } : t.best,
        daily: firstToday ? { day: dayKey(), floor: result.floor, score: result.score } : t.daily,
      },
    }
  })

  const quickDuel = () => {
    const pool = st.follows.length ? st.follows : topics.filter(t => t.official).map(t => t.id)
    go({ name: 'match', id: pick(pool) })
  }

  const topic = route.topicObj || (route.id ? byId(route.id) : null)
  const me = st.profile

  const startDuel = useCallback(() => {
    setRoute(r => ({ ...r, name: 'duel', questions: buildQuestions(topics.find(x => x.id === r.id), st.topicStats[r.id]?.seen) }))
  }, [topics, st.topicStats])

  const finishDuel = useCallback(({ myScore, oppScore, log, questions }) => {
    const r = route, t = r.topicObj || byId(r.id)
    // Défi par lien créé : on enregistre ses réponses et on fabrique le lien à envoyer
    if (r.linkCreate) {
      const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
      const answers = plain(log.me, questions.length)
      const url = challengeUrl({ id, from: meEntry(st.profile), topic: t, questions, answers })
      const entry = { id: 'lk-' + id, dir: 'link-out', linkId: id, topicId: t.id, opponent: FRIEND, createdAt: Date.now(), status: 'waiting-link', url, myScore, unseen: false }
      setSt(s => ({
        ...s,
        linkChallenges: [{ id, topicId: t.id, questions, answers, score: myScore, at: Date.now(), replies: [] }, ...(s.linkChallenges || [])].slice(0, 30),
        challenges: [entry, ...(s.challenges || [])].slice(0, 40),
      }))
      setRoute({ name: 'linkready', id: t.id, url, score: myScore })
      return
    }
    // L'ami a joué un défi reçu par lien : résultat tout de suite, et lien de réponse pour le challenger
    if (r.linkPlay) {
      const ch = r.linkPlay
      const reply = { url: replyUrl({ id: ch.id, from: meEntry(st.profile), answers: plain(log.me, questions.length), questions }), to: ch.from.name }
      const known = byId(ch.topic.id)
      const keep = (data) => ({ id: 'lk-in-' + ch.id + Date.now().toString(36), dir: 'link-in', linkId: ch.id, topicId: ch.topic.id, topicMeta: ch.topic, opponent: r.opponent, createdAt: Date.now(), status: 'done', result: data, unseen: false })
      if (known) {
        const { state, data } = settleDuel(st, { topic: known, opponent: r.opponent, myScore, oppScore, log, questions })
        const full = { ...data, link: reply }
        setSt({ ...state, challenges: [keep(full), ...(state.challenges || [])].slice(0, 40) })
        setRoute({ ...r, name: 'results', id: known.id, topicObj: null, data: { ...full, topic: known } })
      } else {
        const outcome = myScore > oppScore ? 'win' : myScore < oppScore ? 'lose' : 'draw'
        const full = { outcome, myScore, oppScore, opponent: r.opponent, bonuses: {}, total: 0, before: 0, after: 0, log, questions, noXp: true, link: reply }
        setSt(s => ({ ...s, challenges: [keep(full), ...(s.challenges || [])].slice(0, 40) }))
        setRoute({ ...r, name: 'results', data: { ...full, topic: t } })
      }
      setLink(null)
      return
    }
    const ch = r.challengeId ? (st.challenges || []).find(c => c.id === r.challengeId) : null
    // Défi reçu : on a joué sans voir l'adversaire, le résultat viendra plus tard
    if (ch && ch.dir === 'in') {
      const played = markPlayed(ch, log.me, myScore)
      setSt(s => ({ ...s, challenges: s.challenges.map(c => (c.id === ch.id ? played : c)) }))
      setRoute({ name: 'sent', id: t.id, challengeId: ch.id })
      return
    }
    const { state, data } = settleDuel(st, { topic: t, opponent: r.opponent, myScore, oppScore, log, questions, ranks: r.ranks })
    const challenges = ch
      ? state.challenges.map(c => (c.id === ch.id ? { ...c, status: 'done', myScore, result: data, unseen: false } : c))
      : state.challenges
    setSt({ ...state, challenges })
    setRoute({ ...r, name: 'results', data: { ...data, topic: t } })
  }, [route, byId, st])

  // Les défis avancent dans le temps (réponses, parties jouées, nouveaux défis reçus).
  const stRef = useRef(st)
  const topicsRef = useRef(topics)
  useEffect(() => { stRef.current = st; topicsRef.current = topics }, [st, topics])
  const [clock, setClock] = useState(() => Date.now())
  useEffect(() => {
    const run = () => {
      const base = stRef.current
      const { state, events } = tickChallenges(base, topicsRef.current)
      if (state) setSt(s => (s === base ? state : s)) // si l'état a bougé entre-temps, on réessaie au prochain passage
      if (state && events.length) setNotes(n => [...n, ...events].slice(-5))
      setClock(Date.now())
    }
    const first = setTimeout(run, 1500)
    const iv = setInterval(run, 3000)
    return () => { clearTimeout(first); clearInterval(iv) }
  }, [])

  // stable : l'appli se rafraîchit toutes les 3 s et ne doit pas relancer le minuteur de fermeture
  const closeShift = useCallback(() => setShift(null), [])

  const sendChallenge = () => {
    const c = createOutgoing(st, sheet.topic, sheet.opponent)
    update(s => ({ ...s, challenges: [c, ...(s.challenges || [])] }))
    setToast(`Défi envoyé à ${sheet.opponent.name}. Tu seras prévenu de sa réponse.`)
    setSheet(null)
  }
  const patchChallenge = (id, patch) => update(s => ({ ...s, challenges: (s.challenges || []).map(c => (c.id === id ? { ...c, ...patch } : c)) }))
  const playChallenge = (c, mode) => go({
    name: 'duel', id: c.topicId, opponent: c.opponent, ranks: c.ranks, questions: c.questions,
    challengeId: c.id, mode, ghost: mode === 'ghost' ? c.oppAnswers : undefined,
  })
  const inboxHandlers = {
    onAccept: (c) => { patchChallenge(c.id, { status: 'accepted-by-me', unseen: false }); playChallenge(c, 'blind') },
    onReject: (c) => update(s => ({ ...s, challenges: s.challenges.filter(x => x.id !== c.id) })),
    onPlay: (c) => playChallenge(c, 'ghost'),
    onResult: (c) => {
      patchChallenge(c.id, { unseen: false })
      const t = byId(c.topicId) || { id: c.topicId, icon: '🔗', color: '#7c5cff', category: 'Culture', name: 'Défi par lien', ...(c.topicMeta || {}), questions: [] }
      setRoute({ name: 'results', id: byId(c.topicId) ? c.topicId : undefined, topicObj: byId(c.topicId) ? null : t, opponent: c.opponent, data: { ...c.result, topic: t } })
    },
    onResend: async (c) => {
      const t = byId(c.topicId)
      const text = `Je te défie sur « ${t?.name || 'Duelia'} » dans Duelia ! 7 questions, tu peux me battre ?`
      try { await navigator.share({ title: 'Duelia', text, url: c.url }); return } catch { /* refusé : on copie */ }
      try { await navigator.clipboard.writeText(`${text} ${c.url}`); setToast('Lien du défi copié : colle-le dans un message à ton ami.') } catch { setToast('Copie impossible sur cet appareil.') }
    },
    onDismiss: (c) => update(s => ({ ...s, challenges: s.challenges.filter(x => x.id !== c.id) })),
  }

  // Le challenger ouvre la réponse de son ami : on rejoue le résultat à partir des deux séries de réponses
  const openReply = () => {
    const rep = link
    const rec = (st.linkChallenges || []).find(c => c.id === rep.id)
    const t = rec ? byId(rec.topicId) : null
    const questions = rec ? rec.questions : rep.questions
    const opponent = { id: 'lien:' + rep.from.name, ...rep.from, xp: 0 }
    const log = { me: rec ? toLog(rec.answers, questions) : [], opp: toLog(rep.answers, questions) }
    const myScore = rec ? rec.score : 0, oppScore = rep.score
    const already = rec?.replies?.includes(rep.from.name)
    setLink(null)
    // Range le résultat dans l'onglet Défis : le défi en attente passe en « Résultats »
    const file = (s, data) => {
      const list = s.challenges || []
      const waiting = list.find(c => c.dir === 'link-out' && c.linkId === rep.id && c.status === 'waiting-link')
      const done = { dir: 'link-out', linkId: rep.id, topicId: rec?.topicId || 'lien', opponent, status: 'done', result: data, unseen: false, createdAt: Date.now() }
      const already2 = list.some(c => c.dir === 'link-out' && c.linkId === rep.id && c.status === 'done' && c.opponent.name === rep.from.name)
      if (already2) return list
      return waiting ? list.map(c => (c === waiting ? { ...c, ...done } : c)) : [{ id: 'lk-' + rep.id + rep.from.name, ...done }, ...list].slice(0, 40)
    }
    if (rec && t && !already) {
      const { state, data } = settleDuel(st, { topic: t, opponent, myScore, oppScore, log, questions })
      const full = { ...data, fromLink: true }
      setSt({ ...state, challenges: file(state, full), linkChallenges: state.linkChallenges.map(c => (c.id === rec.id ? { ...c, replies: [...(c.replies || []), rep.from.name] } : c)) })
      setRoute({ name: 'results', id: t.id, opponent, data: { ...full, topic: t } })
      return
    }
    const outcome = myScore > oppScore ? 'win' : myScore < oppScore ? 'lose' : 'draw'
    const pseudo = t || { id: 'lien', name: 'Défi par lien', icon: '🔗', color: '#7c5cff', category: 'Culture', questions: [] }
    const full = { outcome, myScore, oppScore, opponent, bonuses: {}, total: 0, before: 0, after: 0, log, questions, noXp: true, fromLink: true, alreadyCounted: already, unknownMine: !rec }
    if (rec && !already) setSt(s => ({ ...s, challenges: file(s, full) }))
    setRoute({ name: 'results', topicObj: pseudo, opponent, data: { ...full, topic: pseudo } })
  }

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

  const [toast, setToast] = useState(LINK?.kind === 'invalid' ? 'Ce lien de défi est incomplet ou abîmé. Demande à ton ami de te le renvoyer.' : null)
  // Un lien de défi ouvert alors que l'appli est déjà ouverte (même onglet) : on le prend en compte aussi
  useEffect(() => {
    const onHash = () => {
      const l = readLinkFromHash()
      if (!l) return
      if (l.kind === 'invalid') { setToast('Ce lien de défi est incomplet ou abîmé. Demande à ton ami de te le renvoyer.'); return }
      setLink(l)
      setRoute({ name: l.kind === 'challenge' ? 'linkintro' : 'linkreply' })
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])
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
  const fullscreen = ['match', 'duel', 'results', 'tower', 'sent', 'linkready', 'linkintro', 'linkreply'].includes(route.name)
  const badge = pendingCount(st)
  let view
  switch (route.name) {
    case 'topics': view = <Topics topics={topics} go={go} importTopic={importTopic} />; break
    case 'topic': view = topic ? <TopicPage st={st} topic={topic} go={go} toggleFollow={toggleFollow} shareTopic={shareTopic} deleteTopic={deleteTopic} /> : null; break
    case 'ranking': view = <Ranking st={st} topic={topic} go={go} />; break
    case 'create': view = <CreateTopic key={route.id || 'new'} st={st} existing={route.id ? topic : null} onSave={saveTopic} go={go} />; break
    case 'profile': view = <Profile st={st} topics={topics} update={update} go={go} />; break
    case 'tower': view = <Tower key={route.daily ? 'daily' : 'free'} topics={topics} profile={me} daily={!!route.daily} towerState={st.tower}
      onFinish={finishTower} onExit={() => go({ name: 'home' })} />; break
    case 'match': view = <Matchmaking topic={topic} opponent={route.opponent} onReady={startDuel} onCancel={() => go({ name: 'topic', id: topic.id })} />; break
    case 'duel': view = <Duel key={route.questions.map(q => q.idx).join() + (route.challengeId || '')} topic={topic} me={meForDuel} opponent={route.opponent} ranks={route.ranks} questions={route.questions}
      mode={route.mode} ghost={route.ghost} onFinish={finishDuel} onQuit={route.challengeId ? () => go({ name: 'inbox' }) : quitDuel} />; break
    case 'linkready': view = <LinkReady url={route.url} score={route.score} topic={topic} onHome={() => go({ name: 'home' })} onTopic={() => go({ name: 'topic', id: topic.id })} />; break
    case 'linkintro': view = link?.kind === 'challenge' ? (
      <LinkIntro challenge={link} onLater={() => { setLink(null); go({ name: 'home' }) }}
        onAccept={() => {
          const known = byId(link.topic.id)
          setRoute({
            name: 'duel', id: known?.id, topicObj: known ? null : { ...link.topic, questions: [] },
            opponent: { id: 'lien:' + link.from.name, ...link.from, xp: 0 }, questions: link.questions,
            mode: 'ghost', ghost: link.answers, linkPlay: link,
          })
        }} />
    ) : null; break
    case 'linkreply': view = link?.kind === 'reply'
      ? <LinkReplyIntro reply={link} known={(st.linkChallenges || []).some(c => c.id === link.id)} onSee={openReply} onHome={() => { setLink(null); go({ name: 'home' }) }} />
      : null; break
    case 'inbox': view = <Inbox st={st} topics={topics} now={clock} {...inboxHandlers} />; break
    case 'sent': {
      const ch = (st.challenges || []).find(c => c.id === route.challengeId)
      view = ch && topic ? <SentScreen challenge={ch} topic={topic} onInbox={() => go({ name: 'inbox' })} onHome={() => go({ name: 'home' })} /> : null
      break
    }
    case 'results': view = (
      <Results data={route.data} me={me}
        onRematch={() => {
          const linkish = route.data.link || route.data.fromLink
          if (!linkish) return go({ name: 'match', id: topic.id, opponent: route.opponent, live: true })
          // revanche par lien : nouvelles questions du même thème si on l'a, sinon choix d'un thème
          return byId(topic.id) ? go({ name: 'linkcreate', id: topic.id }) : go({ name: 'topics' })
        }}
        onAnother={() => (route.data.link || route.data.fromLink ? go({ name: 'home' }) : go({ name: 'match', id: topic.id }))}
        onTopic={() => (byId(topic.id) ? go({ name: 'topic', id: topic.id }) : go({ name: 'topics' }))}
        onShare={() => shareText(`${route.data.outcome === 'win' ? 'Victoire' : 'Duel'} ${route.data.myScore}–${route.data.oppScore} contre ${route.opponent.name} sur « ${topic.name} » dans Duelia !`)} />
    ); break
    default: view = <Home st={st} topics={topics} go={go} quickDuel={quickDuel} />
  }
  if (!view) view = <Home st={st} topics={topics} go={go} quickDuel={quickDuel} />

  return (
    <div className={`app ${fullscreen ? 'full' : ''}`}>
      <main ref={viewRef} className="view"><div key={route.name + (route.id || '')}>{view}</div></main>
      {toast && <div className="toast" role="status">{toast}</div>}
      {notes.length > 0 && !['duel', 'match', 'tower'].includes(route.name) && (
        <NotifyBanner key={notes[0].text} note={notes[0]}
          onOpen={() => { setNotes(n => n.slice(1)); go({ name: 'inbox' }) }}
          onClose={() => setNotes(n => n.slice(1))} />
      )}
      {sheet && <ChallengeSheet sheet={sheet} onSend={sendChallenge} onCancel={() => setSheet(null)} />}
      {shift && <RankShift shift={shift} profile={me} onClose={closeShift} />}
      {!fullscreen && (
        <nav className="tabbar">
          {TABS.map(t => (
            <button key={t.name} className={route.name === t.name || (t.name === 'topics' && ['topic', 'ranking'].includes(route.name)) ? 'on' : ''}
              onClick={() => go({ name: t.name })}>
              <svg viewBox="0 0 24 24">{t.icon}</svg>
              <span>{t.label}</span>
              {t.name === 'inbox' && badge > 0 && <i className="tab-badge">{badge}</i>}
            </button>
          ))}
        </nav>
      )}
    </div>
  )
}
