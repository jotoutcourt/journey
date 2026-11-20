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
