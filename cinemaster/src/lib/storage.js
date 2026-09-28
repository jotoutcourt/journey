// Sauvegarde locale de la collection (navigateur).
import { migrateId, UNIVERSES } from '../data/cards.js'

// clé historique conservée : renommer ferait perdre les collections existantes
const KEY = 'cinemaster:v1'

export const MAX_BOOSTERS = 6
export const REGEN_MS = 2 * 60 * 60 * 1000 // un booster toutes les 2 h
export const BOOSTER_DUST_COST = 20

export const initialState = () => ({
  owned: {},            // { [cardId]: nombre d'exemplaires }
  boosters: MAX_BOOSTERS,
  regenAt: Date.now(),  // début du cycle de recharge en cours
  dust: 0,              // « pellicules », obtenues en recyclant les doublons
  opened: 0,
  universes: null,      // univers choisis (null : pas encore choisis)
})

// Remet d'aplomb une sauvegarde (navigateur ou en ligne) : anciens
// identifiants de cartes, soldes négatifs laissés par d'anciennes versions.
export function normalize(saved) {
  const owned = {}
  for (const [id, n] of Object.entries(saved?.owned || {})) {
    const key = migrateId(id)
    if (n > 0) owned[key] = (owned[key] || 0) + n
  }
  const boosters = Math.max(0, Math.min(MAX_BOOSTERS, Number(saved?.boosters) || 0))
  const dust = Math.max(0, Number(saved?.dust) || 0)
  const universes = Array.isArray(saved?.universes)
    ? [...new Set(saved.universes.filter(u => UNIVERSES[u]))]
    : null
  return { ...initialState(), ...saved, owned, boosters, dust, universes: universes?.length ? universes : null }
}

export function load() {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return normalize(JSON.parse(raw))
  } catch { /* stockage indisponible : on repart de zéro */ }
  return initialState()
}

export function save(state) {
  try { localStorage.setItem(KEY, JSON.stringify(state)) } catch { /* ignore */ }
}

// Ajoute les boosters rechargés depuis `regenAt`.
export function regen(state, now = Date.now()) {
  if (state.boosters >= MAX_BOOSTERS) return { ...state, regenAt: now }
  const gained = Math.floor((now - state.regenAt) / REGEN_MS)
  if (gained <= 0) return state
  const boosters = Math.min(MAX_BOOSTERS, state.boosters + gained)
  return {
    ...state,
    boosters,
    regenAt: boosters >= MAX_BOOSTERS ? now : state.regenAt + gained * REGEN_MS,
  }
}
