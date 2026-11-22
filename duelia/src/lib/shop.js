// Boutique de thèmes : mêmes règles que le serveur (topic_price), qui reste seul juge.
// Chaque nouveau joueur choisit 5 thèmes gratuits au départ ; les autres s'achètent avec des lingots.
export const STARTER_COUNT = 5

export const priceOf = (id) => (id.startsWith('c-') ? 60 : 40)

// Seuls les thèmes officiels se débloquent ; les créations et thèmes partagés restent gratuits
export const isLockable = (t) => !!t && t.official && !t.own
