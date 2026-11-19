// Culto : fonctionne hors connexion.
// - pages : réseau d'abord, sinon la dernière copie ;
// - fichiers de l'appli (/assets, noms uniques par version) : cache d'abord ;
// - polices et icônes : cache, mis à jour en arrière-plan.
const VERSION = 'culto-v1'
const SHELL = ['/', '/manifest.webmanifest', '/icons/icon-192.png', '/favicon.svg']

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()))
})
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()))
})

const put = async (req, res) => {
  if (res && (res.ok || res.type === 'opaque')) (await caches.open(VERSION)).put(req, res.clone())
  return res
}

self.addEventListener('fetch', e => {
  const req = e.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(res => put('/', res)).catch(() => caches.match('/').then(r => r || Response.error())))
    return
  }
  const same = url.origin === self.location.origin
  if (same && url.pathname.startsWith('/assets/')) {
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => put(req, res))))
    return
  }
  const fonts = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com'
  if (fonts || (same && /\.(png|svg|webmanifest)$/.test(url.pathname))) {
    e.respondWith(caches.match(req).then(hit => {
      const fresh = fetch(req).then(res => put(req, res)).catch(() => hit)
      return hit || fresh
    }))
  }
})
