// Kraken hors ligne : l'appli se lance même sans réseau (duels contre l'IA, ascension, thèmes).
// Les échanges avec le serveur (comptes, classements, duels en direct) ne passent jamais par le cache.
const CACHE = 'duelia-v4'
const SHELL = ['/', '/manifest.webmanifest', '/favicon.png', '/icon-192.png', '/apple-touch-icon.png', '/mascotte/logo.webp', '/mascotte/victoire.webp', '/mascotte/defaite.webp', '/mascotte/neutre.webp']

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()))
})
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()))
})

self.addEventListener('fetch', (e) => {
  const req = e.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)
  const fonts = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com'
  if (url.origin !== location.origin && !fonts) return
  // Page : le réseau d'abord (pour avoir la dernière version), le cache si hors ligne
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(res => {
      const copy = res.clone(); caches.open(CACHE).then(c => c.put('/', copy)); return res
    }).catch(() => caches.match('/')))
    return
  }
  // Fichiers versionnés, icônes, polices : le cache d'abord
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => {
    if (res.ok || res.type === 'opaque') { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)) }
    return res
  })))
})

// Notifications : affichage, et ouverture de l'appli au bon endroit quand on appuie dessus
self.addEventListener('push', (e) => {
  let d
  try { d = e.data.json() } catch { d = { title: 'Kraken', body: e.data?.text() || '' } }
  e.waitUntil(self.registration.showNotification(d.title || 'Kraken', {
    body: d.body || '', icon: '/icon-192.png', badge: '/icon-192.png', data: { url: d.url || '/' }, tag: d.url || 'duelia',
  }))
})
self.addEventListener('notificationclick', (e) => {
  e.notification.close()
  const url = new URL(e.notification.data?.url || '/', self.location.origin).href
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    const open = list.find(c => c.url.startsWith(self.location.origin))
    if (open) { open.navigate(url).catch(() => {}); return open.focus() }
    return self.clients.openWindow(url)
  }))
})
