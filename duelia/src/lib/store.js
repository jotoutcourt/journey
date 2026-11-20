// État du joueur, sauvegardé dans le navigateur.
const KEY = 'duelia:v1'

export const emptyState = () => ({
  profile: null,          // { id, name, avatar, country, createdAt }
  xp: 0,
  topicStats: {},          // id -> { xp, played, wins, seen: [] }
  follows: [],
  custom: [],              // thèmes créés ou importés
  history: [],             // dernières parties
  settings: { sound: true },
})

export function loadState() {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return { ...emptyState(), ...JSON.parse(raw) }
  } catch { /* stockage indisponible */ }
  return emptyState()
}

export function saveState(state) {
  try { localStorage.setItem(KEY, JSON.stringify(state)) } catch { /* ignore */ }
}

// Partage d'un thème par lien : le thème est encodé dans l'URL (#t=...).
export function encodeTopic(topic) {
  const { id, name, icon, color, category, tagline, by, questions, ladder } = topic
  const json = JSON.stringify({ id, name, icon, color, category, tagline, by, ladder, questions: questions.map(q => [q.q, ...q.a]) })
  const bytes = new TextEncoder().encode(json)
  let bin = ''
  bytes.forEach(b => { bin += String.fromCharCode(b) })
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function decodeTopic(code) {
  try {
    const b64 = code.replace(/-/g, '+').replace(/_/g, '/')
    const bin = atob(b64)
    const bytes = Uint8Array.from(bin, c => c.charCodeAt(0))
    const t = JSON.parse(new TextDecoder().decode(bytes))
    if (!t.name || !Array.isArray(t.questions) || t.questions.length < 4) return null
    const questions = t.questions
      .filter(q => Array.isArray(q) && q.length === 5 && q.every(s => typeof s === 'string' && s.trim()))
      .map(([q, ...a]) => ({ q: q.slice(0, 200), a: a.map(s => s.slice(0, 80)) }))
    if (questions.length < 4) return null
    return {
      id: String(t.id || 'u-' + Date.now()).slice(0, 40),
      name: String(t.name).slice(0, 40),
      icon: String(t.icon || '❓').slice(0, 8),
      color: /^#[0-9a-f]{6}$/i.test(t.color) ? t.color : '#7c5cff',
      category: String(t.category || 'Culture').slice(0, 30),
      tagline: String(t.tagline || '').slice(0, 80),
      by: String(t.by || 'Anonyme').slice(0, 24),
      questions, community: true, imported: true,
      ...(Array.isArray(t.ladder) && t.ladder.length === 8 && t.ladder.every(x => typeof x === 'string' && x.trim())
        ? { ladder: t.ladder.map(x => x.slice(0, 32)) } : {}),
    }
  } catch {
    return null
  }
}
