// Notifications « Tes boosters sont prêts ! » (Web Push).
// L'appareil s'abonne auprès de son navigateur, puis donne à Supabase
// l'heure à laquelle sa réserve de boosters sera pleine ; une fonction en
// ligne (supabase/functions/push-boosters) envoie la notification à l'heure.
// Sur iPhone, ça ne marche que dans l'appli installée sur l'écran d'accueil.
import { useSyncExternalStore } from 'react'
import { supabase } from './cloud.js'

// Clé publique VAPID (la clé privée n'est que dans les secrets Supabase)
const VAPID_PUBLIC = 'BPkSjZeC7NKjC--P47MOPX4KjnqPV147ysdTDVhShOMuVwGlPBu_C2Tinnz_L4hUKP89qe9yV3tBWnVGGZrDrNU'
const FLAG = 'popcard:push'

const hasApi = typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
const standalone = typeof window !== 'undefined' &&
  (window.matchMedia?.('(display-mode: standalone)').matches || navigator.standalone === true)
const ios = typeof navigator !== 'undefined' && /iPhone|iPad|iPod/.test(navigator.userAgent)

// 'ok' | 'install' (iPhone : installer l'appli d'abord) | 'unsupported'
export const pushSupport = !supabase ? 'unsupported'
  : hasApi ? 'ok'
    : ios && !standalone ? 'install' : 'unsupported'

const readFlag = () => { try { return localStorage.getItem(FLAG) === '1' } catch { return false } }
let enabled = pushSupport === 'ok' && readFlag() && Notification.permission === 'granted'
const listeners = new Set()
const setEnabled = v => {
  enabled = v
  try { localStorage.setItem(FLAG, v ? '1' : '0') } catch { /* ignore */ }
  listeners.forEach(fn => fn())
}
export const usePushEnabled = () => useSyncExternalStore(fn => { listeners.add(fn); return () => listeners.delete(fn) }, () => enabled)

const toBytes = b64 => {
  const s = atob((b64 + '='.repeat((4 - (b64.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/'))
  return Uint8Array.from(s, c => c.charCodeAt(0))
}
const iso = t => (t ? new Date(t).toISOString() : null)
const rpc = async (name, args) => {
  const { error } = await supabase.rpc(name, args)
  if (error) throw error
}

async function currentSub() {
  const reg = await navigator.serviceWorker.ready
  return reg.pushManager.getSubscription()
}

// À appeler depuis un appui (le navigateur demande la permission)
export async function enablePush(fullAt) {
  const perm = await Notification.requestPermission()
  if (perm !== 'granted') throw new Error('refusé')
  const reg = await navigator.serviceWorker.ready
  const sub = (await reg.pushManager.getSubscription()) ||
    await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: toBytes(VAPID_PUBLIC) })
  await rpc('save_push', { p_sub: sub.toJSON(), p_full_at: iso(fullAt) })
  setEnabled(true)
}

export async function disablePush() {
  setEnabled(false)
  const sub = await currentSub().catch(() => null)
  if (!sub) return
  await rpc('delete_push', { p_endpoint: sub.endpoint }).catch(() => {})
  await sub.unsubscribe().catch(() => {})
}

// Heure de réserve pleine : null si elle l'est déjà
let lastSent
export async function updatePushDue(fullAt) {
  if (!enabled) return
  const at = iso(fullAt)
  if (at === lastSent) return
  lastSent = at
  try {
    const sub = await currentSub()
    // abonnement renvoyé en entier : recréé s'il avait été oublié
    if (sub) await rpc('save_push', { p_sub: sub.toJSON(), p_full_at: at })
  } catch {
    lastSent = undefined  // réessai au prochain changement
  }
}
