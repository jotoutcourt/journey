// Boutique de thèmes : mêmes règles que le serveur (topic_price), qui reste seul juge des achats.
export const FREE_TOPICS = ['culture-g', 'histoire', 'capitales', 'cinema', 'musique']

export const priceOf = (id) => (FREE_TOPICS.includes(id) ? 0 : id === 'pokemon' || id.startsWith('c-') ? 60 : 40)

// Seuls les thèmes officiels se débloquent ; les créations et thèmes partagés restent gratuits
export const isLockable = (t) => !!t && (t.official || t.id === 'pokemon') && !t.own && priceOf(t.id) > 0
