import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { OFFICIAL_TOPICS, COMMUNITY_SEED, STARTER_CREATION, STARTER_CREATIONS, MADE_OFFICIAL } from './data/topics.js'
import TopicIcon from './components/TopicIcon.jsx'
import { loadState, saveState, emptyState, encodeTopic, decodeTopic } from './lib/store.js'
import { findOpponent, getCommunity, leaderboard } from './lib/bots.js'
import { meEntry } from './lib/profile.js'
import { setSound, setMusic, sfx } from './lib/sound.js'
import { setMenuMusic } from './lib/menuMusic.js'
import { InstallIntro, InAppGate } from './components/InstallCard.jsx'
import { needsInstallIntro, needsInAppGate } from './lib/installIntro.js'
import Duel from './components/Duel.jsx'
import { buildQuestions } from './lib/duel.js'
import Results from './components/Results.jsx'
import { Home, Topics, TopicPage, Ranking, Matchmaking, CreateTopic, Onboarding } from './components/Screens.jsx'
import Profile from './components/Profile.jsx'
import StickerBook from './components/StickerBook.jsx'
import { MissionsChip, MissionsSheet } from './components/Missions.jsx'
import { useMissions } from './lib/missions.js'
import { settleDuel, ranksFor } from './lib/rewards.js'
import { createOutgoing, tickChallenges, pendingCount, markPlayed } from './lib/challenges.js'
import { Inbox, ChallengeSheet, NotifyBanner, SentScreen } from './components/Challenges.jsx'
import { ButinHome, ButinGame, DuoInviteBanner } from './components/Butin.jsx'
import { Party, PartyInviteBanner } from './components/Party.jsx'
import { Traque, TraqueInviteBanner } from './components/Traque.jsx'
import { OxygenInline, OxygenSheet } from './components/Oxygen.jsx'
import { Shop, StarterPick } from './components/Shop.jsx'
import { priceOf, isLockable } from './lib/shop.js'
import { buildButin } from './lib/butin.js'
import { ChatList, ChatThread } from './components/Chat.jsx'
import { useGroupVoice } from './lib/groupVoice.js'
import { FriendsScreen, FriendChallengeSheet, PickFriendSheet, PlayWhoSheet, InviteWaiting, LiveInviteBanner, FriendSent, FriendProfile, LiveBetResult } from './components/Social.jsx'
import * as api from './lib/account.js'
import TopicRequestSheet from './components/TopicRequest.jsx'
import { useSocial, friendOpponent, fromPlain, logFrom } from './lib/useSocial.js'
import { pushStatus, enablePush, disablePush, refreshPush } from './lib/push.js'
import NotifAsk from './components/NotifAsk.jsx'
import { shouldAskNotif, notifAskLater } from './lib/notifAsk.js'
import RankShift from './components/RankShift.jsx'
import { readLinkFromHash, challengeUrl, replyUrl, LINK_TTL, shortenUrl, resolveShort, baseUrl } from './lib/linkduel.js'
import { LinkReady, LinkIntro, LinkReplyIntro } from './components/LinkDuel.jsx'
import { applyLinkReply, rowToReply } from './lib/linkresults.js'
import { submitLinkResult, fetchLinkResults } from './lib/server.js'
import { connect, pushProfile, saveRemoteState, pushXp, fetchBoard, makeRecoveryCode, recoverWith, findLiveMatch, leaveLiveQueue, sendLiveAnswer, getLiveAnswers, liveResult } from './lib/account.js'
import { setRealRows } from './lib/bots.js'
import { myPeriodScore } from './lib/periods.js'
import { TIME } from './lib/duel.js'

