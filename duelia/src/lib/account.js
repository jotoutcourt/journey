// Comptes joueurs (Supabase) : compte créé automatiquement, progression sauvegardée,
// classements réels et code de connexion pour retrouver son compte sur un autre appareil.
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, PUBLIC_KEY } from './server.js'

let client = null
function sb() {
  client ??= createClient(SUPABASE_URL, PUBLIC_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, storageKey: 'duelia-auth', detectSessionInUrl: false },
  })
  return client
}

async function rpc(fn, args = {}) {
  const { data, error } = await sb().rpc(fn, args)
  if (error) throw new Error(error.message)
  return data
}

// Session de l'appareil : créée sans e-mail ni mot de passe au premier lancement
export async function ensureSession() {
  const { data } = await sb().auth.getSession()
  if (data.session) return data.session
  const res = await sb().auth.signInAnonymously()
  if (res.error) throw res.error
  return res.data.session
}

// Rattache l'appareil à un joueur (créé si besoin) et renvoie ses infos
export async function connect(profile) {
  await ensureSession()
  let me = await rpc('get_me')
  if (!me) {
    await rpc('create_player', { p_name: profile.name, p_avatar: profile.avatar, p_flag: profile.flag || '🇫🇷' })
    me = await rpc('get_me')
  }
  return me
}

const photoForServer = (p) => (p && p.startsWith('data:image/jpeg;base64,') && p.length <= 60000 ? p : null)

export const pushProfile = (profile) => rpc('update_profile', {
  p_name: profile.name, p_avatar: profile.avatar, p_flag: profile.flag || '🇫🇷',
  p_bio: profile.bio || '', p_photo: photoForServer(profile.photo),
})

export const saveRemoteState = (state) => rpc('save_state', { p_data: state })

// Envoie l'XP gagnée depuis la dernière synchronisation, thème par thème.
// Renvoie la nouvelle photographie des XP envoyées.
export async function pushXp(topicStats, synced = {}) {
  const next = { ...synced }
  try {
    for (const [topicId, stats] of Object.entries(topicStats || {})) {
      const xp = stats?.xp || 0
      const before = next[topicId]
      if (before === undefined) {
        if (xp > 0) await rpc('add_xp', { p_topic: topicId, p_xp: xp, p_backfill: true }) // reprise de l'historique
        next[topicId] = xp
      } else {
        // une partie rapporte au plus 800 XP : on découpe, et on note chaque morceau envoyé
        while (xp > next[topicId]) {
          const part = Math.min(xp - next[topicId], 800)
          await rpc('add_xp', { p_topic: topicId, p_xp: part })
          next[topicId] += part
        }
      }
    }
  } catch { /* coupure : ce qui est parti est noté, le reste repartira au prochain essai */ }
  return next
}

// Classement réel d'un thème pour une période ('week' | 'month' | 'all')
export async function fetchBoard(topicId, period) {
  const rows = await rpc('get_leaderboard', { p_topic: topicId, p_period: period })
  return (rows || []).map(r => ({ id: 'p:' + r.player_id, playerId: r.player_id, name: r.name, avatar: r.avatar, flag: r.flag, xp: Number(r.xp) }))
}

export const makeRecoveryCode = () => rpc('make_recovery_code')

// Livre de stickers : le sien (sans paramètre) ou celui d'un ami
export const getStickerBook = (playerId) => rpc('get_sticker_book', playerId ? { p_player: playerId } : {})
export const placeSticker = (id, page, x, y, rot) => rpc('place_sticker', { p_sticker: id, p_page: page, p_x: x, p_y: y, p_rot: rot })

// Fait classer une partie par le serveur ; renvoie { rating, games } (null si refusée)
export const recordGame = (g) => rpc('record_game', { p_topic: g.topic, p_my: Math.round(g.my), p_opp: Math.round(g.opp), p_opp_rating: Math.round(g.oppRating), p_match: g.match, p_challenge: g.challenge })

