// Propositions de prochains univers (films / séries) et votes des joueurs.
// Tout passe par des fonctions du serveur (supabase/suggestions.sql).
import { supabase } from './cloud.js'

const call = async (fn, args) => {
  const { data, error } = await supabase.rpc(fn, args)
  if (error) throw error
  return data
}

export const suggestions = {
  available: !!supabase,
  list: () => call('list_suggestions'),
  // `pick` : fiche IMDb choisie ({ imdb, year, poster }) ou rien (titre libre)
  propose: (title, kind, pick) => call('propose_suggestion', {
    p_title: title, p_kind: kind, p_imdb: pick?.imdb ?? null, p_year: pick?.year ?? null, p_poster: pick?.poster ?? null,
  }),
  toggleVote: id => call('toggle_vote', { p_id: id }),
  setStatus: (id, status) => call('set_suggestion_status', { p_id: id, p_status: status }),
  remove: id => call('delete_suggestion', { p_id: id }),
  isAdmin: async () => (await supabase.rpc('is_admin')).data === true,
}

// Titre simplifié (même règle que le serveur) : repérer les doublons
export const titleKey = t => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

// ─── Recherche IMDb ───────────────────────────────────────────────────────
// Suggestions publiques d'IMDb (celles de sa barre de recherche) : films et
// séries seulement. Si IMDb ne répond pas, on garde la saisie libre.
const KINDS = {
  movie: 'Film', tvMovie: 'Film', feature: 'Film', 'TV movie': 'Film',
  tvSeries: 'Série', tvMiniSeries: 'Série', 'TV series': 'Série', 'TV mini-series': 'Série',
}
// petite affiche (96 px de large) au lieu de l'image pleine taille
const smallPoster = url => (/^https:\/\/m\.media-amazon\.com\//.test(url)
  ? url.replace(/\._V1_.*\.jpg$/, '._V1_QL75_UX96_.jpg')
  : null)

export async function searchImdb(query, signal) {
  const q = query.trim().toLowerCase()
  const res = await fetch(`https://v3.sg.media-imdb.com/suggestion/x/${encodeURIComponent(q)}.json`, { signal })
  if (!res.ok) throw new Error('imdb ' + res.status)
  const data = await res.json()
  return (data.d || [])
    .filter(r => /^tt\d+$/.test(r.id) && KINDS[r.qid || r.q])
    .slice(0, 6)
    .map(r => ({
      imdb: r.id,
      title: r.l,
      year: r.yr || (r.y ? String(r.y) : ''),
      kind: KINDS[r.qid || r.q],
      poster: r.i?.imageUrl ? smallPoster(r.i.imageUrl) : null,
      cast: r.s || '',
    }))
}

export const imdbUrl = id => `https://www.imdb.com/title/${id}/`