// Un thème partagé par lien (#t=…) est importé au chargement.
const SHARED = (() => {
  const m = location.hash.match(/#t=([\w-]+)/)
  if (!m) return null
  history.replaceState(null, '', location.pathname + location.search)
  return decodeTopic(m[1])
})()

// Raccourcis ouverts par une notification ou un lien d'ami : #defis, #amis, #ami=CODE, #theme=ID
function readNavHash() {
  const m = location.hash.match(/^#(defis|amis|ami=([A-Za-z0-9-]{8,9})|theme=([a-z0-9-]{1,60})|chat=([0-9a-f-]{36}))$/)
  if (!m) return null
  history.replaceState(null, '', location.pathname + location.search)
  if (m[4]) return { name: 'chat', peer: { player_id: m[4], name: '…' } } // notification d'un message
  if (m[1] === 'defis') return { name: 'inbox' }
  if (m[3]) return { name: 'topic', id: m[3] } // annonce d'un nouveau thème
  return { name: 'friends', code: m[2] ? m[2].replace('-', '').toUpperCase() : undefined }
}
const NAV = readNavHash()

// Un défi par lien (#d=…) ou la réponse d'un ami (#r=…) ouvert au chargement
const LINK = readLinkFromHash()

// La Chasse au Kraken est en cours de finition : ouverte seulement aux testeurs, « bientôt disponible » pour les autres

// Adversaire fictif quand on crée un défi par lien : l'ami jouera plus tard
const FRIEND = { id: 'ami', name: 'Ton ami', avatar: 'ami-mystere', flag: '❔', xp: 0 }

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
  // Mise à jour unique (v4) : le thème La Villa des cœurs brisés rejoint les créations du joueur.
  if (s.starterVersion < 4) {
    for (const { topic, since } of STARTER_CREATIONS) {
      if (since !== 4 || s.custom.some(t => t.id === topic.id)) continue
      s.custom = [...s.custom, topic]
      if (!s.follows.includes(topic.id)) s.follows = [...s.follows, topic.id]
    }
    s.starterVersion = 4
  }
  // Mise à jour unique (v5) : nouvelles questions « drama » ajoutées à la copie enregistrée de La Villa
  if (s.starterVersion < 5) {
    const fresh = STARTER_CREATIONS.find(x => x.topic.id === 'c-villa')?.topic.questions || []
    s.custom = s.custom.map(t => {
      if (t.id !== 'c-villa') return t
      const have = new Set(t.questions.map(q => q.q))
      return { ...t, questions: [...t.questions, ...fresh.filter(q => !have.has(q.q))] }
    })
    s.starterVersion = 5
  }
  // Mise à jour unique (v6) : La Villa passe à 100 questions dans la copie enregistrée
  if (s.starterVersion < 6) {
    const fresh = STARTER_CREATIONS.find(x => x.topic.id === 'c-villa')?.topic.questions || []
    s.custom = s.custom.map(t => {
      if (t.id !== 'c-villa') return t
      const have = new Set(t.questions.map(q => q.q))
      return { ...t, questions: [...t.questions, ...fresh.filter(q => !have.has(q.q))] }
    })
    s.starterVersion = 6
  }
  // Mise à jour unique (v7) : le thème The Eras Tour rejoint les créations du joueur.
  if (s.starterVersion < 7) {
    for (const { topic, since } of STARTER_CREATIONS) {
      if (since !== 7 || s.custom.some(t => t.id === topic.id)) continue
      s.custom = [...s.custom, topic]
      if (!s.follows.includes(topic.id)) s.follows = [...s.follows, topic.id]
    }
    s.starterVersion = 7
  }
  // Mise à jour unique (v8) : cinq nouveaux thèmes rejoignent les créations du joueur.
  if (s.starterVersion < 8) {
    for (const { topic, since } of STARTER_CREATIONS) {
      if (since !== 8 || s.custom.some(t => t.id === topic.id)) continue
      s.custom = [...s.custom, topic]
      if (!s.follows.includes(topic.id)) s.follows = [...s.follows, topic.id]
    }
    s.starterVersion = 8
  }
  // Mise à jour unique (v9) : Harry Potter, The Eras Tour, Friends, Grey's Anatomy, Disney et Desperate Housewives
  // deviennent des thèmes officiels : on retire leurs anciennes copies des créations du joueur (l'XP et les abonnements restent).
  if (s.starterVersion < 9) {
    s.custom = s.custom.filter(t => !MADE_OFFICIAL.includes(t.id))
    s.starterVersion = 9
  }
  // Mise à jour unique (v10) : le thème « Qui est ce Pokémon ? » est retiré du jeu
  if (s.starterVersion < 10) {
    s.follows = s.follows.filter(id => id !== 'pokemon')
    s.starterVersion = 10
  }
  // Mise à jour unique (v11) : il n'y a plus que des thèmes officiels. Callie & Arizona, La Villa, Gossip Girl et
  // Pop des années 2000 deviennent officiels ; les copies personnelles d'un thème officiel (même nom) sont retirées.
  if (s.starterVersion < 11) {
    const norm = (x) => (x || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
    const officialNames = new Set([...OFFICIAL_TOPICS, ...COMMUNITY_SEED].map(t => norm(t.name)))
    s.custom = s.custom.filter(t => !(t.own && officialNames.has(norm(t.name))))
    s.starterVersion = 11
  }
  // Toujours : un thème devenu officiel n'a plus de copie dans les créations (sinon il apparaîtrait deux fois)
  s.custom = s.custom.filter(t => !MADE_OFFICIAL.includes(t.id))
  return s
}

// Écrans qui font partie de la visite d'un thème (on n'anime le classement qu'en les quittant)
const FLOW = ['topic', 'ranking', 'match', 'duel', 'results', 'create']

const TABS = [
  { name: 'home', label: 'Accueil', icon: <path d="M4 11l8-7 8 7v9h-5v-6H9v6H4z" /> },
  { name: 'topics', label: 'Thèmes', icon: <><rect x="4" y="4" width="7" height="7" rx="2" /><rect x="13" y="4" width="7" height="7" rx="2" /><rect x="4" y="13" width="7" height="7" rx="2" /><rect x="13" y="13" width="7" height="7" rx="2" /></> },
  { name: 'chat', label: 'Chat', icon: <path d="M4 5h16v11H9l-5 4z" /> },
  { name: 'friends', label: 'Amis', icon: <><circle cx="9" cy="8" r="3.2" /><path d="M3 19c.8-3.2 3.1-5 6-5s5.2 1.8 6 5" /><circle cx="17" cy="9" r="2.4" /><path d="M16 14.2c2.4.2 4.2 1.8 5 4.3" /></> },
  { name: 'profile', label: 'Profil', icon: <><circle cx="12" cy="8" r="4" /><path d="M4 20c1-4 4-6 8-6s7 2 8 6" /></> },
]

export default function App() {
  const [st, setSt] = useState(initialState)
  const viewRef = useRef(null)
  // Tout premier lancement dans le navigateur : on explique d'abord comment installer l'appli
  // (sauf si on arrive par un lien de défi : on joue tout de suite)
  const [installIntro, setInstallIntro] = useState(() => !LINK && needsInstallIntro())
  // Ouvert depuis Instagram, Snapchat… : on propose d'abord de passer dans Safari / Chrome
  const [inAppGate, setInAppGate] = useState(needsInAppGate)
  const [route, setRoute] = useState(() => (
    LINK?.kind === 'short' ? { name: 'linkload' }
      : LINK?.kind === 'challenge' ? { name: 'linkintro' }
      : LINK?.kind === 'reply' ? { name: 'linkreply' }
        : NAV ? NAV : SHARED ? { name: 'topic', id: SHARED.id } : { name: 'home' }))
  const [link, setLink] = useState(LINK?.kind === 'challenge' || LINK?.kind === 'reply' ? LINK : null)

  useEffect(() => { saveState(st) }, [st])
  useEffect(() => { setSound(st.settings.sound) }, [st.settings.sound])
  // Un petit son sur chaque bouton (sauf ceux qui ont déjà le leur : caisses du Kraken, réponses en partie)
  useEffect(() => {
    const onClick = (e) => {
      const b = e.target.closest?.('button, [role="button"], .tabbar button')
      if (!b || b.disabled || b.closest('.lt-card, .party-game .options, .options, [data-nosfx]')) return
      sfx.click()
    }
    document.addEventListener('click', onClick, true)
    return () => document.removeEventListener('click', onClick, true)
  }, [])
  useEffect(() => { setMusic(st.settings.music !== false) }, [st.settings.music])
  // Musique d'ambiance : seulement dans les menus et à l'accueil, jamais pendant une partie
  const inGame = ['match', 'duel', 'butingame', 'party', 'traque', 'invite', 'linkload', 'linkready'].includes(route.name)
  // musique : celle des menus, ou celle du plateau pendant la Chasse au Kraken
  const musicTrack = route.name === 'traque' ? 'traque' : 'menu'
  useEffect(() => { setMenuMusic(st.settings.sound && st.settings.menuMusic !== false && (!inGame || musicTrack === 'traque'), musicTrack) }, [st.settings.sound, st.settings.menuMusic, inGame, musicTrack])

  const update = useCallback((fn) => setSt(s => fn(s) ?? emptyState()), [])
  // Les thèmes du joueur sont signés de son pseudo actuel
  const myName = st.profile?.name
  // Thèmes à sortie programmée : ils apparaissent d'eux-mêmes à l'heure prévue, appli ouverte ou non
  const [releaseClock, setReleaseClock] = useState(() => Date.now())
  useEffect(() => {
    const next = Math.min(...OFFICIAL_TOPICS.map(t => t.releaseAt || Infinity).filter(at => at > releaseClock))
    if (!Number.isFinite(next)) return
    const id = setTimeout(() => setReleaseClock(Date.now()), Math.min(next - releaseClock + 500, 2 ** 31 - 1))
    return () => clearTimeout(id)
  }, [releaseClock])
  const topics = useMemo(() => [
    ...OFFICIAL_TOPICS.filter(t => !t.releaseAt || t.releaseAt <= releaseClock), ...COMMUNITY_SEED,
    ...st.custom.map(t => (t.own && myName ? { ...t, by: myName } : t)),
  ], [st.custom, myName, releaseClock])
  const byId = useCallback((id) => topics.find(t => t.id === id), [topics])
  // « Depuis ta dernière connexion » : les thèmes officiels sortis depuis la dernière ouverture de l'appli
  const [newTopics, setNewTopics] = useState(() => {
    const ids = OFFICIAL_TOPICS.filter(t => !t.releaseAt || t.releaseAt <= Date.now()).map(t => t.id)
    try {
      const raw = localStorage.getItem('kraken-known-topics')
      localStorage.setItem('kraken-known-topics', JSON.stringify(ids))
      if (!raw) return [] // première ouverture : rien à annoncer
      const known = new Set(JSON.parse(raw))
      return ids.filter(id => !known.has(id))
    } catch { return [] }
  })

  // Animation du classement quand on quitte un thème : rangs au moment où l'on y entre
  const [session, setSession] = useState(null) // { topicId, before, played }
  const [shift, setShift] = useState(null)
  const [sheet, setSheet] = useState(null)
  const [notes, setNotes] = useState([])

  const lockRef = useRef(() => 0)
  const go = useCallback((r) => {
    // un thème pas encore débloqué ne se lance pas soi-même (on peut seulement relever le défi d'un ami)
    if ((r.name === 'match' || r.name === 'linkcreate') && lockRef.current(byId(r.id)) > 0) {
      setToast('🔒 Débloque ce thème dans la boutique pour lancer une partie.')
      r = { name: 'topic', id: r.id }
    }
    // Défi par lien : on joue d'abord ses 7 questions, sans adversaire
    if (r.name === 'linkcreate') {
      const t = byId(r.id)
      r = { name: 'duel', id: t.id, opponent: FRIEND, mode: 'blind', linkCreate: true, questions: buildQuestions(t, st.topicStats[t.id]?.seen) }
    }
    // On quitte le thème en cours : si l'on a joué, on montre l'évolution du classement
    const inFlow = (x, id) => FLOW.includes(x.name) && x.id === id
    if (session && !inFlow(r, session.topicId)) {
      const t = byId(session.topicId)
      const stats = st.topicStats[session.topicId]
      if (t && stats && (stats.played || 0) > session.played) {
        setShift({ topic: t, before: ranksFor(st.profile, t, session.startStats), after: ranksFor(st.profile, t, stats), stats: { ...stats, ratingFrom: session.startStats?.rating ?? 1000 } })
      }
      setSession(null)
    }
    if (FLOW.includes(r.name) && r.id && (!session || session.topicId !== r.id || !inFlow(r, session.topicId))) {
      const t = byId(r.id)
      if (t && st.profile && (!session || session.topicId !== r.id)) {
        const stats = st.topicStats[r.id]
        setSession({ topicId: r.id, startStats: stats, played: stats?.played || 0 })
      }
    }
    if (r.name === 'match') {
      const topic = byId(r.id)
      const xp = st.topicStats[r.id]?.xp || 0
      let opponent = r.opponent
      // Partie rapide : on cherche d'abord un vrai joueur en ligne
      const searchLive = !opponent && !r.opponentId && !r.forceChampion
      if (!opponent && r.opponentId) {
        const bots = getCommunity(topic)
        const b = bots.find(x => x.id === r.opponentId)
        opponent = { ...b, champion: b === bots[0] }
      }
      opponent ??= findOpponent(topic, xp, { forceChampion: r.forceChampion })
      // Rang mondial (classement « depuis toujours » du thème) des deux joueurs, pour l'intro du duel
      const rows = leaderboard(topic, { ...meEntry(st.profile), allXp: xp }, myPeriodScore(st.topicStats[r.id], 'all'), 'all')
      const ranks = { me: rows.find(x => x.isMe)?.rank, opp: rows.find(x => x.id === opponent.id)?.rank }
      r = { ...r, opponent, ranks, searchLive }
    }
    setRoute(r)
    viewRef.current?.scrollTo(0, 0)
  }, [byId, st.topicStats, st.profile, session])

  // Fin d'une ascension : record personnel et tentative du jour (seule la première compte).

  const topic = route.topicObj || (route.id ? byId(route.id) : null)
  const me = st.profile

  const startDuel = useCallback(() => {
    setRoute(r => ({ ...r, name: 'duel', questions: buildQuestions(topics.find(x => x.id === r.id), st.topicStats[r.id]?.seen) }))
  }, [topics, st.topicStats])

  // Duel en direct : un vrai joueur a été trouvé
  const matchTopicId = route.name === 'match' ? route.id : null
  const liveSearch = useMemo(() => (matchTopicId ? { find: (qs) => findLiveMatch(matchTopicId, qs), leave: leaveLiveQueue } : null), [matchTopicId])
  const makeMatchQuestions = useCallback(() => buildQuestions(topics.find(x => x.id === route.id), st.topicStats[route.id]?.seen), [topics, route.id, st.topicStats])
  const startLive = useCallback((m) => {
    setRoute(r => {
      const t = topics.find(x => x.id === r.id)
      const pid = m.opponent.player_id
      const xp = st.topicStats[r.id]?.xp || 0
      const rows = leaderboard(t, { ...meEntry(st.profile), allXp: xp }, myPeriodScore(st.topicStats[r.id], 'all'), 'all')
      const real = rows.find(x => x.playerId === pid)
      const opponent = { id: 'p:' + pid, playerId: pid, name: m.opponent.name, avatar: m.opponent.avatar, flag: m.opponent.flag || '🏳️', photo: m.opponent.photo, xp: real?.xp || 0, rating: real?.xp, champion: real?.rank === 1, ai: false }
      return { ...r, name: 'duel', mode: 'remote', matchId: m.id, opponent, questions: m.questions, stake: m.stake || 0, ranks: { me: rows.find(x => x.isMe)?.rank, opp: real?.rank } }
    })
  }, [topics, st.topicStats, st.profile])
  const liveLink = useMemo(() => (route.matchId ? {
    send: (round, choice, t) => sendLiveAnswer(route.matchId, round, choice, t),
    poll: () => getLiveAnswers(route.matchId),
    result: () => liveResult(route.matchId),
  } : null), [route.matchId])

  const finishDuel = useCallback(({ myScore, oppScore, log, questions, forfeit = false }) => {
    const r = route, t = r.topicObj || byId(r.id)
    // Défi par lien créé : on enregistre ses réponses et on fabrique le lien à envoyer
    if (r.linkCreate) {
      const id = Date.now().toString(36) + '-' + Array.from(crypto.getRandomValues(new Uint8Array(9)), b => b.toString(36).padStart(2, '0')).join('')
      const answers = plain(log.me, questions.length)
      const url = challengeUrl({ id, from: { ...meEntry(st.profile), fc: social.code || null }, topic: t, questions, answers, expiresAt: Date.now() + LINK_TTL })
      const entry = { id: 'lk-' + id, dir: 'link-out', linkId: id, topicId: t.id, opponent: FRIEND, createdAt: Date.now(), status: 'waiting-link', url, myScore, unseen: false }
      setSt(s => ({
        ...s,
        linkChallenges: [{ id, topicId: t.id, questions, answers, score: myScore, at: Date.now(), replies: [] }, ...(s.linkChallenges || [])].slice(0, 30),
        challenges: [entry, ...(s.challenges || [])].slice(0, 40),
      }))
      setRoute({ name: 'linkready', id: t.id, url, score: myScore, shortening: true, entryId: entry.id })
      // lien court (les longs liens sont coupés par certaines messageries) ; en cas d'échec on garde le long
      shortenUrl(url).catch(() => url).then(short => {
        setRoute(cur => (cur.name === 'linkready' && cur.url === url ? { ...cur, url: short, shortening: false } : cur))
        if (short !== url) setSt(s => ({ ...s, challenges: (s.challenges || []).map(c => (c.id === entry.id ? { ...c, url: short } : c)) }))
      })
      return
    }
    // L'ami a joué un défi reçu par lien : résultat tout de suite, et lien de réponse pour le challenger
    if (r.linkPlay) {
      const ch = r.linkPlay
      const reply = { url: replyUrl({ id: ch.id, from: meEntry(st.profile), answers: plain(log.me, questions.length), questions }), to: ch.from.name, key: ch.id + ':' + Date.now() }
      shortenUrl(reply.url).then(short => {
        if (short !== reply.url) setRoute(cur => (cur.name === 'results' && cur.data?.link?.key === reply.key ? { ...cur, data: { ...cur.data, link: { ...cur.data.link, url: short } } } : cur))
      }).catch(() => {})
      const known = byId(ch.topic.id)
      // Envoi automatique au serveur : le challenger le recevra sans lien de réponse
      const answersPlain = plain(log.me, questions.length)
      // Relever un défi par lien fait de vous des amis (si les deux ont un compte)
      if (ch.from.fc && social.code && ch.from.fc !== social.code) {
        api.befriendByLink(ch.from.fc).then(res => {
          if (res === 'added') { setToast(`${ch.from.name} est maintenant dans tes amis`); social.refreshFriends() }
        }).catch(() => {})
      }
      submitLinkResult(ch.id, meEntry(st.profile), answersPlain)
        .then(() => setRoute(cur => (cur.name === 'results' && cur.data?.link?.key === reply.key ? { ...cur, data: { ...cur.data, autoSent: 'ok' } } : cur)))
        .catch(() => setRoute(cur => (cur.name === 'results' && cur.data?.link?.key === reply.key ? { ...cur, data: { ...cur.data, autoSent: 'failed' } } : cur)))
      const keep = (data) => ({ id: 'lk-in-' + ch.id + Date.now().toString(36), dir: 'link-in', linkId: ch.id, topicId: ch.topic.id, topicMeta: ch.topic, opponent: r.opponent, createdAt: Date.now(), status: 'done', result: data, unseen: false })
      if (known) {
        const { state, data } = settleDuel(st, { topic: known, opponent: r.opponent, myScore, oppScore, log, questions })
        const full = { ...data, link: reply }
        setSt({ ...state, challenges: [keep(full), ...(state.challenges || [])].slice(0, 40) })
        setRoute({ ...r, name: 'results', id: known.id, topicObj: null, data: { ...full, topic: known, autoSent: 'sending' } })
      } else {
        const outcome = myScore > oppScore ? 'win' : myScore < oppScore ? 'lose' : 'draw'
        const full = { outcome, myScore, oppScore, opponent: r.opponent, bonuses: {}, total: 0, before: 0, after: 0, log, questions, noXp: true, link: reply }
        setSt(s => ({ ...s, challenges: [keep(full), ...(s.challenges || [])].slice(0, 40) }))
        setRoute({ ...r, name: 'results', data: { ...full, topic: t, autoSent: 'sending' } })
      }
      setLink(null)
      return
    }
    // Défi différé envoyé à un ami : il part sur le serveur
    if (r.friendSend) {
      const answers = plain(log.me, questions.length)
      const send = () => api.sendChallenge(r.friendSend.player_id, t, questions, answers)
        .then(cid => setRoute(cur => (cur.name === 'friendsent' ? { ...cur, failed: false, challengeId: cid } : cur)))
        .catch(() => setRoute(cur => (cur.name === 'friendsent' ? { ...cur, failed: true } : cur)))
      setRoute({ name: 'friendsent', id: r.id, topicObj: r.topicObj, friend: r.friendSend, score: myScore, failed: undefined, retry: send })
      send()
      return
    }
    // Défi d'un ami joué : le serveur calcule les deux scores
    if (r.friendPlay) {
      const c = r.friendPlay
      const answers = plain(log.me, questions.length)
      api.playChallenge(c.id, answers, forfeit).then(res => {
        const mine = fromPlain(answers.map(a => [a.choice, a.t]), questions.length)
        const theirs = fromPlain(c.from_answers, questions.length)
        const data = settleFriend(c, res.my_score, res.their_score, logFrom(questions, mine, theirs))
        setRoute({ ...r, name: 'results', data, friendRematch: c.opponent, friendMsg: { id: c.id, name: c.opponent.name, theirMsg: res.their_msg ?? c.their_msg } })
        social.refreshChallenges()
      }).catch(() => { setToast('Envoi impossible : vérifie ta connexion. Le défi t\'attend toujours dans Défis.'); setRoute({ name: 'inbox' }) })
      return
    }
    // Duel en direct sur un thème que l'on n'a pas (invitation d'un ami) : pas d'XP, juste le résultat
    if (r.topicObj && !byId(r.topicObj.id)) {
      const outcome = myScore > oppScore ? 'win' : myScore < oppScore ? 'lose' : 'draw'
      setRoute({ ...r, name: 'results', data: { outcome, myScore, oppScore, opponent: r.opponent, bonuses: {}, total: 0, before: 0, after: 0, log, questions, noXp: true, topic: t }, friendRematch: r.friend })
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
    const { state, data } = settleDuel(st, { topic: t, opponent: r.opponent, myScore, oppScore, log, questions, ranks: r.ranks, ref: { matchId: r.mode === 'remote' ? r.matchId : null } })
    const challenges = ch
      ? state.challenges.map(c => (c.id === ch.id ? { ...c, status: 'done', myScore, result: data, unseen: false } : c))
      : state.challenges
    setSt({ ...state, challenges })
    setRoute({ ...r, name: 'results', data: { ...data, topic: t }, friendRematch: r.friend })
  // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // ===== Compte joueur : connexion automatique, sauvegarde, XP et classements réels =====
  const [account, setAccount] = useState({ status: 'idle' }) // idle | online | offline
  const [accountEpoch, setAccountEpoch] = useState(0)
  const [, setBoardTick] = useState(0)
  const lastProfile = useRef(null)
  const hasProfile = !!st.profile
  useEffect(() => {
    if (!hasProfile) return
    let alive = true
    connect(stRef.current.profile)
      .then(me => {
        if (!alive) return
        setAccount({ status: 'online', playerId: me.id, hasRecovery: me.has_recovery })
        update(s => (s.profile && s.profile.playerId !== me.id ? { ...s, profile: { ...s.profile, playerId: me.id } } : s))
      })
      .catch(() => { if (alive) setAccount({ status: 'offline' }) })
    return () => { alive = false }
  }, [hasProfile, accountEpoch, update])

  // Sauvegarde 3 s après chaque changement : profil, XP gagnée, puis toute la progression
  useEffect(() => {
    if (account.status !== 'online') return
    const id = setTimeout(async () => {
      const s = stRef.current
      if (!s.profile) return
      try {
        const key = JSON.stringify([s.profile.name, s.profile.avatar, s.profile.flag, s.profile.bio, s.profile.photo?.length])
        if (key !== lastProfile.current) { await pushProfile(s.profile); lastProfile.current = key }
        const synced = s.sync?.xp || {}
        const next = await pushXp(s.topicStats, synced)
        if (JSON.stringify(next) !== JSON.stringify(synced)) update(x => ({ ...x, sync: { ...(x.sync || {}), xp: next } }))
        // parties à classer : le serveur renvoie la cote officielle, qui remplace la nôtre
        for (const g of s.pendingGames || []) {
          const res = await api.recordGame(g).catch(() => undefined)
          if (res === undefined) break
          update(x => {
            const rest = (x.pendingGames || []).filter(p => p.at !== g.at)
            const ts = x.topicStats[g.topic]
            if (!res || res.dup || !ts) return { ...x, pendingGames: rest }
            return { ...x, pendingGames: rest, topicStats: { ...x.topicStats, [g.topic]: { ...ts, rating: res.rating, rated: res.games } } }
          })
        }
        await saveRemoteState({ ...stRef.current, sync: { ...(stRef.current.sync || {}), xp: next } })
      } catch { /* hors ligne : on réessaiera au prochain changement */ }
    }, 3000)
    return () => clearTimeout(id)
  }, [st, account.status, update])

  // Classements réels du thème affiché (semaine, mois, depuis toujours)
  const boardTopic = ['topic', 'ranking', 'results', 'duel', 'match'].includes(route.name) ? route.id : null
  const syncedXp = boardTopic ? st.sync?.xp?.[boardTopic] : undefined
  useEffect(() => {
    if (account.status !== 'online' || !boardTopic) return
    let alive = true
    Promise.all(['week', 'month', 'all'].map(k => fetchBoard(boardTopic, k).then(rows => setRealRows(boardTopic, k, rows))))
      .then(() => { if (alive) setBoardTick(t => t + 1) })
      .catch(() => {})
    return () => { alive = false }
  }, [account.status, boardTopic, syncedXp])

  const getRecoveryCode = async () => {
    const code = await makeRecoveryCode()
    setAccount(a => ({ ...a, hasRecovery: true }))
    return code
  }
  // Retrouver son compte avec un code (nouvel appareil ou changement de compte)
  const recoverAccount = async (code) => {
    let res
    try { res = await recoverWith(code) } catch { return 'offline' }
    if (!res) return 'bad'
    const base = res.state ? { ...emptyState(), ...res.state } : { ...emptyState(), ...stRef.current }
    const profile = { ...(base.profile || {}), id: base.profile?.id || res.me.id, name: res.me.name, avatar: res.me.avatar, flag: res.me.flag, bio: res.me.bio, playerId: res.me.id }
    lastProfile.current = null
    setSt({ ...base, profile })
    setAccount({ status: 'online', playerId: res.me.id, hasRecovery: true })
    setAccountEpoch(e => e + 1)
    setRoute({ name: 'home' })
    return 'ok'
  }

  // Défis par lien envoyés : les résultats des amis arrivent tout seuls depuis le serveur
  const byIdRef = useRef(byId)
  useEffect(() => { byIdRef.current = byId }, [byId])
  useEffect(() => {
    let alive = true
    const poll = async () => {
      const base = stRef.current
      if (!base.profile) return
      const weekAgo = Date.now() - 14 * 86400000
      // seulement les défis encore ouverts ou déjà répondus (pas les annulés ni les expirés)
      const open = new Set((base.challenges || []).filter(c => c.dir === 'link-out' && ['waiting-link', 'done'].includes(c.status)).map(c => c.linkId))
      const ids = (base.linkChallenges || []).filter(c => c.at > weekAgo && open.has(c.id)).map(c => c.id)
      if (!ids.length) return
      let rows
      try { rows = await fetchLinkResults(ids) } catch { return } // hors ligne : on réessaiera
      if (!alive) return
      const fresh = rows
        .map(row => rowToReply(row, (base.linkChallenges || []).find(c => c.id === row.challenge_id)))
        .filter(rep => rep && !(base.linkChallenges.find(c => c.id === rep.id)?.replies || []).includes(rep.from.name))
      if (!fresh.length) return
      let next = stRef.current
      const notes = []
      for (const rep of fresh) {
        const res = applyLinkReply(next, rep, byIdRef.current)
        if (!res.state) continue
        next = res.state
        const r = res.data
        notes.push({ text: `${rep.from.name} a relevé ton défi : ${r.outcome === 'win' ? 'victoire' : r.outcome === 'lose' ? 'défaite' : 'égalité'} ${r.myScore}–${r.oppScore}`, kind: 'result' })
      }
      const applied = next
      setSt(s => (s === stRef.current ? applied : s))
      if (notes.length) setNotes(n => [...n, ...notes].slice(-5))
    }
    const first = setTimeout(poll, 2500)
    const iv = setInterval(poll, 20000)
    return () => { alive = false; clearTimeout(first); clearInterval(iv) }
  }, [])

  // ===== Amis, défis entre amis, invitations en direct, notifications, thèmes partagés =====
  const online = account.status === 'online'
  const social = useSocial(online)
  const [friendSheet, setFriendSheet] = useState(null)
  const [friendPick, setFriendPick] = useState(null) // thème choisi, en attente du choix de l'ami
  const [playWho, setPlayWho] = useState(null) // thème choisi, en attente de « contre qui ? »
  const [requestSheet, setRequestSheet] = useState(false)
  const requestApi = useMemo(() => ({ request: api.requestTopic, vote: api.voteTopicRequest, list: api.listTopicRequests }), [])
  const [push, setPush] = useState(null)
  const [dismissedInvites, setDismissedInvites] = useState([])
  useEffect(() => {
    if (!online) return
    pushStatus().then(setPush).catch(() => setPush('unsupported'))
    refreshPush().catch(() => {})
    // et à chaque retour dans l'appli : l'appareil se réinscrit (abonnement perdu, changé ou jamais enregistré)
    const onVisible = () => { if (document.visibilityState === 'visible') refreshPush().catch(() => {}) }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [online])
  const onPush = (on) => {
    setPush('busy')
    ;(on ? enablePush() : disablePush()).then(setPush).catch(() => pushStatus().then(setPush).catch(() => setPush('off')))
  }

  // Règlement d'un défi entre amis (une seule fois) : XP si l'on a le thème, et résultat gardé pour « Voir »
  const topicOf = (c) => byId(c.topic_id) || { id: c.topic_id, icon: '❓', color: '#7c5cff', category: 'Culture', ...c.topic, questions: [] }
  function settleFriend(c, myScore, oppScore, log) {
    const t = topicOf(c), known = byId(c.topic_id), opponent = friendOpponent(c.opponent)
    const base = stRef.current
    if (base.friendResults?.[c.id]) return { ...base.friendResults[c.id], topic: t }
    let data, next
    if (known) {
      const res = settleDuel(base, { topic: known, opponent, myScore, oppScore, log, questions: c.questions, ref: { challengeId: c.id } })
      data = res.data; next = res.state
    } else {
      data = { outcome: myScore > oppScore ? 'win' : myScore < oppScore ? 'lose' : 'draw', myScore, oppScore, opponent, bonuses: {}, total: 0, before: 0, after: 0, log, questions: c.questions, noXp: true }
      next = base
    }
    const keep = Object.fromEntries(Object.entries({ ...(next.friendResults || {}), [c.id]: data }).slice(-40))
    setSt({ ...next, friendResults: keep })
    return { ...data, topic: t }
  }
  // Mes défis envoyés qui viennent d'être joués : on les règle et on prévient
  useEffect(() => {
    const done = social.challenges.filter(c => c.dir === 'out' && c.status === 'done' && !stRef.current.friendResults?.[c.id])
    if (!done.length) return
    const notesNew = []
    for (const c of done) {
      const n = c.questions.length
      const data = settleFriend(c, c.my_score, c.their_score, logFrom(c.questions, fromPlain(c.from_answers, n), fromPlain(c.to_answers, n)))
      notesNew.push({ text: `${c.opponent.name} a joué ton défi : ${data.outcome === 'win' ? 'victoire' : data.outcome === 'lose' ? 'défaite' : 'égalité'} ${c.my_score}–${c.their_score}`, kind: 'result' })
    }
    setNotes(nn => [...nn, ...notesNew].slice(-5))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [social.challenges])

  // thèmes proposés pour défier un ami : seulement ceux que l'on a débloqués
  const friendTopicsFor = () => {
    const ok = topics.filter(t => t.questions.length >= 7 && !lockRef.current(t))
    const fav = ok.filter(t => st.follows.includes(t.id) || t.own)
    return [...fav, ...ok.filter(t => t.official && !fav.includes(t))]
  }

  const startFriendDuel = (friend, topic, mode, stake = 0) => {
    setFriendSheet(null)
    if (friend.fromChat) api.chatSend(friend.player_id, `⚔️ Je te lance un défi en ${topic.name}${mode === 'live' ? ' en direct' : ''} !`, 'invite', { type: 'duel', live: mode === 'live' }).catch(() => {})
    const questions = buildQuestions(topic, st.topicStats[topic.id]?.seen)
    if (mode === 'live') {
      setRoute({ name: 'invite', id: topic.id, friend, inviteId: null, status: 'pending', startedAt: Date.now(), questions, stake })
      api.inviteLive(friend.player_id, topic, questions, stake)
        .then(inviteId => setRoute(cur => (cur.name === 'invite' && !cur.inviteId ? { ...cur, inviteId } : cur)))
        .catch((e) => setRoute(cur => (cur.name === 'invite' ? { ...cur, status: 'failed', error: /lingots/.test(e?.message || '') ? 'Tu n\'as pas assez de lingots pour cette mise.' : null } : cur)))
      return
    }
    go({ name: 'duel', id: topic.id, opponent: { ...friendOpponent(friend), id: 'ami' }, mode: 'blind', friendSend: friend, questions })
  }
  // Le challenger attend que son ami accepte le duel en direct
  const inviteId = route.name === 'invite' && route.status === 'pending' ? route.inviteId : null
  useEffect(() => {
    if (!inviteId) return
    let alive = true, busy = false
    const iv = setInterval(async () => {
      if (busy) return
      busy = true
      try {
        const res = await api.getLiveInvite(inviteId)
        if (!alive || !res) return
        if (res.status === 'accepted' && res.match) { alive = false; startLive(res.match) }
        else if (res.status !== 'pending') setRoute(cur => (cur.name === 'invite' ? { ...cur, status: res.status } : cur))
      } catch { /* réseau : on réessaie */ } finally { busy = false }
    }, 1500)
    return () => { alive = false; clearInterval(iv) }
  }, [inviteId, startLive])
  const cancelInvite = () => {
    if (route.inviteId && route.status === 'pending') api.cancelLiveInvite(route.inviteId).catch(() => {})
    go({ name: 'friends' })
  }

  // Invitation reçue
  const invite = social.invites.find(i => !dismissedInvites.includes(i.id))
  const acceptInvite = async (inv) => {
    setDismissedInvites(d => [...d, inv.id])
    let m
    let err = null
    try { m = await api.respondLiveInvite(inv.id, true) } catch (e) { m = null; err = e }
    if (!m) { setToast(/lingots/.test(err?.message || '') ? `💰 Pas assez de lingots pour cette mise (${inv.stake}).` : 'Trop tard : l\'invitation a expiré.'); return }
    const known = byId(inv.topic_id)
    const opponent = { ...friendOpponent(inv.from) }
    setRoute({
      name: 'duel', id: known ? known.id : inv.topic_id, topicObj: known ? null : { id: inv.topic_id, icon: '❓', color: '#7c5cff', category: 'Culture', ...inv.topic, questions: [] },
      mode: 'remote', matchId: m.id, opponent, questions: m.questions, ranks: {}, friend: inv.from, stake: m.stake || 0,
    })
  }
  // Le Butin : inviter un ami, ou rejoindre une partie à laquelle on est invité
  const duoInvite = social.duoInvites.find(i => !dismissedInvites.includes(i.id))
  // Porte-monnaie de lingots (sur le serveur) et Butin solo contre le Kraken
  const [wallet, setWallet] = useState(null)
  const [missions, refreshMissions, setMissions] = useMissions(online)
  const [missionsOpen, setMissionsOpen] = useState(false)
  // Nouveau défi d'un ami reçu pendant qu'on est dans l'appli : bandeau en haut de l'écran (une fois par défi)
  const [chNotice, setChNotice] = useState(null)
  useEffect(() => {
    const incoming = (social.challenges || []).filter(c => c.dir === 'in' && c.status === 'pending')
    if (!incoming.length) return
    let seen
    try { seen = new Set(JSON.parse(localStorage.getItem('kraken-seen-challenges') || '[]')) } catch { seen = new Set() }
    const fresh = incoming.filter(c => !seen.has(c.id))
    if (!fresh.length) return
    const t = setTimeout(() => {
      fresh.forEach(c => seen.add(c.id))
      try { localStorage.setItem('kraken-seen-challenges', JSON.stringify([...seen].slice(-200))) } catch { /* stockage indisponible */ }
      setChNotice({ ...fresh[0], more: fresh.length - 1 })
    }, 0)
    return () => clearTimeout(t)
  }, [social.challenges])
  useEffect(() => {
    if (!chNotice) return
    const t = setTimeout(() => setChNotice(null), 12000)
    return () => clearTimeout(t)
  }, [chNotice])
  // les missions avancent pendant les parties : on les relit à chaque retour à l'accueil
  useEffect(() => { if (online && route.name === 'home') refreshMissions() }, [online, route.name]) // eslint-disable-line react-hooks/exhaustive-deps
  const [walletAt, setWalletAt] = useState(0) // moment de réception (pour le compte à rebours de l'oxygène)
  const [oxySheet, setOxySheet] = useState(null) // { partner? } quand une partie est refusée faute d'oxygène
  const refreshWallet = useCallback(() => api.getWallet().then(w => { if (w) { setWallet(w); setWalletAt(Date.now()) } }).catch(() => {}), [])
  useEffect(() => { if (friendSheet && account.status === 'online') refreshWallet() }, [friendSheet, account.status, refreshWallet])
  const refill = async () => {
    try { const w = await api.refillOxygen(); setWallet(w); setWalletAt(Date.now()); setToast('🫧 Réserve d\'oxygène pleine !'); return true }
    catch { setToast('Recharge impossible.'); return false }
  }
  const noOxygen = (e) => /oxygène/.test(e?.message || '')

  // Boutique : thèmes débloqués (le serveur fait foi). Tant qu'on ne sait pas, rien n'est verrouillé.
  const [unlocks, setUnlocks] = useState(null)
  // Appli installée : on propose d'activer les notifications dès l'accueil (au plus 3 fois, espacées)
  const [notifAsk, setNotifAsk] = useState(false)
  const askReady = route.name === 'home' && !!st.profile && unlocks && !unlocks.needs_pick
  useEffect(() => {
    if (!askReady || !shouldAskNotif(push)) return
    const id = setTimeout(() => setNotifAsk(true), 1500)
    return () => clearTimeout(id)
  }, [askReady, push])
  const notifYes = () => {
    setPush('busy')
    enablePush().then(r => { setPush(r); setNotifAsk(false); if (r !== 'on') notifAskLater() })
      .catch(() => { setNotifAsk(false); notifAskLater(); pushStatus().then(setPush).catch(() => setPush('off')) })
  }
  const notifLater = () => { notifAskLater(); setNotifAsk(false) }
  // Pastille sur l'icône de l'appli (iPhone et Android, appli installée avec notifications) : ce qui attend le joueur
  const waiting = pendingCount(st) + (social.counts?.challenges || 0) + (social.counts?.requests || 0)
  useEffect(() => {
    if (!('setAppBadge' in navigator)) return
    ;(waiting > 0 ? navigator.setAppBadge(Math.min(waiting, 99)) : navigator.clearAppBadge()).catch(() => {})
  }, [waiting])
  const refreshUnlocks = useCallback(() => api.getUnlocks().then(u => { if (u) setUnlocks(u) }).catch(() => {}), [])
  useEffect(() => { if (account.status === 'online') refreshUnlocks() }, [account.status, refreshUnlocks])
  // anciens joueurs : on garde les thèmes suivis ou joués avant l'ouverture de la boutique (une fois)
  useEffect(() => {
    if (!unlocks?.veteran || st.shopClaimed) return
    const ids = [...new Set([...(st.follows || []), ...Object.entries(st.topicStats || {}).filter(([, v]) => (v?.played || 0) > 0).map(([k]) => k)])]
    api.claimTopics(ids).then(u => { if (u) setUnlocks(u); update(s => ({ ...s, shopClaimed: true })) }).catch(() => {})
  }, [unlocks?.veteran, st.shopClaimed]) // eslint-disable-line react-hooks/exhaustive-deps
  const pickStarters = async (ids) => { const u = await api.pickStarterTopics(ids); if (u) setUnlocks(u); setToast('🎉 Tes 5 thèmes sont débloqués !') }
  const lockPrice = useCallback((t) => (unlocks && isLockable(t) && !unlocks.topics.includes(t.id) ? priceOf(t.id) : 0), [unlocks])
  useEffect(() => { lockRef.current = lockPrice }, [lockPrice])
  const unlock = async (t) => {
    try {
      const r = await api.unlockTopic(t.id)
      setUnlocks(r.unlocks); setWallet(r.wallet); setWalletAt(Date.now())
      setToast(`🔓 « ${t.name} » débloqué !`)
    } catch (e) { setToast(/lingots/.test(e?.message || '') ? 'Pas assez de lingots.' : 'Achat impossible : vérifie ta connexion.') }
  }
  // solde rechargé à chaque arrivée sur l'accueil, les thèmes ou la boutique
  const walletScreen = ['home', 'shop', 'topics', 'topic'].includes(route.name) ? route.name + (route.id || '') : null
  useEffect(() => { if (account.status === 'online' && walletScreen) refreshWallet() }, [account.status, refreshWallet, walletScreen])
  // questions de l'Appât du Kraken : on mémorise les 120 dernières vues pour ne pas les reproposer trop vite
  const nextButin = () => {
    const rounds = buildButin(stRef.current.butinSeen || [])
    update(s => ({ ...s, butinSeen: [...(s.butinSeen || []), ...rounds.map(r => r.id)].slice(-240) }))
    return rounds.map(({ id, ...r }) => r) // eslint-disable-line no-unused-vars
  }
  const startSolo = async () => {
    try {
      const id = await api.startSoloButin(nextButin())
      setRoute({ name: 'butingame', gameId: id })
      refreshWallet()
    } catch (e) { if (noOxygen(e)) { refreshWallet(); setOxySheet({}) } else setToast('Impossible de lancer la partie : vérifie ta connexion.') }
  }
  const startButin = async (friend, voiceRoom = null) => {
    try {
      const id = await api.inviteDuo(friend.player_id, nextButin(), voiceRoom)
      setRoute({ name: 'butingame', gameId: id })
    } catch (e) { if (noOxygen(e)) { refreshWallet(); setOxySheet({}) } else setToast('Invitation impossible : vérifie ta connexion.') }
  }
  const acceptDuo = async (inv) => {
    setDismissedInvites(d => [...d, inv.id])
    let v
    try { v = await api.respondDuo(inv.id, true) } catch (e) {
      if (noOxygen(e)) { refreshWallet(); setOxySheet(/coéquipier/.test(e.message) ? { partner: inv.from.name } : {}); return }
      v = null
    }
    if (!v) { setToast('Trop tard : l\'invitation a expiré.'); return }
    refreshWallet()
    setRoute({ name: 'butingame', gameId: inv.id })
  }
  // Duel quiz à plusieurs : créer un salon, ou rejoindre celui d'un ami
  const partyInvite = (social.partyInvites || []).find(i => !dismissedInvites.includes(i.id))
  // La Traque du Kraken
  const traqueInvite = (social.traqueInvites || []).find(i => !dismissedInvites.includes(i.id))
  const startTraque = async () => {
    try { const id = await api.createTraque(); setRoute({ name: 'traque', gameId: id }) } catch { setToast('Pas de connexion.') }
  }
  const acceptTraque = async (inv) => {
    setDismissedInvites(d => [...d, inv.id])
    let ok
    try { ok = await api.respondTraque(inv.id, true) } catch { ok = null }
    if (!ok) { setToast('Trop tard : la partie a déjà commencé ou a été annulée.'); return }
    setRoute({ name: 'traque', gameId: inv.id })
  }
  const declineTraque = (inv) => { setDismissedInvites(d => [...d, inv.id]); api.respondTraque(inv.id, false).catch(() => {}) }
  // vocal d'un duel en direct entre amis : pendant le duel et sur l'écran de résultat, jusqu'à ce qu'on raccroche
  const duelFriendId = ['duel', 'results'].includes(route.name) && route.mode === 'remote' && route.matchId
    ? (route.friend?.player_id || route.opponent?.playerId || route.data?.opponent?.playerId) : null
  const duelFriend = duelFriendId ? (social.social?.friends || []).find(f => f.player_id === duelFriendId) : null
  const [hungMatch, setHungMatch] = useState(null)
  const duelVoice = useGroupVoice(route.matchId || 'none', account.playerId, duelFriend ? [duelFriend.player_id] : [], !!duelFriend && hungMatch !== route.matchId, 'match')
  const [traqueResume, setTraqueResume] = useState(null)
  useEffect(() => {
    if (!online || route.name !== 'home') return
    let alive = true
    api.myTraque().then(id => { if (alive) setTraqueResume(id || null) }).catch(() => {})
    return () => { alive = false }
  }, [online, route.name])
  const startPartyFor = async (topic) => {
    try {
      const id = await api.createParty(topic, buildQuestions(topic, st.topicStats[topic.id]?.seen))
      setRoute({ name: 'party', partyId: id })
    } catch { setToast('Impossible de créer la partie : vérifie ta connexion.') }
  }
  const acceptParty = async (inv) => {
    setDismissedInvites(d => [...d, inv.id])
    let v
    try { v = await api.respondParty(inv.id, true) } catch { v = null }
    if (!v) { setToast('Trop tard : la partie a commencé ou a été annulée.'); return }
    setRoute({ name: 'party', partyId: inv.id })
  }
  const declineParty = (inv) => { setDismissedInvites(d => [...d, inv.id]); api.respondParty(inv.id, false).catch(() => {}) }
  const declineDuo = (inv) => { setDismissedInvites(d => [...d, inv.id]); api.respondDuo(inv.id, false).catch(() => {}) }
  const declineInvite = (inv) => { setDismissedInvites(d => [...d, inv.id]); api.respondLiveInvite(inv.id, false).catch(() => {}) }

  const friendHandlers = {
    onPlay: (c) => {
      const known = byId(c.topic_id)
      setRoute({
        name: 'duel', id: known ? known.id : c.topic_id, topicObj: known ? null : topicOf(c),
        opponent: friendOpponent(c.opponent), questions: c.questions, mode: 'ghost', ghost: fromPlain(c.from_answers, c.questions.length), friendPlay: c,
      })
    },
    onDecline: (c) => api.declineChallenge(c.id).then(social.refreshChallenges).catch(() => setToast('Pas de connexion.')),
    onCancel: (c) => api.cancelChallenge(c.id).then(social.refreshChallenges).catch(() => setToast('Pas de connexion.')),
    onSee: (c) => {
      api.chatResultSeen(c.id).catch(() => {})
      const data = st.friendResults?.[c.id]
      if (!data) { setToast('Résultat en cours de récupération…'); return }
      const t = topicOf(c)
      markSeen('f-' + c.id)
      if (c.their_msg) markSeen('f-' + c.id + ':m')
      setRoute({ name: 'results', id: byId(c.topic_id) ? c.topic_id : undefined, topicObj: byId(c.topic_id) ? null : t, opponent: data.opponent, data: { ...data, topic: t }, friendRematch: c.opponent,
        friendMsg: { id: c.id, name: c.opponent.name, theirMsg: c.their_msg, myMsg: c.my_msg } })
    },
  }

  // Résultat consulté : il disparaît de la liste « Résultats » (gardé dans la sauvegarde, donc sur tous les appareils)
  function markSeen(id) {
    update(s => (s.seenResults || []).includes(id) ? s : { ...s, seenResults: [...(s.seenResults || []), id].slice(-300) })
  }

  // Nom donné au destinataire d'un défi par lien (« Défi pour Maman ») : remplace « Ton ami » dans la liste
  const nameLinkTarget = (name) => {
    const n = name.trim().slice(0, 18)
    setSt(s => ({ ...s, challenges: (s.challenges || []).map(c => (c.id === route.entryId ? { ...c, opponent: n ? { ...FRIEND, name: n, flag: '' } : FRIEND } : c)) }))
  }
  const shareMyCode = () => social.code && shareText(`Ajoute-moi en ami sur Kraken ! Mon code : ${social.code.slice(0, 4)}-${social.code.slice(4)}`, `${baseUrl()}#ami=${social.code}`)

  const unpublishTopic = async (t) => {
    try { await api.unpublishTopic(t.id) } catch { setToast('Pas de connexion.'); return }
    update(s => ({ ...s, custom: s.custom.map(x => (x.id === t.id ? { ...x, published: false } : x)) }))
    setToast('Thème retiré : il n\'est plus visible des autres joueurs.')
  }
  // Un thème partagé installé se met à jour quand on ouvre sa page
  const sharedPageId = route.name === 'topic' && route.id?.startsWith('p-') ? route.id : null
  useEffect(() => {
    if (!online || !sharedPageId) return
    const local = stRef.current.custom.find(x => x.id === sharedPageId)
    if (!local || local.own) return
    api.getSharedTopic(sharedPageId).then(full => {
      if (!full || full.updated_at === local.sharedAt) return
      update(s => ({ ...s, custom: s.custom.map(x => (x.id === sharedPageId ? { ...x, ...full.meta, questions: full.questions, by: full.by_name, sharedAt: full.updated_at } : x)) }))
    }).catch(() => {})
  }, [online, sharedPageId, update])

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
      markSeen(c.id)
      const t = byId(c.topicId) || { id: c.topicId, icon: '🔗', color: '#7c5cff', category: 'Culture', name: 'Défi par lien', ...(c.topicMeta || {}), questions: [] }
      setRoute({ name: 'results', id: byId(c.topicId) ? c.topicId : undefined, topicObj: byId(c.topicId) ? null : t, opponent: c.opponent, data: { ...c.result, topic: t } })
    },
    onResend: async (c) => {
      const t = byId(c.topicId)
      const text = `Je te défie sur « ${t?.name || 'Kraken'} » dans Kraken ! 7 questions, tu peux me battre ?`
      try { await navigator.share({ title: 'Kraken', text, url: c.url }); return } catch { /* refusé : on copie */ }
      try { await navigator.clipboard.writeText(`${text} ${c.url}`); setToast('Lien du défi copié : colle-le dans un message à ton ami.') } catch { setToast('Copie impossible sur cet appareil.') }
    },
    onDismiss: (c) => update(s => ({ ...s, challenges: s.challenges.filter(x => x.id !== c.id) })),
    // Annuler un défi par lien : il disparaît, et un résultat qui arriverait plus tard est ignoré
    onCancel: (c) => {
      update(s => ({
        ...s,
        challenges: s.challenges.filter(x => x.id !== c.id),
        linkChallenges: (s.linkChallenges || []).filter(x => x.id !== c.linkId),
      }))
      setToast('Défi annulé.')
    },
  }

  // Le challenger ouvre la réponse de son ami : on rejoue le résultat à partir des deux séries de réponses
  const openReply = () => {
    const res = applyLinkReply(st, link, byId)
    setLink(null)
    if (res.state) setSt(res.state)
    const known = byId(res.topic.id)
    setRoute({ name: 'results', id: known ? known.id : undefined, topicObj: known ? null : res.topic, opponent: res.data.opponent, data: { ...res.data, topic: res.topic } })
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
    // thème publié : la version de tous les joueurs suit les modifications
    if (t.own && t.published && t.id.startsWith('p-')) api.publishTopic(t, t.id).catch(() => setToast('Modifs enregistrées ici, mais pas encore publiées (connexion ?).'))
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
    let alive = true
    const show = (l) => {
      if (!alive) return
      const fail = {
        invalid: 'Ce lien de défi est incomplet ou abîmé. Demande à ton ami de te le renvoyer.',
        missing: 'Ce défi n\'existe plus (les liens durent 30 jours). Demande à ton ami d\'en envoyer un nouveau.',
        offline: 'Pas de connexion : impossible d\'ouvrir le défi. Réessaie dans un instant.',
      }[l.kind]
      if (fail) { setToast(fail); setRoute(r => (r.name === 'linkload' ? { name: 'home' } : r)); return }
      setLink(l)
      setRoute({ name: l.kind === 'challenge' ? 'linkintro' : 'linkreply' })
    }
    const open = (l) => {
      if (!l) return
      if (l.kind !== 'short') return show(l)
      setRoute({ name: 'linkload' })
      resolveShort(l.id).then(show)
    }
    if (LINK?.kind === 'short') resolveShort(LINK.id).then(show)
    const onHash = () => {
      const nav = readNavHash()
      if (nav) { setRoute(nav); return }
      open(readLinkFromHash())
    }
    window.addEventListener('hashchange', onHash)
    return () => { alive = false; window.removeEventListener('hashchange', onHash) }
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
    try { if (navigator.share) { await navigator.share({ title: 'Kraken', text, url }); return } } catch { /* refusé ou annulé */ }
    setToast(copied ? 'Lien copié, colle-le à tes amis' : "Impossible de copier sur cet appareil")
  }

  const shareTopic = (t) => {
    const url = `${location.origin}${location.pathname}#t=${encodeTopic(t)}`
    shareText(`Viens me défier sur mon thème « ${t.name} » !`, url)
  }

  if (inAppGate) {
    return <div className="app"><main className="view"><div><InAppGate onContinue={() => setInAppGate(false)} /></div></main></div>
  }
  if (!me && installIntro) {
    return <div className="app"><main className="view"><div><InstallIntro onDone={() => setInstallIntro(false)} /></div></main></div>
  }
  if (!me) {
    return (
      <div className="app">
        {/* dans la zone qui défile : sur un petit écran (ou avec le clavier ouvert), on doit pouvoir descendre jusqu'au bouton */}
        <main className="view"><div>
          <Onboarding topics={topics} onRecover={recoverAccount} onDone={({ name, avatar, photo, follows }) => {
            update(s => ({ ...s, profile: { id: Math.random().toString(36).slice(2), name, avatar, ...(photo ? { photo } : {}), createdAt: Date.now() }, follows: [...new Set([...s.follows, ...follows, ...(SHARED ? [SHARED.id] : [])])] }))
          }} />
        </div></main>
      </div>
    )
  }

  const meForDuel = { ...me, topicXp: st.topicStats[route.id]?.xp || 0 }
  const fullscreen = (route.name === 'chat' && !!route.peer) || ['match', 'duel', 'results', 'butingame', 'party', 'traque', 'sent', 'invite', 'friendsent', 'linkload', 'linkready', 'linkintro', 'linkreply'].includes(route.name)
  // pas de rechargement automatique (nouvelle version) pendant une partie
  window.__dueliaBusy = ['match', 'duel', 'invite', 'create', 'butingame', 'party', 'traque'].includes(route.name)
  const badge = pendingCount(st) + social.counts.challenges
  const friendBadge = social.counts.requests
  const chatBadge = social.counts.chat || 0
  let view
  if (unlocks?.needs_pick && hasProfile && !['duel', 'match', 'results', 'butingame', 'party', 'linkintro', 'linkload'].includes(route.name)) {
    view = <StarterPick topics={topics} onDone={pickStarters} />
  } else switch (route.name) {
    case 'topics': view = <Topics topics={topics} go={go} lockPrice={lockPrice} importTopic={importTopic} onRequest={() => setRequestSheet(true)} />; break
    case 'topic': view = topic ? <TopicPage st={st} topic={topic} go={go} friends={social.social?.friends || []} onChallengeFriend={(f) => setFriendSheet({ ...f, topic })} toggleFollow={toggleFollow} shareTopic={shareTopic} deleteTopic={deleteTopic} onUnpublish={unpublishTopic} onPlay={(t) => { social.refreshFriends?.(); setPlayWho(t) }}
      lockPrice={lockPrice(topic)} lingots={wallet?.lingots || 0} onUnlock={unlock} /> : null; break
    case 'ranking': view = <Ranking st={st} topic={topic} go={go} friends={social.social?.friends || []} onChallenge={(f) => setFriendSheet({ ...f, topic })} />; break
    case 'create': view = <CreateTopic key={route.id || 'new'} st={st} existing={route.id ? topic : null} onSave={saveTopic} go={go} />; break
    case 'profile': view = <Profile st={st} topics={topics} update={update} go={go} account={account} onMakeCode={getRecoveryCode} onRecover={recoverAccount} push={push} onPush={onPush} onFriends={() => go({ name: 'friends' })} friendCount={social.social?.friends?.length} onBook={() => go({ name: 'book' })} />; break
    case 'book': view = <StickerBook key={route.friend?.player_id || 'me'} playerId={route.friend?.player_id} editable={!route.friend} topics={topics} onToast={setToast}
      title={route.friend ? `Livre de ${route.friend.name}` : 'Mon livre de stickers'} onBack={() => go(route.friend ? { name: 'friend', friend: route.friend } : { name: 'profile' })} />; break
    case 'shop': view = <Shop topics={topics} wallet={wallet} online={online && account.status === 'online'} isLocked={(t) => lockPrice(t) > 0}
      onUnlock={unlock} onOpen={(t) => go({ name: 'topic', id: t.id })} onBack={() => go({ name: 'home' })} />; break
    case 'traque': view = <Traque key={route.gameId} gameId={route.gameId} topics={topics} friends={social.social?.friends || []} onWallet={refreshWallet} onExit={() => go({ name: 'home' })} />; break
    case 'party': view = <Party key={route.partyId} partyId={route.partyId} friends={social.social?.friends} onExit={() => go({ name: 'home' })} />; break
    case 'butin': view = <ButinHome online={online && account.status === 'online'} friends={social.social?.friends} onInvite={startButin} onSolo={startSolo} wallet={wallet}
      onBack={() => go({ name: 'home' })} onAddFriend={() => go({ name: 'friends' })} />; break
    case 'butingame': view = <ButinGame key="butin" gameId={route.gameId} me={me}
      replayInvite={social.duoInvites.find(i => !dismissedInvites.includes(i.id))}
      onAcceptReplay={acceptDuo}
      onWallet={(n) => setWallet(w => ({ ...(w || {}), lingots: n, daily_bonus: false }))}
      onExit={() => go({ name: 'home' })} onReplay={(p, room) => (p ? startButin(p, room) : startSolo())} />; break
    case 'match': view = <Matchmaking key={route.id} topic={topic} opponent={route.opponent} onReady={startDuel} onCancel={() => go({ name: 'topic', id: topic.id })}
      live={route.searchLive && account.status === 'online' ? liveSearch : null} makeQuestions={makeMatchQuestions} onLive={startLive} />; break
    case 'duel': view = <Duel key={route.questions.map(q => q.idx).join() + (route.challengeId || '')} topic={topic} me={meForDuel} opponent={route.opponent} ranks={route.ranks} questions={route.questions}
      mode={route.mode} ghost={route.ghost} link={liveLink} onFinish={finishDuel} onQuit={route.challengeId ? () => go({ name: 'inbox' }) : quitDuel}
      chatPeer={duelFriend ? { player_id: duelFriend.player_id, name: duelFriend.name } : null} voice={duelFriend ? duelVoice : null} matchId={route.matchId}
      onForfeit={route.mode === 'remote' || route.friendPlay ? (res) => {
        // abandon contre un ami : compté comme une défaite (et la victoire de l'ami)
        setToast('Abandon : compté comme une défaite.')
        if (route.mode === 'remote' && route.matchId) api.liveForfeit(route.matchId).catch(() => {})
        finishDuel({ ...res, myScore: route.friendPlay ? res.myScore : 0, oppScore: route.friendPlay ? res.oppScore : Math.max(res.oppScore, 1), forfeit: true })
      } : undefined} />; break
    case 'linkload': view = <div className="screen link-screen"><div className="link-card"><div className="spinner" aria-hidden="true" /><h1>Ouverture du défi…</h1></div></div>; break
    case 'linkready': view = <LinkReady url={route.url} shortening={route.shortening} score={route.score} topic={topic} onName={nameLinkTarget} onHome={() => go({ name: 'home' })} onTopic={() => go({ name: 'topic', id: topic.id })} />; break
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
    case 'inbox': view = <Inbox st={st} topics={topics} now={clock} {...inboxHandlers} onBack={() => go({ name: 'chat' })}
      friend={{ list: social.challenges || [], results: st.friendResults, ...friendHandlers }} />; break
    case 'chat': view = route.peer
      ? <ChatThread key={route.peer.player_id} peer={route.peer} onBack={() => go({ name: 'chat' })}
          onChallenge={(f) => setFriendSheet({ ...f, fromChat: true })}
          onTraque={async (f) => { try { const id = await api.createTraque(); await api.inviteTraque(id, f.player_id); setRoute({ name: 'traque', gameId: id }); return id } catch { setToast('Pas de connexion.'); return null } }}
          onJoinTraque={async (id) => { let ok; try { ok = await api.respondTraque(id, true) } catch { ok = null } if (!ok) { setToast('Trop tard : la partie a déjà commencé ou a été annulée.'); return } setRoute({ name: 'traque', gameId: id }) }}
          onOpenInbox={() => go({ name: 'inbox' })} />
      : <ChatList onOpen={(peer) => go({ name: 'chat', peer })} onAddFriend={() => go({ name: 'friends' })} challenges={badge} onChallenges={() => go({ name: 'inbox' })} />; break
    case 'friends': view = <FriendsScreen online={online} social={social.social} code={social.code} initialCode={route.code} now={clock} push={push} onPush={onPush}
      onAdd={(c) => api.addFriend(c).then(r => { social.refreshFriends(); return r })}
      onRespond={(f, yes) => api.respondFriend(f.player_id, yes).then(social.refreshFriends).catch(() => setToast('Pas de connexion.'))}
      onRemove={(f) => api.removeFriend(f.player_id).then(social.refreshFriends).catch(() => setToast('Pas de connexion.'))}
      onChallenge={setFriendSheet} onShareCode={shareMyCode} onOpen={(f) => go({ name: 'friend', friend: f })} />; break
    case 'friend': view = route.friend ? <FriendProfile friend={route.friend} topics={topics} onChallenge={setFriendSheet} onBook={(f) => go({ name: 'book', friend: f })} onBack={() => go({ name: 'friends' })}
      onRemove={(f) => api.removeFriend(f.player_id).then(() => { social.refreshFriends(); setToast(`${f.name} n'est plus dans tes amis.`); go({ name: 'friends' }) }).catch(() => setToast('Pas de connexion.'))} /> : null; break
    case 'invite': view = topic ? <InviteWaiting key={route.startedAt} friend={route.friend} topic={topic} status={route.status} startedAt={route.startedAt} stake={route.stake} error={route.error}
      onCancel={cancelInvite} onAsync={() => startFriendDuel(route.friend, topic, 'async')} /> : null; break
    case 'friendsent': view = topic ? <FriendSent friend={route.friend} topic={topic} score={route.score} failed={route.failed}
      onMessage={route.challengeId ? (m) => api.setChallengeMessage(route.challengeId, m) : null}
      onRetry={() => { setRoute(cur => ({ ...cur, failed: undefined })); route.retry() }} onInbox={() => go({ name: 'inbox' })} onHome={() => go({ name: 'home' })} /> : null; break
    case 'sent': {
      const ch = (st.challenges || []).find(c => c.id === route.challengeId)
      view = ch && topic ? <SentScreen challenge={ch} topic={topic} onInbox={() => go({ name: 'inbox' })} onHome={() => go({ name: 'home' })} /> : null
      break
    }
    case 'results': view = (
      <Results data={route.data} me={me} onBook={() => go({ name: 'book' })}
        extra={(() => {
          // un ami : on continue la discussion dans le chat
          const pid = route.friendRematch?.player_id || route.friend?.player_id || route.opponent?.playerId || route.data?.opponent?.playerId
          const f = (social.social?.friends || []).find(x => x.player_id === pid)
          const chatBtn = f ? <button className="btn btn-secondary wide res-chat" onClick={() => go({ name: 'chat', peer: f })}>💬 Écrire à {f.name}</button> : null
          const voiceBar = duelFriend && hungMatch !== route.matchId ? <div className="tq-finale-voice res-voice">
            <button className={`tq-round-btn mic ${duelVoice.mic}`} onClick={duelVoice.toggleMic} disabled={duelVoice.mic === 'asking' || duelVoice.mic === 'unsupported'} aria-label="Micro">
              {{ on: '🎙️', muted: '🔇', asking: '⏳', denied: '🚫', unsupported: '🚫' }[duelVoice.mic] || '🎙️'}</button>
            <span>Vocal avec {duelFriend.name}</span>
            <button className="btn btn-small btn-ghost" onClick={() => setHungMatch(route.matchId)}>📞 Raccrocher</button>
          </div> : null
          return route.mode === 'remote' && route.matchId
            ? <>{voiceBar}<LiveBetResult matchId={route.matchId} stake={route.stake} name={route.opponent?.name || route.data?.opponent?.name} onWallet={refreshWallet} />{chatBtn}</>
            : chatBtn
        })()}
        onRematch={() => {
          const linkish = route.data.link || route.data.fromLink
          if (route.friendRematch) return setFriendSheet({ ...route.friendRematch, online: social.social?.friends?.find(f => f.player_id === route.friendRematch.player_id)?.online })
          if (route.mode === 'remote') return go({ name: 'match', id: topic.id }) // on recherche un joueur en ligne
          if (!linkish) return go({ name: 'match', id: topic.id, opponent: route.opponent, live: true })
          // revanche par lien : nouvelles questions du même thème si on l'a, sinon choix d'un thème
          return byId(topic.id) ? go({ name: 'linkcreate', id: topic.id }) : go({ name: 'topics' })
        }}
        onAnother={() => (route.data.link || route.data.fromLink ? go({ name: 'home' }) : go({ name: 'match', id: topic.id }))}
        onTopic={() => (byId(topic.id) ? go({ name: 'topic', id: topic.id }) : go({ name: 'topics' }))}
        onShare={() => shareText(`${route.data.outcome === 'win' ? 'Victoire' : 'Duel'} ${route.data.myScore}–${route.data.oppScore} contre ${route.opponent.name} sur « ${topic.name} » dans Kraken !`)} />
    ); break
    default: view = <Home st={st} topics={topics} go={go} wallet={wallet} onSolo={startSolo} onTraque={startTraque} traqueResume={traqueResume ? () => go({ name: 'traque', gameId: traqueResume }) : null} missions={<MissionsChip data={missions} onOpen={() => setMissionsOpen(true)} />}
      oxygen={<OxygenInline wallet={wallet} at={walletAt} onRefill={refill} onDue={refreshWallet} />} />
  }
  if (!view) view = <Home st={st} topics={topics} go={go} wallet={wallet} onSolo={startSolo} onTraque={startTraque} traqueResume={traqueResume ? () => go({ name: 'traque', gameId: traqueResume }) : null} missions={<MissionsChip data={missions} onOpen={() => setMissionsOpen(true)} />}
    oxygen={<OxygenInline wallet={wallet} at={walletAt} onRefill={refill} onDue={refreshWallet} />} />

  return (
    <div className={`app ${fullscreen ? 'full' : ''}`}>
      <main ref={viewRef} className="view"><div key={route.name + (route.id || '')}>{view}</div></main>
      {toast && <div className="toast" role="status">{toast}</div>}
      {notes.length > 0 && !['duel', 'match'].includes(route.name) && (
        <NotifyBanner key={notes[0].text} note={notes[0]}
          onOpen={() => { setNotes(n => n.slice(1)); go({ name: 'inbox' }) }}
          onClose={() => setNotes(n => n.slice(1))} />
      )}
      {newTopics.length > 0 && !['duel', 'match', 'traque'].includes(route.name) && (
        <div className="sheet-backdrop" onClick={() => setNewTopics([])}>
          <div className="sheet new-topics" role="dialog" aria-labelledby="nt-title" onClick={e => e.stopPropagation()}>
            <span className="nt-emoji" aria-hidden="true">🎉</span>
            <h2 id="nt-title">Depuis ta dernière connexion, voici les nouveaux thèmes ajoutés</h2>
            <div className="nt-list">
              {newTopics.map(byId).filter(Boolean).map(t => (
                <button key={t.id} className="nt-topic" onClick={() => { setNewTopics([]); go({ name: 'topic', id: t.id }) }}>
                  <TopicIcon topic={t} size={34} /><span><b>{t.name}</b><small>{t.questions.length} questions</small></span><i aria-hidden="true">›</i>
                </button>
              ))}
            </div>
            <button className="btn btn-primary wide" onClick={() => setNewTopics([])}>Super !</button>
          </div>
        </div>
      )}
      {sheet && <ChallengeSheet sheet={sheet} onSend={sendChallenge} onCancel={() => setSheet(null)} />}
      {requestSheet && <TopicRequestSheet online={online} api={requestApi} onClose={() => setRequestSheet(false)} />}
      {friendSheet && <FriendChallengeSheet friend={friendSheet} topics={friendTopicsFor()} initialTopic={friendSheet.topic && !lockPrice(friendSheet.topic) ? friendSheet.topic : null} onPick={(t, mode, stake) => startFriendDuel(friendSheet, t, mode, stake)} onCancel={() => setFriendSheet(null)} lingots={wallet?.lingots} />}
      {oxySheet && <OxygenSheet wallet={wallet} at={walletAt} partner={oxySheet.partner} onRefill={refill} onDue={refreshWallet} onClose={() => setOxySheet(null)} />}
      {playWho && <PlayWhoSheet topic={playWho} online={online && !!social.social} hasFriends={(social.social?.friends || []).length > 0}
        onPick={(k) => {
          const t = playWho; setPlayWho(null)
          if (k === 'ai') go({ name: 'match', id: t.id })
          else if (k === 'friend') setFriendPick(t)
          else if (k === 'party') startPartyFor(t)
          else go({ name: 'linkcreate', id: t.id })
        }}
        onCancel={() => setPlayWho(null)} />}
      {friendPick && <PickFriendSheet topic={friendPick} friends={social.social?.friends} online={online && !!social.social}
        onPick={(f) => { setFriendPick(null); setFriendSheet({ ...f, topic: friendPick }) }}
        onLink={() => { const t = friendPick; setFriendPick(null); go({ name: 'linkcreate', id: t.id }) }}
        onAdd={() => { setFriendPick(null); go({ name: 'friends' }) }}
        onCancel={() => setFriendPick(null)} />}
      {chNotice && !inGame && route.name !== 'inbox' && (
        <div className="challenge-notice" role="status">
          <button className="cn-main" onClick={() => { setChNotice(null); go({ name: 'inbox' }) }}>
            <span className="cn-icon" aria-hidden="true">⚔️</span>
            <span className="cn-txt"><b>{chNotice.opponent?.name || 'Un ami'} te défie !</b>
              <small>{chNotice.topic?.name ? `Thème : ${chNotice.topic.name}` : 'Nouveau défi'}{chNotice.more > 0 ? ` · +${chNotice.more} autre${chNotice.more > 1 ? 's' : ''}` : ''}</small></span>
            <span className="cn-go">Jouer</span>
          </button>
          <button className="cn-close" aria-label="Fermer" onClick={() => setChNotice(null)}>×</button>
        </div>
      )}
      {invite && !['duel', 'match', 'invite'].includes(route.name) && <LiveInviteBanner key={invite.id} invite={invite} onAccept={acceptInvite} onDecline={declineInvite} />}
      {traqueInvite && !invite && !inGame && <TraqueInviteBanner key={traqueInvite.id} invite={traqueInvite} onAccept={acceptTraque} onDecline={declineTraque} />}
      {partyInvite && !invite && !['duel', 'match', 'invite', 'butingame', 'party'].includes(route.name) && <PartyInviteBanner key={partyInvite.id} invite={partyInvite} onAccept={acceptParty} onDecline={declineParty} />}
      {duoInvite && !invite && !['duel', 'match', 'invite', 'butingame'].includes(route.name) && <DuoInviteBanner key={duoInvite.id} invite={duoInvite} onAccept={acceptDuo} onDecline={declineDuo} />}
      {shift && <RankShift shift={shift} profile={me} onClose={closeShift} />}
      {missionsOpen && missions && <MissionsSheet data={missions} onClose={() => setMissionsOpen(false)} onToast={setToast}
        onClaimed={(code, lingots) => { setMissions(d => ({ ...d, missions: d.missions.map(m => m.code === code ? { ...m, claimed: true } : m) })); if (lingots != null) setWallet(w => ({ ...(w || {}), lingots })) }} />}
      {notifAsk && route.name === 'home' && <NotifAsk busy={push === 'busy'} onYes={notifYes} onLater={notifLater} />}
      {!fullscreen && (
        <nav className="tabbar">
          {TABS.map(t => (
            <button key={t.name} className={route.name === t.name || (t.name === 'topics' && ['topic', 'ranking'].includes(route.name)) || (t.name === 'friends' && route.name === 'friend') || (t.name === 'chat' && route.name === 'inbox') || (t.name === 'profile' && route.name === 'book') ? 'on' : ''}
              onClick={() => go({ name: t.name })}>
              <svg viewBox="0 0 24 24">{t.icon}</svg>
              <span>{t.label}</span>
              {t.name === 'friends' && friendBadge > 0 && <i className="tab-badge">{friendBadge}</i>}
              {t.name === 'chat' && chatBadge + badge > 0 && <i className="tab-badge">{chatBadge + badge}</i>}
            </button>
          ))}
        </nav>
      )}
    </div>
  )
}
