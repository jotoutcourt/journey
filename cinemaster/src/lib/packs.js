import { CARDS } from '../data/cards.js'

// Boosters au choix, chacun à thème : chaque booster contient au moins une
// carte de sa série (voir openBooster). La carte de couverture sert
// d'illustration tant qu'aucune image de booster n'a été ajoutée.
export const PACK_COVERS = ['le-cafe-central-perk', 'clarke-griffin', 'a-la-proue-je-vole-jack']
  .map(id => CARDS.find(c => c.id === id))
  .filter(Boolean)
