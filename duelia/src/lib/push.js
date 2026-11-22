// Notifications sur le téléphone (Web Push). Sur iPhone, il faut d'abord ajouter Kraken à l'écran d'accueil.
// Clé PUBLIQUE d'envoi (VAPID) : faite pour être dans l'appli ; la clé privée reste chez Vercel.
import { savePushSubscription, deletePushSubscription, testPush } from './account.js'

const VAPID_PUBLIC = 'BO9MJx4LtwvBoDnyivpdVoDv718tlq_kZxZIe8yJfmanyAtsESbG9Bw9-qhz1A-Hl4FXN57eSOyObzeuu1yeZr4'

const toBytes = (b64) => {
  const s = atob((b64 + '='.repeat((4 - (b64.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/'))
  return Uint8Array.from(s, c => c.charCodeAt(0))
}

const standalone = () => window.matchMedia?.('(display-mode: standalone)').matches || navigator.standalone === true
const isIos = () => /iphone|ipad|ipod/i.test(navigator.userAgent)

// 'unsupported' | 'install-first' (iPhone hors écran d'accueil) | 'denied' | 'on' | 'off'
export async function pushStatus() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
    return isIos() && !standalone() ? 'install-first' : 'unsupported'
  }
  if (Notification.permission === 'denied') return 'denied'
  const reg = await navigator.serviceWorker.getRegistration()
  const sub = await reg?.pushManager.getSubscription()
  return sub && Notification.permission === 'granted' ? 'on' : 'off'
}

// À appeler dans un geste du joueur (appui sur un bouton)
export async function enablePush() {
  const perm = await Notification.requestPermission()
  if (perm !== 'granted') return perm === 'denied' ? 'denied' : 'off'
  const reg = (await navigator.serviceWorker.getRegistration()) || (await navigator.serviceWorker.register('/sw.js'))
  await navigator.serviceWorker.ready
  const sub = (await reg.pushManager.getSubscription()) || (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: toBytes(VAPID_PUBLIC) }))
  const j = sub.toJSON()
  // l'inscription côté serveur est retentée : sans elle, le téléphone se croit abonné mais ne reçoit rien
  for (let i = 0; ; i++) {
    try { await savePushSubscription(j.endpoint, j.keys.p256dh, j.keys.auth); break } catch (e) {
      if (i >= 2) throw e
      await new Promise(r => setTimeout(r, 1500 * (i + 1)))
    }
  }
  return 'on'
}

export async function disablePush() {
  const reg = await navigator.serviceWorker.getRegistration()
  const sub = await reg?.pushManager.getSubscription()
  if (sub) { await deletePushSubscription(sub.endpoint).catch(() => {}); await sub.unsubscribe() }
  return 'off'
}

// Abonnement toujours à jour côté serveur (il peut changer, ou l'appareil a changé de compte)
export async function refreshPush() {
  if ((await pushStatus()) !== 'on') return
  const reg = await navigator.serviceWorker.getRegistration()
  const j = (await reg.pushManager.getSubscription()).toJSON()
  await savePushSubscription(j.endpoint, j.keys.p256dh, j.keys.auth)
}

// Envoie une notification de test sur ses appareils : nombre d'appareils inscrits, -1 si trop tôt
export const sendTestPush = () => testPush()
