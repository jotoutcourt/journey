import { GEN_START, NAMES_BY_GEN } from './pokemon-names.js'
import { seeded, shuffle } from '../lib/rng.js'

// Thème « Qui est ce Pokémon ? » : une question par Pokémon, images servies par PokeAPI.
export const pokemonImage = (id) =>
  `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`

function buildPokemonQuestions() {
  const questions = []
  NAMES_BY_GEN.forEach((str, g) => {
    const names = str.split('|')
    names.forEach((name, k) => {
      const id = GEN_START[g] + k
      // Leurres tirés de la même génération : les réponses se ressemblent davantage.
      const r = seeded('poke:' + id)
      const others = shuffle(names.filter(n => n !== name), r).slice(0, 3)
      questions.push({ q: 'Qui est ce Pokémon ?', a: [name, ...others], img: pokemonImage(id), dex: id })
    })
  })
  return questions
}

export const POKEMON_TOPIC = {
  id: 'pokemon', name: 'Qui est ce Pokémon ?', icon: '🔍', color: '#ef5350', category: 'Jeux vidéo',
  tagline: 'Devine le Pokémon à partir de sa silhouette, du n° 1 au n° 1025', by: 'Duelia', official: true, followers: 41280,
  questions: buildPokemonQuestions(),
}