// Retrouver son compte avec un code : renvoie { me, state } ou null si le code est faux
export async function recoverWith(code) {
  await ensureSession()
  const pid = await rpc('recover', { p_code: code })
  if (!pid) return null
  const [me, state] = await Promise.all([rpc('get_me'), rpc('load_state')])
  return { me, state }
}

// ===== Duel en direct entre deux vrais joueurs (échanges par le serveur toutes les fractions de seconde) =====
const slimQuestion = (q) => ({ q: q.q, options: q.options, correct: q.correct, idx: q.idx })

// Cherche un adversaire sur le thème : renvoie le duel trouvé, ou null (on reste dans la salle d'attente)
export const findLiveMatch = (topicId, questions) => rpc('find_live_match', { p_topic: topicId, p_questions: questions.map(slimQuestion) })
export const leaveLiveQueue = () => rpc('leave_live_queue')
export const sendLiveAnswer = (matchId, round, choice, t) => rpc('send_live_answer', { p_match: matchId, p_round: round, p_choice: choice, p_t: Math.round(t) })
export const getLiveAnswers = (matchId) => rpc('get_live_answers', { p_match: matchId })
// Score officiel calculé par le serveur : { me, opp, complete }
export const liveResult = (matchId) => rpc('live_result', { p_match: matchId })
export const setMatchMessage = (matchId, msg) => rpc('set_match_message', { p_match: matchId, p_msg: msg })
export const getMatchMessages = (matchId) => rpc('get_match_messages', { p_match: matchId })

// ===== Amis, défis entre amis, notifications, thèmes partagés =====
export const myFriendCode = () => rpc('my_friend_code')
export const getFriends = () => rpc('get_friends')
export const getFriendProfile = (id) => rpc('get_friend_profile', { p_friend: id })
export const addFriend = (code) => rpc('add_friend', { p_code: code })
export const befriendByLink = (code) => rpc('befriend_by_link', { p_code: code })
export const respondFriend = (playerId, accept) => rpc('respond_friend', { p_player: playerId, p_accept: accept })
export const removeFriend = (playerId) => rpc('remove_friend', { p_player: playerId })
export const heartbeat = () => rpc('heartbeat')

const topicMeta = (t) => ({ name: t.name, icon: t.icon, color: t.color, category: t.category })
const plainAnswers = (answers) => answers.map(a => [a.choice, Math.round(a.t)])
export const sendChallenge = (friendId, topic, questions, answers) => rpc('send_challenge', {
  p_to: friendId, p_topic_id: topic.id, p_topic: topicMeta(topic), p_questions: questions.map(slimQuestion), p_answers: plainAnswers(answers),
})
export const getChallenges = () => rpc('get_challenges')
export const playChallenge = (id, answers) => rpc('play_challenge', { p_id: id, p_answers: plainAnswers(answers) })
export const declineChallenge = (id) => rpc('decline_challenge', { p_id: id })
export const cancelChallenge = (id) => rpc('cancel_challenge', { p_id: id })

export const inviteLive = (friendId, topic, questions, stake = 0) => rpc('invite_live', { p_to: friendId, p_topic_id: topic.id, p_topic: topicMeta(topic), p_questions: questions.map(slimQuestion), p_stake: stake })
// Mise d'un duel en direct : réglée par le serveur ({ stake, settled, won, draw, wallet })
export const myMatchBet = (matchId) => rpc('my_match_bet', { p_match: matchId })
export const getLiveInvite = (id) => rpc('get_live_invite', { p_id: id })
export const cancelLiveInvite = (id) => rpc('cancel_live_invite', { p_id: id })
export const respondLiveInvite = (id, accept) => rpc('respond_live_invite', { p_id: id, p_accept: accept })

export const savePushSubscription = (endpoint, p256dh, auth) => rpc('save_push_subscription', { p_endpoint: endpoint, p_p256dh: p256dh, p_auth: auth })
export const deletePushSubscription = (endpoint) => rpc('delete_push_subscription', { p_endpoint: endpoint })
export const testPush = () => rpc('test_push')

