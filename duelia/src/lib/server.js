// Accès au serveur Supabase du jeu.
// La clé ci-dessous est la clé PUBLIQUE (« publishable ») du projet : elle est faite pour être dans le site.
// Elle ne donne accès qu'aux deux fonctions autorisées (voir supabase/link_results.sql).
export const SUPABASE_URL = 'https://smghiqolqdviyxxisdie.supabase.co'
const PUBLIC_KEY = 'sb_publishable_7MZtPO9jkhzhLVYSFaKLFA_dqK3drPi'

async function rpc(fn, args, timeoutMs = 8000) {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
      method: 'POST',
      headers: { apikey: PUBLIC_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify(args),
      signal: ctrl.signal,
    })
    if (!res.ok) throw new Error(`serveur ${res.status}`)
    const text = await res.text()
    return text ? JSON.parse(text) : null
  } finally {
    clearTimeout(timer)
  }
}

// L'ami envoie ses réponses à un défi reçu par lien
export function submitLinkResult(challengeId, from, answers) {
  return rpc('submit_link_result', {
    p_challenge: challengeId, p_name: from.name, p_avatar: from.avatar, p_flag: from.flag || '🏳️',
    p_answers: answers.map(a => [a.choice, Math.round(a.t)]),
  })
}

// Le challenger récupère les résultats de ses défis par lien
export async function fetchLinkResults(challengeIds) {
  if (!challengeIds.length) return []
  const rows = await rpc('get_link_results', { p_ids: challengeIds.slice(0, 50) })
  return Array.isArray(rows) ? rows : []
}
