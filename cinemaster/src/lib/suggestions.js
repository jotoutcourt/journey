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
  propose: (title, kind) => call('propose_suggestion', { p_title: title, p_kind: kind }),
  toggleVote: id => call('toggle_vote', { p_id: id }),
  setStatus: (id, status) => call('set_suggestion_status', { p_id: id, p_status: status }),
  remove: id => call('delete_suggestion', { p_id: id }),
  isAdmin: async () => (await supabase.rpc('is_admin')).data === true,
}

// Titre simplifié (même règle que le serveur) : repérer les doublons
export const titleKey = t => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
