// Envoi des notifications (Web Push). Appelée uniquement par la base de données, avec un secret partagé.
// Les clés VAPID et le secret sont dans les variables d'environnement Vercel, jamais dans le code.
import webpush from 'web-push'

const SUPABASE_URL = 'https://smghiqolqdviyxxisdie.supabase.co'
const PUBLIC_KEY = 'sb_publishable_7MZtPO9jkhzhLVYSFaKLFA_dqK3drPi'

export default async function handler(req, res) {
  const secret = process.env.PUSH_SECRET
  if (req.method !== 'POST' || !secret || req.headers['x-push-secret'] !== secret) return res.status(403).json({ ok: false })
  const { subscriptions = [], title, body, url } = req.body || {}
  webpush.setVapidDetails('https://duelia.vercel.app', process.env.VAPID_PUBLIC_KEY, process.env.VAPID_PRIVATE_KEY)
  const payload = JSON.stringify({ title: String(title || 'Duelia').slice(0, 80), body: String(body || '').slice(0, 200), url: String(url || '/').slice(0, 100) })
  const gone = []
  const results = await Promise.all(subscriptions.slice(0, 10).map(async (s) => {
    try { await webpush.sendNotification(s, payload, { TTL: 3600, urgency: 'high' }); return 'ok' } catch (e) {
      if (e.statusCode === 404 || e.statusCode === 410) gone.push(s.endpoint)
      return 'err ' + (e.statusCode || e.message)
    }
  }))
  // abonnements expirés : on prévient la base pour qu'elle les retire
  if (gone.length) {
    await fetch(`${SUPABASE_URL}/rest/v1/rpc/prune_push`, {
      method: 'POST', headers: { apikey: PUBLIC_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ p_secret: secret, p_endpoints: gone }),
    }).catch(() => {})
  }
  res.status(200).json({ ok: true, results })
}
