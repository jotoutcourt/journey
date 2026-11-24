// Kraken hors ligne : l'appli se lance même sans réseau (duels contre l'IA, ascension, thèmes).
// Les échanges avec le serveur (comptes, classements, duels en direct) ne passent jamais par le cache.
const CACHE = 'duelia-v165'
// Médias lourds qui ne changent pas d'une version à l'autre (musique, voix, photos) : cache séparé, gardé entre les mises à jour
const MEDIA = 'kraken-media-v1'
const isMedia = (p) => p.startsWith('/musique/') || p.startsWith('/voix/') || p.startsWith('/animaux/')
const SHELL = ['/', '/manifest.webmanifest', '/favicon.png', '/icon-192.png', '/apple-touch-icon.png', '/mascotte/logo.webp', '/splash/kraken-splash.webp', '/mascotte/victoire.webp', '/mascotte/defaite.webp', '/mascotte/neutre.webp', '/mascotte/neutre-anim.webp', '/mascotte/egalite.webp', '/mascotte/combat.webp', '/mascotte/hors-ligne.webp', '/mascotte/notification.webp', '/mascotte/combat-anim.webp', '/mascotte/attente-anim.webp', '/mascotte/pirate.webp', '/mascotte/pirate-anim.webp', '/decor/vs-fond-debut.webp', '/decor/butin-fond.webp', '/decor/accueil-fond.webp', '/decor/pancarte.webp', '/decor/bouteille.webp', '/decor/tentacule-anim.webp', '/decor/tentacule-anim-d.webp', '/decor/tentacules.webp']

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()))
})
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE && k !== MEDIA).map(k => caches.delete(k)))).then(() => self.clients.claim()))
})

self.addEventListener('fetch', (e) => {
  const req = e.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)
  const fonts = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com'
  if (url.origin !== location.origin && !fonts) return
  // Vérification de mise à jour : toujours le réseau, jamais le cache
  if (url.searchParams.has('fresh')) return
  // Vidéos : lues par morceaux (Range), on laisse le navigateur faire (la musique, elle, est téléchargée en entier puis gardée en cache)
  if (url.pathname.endsWith('.mp4')) return
  // Médias : le cache d'abord (lecture par morceaux laissée au navigateur)
  if (isMedia(url.pathname)) {
    if (req.headers.has('range')) return
    e.respondWith(caches.open(MEDIA).then(c => c.match(req).then(hit => hit || fetch(req).then(res => { if (res.ok) c.put(req, res.clone()); return res }))))
    return
  }
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
  // pastille sur l'icône de l'appli (nombre de choses qui attendent le joueur)
  const badge = Number.isInteger(d.badge) && self.navigator.setAppBadge
    ? (d.badge ? self.navigator.setAppBadge(d.badge) : self.navigator.clearAppBadge()).catch(() => {}) : Promise.resolve()
  e.waitUntil(badge.then(() => self.registration.showNotification(d.title || 'Kraken', {
    body: d.body || '', icon: '/icon-192.png', badge: '/icon-192.png', data: { url: d.url || '/' }, tag: d.url || 'duelia',
  })))
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
