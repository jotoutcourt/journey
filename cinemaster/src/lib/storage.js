// Sauvegarde locale de la collection (navigateur).
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
})

export function load() {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return { ...initialState(), ...JSON.parse(raw) }
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
