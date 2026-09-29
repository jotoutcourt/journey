// Booster vedette du week-end : chaque semaine, un des univers du joueur
// (à tour de rôle) est mis en avant le samedi et le dimanche, avec plus de chances d'avoir
// une Holo (et mieux) dans l'emplacement rare.

// Emplacement rare d'un booster vedette (au lieu de 62 / 25 / 10 / 3)
export const FEATURED_RARE_SLOT = { rare: 40, holo: 40, ultra: 15, secrete: 5 }

// Samedi du week-end en cours, ou du prochain
function saturday(now) {
  const d = new Date(now)
  const day = d.getDay()                        // 0 = dimanche, 6 = samedi
  const shift = day === 0 ? -1 : 6 - day
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + shift)
}

export function featuredFor(universes, now = Date.now()) {
  if (!universes?.length) return null
  const sat = saturday(now)
  // numéro de semaine : chaque week-end, l'univers suivant (ordre alphabétique
  // des clés, pour ne pas dépendre de l'ordre dans lequel ils ont été choisis)
  const week = Math.floor(Math.round(sat.getTime() / 86400000) / 7)
  const list = [...universes].sort()
  const u = list[week % list.length]
  const day = new Date(now).getDay()
  const active = day === 6 || day === 0
  const end = new Date(sat.getFullYear(), sat.getMonth(), sat.getDate() + 2).getTime()
  return { u, active, start: sat.getTime(), end }
}
