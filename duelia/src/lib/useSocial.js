// État « social » venu du serveur : code ami, amis et présence, défis entre amis, invitations en direct.
import { useCallback, useEffect, useRef, useState } from 'react'
import * as api from './account.js'
import { pointsFor, TIME } from './duel.js'

export function useSocial(online) {
  const [code, setCode] = useState(null)
  const [social, setSocial] = useState(null)
  const [challenges, setChallenges] = useState([])
  const [invites, setInvites] = useState([])
  const [duoInvites, setDuoInvites] = useState([])
  const [partyInvites, setPartyInvites] = useState([])
  const [counts, setCounts] = useState({ requests: 0, challenges: 0 })
  const countsRef = useRef(counts)

  const refreshFriends = useCallback(() => api.getFriends().then(s => { if (s) setSocial(s) }).catch(() => {}), [])
  const refreshChallenges = useCallback(() => api.getChallenges().then(l => setChallenges(Array.isArray(l) ? l : [])).catch(() => {}), [])

  useEffect(() => {
    if (!online) return
    api.myFriendCode().then(setCode).catch(() => {})
    refreshFriends()
    refreshChallenges()
    const a = setInterval(refreshFriends, 30000)
    const b = setInterval(refreshChallenges, 15000)
    return () => { clearInterval(a); clearInterval(b) }
  }, [online, refreshFriends, refreshChallenges])

  // Présence et invitations en direct : toutes les 5 s quand l'appli est au premier plan
  useEffect(() => {
    if (!online) return
    const beat = () => {
      if (document.hidden) return
      api.heartbeat().then(h => {
        if (!h) return
        setInvites(h.invites || [])
        setDuoInvites(h.duo_invites || [])
        setPartyInvites(h.party_invites || [])
        const next = { requests: h.friend_requests || 0, challenges: h.pending_challenges || 0 }
        const prev = countsRef.current
        if (next.challenges !== prev.challenges) refreshChallenges()
        if (next.requests !== prev.requests) refreshFriends()
        countsRef.current = next
        setCounts(next)
      }).catch(() => {})
    }
    beat()
    const id = setInterval(beat, 5000)
    const onVis = () => { if (!document.hidden) beat() }
    document.addEventListener('visibilitychange', onVis)
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', onVis) }
  }, [online, refreshChallenges, refreshFriends])

  return { code, social, challenges, invites, duoInvites, setDuoInvites, partyInvites, counts, setInvites, refreshFriends, refreshChallenges }
}

// Joueur réel vu comme adversaire de duel
export const friendOpponent = (f) => ({
  id: 'p:' + f.player_id, playerId: f.player_id, name: f.name, avatar: f.avatar, flag: f.flag || '🏳️', photo: f.photo, xp: 0, ai: false,
})

// [[choix, temps], …] → [{ choice, t }, …]
export const fromPlain = (list, n) => Array.from({ length: n }, (_, i) => {
  const a = list?.[i]
  return Array.isArray(a) ? { choice: a[0], t: a[0] === -1 ? TIME : Math.max(300, Math.min(TIME, a[1])) } : { choice: -1, t: TIME }
})

// Journal d'un duel (pour l'écran de résultat) à partir des deux séries de réponses
export function logFrom(questions, mine, theirs) {
  const pts = (a, i) => (a.choice === questions[i].correct ? pointsFor(a.t, i === questions.length - 1 ? 2 : 1) : 0)
  return { me: mine.map((a, i) => ({ ...a, pts: pts(a, i) })), opp: theirs.map((a, i) => ({ ...a, pts: pts(a, i) })) }
}
