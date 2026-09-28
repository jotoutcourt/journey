import { CARDS } from '../data/cards.js'

// Trois boosters au choix, comme en boutique : seule l'illustration change.
export const PACK_COVERS = ['dark-vador', 'daenerys-targaryen', 'la-delorean']
  .map(id => CARDS.find(c => c.id === id))
  .filter(Boolean)
