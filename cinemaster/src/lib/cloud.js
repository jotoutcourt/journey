// Comptes et sauvegarde en ligne (Supabase).
// - Connexion sans mot de passe : un code à 6 chiffres reçu par e-mail.
// - La collection est enregistrée en ligne quelques secondes après chaque
//   changement, et récupérée sur un autre appareil.
// - Échanges entre amis : voir trades.* plus bas.
// Les clés ci-dessous sont publiques par nature : ce sont les règles de la
// base (supabase/schema.sql) qui protègent les données de chacun.
import { createClient } from '@supabase/supabase-js'
import { useSyncExternalStore } from 'react'

const URL = import.meta.env.VITE_SUPABASE_URL || 'https://rzebzydhthxyixkshewk.supabase.co'
const KEY = import.meta.env.VITE_SUPABASE_KEY || 'sb_publishable_ef0R9pT3IA5ZrFFc_Il4zQ_o92HUs3l'

// Pas de compte dans l'aperçu intégré (claude.ai) : seulement sur le site
// ou l'appli installée.
const embedded = typeof window !== 'undefined' && window.self !== window.top
export const supabase = URL && KEY && !embedded
  ? createClient(URL, KEY, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } })
  : null

// ─── Session ──────────────────────────────────────────────────────────────
let session = null
let profile = undefined        // undefined = pas encore chargé, null = pas de pseudo
const listeners = new Set()
const emit = () => listeners.forEach(fn => fn())
const subscribe = fn => { listeners.add(fn); return () => listeners.delete(fn) }

let recovery = false           // arrivé par le lien « mot de passe oublié »
let snapshot = { ready: !supabase, session, profile, recovery }
const refresh = () => { snapshot = { ready: true, session, profile, recovery }; emit() }

async function loadProfile() {
  if (!session) { profile = undefined; return refresh() }
  const { data } = await supabase.from('profiles').select('pseudo').eq('id', session.user.id).maybeSingle()
  profile = data || null
  refresh()
}

if (supabase) {
  supabase.auth.getSession().then(({ data }) => { session = data.session; loadProfile() })
  supabase.auth.onAuthStateChange((event, s) => {
    if (event === 'PASSWORD_RECOVERY') recovery = true
    const changed = s?.user?.id !== session?.user?.id
    session = s
    if (changed) loadProfile()
    else refresh()
  })
}

export function useAccount() {
  return useSyncExternalStore(subscribe, () => snapshot)
}

export const account = {
  available: !!supabase,
  async sendCode(email) {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true, emailRedirectTo: window.location.origin },
    })
    if (error) throw error
  },
  async verifyCode(email, token) {
    const { error } = await supabase.auth.verifyOtp({ email, token, type: 'email' })
    if (error) throw error
  },
  // Connexion par e-mail + mot de passe : se fait entièrement dans l'appli
  // (indispensable pour l'appli installée sur iPhone, où les liens reçus
  // par e-mail s'ouvrent dans Safari et non dans l'appli).
  async signIn(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  },
  // Création de compte ; renvoie true si l'adresse doit d'abord être confirmée
  async signUp(email, password) {
    const { data, error } = await supabase.auth.signUp({
      email, password, options: { emailRedirectTo: window.location.origin },
    })
    if (error) throw error
    return !data.session
  },
  async resetPassword(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin })
    if (error) throw error
  },
  async setPassword(password) {
    const { error } = await supabase.auth.updateUser({ password })
    if (error) throw error
    recovery = false
    refresh()
  },
  dismissRecovery() {
    recovery = false
    refresh()
  },
  async setPseudo(pseudo) {
    const { error } = await supabase.from('profiles').upsert({ id: session.user.id, pseudo })
    if (error) throw error
    await loadProfile()
  },
  async signOut() {
    await supabase.auth.signOut()
  },
}

// ─── Sauvegarde ───────────────────────────────────────────────────────────
// Dernière synchronisation connue sur cet appareil, par compte : sert à
// savoir si la version en ligne est plus récente (joueur sur un autre appareil).
const syncKey = uid => `popcard:synced:${uid}`
const getSynced = uid => { try { return Number(localStorage.getItem(syncKey(uid))) || 0 } catch { return 0 } }
const setSynced = (uid, t) => { try { localStorage.setItem(syncKey(uid), String(t)) } catch { /* ignore */ } }

export const cloud = {
  async fetchSave() {
    const { data, error } = await supabase.from('saves').select('data, updated_at').eq('user_id', session.user.id).maybeSingle()
    if (error) throw error
    return data ? { data: data.data, updatedAt: Date.parse(data.updated_at) } : null
  },
  async pushSave(state) {
    const updatedAt = new Date().toISOString()
    const { error } = await supabase.from('saves').upsert({ user_id: session.user.id, data: state, updated_at: updatedAt })
    if (error) throw error
    setSynced(session.user.id, Date.parse(updatedAt))
  },
  lastSynced: () => (session ? getSynced(session.user.id) : 0),
  markSynced: t => session && setSynced(session.user.id, t),
  // Cartes gagnées par des échanges : récupérées une seule fois (effacées
  // au passage), à ajouter à la collection.
  async takeDeliveries() {
    const { data, error } = await supabase.from('deliveries').delete().eq('user_id', session.user.id).select('card_id, qty')
    if (error) throw error
    return data || []
  },
}

// ─── Échanges ─────────────────────────────────────────────────────────────
export const trades = {
  async findPlayer(pseudo) {
    const { data, error } = await supabase.from('profiles').select('id, pseudo').ilike('pseudo', pseudo.trim()).maybeSingle()
    if (error) throw error
    return data
  },
  async duplicatesOf(userId) {
    const { data, error } = await supabase.rpc('duplicates_of', { friend: userId })
    if (error) throw error
    return (data || []).map(r => (typeof r === 'string' ? r : r.duplicates_of))
  },
  async propose(toUser, giveCard, wantCard) {
    const { error } = await supabase.from('trades').insert({
      from_user: session.user.id, to_user: toUser, give_card: giveCard, want_card: wantCard || null,
    })
    if (error) throw error
  },
  async list() {
    const { data, error } = await supabase.from('trades')
      .select('id, from_user, to_user, give_card, want_card, status, created_at, resolved_at')
      .or(`from_user.eq.${session.user.id},to_user.eq.${session.user.id}`)
      .order('created_at', { ascending: false })
      .limit(40)
    if (error) throw error
    // pseudos des autres joueurs
    const ids = [...new Set((data || []).flatMap(t => [t.from_user, t.to_user]))]
    const { data: people } = ids.length
      ? await supabase.from('profiles').select('id, pseudo').in('id', ids)
      : { data: [] }
    const names = Object.fromEntries((people || []).map(p => [p.id, p.pseudo]))
    const me = session.user.id
    return (data || []).map(t => ({
      ...t,
      mine: t.from_user === me,
      other: names[t.from_user === me ? t.to_user : t.from_user] || '?',
    }))
  },
  accept: id => supabase.rpc('accept_trade', { trade_id: id }).then(r => { if (r.error) throw r.error; return r.data }),
  decline: id => supabase.rpc('decline_trade', { trade_id: id }).then(r => { if (r.error) throw r.error; return r.data }),
  cancel: id => supabase.rpc('cancel_trade', { trade_id: id }).then(r => { if (r.error) throw r.error; return r.data }),
  // nouvelles propositions reçues en direct (si le temps réel est activé)
  watch(onChange) {
    const ch = supabase.channel('trades-' + session.user.id)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trades', filter: `to_user=eq.${session.user.id}` }, onChange)
      .subscribe()
    return () => supabase.removeChannel(ch)
  },
}
