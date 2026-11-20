// Réveil quotidien (tâche planifiée Vercel) : une petite requête à la base pour que
// Supabase (offre gratuite) ne mette pas le projet en pause après 7 jours sans activité.
// mêmes valeurs publiques que src/lib/server.js
const SUPABASE_URL = 'https://smghiqolqdviyxxisdie.supabase.co'
const PUBLIC_KEY = 'sb_publishable_7MZtPO9jkhzhLVYSFaKLFA_dqK3drPi'

export default async function handler(req, res) {
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_link_results`, {
      method: 'POST',
      headers: { apikey: PUBLIC_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ p_ids: ['keepalive'] }),
    })
    res.status(r.ok ? 200 : 502).json({ ok: r.ok, at: new Date().toISOString() })
  } catch {
    res.status(502).json({ ok: false })
  }
}
