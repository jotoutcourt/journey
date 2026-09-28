import { CARDS, UNIVERSES } from '../data/cards.js'

// Un booster à thème par univers : chaque booster contient au moins une
// carte de sa série (voir openBooster). La carte de couverture sert
// d'illustration tant qu'aucune image de booster n'a été ajoutée ; par
// défaut, le premier personnage principal de la série.
const COVER_OVERRIDES = {
  friends: 'le-cafe-central-perk',
  titanic: 'a-la-proue-je-vole-jack',
}

const byId = id => CARDS.find(c => c.id === id)
// personnage principal : un Rare de base (pas une version Full Art / Gold)
const RANK = { rare: 0, holo: 1, ultra: 2 }
const firstChar = u => CARDS
  .filter(c => c.u === u && c.type === 'CHAR' && !/-(full|gold)$/.test(c.id))
  .sort((a, b) => (RANK[a.rarity] ?? 9) - (RANK[b.rarity] ?? 9))[0] || CARDS.find(c => c.u === u)

const PACKS = Object.fromEntries(Object.keys(UNIVERSES).map(u => [u, byId(COVER_OVERRIDES[u]) || firstChar(u)]))

export const packFor = u => PACKS[u]

// Tous les boosters (Atelier : images de booster de chaque série)
export const PACK_COVERS = Object.values(PACKS).filter(Boolean)
