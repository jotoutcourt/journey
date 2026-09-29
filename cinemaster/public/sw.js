// PopCard : fonctionnement hors connexion.
// - pages : réseau d'abord (toujours la dernière version), sinon la copie en cache ;
// - fichiers de l'appli (/assets, noms uniques à chaque version) : cache d'abord ;
// - polices Google et images (dont celles des cartes en ligne) : servies du
//   cache, mises à jour en arrière-plan.
const VERSION = 'popcard-v3'
const SHELL = ['/', '/manifest.webmanifest', '/icons/icon-192.png', '/icons/icon-512.png', '/favicon.svg']

self.addEventListener('install', event => {
  event.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()))
})

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

const put = async (req, res) => {
  if (res && (res.ok || res.type === 'opaque')) {
    const cache = await caches.open(VERSION)
    await cache.put(req, res.clone())
  }
  return res
}

self.addEventListener('fetch', event => {
  const req = event.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)

  // navigation : réseau d'abord, repli sur la dernière page connue
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then(res => put('/', res))
        .catch(() => caches.match('/').then(r => r || Response.error())),
    )
    return
  }

  const sameOrigin = url.origin === self.location.origin
  const fonts = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com'
  // images des cartes déposées en ligne (Supabase) : gardées pour le hors-ligne
  const cardImages = url.hostname.endsWith('.supabase.co') && url.pathname.includes('/storage/v1/object/public/')

  // fichiers versionnés de l'appli : ils ne changent jamais
  if (sameOrigin && url.pathname.startsWith('/assets/')) {
    event.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => put(req, res))))
    return
  }

  // polices, icônes, images : cache immédiat + mise à jour discrète
  if (fonts || cardImages || (sameOrigin && /\.(png|jpe?g|webp|svg|webmanifest)$/.test(url.pathname))) {
    event.respondWith(
      caches.match(req).then(hit => {
        const fresh = fetch(req).then(res => put(req, res)).catch(() => hit)
        return hit || fresh
      }),
    )
  }
})

// Notifications (« Tes boosters sont prêts ! »), envoyées par Supabase
self.addEventListener('push', event => {
  let msg = {}
  try { msg = event.data ? event.data.json() : {} } catch { msg = { body: event.data?.text() } }
  event.waitUntil(self.registration.showNotification(msg.title || 'PopCard', {
    body: msg.body || '',
    tag: msg.tag || 'popcard',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    data: { url: msg.url || '/' },
  }))
})

// Toucher la notification : ramène l'appli au premier plan (ou l'ouvre)
self.addEventListener('notificationclick', event => {
  event.notification.close()
  const url = event.notification.data?.url || '/'
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      const open = list.find(c => new URL(c.url).origin === self.location.origin)
      return open ? open.focus() : self.clients.openWindow(url)
    }),
  )
})
