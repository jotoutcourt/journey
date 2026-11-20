import { GEN_START, NAMES_BY_GEN } from './pokemon-names.js'
import { GENUS, COLOR } from './pokemon-clues.js'
import { seeded, shuffle } from '../lib/rng.js'

// Thème « Qui est ce Pokémon ? » : on devine le Pokémon à partir d'indices tirés des données
// de PokeAPI (catégorie, génération, couleur). Aucune image n'est affichée.
const ORD = (g) => (g === 1 ? '1re' : `${g}e`)

function buildPokemonQuestions() {
  const questions = []
  NAMES_BY_GEN.forEach((str, g) => {
    const names = str.split('|')
    names.forEach((name, k) => {
      const id = GEN_START[g] + k
      const genus = GENUS[id - 1], color = COLOR[id - 1]
      // Leurres de la même génération, mais d'une autre catégorie, pour qu'une seule réponse colle aux indices.
      const r = seeded('poke:' + id)
      const others = shuffle(names.filter((n, j) => n !== name && GENUS[GEN_START[g] + j - 1] !== genus), r).slice(0, 3)
      const q = `Quel Pokémon de ${ORD(g + 1)} génération est le « ${genus} »${color ? `, de couleur ${color}` : ''} ?`
      questions.push({ q, a: [name, ...others], dex: id })
    })
  })
  return questions
}

export const POKEMON_TOPIC = {
  id: 'pokemon', name: 'Qui est ce Pokémon ?', icon: '🔍', color: '#ef5350', category: 'Jeux vidéo',
  tagline: 'Devine le Pokémon à partir de ses indices, du n° 1 au n° 1025', by: 'Duelia', official: true, followers: 41280,
  questions: buildPokemonQuestions(),
}