export const publishTopic = (topic, publishedId) => rpc('publish_topic', {
  p_id: publishedId || null,
  p_meta: { ...topicMeta(topic), tagline: topic.tagline || '', ladder: topic.ladder || null },
  p_questions: topic.questions.map(q => ({ q: q.q, a: q.a })),
})
export const unpublishTopic = (id) => rpc('unpublish_topic', { p_id: id })
export const listSharedTopics = (query) => rpc('list_shared_topics', { p_query: query || null })
export const getSharedTopic = (id) => rpc('get_shared_topic', { p_id: id })

// Demandes de thèmes
export const requestTopic = (name, details) => rpc('request_topic', { p_name: name, p_details: details || '' })
export const voteTopicRequest = (id) => rpc('vote_topic_request', { p_id: id })
export const listTopicRequests = () => rpc('list_topic_requests')


// ===== Le Butin : mode coopératif à deux (la partie vit sur le serveur) =====
export const inviteDuo = (to, questions, voice = null) => rpc('invite_duo', { p_to: to, p_questions: questions, p_voice: voice })
export const respondDuo = (id, accept) => rpc('respond_duo', { p_id: id, p_accept: accept })
export const getDuo = (id) => rpc('get_duo', { p_id: id })
export const duoPlace = (id, round, placement) => rpc('duo_place', { p_id: id, p_round: round, p_placement: placement })
export const duoReady = (id, round, ready) => rpc('duo_ready', { p_id: id, p_round: round, p_ready: ready })
export const leaveDuo = (id) => rpc('leave_duo', { p_id: id })
export const getDuoBoard = () => rpc('get_duo_board')
export const duoSignal = (id, kind, payload) => rpc('duo_signal', { p_game: id, p_kind: kind, p_payload: payload })
export const duoSignalsSince = (id, after) => rpc('duo_signals_since', { p_game: id, p_after: after })
export const setChallengeMessage = (id, msg) => rpc('set_challenge_message', { p_id: id, p_msg: msg })
// ===== Le Butin solo et porte-monnaie de lingots =====
export const startSoloButin = (questions) => rpc('start_solo_butin', { p_questions: questions })
export const getWallet = () => rpc('get_wallet')
// ===== Duel quiz à plusieurs (2 à 4 joueurs, en direct) =====
export const createParty = (topic, questions) => rpc('create_party', {
  p_topic_id: topic.id, p_topic: { name: topic.name, icon: topic.icon, color: topic.color, category: topic.category },
  p_questions: questions.map(q => ({ q: q.q, options: q.options, correct: q.correct, idx: q.idx })),
})
export const inviteToParty = (party, friend) => rpc('invite_to_party', { p_party: party, p_friend: friend })
export const respondParty = (party, accept) => rpc('respond_party', { p_party: party, p_accept: accept })
export const startParty = (party) => rpc('start_party', { p_party: party })
export const getParty = (id) => rpc('get_party', { p_id: id })
export const partyAnswer = (party, round, choice) => rpc('party_answer', { p_party: party, p_round: round, p_choice: choice })
export const leaveParty = (party) => rpc('leave_party', { p_party: party })
export const refillOxygen = () => rpc('refill_oxygen')
// ===== Boutique de thèmes =====
export const getUnlocks = () => rpc('get_unlocks')
export const claimTopics = (ids) => rpc('claim_topics', { p_topics: ids })
export const unlockTopic = (id) => rpc('unlock_topic', { p_topic: id })
export const pickStarterTopics = (ids) => rpc('pick_starter_topics', { p_topics: ids })
export const duoNext = (id, round) => rpc('duo_next', { p_id: id, p_round: round })
export const duoJoker = (id, round) => rpc('duo_joker', { p_id: id, p_round: round })
export const placeDecor = (deco, page, x, y, rot, size) => rpc('place_decor', { p_deco: deco, p_page: page, p_x: x, p_y: y, p_rot: rot, p_size: size })
export const removeDecor = (id) => rpc('remove_decor', { p_id: id })
export const getMissions = () => rpc('get_missions')
export const claimMission = (code) => rpc('claim_mission', { p_code: code })
