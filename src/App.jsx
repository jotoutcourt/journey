import { useState, useEffect, useMemo } from 'react'
import { useT, useLocale, useTField } from './i18n/index.jsx'

// ── Buy Me a Coffee — update VITE_BMAC_URL in .env to activate ──────────────
const BMAC_URL = import.meta.env.VITE_BMAC_URL || 'https://buymeacoffee.com/jordanjoin'

function BmacButton({ size = 'normal' }) {
  if (!BMAC_URL) return null
  return (
    <a
      href={BMAC_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={`bmac-btn${size === 'small' ? ' bmac-btn--small' : ''}`}
    >
      ☕ Buy me a coffee
    </a>
  )
}
import BugReport from './BugReport.jsx'
import PokemonDetail from './PokemonDetail.jsx'
import { ConsoleScreen } from './ConsoleScreen.jsx'
import { GBACart } from './GBACart.jsx'
import { OnboardingScreen } from './OnboardingScreen.jsx'
import { ZONES, CHAPTERS } from './data/firered.js'
import {
  ZONES as HG_ZONES,
  CHAPTERS as HG_CHAPTERS,
  JOHTO_BADGES,
  JOHTO_LEGENDARIES,
  JOHTO_STARTER_BEAST_MAP,
  JOHTO_BEAST_IDS,
} from './data/heartgold.js'
import {
  ZONES as OR_ZONES,
  CHAPTERS as OR_CHAPTERS,
  HOENN_BADGES,
  HOENN_LEGENDARIES,
  HOENN_MEGAS,
} from './data/omegaruby.js'
import KantoMap from './KantoMap.jsx'
import CaptureCalcWidget from './CaptureCalcWidget.jsx'
import GuideWidget from './GuideWidget.jsx'
import WhichPokemon from './WhichPokemon.jsx'
import TrophyWidget from './TrophyWidget.jsx'
import SoftResetWidget from './SoftResetWidget.jsx'
import MovesWidget from './MovesWidget.jsx'

// ─── DONNÉES ──────────────────────────────────────────────────────────────────

// ── Exclusivités de version ───────────────────────────────────────────────────

// Pokémon Kanto (1-150) exclusifs à Rouge Feu (pas attrapables en Vert Feuille)
const FR_ONLY_KANTO = new Set([23,24,43,44,45,54,55,58,59,90,91,123,125])
// Pokémon Kanto (1-150) exclusifs à Vert Feuille
const LG_ONLY_KANTO = new Set([27,28,37,38,69,70,71,79,80,120,121,126,127])

// Extras Gen 2 exclusifs à Rouge Feu
const FR_ONLY_EXTRA = [182,194,195,198,211,212,225,227,239]
// Extras Gen 2 exclusifs à Vert Feuille
const LG_ONLY_EXTRA = [183,184,199,200,215,223,224,226,240,298]
// Extras Gen 2 disponibles dans les deux versions
const SHARED_EXTRA  = [
  161,162,165,166,167,168,169,
  172,173,174,175,176,177,178,
  186,187,188,189,193,201,202,
  206,208,214,218,219,220,221,
  230,231,232,233,236,237,238,242,
  243,244,245,246,247,248,249,250,
  360,386,
]

// Pokémon absents des deux versions (Gen 3+ hors FR/LG, légendaires d'autres régions…)
const BASE_UNAVAILABLE = [
  151,
  152,153,154,155,156,157,158,159,160,
  163,164,170,171,179,180,181,185,
  190,191,192,196,197,203,204,205,207,209,210,
  213,216,217,222,228,229,234,235,241,251,
  252,253,254,255,256,257,258,259,260,
  261,262,263,264,265,266,267,268,269,270,
  271,272,273,274,275,276,277,278,279,280,
  281,282,283,284,285,286,287,288,289,290,
  291,292,293,294,295,296,297,299,300,
  301,302,303,304,305,306,307,308,309,310,
  311,312,313,314,315,316,317,318,319,320,
  321,322,323,324,325,326,327,328,329,330,
  331,332,333,334,335,336,337,338,339,340,
  341,342,343,344,345,346,347,348,349,350,
  351,352,353,354,355,356,357,358,359,
  361,362,363,364,365,366,367,368,369,370,
  371,372,373,374,375,376,377,378,379,380,
  381,382,383,384,385,
]

const KANTO_BASE = Array.from({ length: 150 }, (_, i) => i + 1)

// Rouge Feu : tout Kanto sauf exclusifs LG + extras partagés + extras FR
const FIRERED_AVAILABLE_IDS = new Set([
  ...KANTO_BASE.filter(id => !LG_ONLY_KANTO.has(id)),
  ...SHARED_EXTRA,
  ...FR_ONLY_EXTRA,
])
const FIRERED_UNAVAILABLE_IDS = new Set([
  ...BASE_UNAVAILABLE,
  ...LG_ONLY_EXTRA,
  ...[...LG_ONLY_KANTO],
])

// Vert Feuille : tout Kanto sauf exclusifs FR + extras partagés + extras LG
const LEAFGREEN_AVAILABLE_IDS = new Set([
  ...KANTO_BASE.filter(id => !FR_ONLY_KANTO.has(id)),
  ...SHARED_EXTRA,
  ...LG_ONLY_EXTRA,
])
const LEAFGREEN_UNAVAILABLE_IDS = new Set([
  ...BASE_UNAVAILABLE,
  ...FR_ONLY_EXTRA,
  ...[...FR_ONLY_KANTO],
])

// ─── LÉGENDAIRES KANTO (FR/LG partagés) ──────────────────────────────────────

const KANTO_LEGENDARIES = [
  {
    id: 144, nameFr: 'Artikodin', types: ['ice','flying'],
    storyReq: 6,
    level: 50, location: 'Îles Écume',
    tip: 'Niveaux inférieurs des Îles Écume — Surf + Force requis. Sauvegardez avant !',
    lore: "Artikodin est l'oiseau légendaire des glaces, gardien mystique du grand hiver. Les légendes de Kanto racontent qu'il apparaît aux voyageurs égarés dans les tempêtes de neige pour leur offrir une mort douce et froide. Sa présence dans le ciel annonce les blizzards les plus violents, et les anciens pêcheurs côtiers construisaient des autels à son effigie pour conjurer les tempêtes hivernales. Ses grandes ailes, d'une blancheur immaculée, peuvent geler l'air ambiant à chacun de leurs battements.",
    anecdotes: ["Son nom japonais フリーザー (Freezer) est directement tiré du mot anglais « freezer ».", "Dans Pokémon Or & Argent, un Artikodin errant parcourt la région de Johto.", "Il est l'un des tout premiers Pokémon légendaires de la saga, créé en 1996 par Ken Sugimori."],
  },
  {
    id: 145, nameFr: 'Électhor', types: ['electric','flying'],
    storyReq: 4,
    level: 50, location: 'Centrale',
    tip: 'Nord-ouest de la Centrale. Optionnel avant la Ligue. Paralysie recommandée.',
    lore: "Électhor habite au cœur des nuages d'orage, se nourrissant de l'énergie brute des éclairs. Ses ailes crépitent en permanence, libérant des décharges qui illuminent les nuits de Kanto. Les anciens croyaient que chaque coup de tonnerre était son cri de guerre, et que plonger dans la mer lui permettait de recharger ses réserves à l'infini. Capturer Électhor, disaient-ils, c'est tenter d'attraper la foudre elle-même — une entreprise insensée vouée à l'échec.",
    anecdotes: ["Son nom vient de « électricité » + le suffixe légendaire de la Gen 1.", "Électhor est le seul des trois oiseaux dont le type lui confère une immunité totale (électrique contre sol).", "Il possède l'une des meilleures statistiques en Attaque Spéciale parmi les légendaires de Gen 1."],
  },
  {
    id: 146, nameFr: 'Sulfura', types: ['fire','flying'],
    storyReq: 8,
    level: 50, location: 'Mont Braise (Île 1)',
    tip: 'Zone secrète du Mont Braise — accessible uniquement en post-game.',
    lore: "Sulfura est le phénix de la mythologie Pokémon — un oiseau de feu immortel dont les blessures guérissent instantanément quand il plonge dans un volcan en éruption. Chaque printemps, sa migration vers le nord laisse des traînées de flammes orangées dans le ciel crépusculaire, que les anciens prenaient pour des présages de renouveau. Les civilisations de Kanto célébraient son retour comme le début de la saison chaude, brûlant des offrandes en son honneur.",
    anecdotes: ["Dans Pokémon Rouge & Bleu originaux, Sulfura se trouvait dans le Manoir Pokémon de Pallet.", "Son design s'inspire directement du phénix, créature mythologique symbole de renaissance.", "Dans l'animé, des chercheurs tentent de le capturer et déclenchent involontairement une catastrophe."],
  },
  {
    id: 150, nameFr: 'Méwtwo', types: ['psychic'],
    storyReq: 8,
    level: 70, location: 'Caverne Azurée',
    tip: 'Post-game uniquement (Pokédex National requis). Master Ball recommandée.',
    lore: "Méwtwo est la création la plus sombre de la science Pokémon — un être né non de la nature, mais de l'obsession humaine pour le pouvoir absolu. Extrait de l'ADN de Mew et manipulé génétiquement par des scientifiques sans scrupules, il naquit tourmenté par son existence artificielle. Son intelligence surpasse celle de tout être vivant, et la haine qu'il nourrit contre les humains qui l'ont créé comme une arme de destruction brûle en lui depuis le premier instant de sa conscience. Aucune Poké Ball standard ne peut espérer le contenir.",
    anecdotes: ["Méwtwo est le personnage central du premier film Pokémon, sorti en 1998.", "Son Pokédex entry décrit des années de manipulations génétiques brutales pour l'arracher à Mew.", "Il possède deux Méga-Évolutions : Méga-Méwtwo X (Psy/Combat) et Méga-Méwtwo Y (Psy).", "Dans Pokémon Go, il fut le premier légendaire disponible lors d'un événement Raid mondial exclusif."],
  },
  {
    id: 243, nameFr: 'Raikou', types: ['electric'],
    storyReq: 8,
    level: 50, location: 'Kanto (errant)',
    tip: "Disponible si starter = Carapuce. Erre dans tout Kanto après le Pokédex National. Très difficile à attraper — utilise l'Arène Ball ou endors-le.",
    lore: "Raikou est l'incarnation de la foudre céleste. Selon la mythologie de Johto, les trois Chiens Sacrés périrent dans l'incendie qui ravagea la Tour Écarlate, et Ho-Oh les ressuscita en leur insufflant les forces primordiales de l'orage, du feu et de l'eau. Raikou court plus vite que l'éclair, laissant des sillons fumants dans les plaines de Kanto. Ceux qui croisent son regard décrivent une vision de tempête pure et absolue qui les hante toute leur vie.",
    anecdotes: ["Son design s'inspire du tigre à dents de sabre, animal préhistorique aujourd'hui disparu.", "Dans Feu Rouge, il n'est disponible que si le starter choisi est Carapuce.", "Raikou, Entei et Suicune sont appelés collectivement les « Bêtes Sacrées » ou « Chiens Légendaires »."],
  },
  {
    id: 244, nameFr: 'Entei', types: ['fire'],
    storyReq: 8,
    level: 50, location: 'Kanto (errant)',
    tip: "Disponible si starter = Bulbizarre. Erre dans tout Kanto après le Pokédex National. Très difficile à attraper — utilise l'Arène Ball ou endors-le.",
    lore: "Entei est la furie des volcans éveillée sous une forme vivante. Les sages de Johto racontent que chaque rugissement d'Entei déclenche quelque part dans le monde une nouvelle éruption volcanique. Né du feu qui réduisit la Tour Écarlate en cendres, il est l'héritier de cette destruction primordiale. Sa fourrure brûle à plus de mille degrés et ses crocs d'acier tranchent la roche comme du beurre. Aucun obstacle ne l'arrête longtemps.",
    anecdotes: ["Dans le film Pokémon 3 : Le Sort des Zarbi, Entei joue un rôle central comme figure paternelle.", "Dans Feu Rouge, il est disponible uniquement si le starter choisi est Bulbizarre.", "Son rugissement peut s'entendre à des centaines de kilomètres selon plusieurs entrées du Pokédex."],
  },
  {
    id: 245, nameFr: 'Suicune', types: ['water'],
    storyReq: 8,
    level: 50, location: 'Kanto (errant)',
    tip: "Disponible si starter = Salamèche. Erre dans tout Kanto après le Pokédex National. Très difficile à attraper — utilise l'Arène Ball ou endors-le.",
    lore: "Suicune est le gardien éternel de la pureté des eaux. Il parcourt le monde du nord au sud, purifiant lacs et rivières empoisonnés. Né de l'eau qui éteignit les flammes de la Tour Écarlate, il porte en lui la mémoire cristalline de cette nuit de renaissance. Les chamanes de Johto disent que Suicune court toujours face au vent du nord — symbole de liberté absolue, de clarté, et du recommencement perpétuel du monde.",
    anecdotes: ["Suicune est le Pokémon vedette de la version Cristal, la première à avoir une mascotte distincte.", "Son design s'inspire du qilin, créature mythologique chinoise symbole de pureté et de bon présage.", "Dans Feu Rouge, il est disponible uniquement si le starter choisi est Salamèche."],
  },
  {
    id: 249, nameFr: 'Lugia', types: ['psychic','flying'],
    storyReq: 8,
    level: 70, location: 'Île Navale (Switch)',
    tip: "⚠️ Réédition Nintendo Switch uniquement. Le Ticket Mystik apparaît automatiquement dans le Sac après la 1ʳᵉ entrée au Panthéon avec au moins un Pokémon sans Ruban Maître. Lugia se trouve dans les profondeurs de l'Île Navale.",
    lore: "Lugia est le maître absolu des océans et des tempêtes. Si puissant qu'un simple battement de ses ailes peut déchaîner un ouragan de quarante jours, il s'est imposé une réclusion volontaire au fond des abysses pour ne pas détruire le monde par inadvertance. Les anciens marins de Kanto l'appelaient « le Pokémon d'Argent » et construisaient des temples entiers sur les côtes rocheuses en signe de dévotion et de peur sacrée.",
    anecdotes: ["Lugia est au centre du film Pokémon 2 : Le Pouvoir est en Toi (1999).", "Il est l'un des rares légendaires à avoir une progéniture dans l'animé (Petit Lugia).", "Accessible dans Feu Rouge uniquement via le Ticket Mystik sur la réédition Nintendo Switch."],
  },
  {
    id: 250, nameFr: 'Ho-Oh', types: ['fire','flying'],
    storyReq: 8,
    level: 70, location: 'Île Navale (Switch)',
    tip: "⚠️ Réédition Nintendo Switch uniquement. Le Ticket Mystik apparaît automatiquement dans le Sac après la 1ʳᵉ entrée au Panthéon avec au moins un Pokémon sans Ruban Maître. Ho-Oh se trouve au sommet de l'Île Navale.",
    lore: "Ho-Oh est le phénix sacré, gardien des cieux et symbole de l'éternité. Selon la légende de Johto, c'est lui qui ressuscita les trois Chiens Sacrés après l'incendie de la Tour Écarlate, leur insufflant vie et forces primordiales. Il est dit que quiconque croise son regard est promis à un bonheur éternel — et c'est précisément ce que vécut Sacha le premier jour de son aventure, croisant Ho-Oh dans le ciel au-dessus de Bourg Palette.",
    anecdotes: ["Ho-Oh est le tout premier Pokémon légendaire apparu dans l'animé, dès l'épisode 1.", "Ses plumes multicolores sont censées posséder le pouvoir de ressusciter les morts.", "Accessible dans Feu Rouge uniquement via le Ticket Mystik sur la réédition Nintendo Switch."],
  },
  {
    id: 386, nameFr: 'Deoxys', types: ['psychic'],
    storyReq: 8,
    level: 30, location: 'Île Naissance (Switch)',
    tip: "⚠️ Réédition Nintendo Switch uniquement. Le Ticket Aurora apparaît automatiquement dans le Sac après la 1ʳᵉ entrée au Panthéon avec au moins un Pokémon sans Ruban Maître. Deoxys se trouve sur l'Île Naissance, accessible depuis Carmoisîle.",
    lore: "Deoxys n'est pas un Pokémon de ce monde. Né dans les confins de l'espace, un virus extraterrestre muté sous l'effet d'un rayon laser cosmique a pris une forme consciente et mouvante. Sa structure ADN est instable par nature — il peut se remodeler en quatre formes distinctes selon ses besoins. Des scientifiques de Kanto tentèrent de l'étudier, mais aucun n'a pu véritablement comprendre ce qu'il est ni d'où il vient.",
    anecdotes: ["Deoxys est le seul Pokémon à posséder quatre formes aux statistiques radicalement différentes.", "Son design s'inspire des organismes extraterrestres et des structures en double hélice de l'ADN.", "Accessible dans Feu Rouge via le Ticket Aurora, sur la réédition Nintendo Switch."],
  },
]

// Starter → bête errante (même logique FR et LG)
const KANTO_STARTER_BEAST_MAP = { 1: 244, 4: 245, 7: 243 }
const KANTO_BEAST_IDS = [243, 244, 245]

const KANTO_BADGES = [
  { id: 1, name: 'Roche',   gym: 'Jadielle',       leader: 'Pierre',    badgeFolder: 'kanto' },
  { id: 2, name: 'Cascade', gym: 'Azuria',         leader: 'Ondine',    badgeFolder: 'kanto' },
  { id: 3, name: 'Foudre',  gym: 'Carmin-sur-Mer', leader: 'Major Bob', badgeFolder: 'kanto' },
  { id: 4, name: 'Prisme',  gym: 'Céladopole',     leader: 'Érika',     badgeFolder: 'kanto' },
  { id: 5, name: 'Âme',     gym: 'Parmanie',       leader: 'Koga',      badgeFolder: 'kanto' },
  { id: 6, name: 'Marais',  gym: 'Parmanie',       leader: 'Morgane',   badgeFolder: 'kanto' },
  { id: 7, name: 'Volcan',  gym: "Cramois'île",    leader: 'Pyrobaba',  badgeFolder: 'kanto' },
  { id: 8, name: 'Terre',   gym: 'Argenta',        leader: 'Giovanni',  badgeFolder: 'kanto' },
]

// ─── CATALOGUE DES JEUX ───────────────────────────────────────────────────────

const games = [
  {
    id: 'firered',
    name: 'Rouge Feu',
    color: '#ff4444',
    emoji: '🔴',
    region: 'Kanto',
    generation: 3,
    badgeFolder: 'kanto',
    gradient: 'linear-gradient(160deg, #200505 0%, #160606 45%, #0d0f1a 100%)',
    availableIds: FIRERED_AVAILABLE_IDS,
    unavailableIds: FIRERED_UNAVAILABLE_IDS,
    badges: KANTO_BADGES,
    legendaries: KANTO_LEGENDARIES,
    starterBeastMap: KANTO_STARTER_BEAST_MAP,
    allBeastIds: KANTO_BEAST_IDS,
    get zones()    { return ZONES    },
    get chapters() { return CHAPTERS },
  },
  {
    id: 'leafgreen',
    name: 'Vert Feuille',
    color: '#22a84a',
    emoji: '🟢',
    region: 'Kanto',
    generation: 3,
    badgeFolder: 'kanto',
    gradient: 'linear-gradient(160deg, #021505 0%, #011006 45%, #0a0f0d 100%)',
    availableIds: LEAFGREEN_AVAILABLE_IDS,
    unavailableIds: LEAFGREEN_UNAVAILABLE_IDS,
    badges: KANTO_BADGES,
    legendaries: KANTO_LEGENDARIES,
    starterBeastMap: KANTO_STARTER_BEAST_MAP,
    allBeastIds: KANTO_BEAST_IDS,
    get zones()    { return ZONES    },
    get chapters() { return CHAPTERS },
  },
  {
    id: 'heartgold',
    name: 'Or HeartGold',
    color: '#c8860a',
    emoji: '🌟',
    region: 'Johto',
    generation: 4,
    defaultDexFilter: 'johto',
    badgeFolder: 'johto',
    gradient: 'linear-gradient(160deg, #1a0f00 0%, #110a00 45%, #0d0f1a 100%)',
    badges: JOHTO_BADGES,
    legendaries: JOHTO_LEGENDARIES.filter(l => !l.version || l.version === 'HG'),
    starterBeastMap: JOHTO_STARTER_BEAST_MAP,
    allBeastIds: JOHTO_BEAST_IDS,
    get zones()    { return HG_ZONES    },
    get chapters() { return HG_CHAPTERS },
  },
  {
    id: 'soulsilver',
    name: 'Argent SoulSilver',
    color: '#7a9ab5',
    emoji: '🌙',
    region: 'Johto',
    generation: 4,
    defaultDexFilter: 'johto',
    badgeFolder: 'johto',
    gradient: 'linear-gradient(160deg, #040d14 0%, #030a10 45%, #0d0f1a 100%)',
    badges: JOHTO_BADGES,
    legendaries: JOHTO_LEGENDARIES.filter(l => !l.version || l.version === 'SS'),
    starterBeastMap: JOHTO_STARTER_BEAST_MAP,
    allBeastIds: JOHTO_BEAST_IDS,
    get zones()    { return HG_ZONES    },
    get chapters() { return HG_CHAPTERS },
  },
  {
    id: 'omegaruby',
    name: 'Rubis Oméga',
    color: '#b01010',
    emoji: '🔴',
    region: 'Hoenn',
    generation: 6,
    defaultDexFilter: 'hoenn',
    badgeFolder: 'hoenn',
    gradient: 'linear-gradient(160deg, #1a0202 0%, #110101 45%, #0d0f1a 100%)',
    badges: HOENN_BADGES,
    legendaries: HOENN_LEGENDARIES.filter(l => !l.version || l.version === 'OR'),
    megas: HOENN_MEGAS,
    starterBeastMap: {},
    allBeastIds: [],
    get zones()    { return OR_ZONES    },
    get chapters() { return OR_CHAPTERS },
  },
  {
    id: 'alphasapphire',
    name: 'Saphir Alpha',
    color: '#1155cc',
    emoji: '💎',
    region: 'Hoenn',
    generation: 6,
    defaultDexFilter: 'hoenn',
    badgeFolder: 'hoenn',
    gradient: 'linear-gradient(160deg, #00091a 0%, #000c18 45%, #0d0f1a 100%)',
    badges: HOENN_BADGES,
    legendaries: HOENN_LEGENDARIES.filter(l => !l.version || l.version === 'AS'),
    megas: HOENN_MEGAS,
    starterBeastMap: {},
    allBeastIds: [],
    get zones()    { return OR_ZONES    },
    get chapters() { return OR_CHAPTERS },
  },
]

// Traduction des 18 types — pas besoin d'API, ils ne changent jamais
const TYPE_FR = {
  normal: 'Normal',   fire: 'Feu',       water: 'Eau',
  electric: 'Électk', grass: 'Plante',   ice: 'Glace',
  fighting: 'Combat', poison: 'Poison',  ground: 'Sol',
  flying: 'Vol',      psychic: 'Psy',    bug: 'Insecte',
  rock: 'Roche',      ghost: 'Spectre',  dragon: 'Dragon',
  dark: 'Ténèbres',   steel: 'Acier',    fairy: 'Fée',
}

const TYPE_COLORS = {
  normal: '#9099A1',   fire: '#FF6C35',    water: '#4D90D5',
  electric: '#F4D23C', grass: '#63BB5B',   ice: '#74CEC0',
  fighting: '#CE4265', poison: '#AB6AC8',  ground: '#D97845',
  flying: '#8FA9DE',   psychic: '#F97176', bug: '#90C12C',
  rock: '#C9BB8A',     ghost: '#5269AD',   dragon: '#0B6DC3',
  dark: '#5A5366',     steel: '#5A8EA2',   fairy: '#EC8FE6',
}

// ─── CHARGEMENT POKÉMON ───────────────────────────────────────────────────────
//
// On cache les données dans localStorage pour ne faire les 302 requêtes
// qu'une seule fois. La prochaine fois, chargement instantané.

const CACHE_KEY = 'pjt-pokemon-v9'

const ALL_IDS = [
  ...Array.from({ length: 150 }, (_, i) => i + 1),
  ...FR_ONLY_EXTRA,
  ...LG_ONLY_EXTRA,
  ...SHARED_EXTRA,
  ...BASE_UNAVAILABLE,
].sort((a, b) => a - b)

async function fetchAllPokemon(onProgress) {
  const cached = localStorage.getItem(CACHE_KEY)
  if (cached) return JSON.parse(cached)

  let count = 0
  const promises = ALL_IDS.map(async (id) => {
    const [pokeRes, speciesRes] = await Promise.all([
      fetch(`https://pokeapi.co/api/v2/pokemon/${id}/`),
      fetch(`https://pokeapi.co/api/v2/pokemon-species/${id}/`),
    ])
    const [poke, species] = await Promise.all([
      pokeRes.json(),
      speciesRes.json(),
    ])

    onProgress(++count)

    const nameFr = species.names.find(n => n.language.name === 'fr')?.name || poke.name
    const nameEn = species.names.find(n => n.language.name === 'en')?.name || poke.name

    return {
      id,
      name: nameEn,
      nameFr,
      types: poke.types.map(t => t.type.name),
      sprite: poke.sprites.other['official-artwork'].front_default
        || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`,
    }
  })

  const data = (await Promise.all(promises)).sort((a, b) => a.id - b.id)
  localStorage.setItem(CACHE_KEY, JSON.stringify(data))
  return data
}

// ─── COMPOSANT : BADGES TYPE ─────────────────────────────────────────────────

function TypeBadges({ types }) {
  const t = useT()
  return (
    <div style={{ display: 'flex', gap: '3px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '4px' }}>
      {types.map(type => (
        <span
          key={type}
          style={{
            background: TYPE_COLORS[type] || '#555',
            color: '#fff',
            fontSize: '0.52rem',
            fontWeight: '700',
            padding: '1px 5px',
            borderRadius: '4px',
            letterSpacing: '0.3px',
            textShadow: '0 1px 2px rgba(0,0,0,0.4)',
          }}
        >
          {t(`type.${type}`) || type}
        </span>
      ))}
    </div>
  )
}

// ─── COMPOSANT : CHARGEMENT ───────────────────────────────────────────────────

function LoadingScreen({ progress }) {
  const t     = useT()
  const total = ALL_IDS.length
  const pct = Math.round((progress / total) * 100)
  return (
    <div style={{ padding: '3rem', textAlign: 'center' }}>
      <p style={{ color: '#666', marginBottom: '1rem', fontSize: '0.9rem' }}>
        {t('loading', { p: progress, t: total })}
      </p>
      <div style={{ background: '#16213e', borderRadius: '999px', height: '6px', maxWidth: '300px', margin: '0 auto' }}>
        <div style={{
          width: `${pct}%`,
          height: '100%',
          background: 'var(--game-color)',
          borderRadius: '999px',
          transition: 'width 0.1s',
        }} />
      </div>
    </div>
  )
}

// ─── COMPOSANT : TEAM BUILDER ────────────────────────────────────────────────

function TeamBuilder({ game, pokemon, loading, loadProgress, onSelectPokemon }) {
  const { locale } = useLocale()
  const storageKey = `team-${game.id}`
  const [team, setTeam] = useState(() => {
    const saved = localStorage.getItem(storageKey)
    return saved ? JSON.parse(saved) : []
  })
  const [search, setSearch] = useState('')

  const saveTeam = (updated) => {
    setTeam(updated)
    localStorage.setItem(storageKey, JSON.stringify(updated))
  }

  const addToTeam = (poke) => {
    if (team.length >= 6 || team.some(p => p.id === poke.id)) return
    saveTeam([...team, poke])
  }

  const removeFromTeam = (id) => saveTeam(team.filter(p => p.id !== id))

  const filtered = pokemon.filter(p =>
    p.nameFr.toLowerCase().includes(search.toLowerCase()) ||
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    String(p.id).includes(search)
  )

  const teamFull = team.length >= 6

  return (
    <div style={{ padding: '1rem', maxWidth: '920px', margin: '0 auto' }}>
      <h2 style={{ color: game.color, textAlign: 'center', marginBottom: '1.25rem', fontSize: '1.15rem' }}>
        Mon équipe — {team.length}/6
      </h2>

      {/* 6 slots — Array.from crée un tableau [undefined × 6] qu'on transforme */}
      <div className="team-slots">
        {Array.from({ length: 6 }, (_, i) => {
          const poke = team[i]
          return (
            <div
              key={i}
              className={`team-slot${poke ? ' filled' : ''}`}
              onClick={() => poke && removeFromTeam(poke.id)}
              title={poke ? `Retirer ${locale !== 'fr' ? poke.name : poke.nameFr}` : 'Slot vide'}
            >
              {poke ? (
                <>
                  <img
                    src={poke.sprite}
                    alt={locale !== 'fr' ? poke.name : poke.nameFr}
                    style={{ width: '62px', height: '62px', objectFit: 'contain' }}
                  />
                  <span style={{ fontSize: '0.6rem', color: game.color, marginTop: '2px' }}>
                    {locale !== 'fr' ? poke.name : poke.nameFr}
                  </span>
                </>
              ) : (
                <span style={{ color: '#2a2e50', fontSize: '1.6rem', fontWeight: 'bold' }}>+</span>
              )}
            </div>
          )
        })}
      </div>

      {teamFull && (
        <p style={{ textAlign: 'center', color: game.color, marginBottom: '1rem', fontSize: '0.82rem', opacity: 0.7 }}>
          Équipe complète ! Clique sur un slot pour retirer un Pokémon.
        </p>
      )}

      {loading ? (
        <LoadingScreen progress={loadProgress} />
      ) : (
        <>
          <input
            className="search-input"
            type="text"
            placeholder="Chercher un Pokémon..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))',
            gap: '0.6rem',
          }}>
            {filtered.map(p => {
              const inTeam = team.some(t => t.id === p.id)
              const disabled = !inTeam && teamFull
              return (
                <div
                  key={p.id}
                  className={`poke-select-card${inTeam ? ' in-team' : disabled ? ' disabled' : ''}`}
                  onClick={() => !inTeam && !disabled && addToTeam(p)}
                  onContextMenu={e => { e.preventDefault(); onSelectPokemon(p.id) }}
                  title={`Clic droit → fiche complète`}
                >
                  <img
                    src={p.sprite}
                    alt={locale !== 'fr' ? p.name : p.nameFr}
                    style={{ width: '60px', height: '60px', objectFit: 'contain' }}
                  />
                  <p style={{ fontSize: '0.55rem', color: '#555' }}>#{String(p.id).padStart(3, '0')}</p>
                  <p style={{
                    fontSize: '0.65rem',
                    color: inTeam ? game.color : '#ccc',
                    fontWeight: inTeam ? '700' : '400',
                    marginBottom: '2px',
                  }}>
                    {locale !== 'fr' ? p.name : p.nameFr}
                  </p>
                  <TypeBadges types={p.types} />
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

// ─── COMPOSANT : BADGES ──────────────────────────────────────────────────────

// Badges locaux (public/badges/) — source : PokeAPI sprites repo
// Kanto: 1-8, Johto: 9-16, Hoenn: 17-24
const BADGE_SPRITE_BASE = {
  firered:       (id) => `/badges/kanto/badge_${id}.png`,
  leafgreen:     (id) => `/badges/kanto/badge_${id}.png`,
  gold:          (id) => `/badges/johto/badge_${id}.png`,
  heartgold:     (id) => `/badges/johto/badge_${id}.png`,
  soulsilver:    (id) => `/badges/johto/badge_${id}.png`,
  sapphire:      (id) => `/badges/hoenn/badge_${id}.png`,
  omegaruby:     (id) => `/badges/hoenn/badge_${id}.png`,
  alphasapphire: (id) => `/badges/hoenn/badge_${id}.png`,
}

function Badges({ game, newBadgeIds = new Set() }) {
  const t = useT()
  const storageKey = `badges-${game.id}`
  const [obtained, setObtained] = useState(() => {
    const saved = localStorage.getItem(storageKey)
    return saved ? JSON.parse(saved) : []
  })

  function toggle(id) {
    const updated = obtained.includes(id)
      ? obtained.filter(b => b !== id)
      : [...obtained, id]
    setObtained(updated)
    localStorage.setItem(storageKey, JSON.stringify(updated))
  }

  const spriteUrl = BADGE_SPRITE_BASE[game.id] || BADGE_SPRITE_BASE.firered
  const count = obtained.length
  const total = game.badges.length
  const complete = count === total

  const half = Math.ceil(total / 2)
  const row1 = game.badges.slice(0, half)
  const row2 = game.badges.slice(half)

  function renderSlot(badge) {
    const got = obtained.includes(badge.id)
    const isNew = newBadgeIds.has(badge.id)
    const slotClass = ['bc-slot', got ? 'bc-slot-filled' : 'bc-slot-empty', isNew ? 'bc-slot-new' : ''].filter(Boolean).join(' ')
    return (
      <button
        key={badge.id}
        className={`bc-slot-wrap ${got ? 'bc-slot-filled-wrap' : 'bc-slot-empty-wrap'}`}
        onClick={() => toggle(badge.id)}
        title={got ? '' : t('badges.get', { name: badge.name })}
      >
        {got && (
          <div className="bc-tooltip">
            <span className="bc-tooltip-name">{badge.name}</span>
            <span className="bc-tooltip-leader">{badge.leader}</span>
          </div>
        )}
        <div className={slotClass}>
          {got && (
            <img
              src={spriteUrl(badge.id)}
              alt={badge.name}
              className="bc-badge-img"
              onError={e => { e.target.style.display = 'none' }}
            />
          )}
        </div>
      </button>
    )
  }

  return (
    <div className="badges-page">
      <div className="badge-case" style={{ '--gc': game.color }}>

        <div className="bc-topbar">
          <span className="bc-label">{t('badges.case')}</span>
          <span className={`bc-count ${complete ? 'bc-count-done' : ''}`}>
            {count} / {total}{complete ? ' ✓' : ''}
          </span>
        </div>

        <div className="bc-interior">
          <div className="bc-row">{row1.map(renderSlot)}</div>

          <div className="bc-divider">
            <svg className="bc-pokeball-icon" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="1.5"/>
              <line x1="1" y1="10" x2="19" y2="10" stroke="currentColor" strokeWidth="1.5"/>
              <circle cx="10" cy="10" r="3" stroke="currentColor" strokeWidth="1.5" fill="#0d0d1a"/>
              <circle cx="10" cy="10" r="1" fill="currentColor"/>
            </svg>
          </div>

          <div className="bc-row">{row2.map(renderSlot)}</div>
        </div>

        <div className="bc-footer">
          <div className="bc-progress-track">
            <div className="bc-progress-fill" style={{ width: `${(count / total) * 100}%` }} />
          </div>
          <span className="bc-gym-hint">{t('badges.hint')}</span>
        </div>

      </div>
    </div>
  )
}

// ─── COMPOSANT : POKÉDEX ─────────────────────────────────────────────────────

const GEN_RANGES = [
  { key: '',      label: 'Tous',   min: 1,   max: 999 },
  { key: 'kanto', label: 'Kanto',  min: 1,   max: 151 },
  { key: 'johto', label: 'Johto',  min: 152, max: 251 },
  { key: 'hoenn', label: 'Hoenn',  min: 252, max: 386 },
]

function PdxUncaughtPopup({ pokemon, game, onViewFiche, onMarkCaught, onClose }) {
  const t = useT()
  const [view, setView] = useState('main')

  const locations = useMemo(() => {
    const gv = game.id === 'firered' ? 'RF' : game.id === 'leafgreen' ? 'VF' : null
    const vf = pk => !pk.version || !gv || pk.version === gv
    return (game.zones ?? ZONES).flatMap(z => {
      const matchingEncs = (z.encounters || []).filter(enc =>
        (enc.pokemon || []).some(pk => pk.id === pokemon.id && vf(pk))
      )
      return matchingEncs.length > 0
        ? [{ zone: z.name, methods: matchingEncs.map(e => e.method) }]
        : []
    })
  }, [pokemon.id, game.id])

  const isUnavailable = game.unavailableIds?.has(pokemon.id)

  return (
    <div className="pdx-popup-backdrop" onClick={onClose}>
      <div className="pdx-popup" onClick={e => e.stopPropagation()}>
        <button className="pdx-popup-close" onClick={onClose}>✕</button>

        {view === 'main' && (
          <>
            <div className="pdx-popup-hero">
              <div className="pdx-popup-sprite-wrap">
                <img src={pokemon.sprite} alt="?" className="pdx-popup-sprite" />
              </div>
              <div className="pdx-popup-hero-info">
                <span className="pdx-popup-num">#{String(pokemon.id).padStart(3, '0')}</span>
                <span className="pdx-popup-pname">???</span>
              </div>
            </div>
            <p className="pdx-popup-msg">{t('pdx.popup_msg')}</p>
            <div className="pdx-popup-btns">
              <button className="pdx-popup-btn" onClick={onViewFiche}>
                {t('pdx.popup_view')}
              </button>
              <button className="pdx-popup-btn" onClick={() => setView('how')}>
                {t('pdx.popup_how')}
              </button>
              <button className="pdx-popup-btn pdx-popup-btn--catch" onClick={() => { onMarkCaught(); onClose() }}>
                {t('pdx.popup_catch')}
              </button>
            </div>
          </>
        )}

        {view === 'how' && (
          <>
            <p className="pdx-popup-how-title">{t('pdx.how_title')}</p>
            <div className="pdx-popup-how-body">
              {isUnavailable ? (
                <div className="pdx-popup-how-msg">{t('pdx.how_unavailable')}</div>
              ) : locations.length > 0 ? (
                <div className="pdx-popup-locs">
                  {locations.map((loc, i) => (
                    <div key={i} className="pdx-popup-loc">
                      <span className="pdx-popup-loc-name">📍 {loc.zone}</span>
                      <div className="pdx-popup-loc-methods">
                        {loc.methods.map((m, j) => <span key={j} className="pdx-popup-loc-method">{t(`enc.${m}`) !== `enc.${m}` ? t(`enc.${m}`) : m}</span>)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="pdx-popup-how-msg">
                  {t('pdx.how_evo_1')} <strong>{t('pdx.how_evo_2')}</strong> {t('pdx.how_evo_3')} <strong>{t('pdx.how_evo_4')}</strong>.<br />
                  {t('pdx.how_evo_5')}
                </div>
              )}
            </div>
            <button className="pdx-popup-btn" onClick={() => setView('main')}>{t('pdx.back')}</button>
          </>
        )}
      </div>
    </div>
  )
}

function Pokedex({ game, pokemon, loading, loadProgress, onSelectPokemon, caught, toggleCaught, unavailableBeastIds = new Set() }) {
  const tr = useT()
  const { locale } = useLocale()
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterGen, setFilterGen] = useState(game.availableIds ? '__available__' : (game.defaultDexFilter ?? ''))
  const [shinyIds, setShinyIds] = useState(new Set())
  const [popupPokemon, setPopupPokemon] = useState(null)

  const toggleShiny = (id, e) => {
    e.stopPropagation()
    setShinyIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const shinySprite = (p) => {
    if (p.sprite && p.sprite.includes('official-artwork')) {
      return p.sprite.replace('/official-artwork/', '/official-artwork/shiny/')
    }
    return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${p.id}.png`
  }

  const filtered = pokemon.filter(p => {
    const matchSearch = !search || p.nameFr.toLowerCase().includes(search.toLowerCase()) || String(p.id).includes(search)
    const matchType   = !filterType || p.types.includes(filterType)
    let matchGen
    if (filterGen === '__available__' && game.availableIds) {
      matchGen = game.availableIds.has(p.id) && !unavailableBeastIds.has(p.id)
    } else if (filterGen === '__unavailable__' && game.unavailableIds) {
      matchGen = game.unavailableIds.has(p.id) || unavailableBeastIds.has(p.id)
    } else {
      const genRange = GEN_RANGES.find(g => g.key === filterGen) || GEN_RANGES[0]
      matchGen = p.id >= genRange.min && p.id <= genRange.max
    }
    return matchSearch && matchType && matchGen
  })

  const availableTypes = [...new Set(pokemon.flatMap(p => p.types))].sort()

  return (
    <div className="pdx-page">
      {loading ? (
        <LoadingScreen progress={loadProgress} />
      ) : (
        <>
          {/* Barre flottante : recherche + filtres type */}
          <div className="pdx-bar">
            <input
              className="pdx-search"
              type="text"
              placeholder={tr('pdx.search')}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {/* Filtre génération */}
            <div className="pdx-type-pills" style={{ borderBottom:'1px solid #e5e5ea', paddingBottom:'0.4rem', marginBottom:'0.35rem' }}>
              {game.availableIds && (
                <button
                  className={`pdx-type-pill${filterGen === '__available__' ? ' pdx-type-pill-active' : ''}`}
                  style={{ '--tc': filterGen === '__available__' ? game.color : '#999' }}
                  onClick={() => setFilterGen('__available__')}
                >
                  {tr('pdx.available', { emoji: game.emoji })}
                </button>
              )}
              {game.unavailableIds && (
                <button
                  className={`pdx-type-pill${filterGen === '__unavailable__' ? ' pdx-type-pill-active' : ''}`}
                  style={{ '--tc': filterGen === '__unavailable__' ? '#888' : '#999' }}
                  onClick={() => setFilterGen('__unavailable__')}
                >
                  {tr('pdx.unavailable')}
                </button>
              )}
              {GEN_RANGES.map(g => (
                <button
                  key={g.key}
                  className={`pdx-type-pill${filterGen === g.key ? ' pdx-type-pill-active' : ''}`}
                  style={{ '--tc': filterGen === g.key ? game.color : '#999' }}
                  onClick={() => setFilterGen(g.key)}
                >
                  {g.label}
                </button>
              ))}
            </div>

            {/* Filtre type */}
            <div className="pdx-type-pills">
              <button
                className={`pdx-type-pill${!filterType ? ' pdx-type-pill-active' : ''}`}
                style={{ '--tc': '#999' }}
                onClick={() => setFilterType('')}
              >
                {tr('pdx.all_types')}
              </button>
              {availableTypes.map(t => (
                <button
                  key={t}
                  className={`pdx-type-pill${filterType === t ? ' pdx-type-pill-active' : ''}`}
                  style={{ '--tc': TYPE_COLORS[t] || '#888' }}
                  onClick={() => setFilterType(filterType === t ? '' : t)}
                >
                  {tr(`type.${t}`) || t}
                </button>
              ))}
            </div>
          </div>

          <p className="pdx-count">{tr('pdx.count', { n: filtered.length })}</p>

          <div className="pdx-grid" key={`${search}|${filterType}|${filterGen}`}>
            {filtered.map((p, idx) => {
              const isCaught = caught?.has(p.id)
              const isShiny  = shinyIds.has(p.id)
              const tc       = TYPE_COLORS[p.types[0]] || '#888'
              const src      = isShiny ? shinySprite(p) : p.sprite
              const delay    = Math.min(idx * 28, 560)

              return (
                <div
                  key={p.id}
                  className={[
                    'pdx-card',
                    isCaught ? 'pdx-card-caught' : 'pdx-card-uncaught',
                    isShiny  ? 'pdx-card-shiny'  : '',
                  ].filter(Boolean).join(' ')}
                  style={{ '--tc': tc, '--pdx-delay': `${delay}ms` }}
                  onClick={() => isCaught ? onSelectPokemon(p.id) : setPopupPokemon(p)}
                >
                  {/* Bouton chromatique */}
                  <button
                    className={`pdx-shiny-btn${isShiny ? ' pdx-shiny-active' : ''}`}
                    onClick={e => toggleShiny(p.id, e)}
                    title={tr('pdx.shiny')}
                  >
                    ✦
                  </button>

                  {/* Bouton Pokéball — capture rapide */}
                  <button
                    className={`pdx-ball-btn${isCaught ? ' pdx-ball-caught' : ''}`}
                    onClick={e => { e.stopPropagation(); toggleCaught(p.id) }}
                    title={isCaught ? tr('pdx.mark_uncaught') : tr('pdx.mark_caught')}
                  >
                    {isCaught ? '●' : '○'}
                  </button>

                  {/* Zone sprite avec fond teinté par type */}
                  <div className="pdx-card-top">
                    <img
                      src={src}
                      alt={isCaught ? (locale !== 'fr' ? p.name : p.nameFr) : '???'}
                      className={`pdx-sprite${isShiny ? ' pdx-sprite-shiny' : ''}`}
                      onError={e => { e.currentTarget.src = p.sprite }}
                    />
                    {isCaught && <span className="pdx-caught-badge">✓</span>}
                  </div>

                  {/* Zone info */}
                  <div className="pdx-card-bot">
                    <p className="pdx-num">#{String(p.id).padStart(3, '0')}</p>
                    <p className="pdx-name">{isCaught ? (locale !== 'fr' ? p.name : p.nameFr) : '???'}</p>
                    <div className="pdx-types">
                      {p.types.map(type => (
                        <span
                          key={type}
                          className="pdx-badge"
                          style={{ '--tc': TYPE_COLORS[type] || '#888' }}
                        >
                          {tr(`type.${type}`) || type}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Popup Pokémon non capturé */}
          {popupPokemon && (
            <PdxUncaughtPopup
              pokemon={popupPokemon}
              game={game}
              onViewFiche={() => { setPopupPokemon(null); onSelectPokemon(popupPokemon.id) }}
              onMarkCaught={() => toggleCaught(popupPokemon.id)}
              onClose={() => setPopupPokemon(null)}
            />
          )}
        </>
      )}
    </div>
  )
}

// ─── COMPOSANT : TABLE DES TYPES ─────────────────────────────────────────────

const ALL_TYPES = [
  'normal','fire','water','electric','grass','ice',
  'fighting','poison','ground','flying','psychic','bug',
  'rock','ghost','dragon','dark','steel','fairy',
]

// Multiplicateurs d'attaque : attacking[DEF] = multiplicateur
const EFFECTIVENESS = {
  normal:   { rock:0.5, ghost:0, steel:0.5 },
  fire:     { fire:0.5, water:0.5, rock:0.5, dragon:0.5, grass:2, ice:2, bug:2, steel:2 },
  water:    { water:0.5, grass:0.5, dragon:0.5, fire:2, ground:2, rock:2 },
  electric: { electric:0.5, grass:0.5, dragon:0.5, ground:0, flying:2, water:2 },
  grass:    { fire:0.5, grass:0.5, poison:0.5, flying:0.5, bug:0.5, dragon:0.5, steel:0.5, water:2, ground:2, rock:2 },
  ice:      { water:0.5, ice:0.5, fire:0.5, steel:0.5, grass:2, ground:2, flying:2, dragon:2 },
  fighting: { poison:0.5, bug:0.5, psychic:0.5, flying:0.5, fairy:0.5, ghost:0, normal:2, ice:2, rock:2, dark:2, steel:2 },
  poison:   { poison:0.5, ground:0.5, rock:0.5, ghost:0.5, steel:0, grass:2, fairy:2 },
  ground:   { grass:0.5, bug:0.5, flying:0, fire:2, electric:2, poison:2, rock:2, steel:2 },
  flying:   { electric:0.5, rock:0.5, steel:0.5, grass:2, fighting:2, bug:2 },
  psychic:  { psychic:0.5, steel:0.5, dark:0, fighting:2, poison:2 },
  bug:      { fire:0.5, fighting:0.5, flying:0.5, ghost:0.5, steel:0.5, fairy:0.5, grass:2, psychic:2, dark:2 },
  rock:     { fighting:0.5, ground:0.5, steel:0.5, fire:2, ice:2, flying:2, bug:2 },
  ghost:    { normal:0, dark:0.5, ghost:2, psychic:2 },
  dragon:   { steel:0.5, fairy:0, dragon:2 },
  dark:     { fighting:0.5, dark:0.5, fairy:0.5, ghost:2, psychic:2 },
  steel:    { fire:0.5, water:0.5, electric:0.5, steel:0.5, ice:2, rock:2, fairy:2 },
  fairy:    { fire:0.5, poison:0.5, steel:0.5, fighting:2, dragon:2, dark:2 },
}

function eff(atk, def) {
  const v = (EFFECTIVENESS[atk] || {})[def]
  return v === undefined ? 1 : v
}

function TypesTable() {
  const tr = useT()
  const [mode, setMode]       = useState('atk')
  const [selected, setSelected] = useState(null)
  const [hovRow, setHovRow]   = useState(null)
  const [hovCol, setHovCol]   = useState(null)

  function toggle(t) { setSelected(s => s === t ? null : t) }

  const superEff = selected ? ALL_TYPES.filter(t => mode === 'atk' ? eff(selected, t) === 2 : eff(t, selected) === 2) : []
  const halfEff  = selected ? ALL_TYPES.filter(t => mode === 'atk' ? eff(selected, t) === 0.5 : eff(t, selected) === 0.5) : []
  const immune   = selected ? ALL_TYPES.filter(t => mode === 'atk' ? eff(selected, t) === 0 : eff(t, selected) === 0) : []
  const neutral  = selected ? ALL_TYPES.filter(t => mode === 'atk' ? eff(selected, t) === 1 : eff(t, selected) === 1) : []

  return (
    <div className="tc-root">

      {/* Tabs mode */}
      <div className="tc-tabs">
        <button className={`tc-tab${mode === 'atk' ? ' tc-tab--on' : ''}`} onClick={() => { setMode('atk'); setSelected(null) }}>
          {tr('types.atk')}
        </button>
        <button className={`tc-tab${mode === 'def' ? ' tc-tab--on' : ''}`} onClick={() => { setMode('def'); setSelected(null) }}>
          {tr('types.def')}
        </button>
      </div>

      <p className="tc-hint">
        {mode === 'atk' ? tr('types.hint_atk') : tr('types.hint_def')}
      </p>

      {/* Type picker */}
      <div className="tc-picker">
        {ALL_TYPES.map(tp => (
          <button
            key={tp}
            className={`tc-pick-btn${selected === tp ? ' tc-pick-btn--on' : ''}`}
            style={{ '--tc': TYPE_COLORS[tp] }}
            onClick={() => toggle(tp)}
          >
            {tr(`type.${tp}`)}
          </button>
        ))}
      </div>

      {/* Result panel */}
      {selected && (
        <div className="tc-result">
          <div className="tc-result-title">
            {mode === 'atk' ? tr('types.atk_label') : tr('types.def_label')}
            <span className="tc-result-type" style={{ background: TYPE_COLORS[selected] }}>
              {tr(`type.${selected}`)}
            </span>
          </div>

          {superEff.length > 0 && (
            <div className="tc-result-row">
              <span className="tc-result-label tc-rl--super">
                {mode === 'atk' ? tr('types.super_atk') : tr('types.super_def')}
              </span>
              <div className="tc-result-pills">
                {superEff.map(tp => <span key={tp} className="tc-mini-pill" style={{ background: TYPE_COLORS[tp] }}>{tr(`type.${tp}`)}</span>)}
              </div>
            </div>
          )}

          {neutral.length > 0 && (
            <div className="tc-result-row">
              <span className="tc-result-label tc-rl--neutral">
                {mode === 'atk' ? tr('types.neutral_atk') : tr('types.neutral_def')}
              </span>
              <div className="tc-result-pills">
                {neutral.map(tp => <span key={tp} className="tc-mini-pill tc-mini-pill--neutral" style={{ background: TYPE_COLORS[tp] }}>{tr(`type.${tp}`)}</span>)}
              </div>
            </div>
          )}

          {halfEff.length > 0 && (
            <div className="tc-result-row">
              <span className="tc-result-label tc-rl--half">
                {mode === 'atk' ? tr('types.half_atk') : tr('types.half_def')}
              </span>
              <div className="tc-result-pills">
                {halfEff.map(tp => <span key={tp} className="tc-mini-pill" style={{ background: TYPE_COLORS[tp] }}>{tr(`type.${tp}`)}</span>)}
              </div>
            </div>
          )}

          {immune.length > 0 && (
            <div className="tc-result-row">
              <span className="tc-result-label tc-rl--zero">
                {mode === 'atk' ? tr('types.immune_atk') : tr('types.immune_def')}
              </span>
              <div className="tc-result-pills">
                {immune.map(tp => <span key={tp} className="tc-mini-pill tc-mini-pill--immune" style={{ background: TYPE_COLORS[tp] }}>{tr(`type.${tp}`)}</span>)}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Reference table collapsible */}
      <details className="tc-details">
        <summary className="tc-details-summary">{tr('types.full_table')}</summary>
        <div className="tc-scroll">
          <table className="tc-table">
            <thead>
              <tr>
                <th className="tc-corner">{tr('types.corner')}</th>
                {ALL_TYPES.map(tp => (
                  <th
                    key={tp}
                    className={`tc-th${hovCol === tp ? ' tc-th--hov' : ''}`}
                    onMouseEnter={() => setHovCol(tp)}
                    onMouseLeave={() => setHovCol(null)}
                  >
                    <span className="tc-th-pill" style={{ background: TYPE_COLORS[tp] }}>
                      {tr(`type.${tp}`)[0]}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ALL_TYPES.map(atk => (
                <tr
                  key={atk}
                  onMouseEnter={() => setHovRow(atk)}
                  onMouseLeave={() => setHovRow(null)}
                >
                  <td className={`tc-th tc-th-row${hovRow === atk ? ' tc-th--hov' : ''}`}>
                    <span className="tc-th-pill" style={{ background: TYPE_COLORS[atk] }}>
                      {tr(`type.${atk}`)[0]}
                    </span>
                    <span className="tc-th-label">{tr(`type.${atk}`)}</span>
                  </td>
                  {ALL_TYPES.map(def => {
                    const v = eff(atk, def)
                    const isRowHov = hovRow === atk
                    const isColHov = hovCol === def
                    return (
                      <td
                        key={def}
                        className={[
                          'tc-cell',
                          v === 2   ? 'tc-cell--super' : '',
                          v === 0.5 ? 'tc-cell--half'  : '',
                          v === 0   ? 'tc-cell--zero'  : '',
                          isRowHov || isColHov ? 'tc-cell--hov' : '',
                        ].filter(Boolean).join(' ')}
                      >
                        {v === 2 ? '2×' : v === 0.5 ? '½' : v === 0 ? '✕' : ''}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="tc-legend">
          <span className="tc-leg tc-leg--super">{tr('types.legend_super')}</span> &nbsp;
          <span className="tc-leg tc-leg--half">{tr('types.legend_half')}</span> &nbsp;
          <span className="tc-leg tc-leg--zero">{tr('types.legend_immune')}</span>
        </div>
      </details>

    </div>
  )
}

// ─── COMPOSANT : SECTION ARÈNE ───────────────────────────────────────────────

function GymSection({ gym, game, pokemon }) {
  const t = useT()
  const tField = useTField()
  const { locale } = useLocale()
  const miniSprite = id =>
    `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`

  if (!gym) return null

  return (
    <div className="gym-section">

      {/* Carte leader */}
      <div className="gym-leader-card" style={{ '--gc': game.color }}>
        <div className="gym-leader-name">{gym.leader}</div>
        <div className="gym-leader-title">{tField(gym, 'leaderTitle')}</div>
        <div className="gym-specialty">
          {gym.specialty.map(tp => (
            <span key={tp} className="gym-type-pill" style={{ background: TYPE_COLORS[tp] }}>
              {t(`type.${tp}`)}
            </span>
          ))}
        </div>
      </div>

      {/* Équipe */}
      <div className="gym-section-block">
        <div className="gym-section-label">{t('gym.team')}</div>
        <div className="gym-team-grid">
          {gym.team.map((p, i) => {
            const pCache = pokemon.find(pk => pk.id === p.id)
            const pokeName = locale !== 'fr' ? (pCache?.name || p.nameFr) : p.nameFr
            return (
            <div key={i} className="gym-poke-card">
              <img src={miniSprite(p.id)} alt={pokeName} className="gym-poke-sprite" />
              <div className="gym-poke-name">{pokeName}</div>
              <div className="gym-poke-level">{t('gym.level')} {p.level}</div>
              <div className="gym-poke-types">
                {p.types.map(tp => (
                  <span key={tp} className="gym-type-mini" style={{ background: TYPE_COLORS[tp] }}>
                    {t(`type.${tp}`)}
                  </span>
                ))}
              </div>
              {p.note && <div className="gym-poke-note">{p.note}</div>}
            </div>
            )
          })}
        </div>
      </div>

      {/* Faiblesses */}
      <div className="gym-section-block">
        <div className="gym-section-label">{t('gym.weaknesses')}</div>
        <div className="gym-weak-row">
          {gym.weaknesses.map(tp => (
            <span key={tp} className="gym-type-pill" style={{ background: TYPE_COLORS[tp] }}>
              {t(`type.${tp}`)}
            </span>
          ))}
        </div>
      </div>

      {/* Stratégie */}
      <div className="gym-section-block">
        <div className="gym-section-label">{t('gym.strategy')}</div>
        <p className="gym-strategy-text">{tField(gym, 'strategy')}</p>
        <ul className="gym-tips">
          {(tField(gym, 'tips') || []).map((tip, i) => (
            <li key={i} className="gym-tip">{tip}</li>
          ))}
        </ul>
      </div>

      {/* Recommandés */}
      {gym.recommended && gym.recommended.length > 0 && (
        <div className="gym-section-block">
          <div className="gym-section-label">{t('gym.recommended')}</div>
          <div className="gym-rec-row">
            {gym.recommended.map(id => {
              const p = pokemon.find(pk => pk.id === id)
              return (
                <div key={id} className="gym-rec-poke">
                  <img src={miniSprite(id)} alt={(locale !== 'fr' ? p?.name : p?.nameFr) || `#${id}`} className="gym-rec-sprite" />
                  <div className="gym-rec-name">{(locale !== 'fr' ? p?.name : p?.nameFr) || `#${id}`}</div>
                </div>
              )
            })}
          </div>
        </div>
      )}

    </div>
  )
}

// ─── LABELS ──────────────────────────────────────────────────────────────────

const ENC_METHOD_LABELS = {
  grass:    '🌿 Hautes herbes',
  cave:     '⛰️ Dans la grotte',
  'cave-rdc': '⛰️ Rez-de-chaussée',
  'cave-b1':  '⛰️ 1er Sous-sol',
  'cave-b2':  '⛰️ 2e Sous-sol',
  'eclate-roc': '🪨 Éclate-Roc',
  surf:         '🌊 Surf',
  fish:         '🎣 Pêche',
  horde:        '⚡ Hordes',
  canne:        '🎣 Canne',
  'super-canne':'🎣 Super Canne',
  'mega-canne': '🎣 Méga Canne',
  'safari-entree': '🌿 Zone Centrale (Entrée)',
  'safari-est':    '🌿 Zone 1 — Est',
  'safari-nord':   '🌿 Zone 2 — Nord',
  'safari-ouest':  '🌿 Zone 3 — Ouest',
  'safari-surf':   '🌊 Surf (toutes zones)',
  'safari-fish':   '🎣 Pêche (toutes zones)',
}

const ZONE_TYPE_FR = {
  town:  'Ville',
  route: 'Route',
  cave:  'Donjon',
  gym:   'Arène',
}

const TRAINER_ICONS = {
  scout:     '🧒',
  hiker:     '🧗',
  lass:      '👧',
  youngster: '👦',
  rocket:     '🚀',
  nerd:       '🤓',
  swimmer:    '🏊',
  picnicker:  '🧺',
  camper:     '🏕️',
  gentleman:  '🎩',
  sailor:     '⚓',
  mechanic:   '🔧',
  fisherman:  '🎣',
  pokemaniac: '🤪',
  fillette:   '👧',
  gambler:    '🎰',
  twins:      '👭',
  biker:       '🏍️',
  boss:        '😈',
  leader:      '🏆',
  couple:      '💑',
  exorciste:   '🕯️',
  rocker:      '🎸',
  ornithologue:'🦅',
  canon:       '💄',
  'duo-baston':'🥊',
  jongleur:    '🤹',
  dompteur:    '🦁',
  loubard:     '😤',
  rival:       '⚔️',
  ghost:       '👻',
  karateka:    '🥋',
  kiné:        '🧘',
  nageur:      '🏊',
  nageuse:     '🏊',
  pillard:     '🔓',
  scientifique:'🔬',
  intello:        '🤓',
  topdresseur:    '🏅',
  'pkmn-ranger':  '🌿',
  'fille-baston': '👊',
  aroma:          '🌸',
  flotteur:       '🛟',
  campeur:        '🏕️',
  motard:         '🏍️',
  pêcheur:        '🎣',
  conseil4:       '⭐',
  champion:       '🏆',
}

// ─── COMPOSANT : BLOC REPLIABLE ──────────────────────────────────────────────

function CollapsibleBlock({ title, icon, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="cblock">
      <button className="cblock-header" onClick={() => setOpen(o => !o)}>
        <span className="cblock-icon">{icon}</span>
        <span className="cblock-title">{title}</span>
        <span className="cblock-chevron">{open ? '▾' : '▸'}</span>
      </button>
      {open && <div className="cblock-body">{children}</div>}
    </div>
  )
}

// ─── COMPOSANT : DRESSEUR (ligne dépliable) ──────────────────────────────────

function TrainerRow({ trainer, isBeaten, onToggle, game, pokeMap = {} }) {
  const t = useT()
  const { locale } = useLocale()
  const [expanded, setExpanded] = useState(false)
  return (
    <div className={`zdv2-trainer${isBeaten ? ' zdv2-trainer-beaten' : ''}`} style={{ '--gc': game.color }}>
      <div className="zdv2-trainer-head" onClick={() => setExpanded(e => !e)}>
        <span className="zdv2-trainer-class-icon">{TRAINER_ICONS[trainer.class] || '🧑'}</span>
        <span className="zdv2-trainer-name">{trainer.name.replace(/\s+si \S+ choisi/g, '').trim()}</span>
        <span className="zdv2-trainer-chevron">{expanded ? '▾' : '▸'}</span>
        <label
          className={`zdv2-trainer-check${isBeaten ? ' zdv2-trainer-check-done' : ''}`}
          onClick={e => { e.stopPropagation(); onToggle() }}
        >
          {isBeaten ? t('trainer.beaten') : t('trainer.beat')}
        </label>
      </div>
      {expanded && (
        <div className="zdv2-trainer-team">
          {trainer.team.map((p, i) => (
            <div key={i} className="zdv2-trainer-poke">
              <img
                src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.id}.png`}
                alt={locale !== 'fr' ? (pokeMap[p.id]?.name || p.nameFr) : p.nameFr}
                className="zdv2-trainer-sprite"
              />
              <div className="zdv2-trainer-poke-info">
                <span className="zdv2-trainer-poke-name">{locale !== 'fr' ? (pokeMap[p.id]?.name || p.nameFr) : p.nameFr}</span>
                <span className="zdv2-trainer-poke-lvl">niv. {p.level}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── COMPOSANT : PANNEAU DÉTAIL DE ZONE ──────────────────────────────────────

function ZoneDetailPanel({ zone, game, isChecked, toggleCheck, caught, toggleCaught, obtainedMegas, toggleMega, pokemon, zoneCompletion, filterChecklist, filterTrainers }) {
  const t = useT()
  const tField = useTField()
  const { locale } = useLocale()
  const pokeMap = useMemo(
    () => Object.fromEntries(pokemon.map(p => [p.id, p])),
    [pokemon]
  )

  const checklistFr    = filterChecklist ? filterChecklist(zone.checklist) : zone.checklist
  const checklistEn    = zone.checklist_en || []
  const trainers       = filterTrainers  ? filterTrainers(zone.trainers)   : (zone.trainers || [])

  const noteKey = `pjt-note-${game.id}-${zone.id}`
  const [note, setNote] = useState(() => localStorage.getItem(noteKey) || '')

  function handleNote(val) {
    setNote(val)
    if (val.trim()) localStorage.setItem(noteKey, val)
    else localStorage.removeItem(noteKey)
  }

  const comp = zoneCompletion(zone)
  const pct  = comp ? Math.round((comp.done / comp.total) * 100) : null

  const hasGym       = zone.type === 'gym' && zone.gym
  const hasPokemon   = zone.encounters.length > 0
  const hasItems     = zone.items.length > 0
  const hasChecklist = checklistFr.length > 0
  const hasTrainers  = trainers.length > 0

  return (
    <div className="zdv2">

      {/* ── En-tête ── */}
      <div className="zdv2-header" style={{ '--gc': game.color }}>
        <div className="zdv2-header-top">
          <span className="zdv2-icon">{zone.icon}</span>
          <div className="zdv2-header-info">
            <h2 className="zdv2-name">{tField(zone, 'name')}</h2>
            <span className="zdv2-type-tag">{t(`zone_type.${zone.type}`) || zone.type}</span>
          </div>
          {pct !== null && (
            <div className="zdv2-pct" style={{ color: pct === 100 ? game.color : '#bbb' }}>
              {pct}%
            </div>
          )}
        </div>
        {comp && (
          <div className="zdv2-progress-track">
            <div className="zdv2-progress-fill" style={{ width: `${pct}%`, background: game.color }} />
          </div>
        )}
      </div>

      {/* Conseil contextuel */}
      {zone.tip && (
        <div className="zdv2-tip" style={{ borderLeftColor: game.color }}>
          {tField(zone, 'tip')}
        </div>
      )}

      <div className="zdv2-blocks">

        {/* ── Checklist événements clés ── */}
        {hasChecklist && (
          <CollapsibleBlock title={t('zone.key_events')} icon="✅">
            <div className="zdv2-checklist">
              {checklistFr.map((frItem, i) => {
                const displayItem = (locale !== 'fr' && checklistEn[i]) ? checklistEn[i] : frItem
                const done = isChecked(zone.id, frItem)
                const displayText = displayItem.replace(/\s+si starter\s*[=≠]\s*\S+/g, '')
                return (
                  <label
                    key={i}
                    className={`zdv2-check-row${done ? ' zdv2-check-done' : ''}`}
                    style={done ? { '--gc': game.color } : {}}
                  >
                    <input type="checkbox" checked={done} onChange={() => toggleCheck(zone.id, frItem)} />
                    <span className="zdv2-check-text">{displayText}</span>
                  </label>
                )
              })}
            </div>
          </CollapsibleBlock>
        )}

        {/* ── Pokémon rencontrables ── */}
        {hasPokemon && (() => {
          const gameVer = game.id === 'firered' ? 'RF' : game.id === 'leafgreen' ? 'VF'
            : game.id === 'omegaruby' ? 'OR' : game.id === 'alphasapphire' ? 'AS' : null
          const vFilter = p => !p.version || !gameVer || p.version === gameVer
          const allEncIds = [...new Set(zone.encounters.flatMap(e => e.pokemon.filter(vFilter).map(p => p.id)))]
          const caughtCount = allEncIds.filter(id => caught?.has(id)).length
          return (
            <CollapsibleBlock title={t('zone.pokemon', { caught: caughtCount, total: allEncIds.length })} icon="🎮">
              {zone.encounters.map((enc, i) => (
                <div key={i} className="zdv2-enc-group">
                  <div className="zdv2-enc-method">{t(`enc.${enc.method}`) !== `enc.${enc.method}` ? t(`enc.${enc.method}`) : enc.method}</div>
                  {enc.pokemon.filter(vFilter).map((p, j) => {
                    const pData    = pokeMap[p.id]
                    const isCaught = caught?.has(p.id)
                    const rateColor = p.rate <= 10 ? '#e07070' : p.rate >= 40 ? '#70b870' : '#c0a860'
                    return (
                      <label
                        key={j}
                        className={`zdv2-poke-row${isCaught ? ' zdv2-poke-caught' : ''}`}
                        style={{ '--gc': game.color }}
                        onClick={() => toggleCaught?.(p.id)}
                      >
                        <img
                          src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.id}.png`}
                          alt={locale !== 'fr' ? (pokeMap[p.id]?.name || p.nameFr) : p.nameFr}
                          className="zdv2-poke-sprite"
                          style={{ filter: isCaught ? 'none' : 'grayscale(100%) brightness(0.7)' }}
                        />
                        <div className="zdv2-poke-info">
                          <span className="zdv2-poke-name">{locale !== 'fr' ? (pokeMap[p.id]?.name || p.nameFr) : p.nameFr}</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                            {pData && <TypeBadges types={pData.types} />}
                            {p.levels && <span className="zdv2-poke-levels">Lv.{p.levels}</span>}
                          </div>
                        </div>
                        <div className="zdv2-rate-wrap">
                          <div className="zdv2-rate-bar">
                            <div className="zdv2-rate-fill" style={{ width: `${p.rate}%`, background: rateColor }} />
                          </div>
                          <span className="zdv2-rate-label">{p.rate}%</span>
                        </div>
                        <span className="zdv2-poke-check" style={{ color: isCaught ? game.color : '#ccc' }}>
                          {isCaught ? '✓' : '○'}
                        </span>
                      </label>
                    )
                  })}
                </div>
              ))}
            </CollapsibleBlock>
          )
        })()}

        {/* ── Légendaires à capturer ── */}
        {hasItems && zone.items.some(it => it.legendaryId) && (() => {
          const lgdItems = zone.items.filter(it => it.legendaryId)
          return (
            <CollapsibleBlock title={t('zone.legendary')} icon="✨">
              <div className="zdv2-lgd-tiles">
                {lgdItems.map((item, i) => {
                  const lgd      = (game.legendaries ?? []).find(l => l.id === item.legendaryId)
                  const isCaught = caught?.has(item.legendaryId)
                  const tc       = lgd ? (TYPE_COLORS[lgd.types[0]] || '#888') : '#888'
                  return (
                    <div
                      key={i}
                      className={`zdv2-lgd-tile${isCaught ? ' zdv2-lgd-tile--caught' : ''}`}
                      style={{ '--tc': tc }}
                    >
                      <img
                        className="zdv2-lgd-sprite"
                        src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${item.legendaryId}.png`}
                        alt={tField(item, 'name')}
                      />
                      <div className="zdv2-lgd-info">
                        <span className="zdv2-lgd-name">{tField(item, 'name')}</span>
                        {lgd && (
                          <div className="zdv2-lgd-types">
                            {lgd.types.map(tp => (
                              <span key={tp} className="pdx-badge" style={{ '--tc': TYPE_COLORS[tp] || '#888' }}>
                                {t(`type.${tp}`)}
                              </span>
                            ))}
                          </div>
                        )}
                        <span className="zdv2-lgd-source">{tField(item, 'source')}</span>
                      </div>
                      <button
                        className={`zdv2-lgd-btn${isCaught ? ' zdv2-lgd-btn--caught' : ''}`}
                        onClick={() => toggleCaught?.(item.legendaryId)}
                        title={isCaught ? t('zone.mark_not_caught') : t('zone.mark_caught')}
                      >
                        {isCaught ? '✓' : '○'}
                      </button>
                    </div>
                  )
                })}
              </div>
            </CollapsibleBlock>
          )
        })()}

        {/* ── Méga-Gemmes ── */}
        {hasItems && zone.items.some(it => it.megaStone) && (() => {
          const megaItems = zone.items.filter(it => it.megaStone)
          return (
            <CollapsibleBlock title={t('zone.mega')} icon="💎">
              <div className="zdv2-lgd-tiles">
                {megaItems.map((item, i) => {
                  const mega       = (game.megas ?? []).find(m => m.stone === item.megaStone)
                  const isObtained = obtainedMegas?.has(item.megaStone)
                  const spriteUrl  = mega
                    ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${mega.megaId ?? mega.id}.png`
                    : null
                  return (
                    <div
                      key={i}
                      className={`zdv2-lgd-tile${isObtained ? ' zdv2-lgd-tile--caught' : ''}`}
                      style={{ '--tc': game.color }}
                    >
                      {spriteUrl && (
                        <img className="zdv2-lgd-sprite" src={spriteUrl} alt={tField(item, 'name')} />
                      )}
                      <div className="zdv2-lgd-info">
                        <span className="zdv2-lgd-name">{tField(item, 'name')}</span>
                        {mega && <span className="zdv2-lgd-source">{t('zone.mega_name', { name: mega.nameFr })}</span>}
                        <span className="zdv2-lgd-source">{tField(item, 'source')}</span>
                      </div>
                      <button
                        className={`zdv2-lgd-btn${isObtained ? ' zdv2-lgd-btn--caught' : ''}`}
                        onClick={() => toggleMega?.(item.megaStone)}
                        title={isObtained ? t('zone.remove_stone') : t('zone.mark_obtained')}
                      >
                        {isObtained ? '✓' : '○'}
                      </button>
                    </div>
                  )
                })}
              </div>
            </CollapsibleBlock>
          )
        })()}

        {/* ── Objets à récupérer ── */}
        {hasItems && zone.items.some(it => !it.legendaryId && !it.megaStone) && (() => {
          const regularItems = zone.items.filter(it => !it.legendaryId && !it.megaStone)
          const collectedCount = regularItems.filter((item, i) =>
            isChecked(zone.id, `item::${i}::${item.name}`)
          ).length
          return (
            <CollapsibleBlock title={t('zone.items', { collected: collectedCount, total: regularItems.length })} icon="📦">
              <div className="zdv2-items">
                {regularItems.map((item, i) => {
                  const itemKey = `item::${i}::${item.name}`
                  const collected = isChecked(zone.id, itemKey)
                  return (
                    <label
                      key={i}
                      className={[
                        'zdv2-item-row',
                        item.key ? 'zdv2-item-key' : '',
                        collected ? 'zdv2-item-collected' : '',
                      ].filter(Boolean).join(' ')}
                      style={collected ? { '--gc': game.color } : {}}
                      onClick={() => toggleCheck(zone.id, itemKey)}
                    >
                      <span className="zdv2-item-icon">
                        {collected ? '✓' : item.key ? '⭐' : '📦'}
                      </span>
                      <div className="zdv2-item-info">
                        <span className="zdv2-item-name">{tField(item, 'name')}</span>
                        <span className="zdv2-item-source">{tField(item, 'source')}</span>
                      </div>
                    </label>
                  )
                })}
              </div>
            </CollapsibleBlock>
          )
        })()}

        {/* ── Dresseurs ── */}
        {hasTrainers && (
          <CollapsibleBlock title={t('zone.trainers')} icon="🧢">
            <div className="zdv2-trainers">
              {trainers.map((trainer, i) => (
                <TrainerRow
                  key={trainer.id || i}
                  trainer={trainer}
                  isBeaten={isChecked(zone.id, `trainer::${trainer.id || trainer.name}`)}
                  onToggle={() => toggleCheck(zone.id, `trainer::${trainer.id || trainer.name}`)}
                  game={game}
                  pokeMap={pokeMap}
                />
              ))}
            </div>
          </CollapsibleBlock>
        )}

        {/* ── Arène ── */}
        {hasGym && (
          <CollapsibleBlock title={t('zone.gym', { leader: zone.gym.leader })} icon="🏆">
            <GymSection gym={zone.gym} game={game} pokemon={pokemon} />
          </CollapsibleBlock>
        )}

        {/* ── Notes ── */}
        <div className="zdv2-notes">
          <div className="zdv2-notes-label">{t('zone.notes_label')}</div>
          <textarea
            className="zdv2-notes-area"
            placeholder={t('zone.notes_ph')}
            value={note}
            onChange={e => handleNote(e.target.value)}
            rows={3}
          />
        </div>

      </div>
    </div>
  )
}

// ─── COMPOSANT : POPUP BADGE OBTENU ──────────────────────────────────────────

function BadgePopup({ popup, game, onContinue, onViewBadges }) {
  const t = useT()
  const spriteUrl = (BADGE_SPRITE_BASE[game.id] || BADGE_SPRITE_BASE.firered)
  return (
    <div className="badge-popup-overlay" onClick={onContinue}>
      <div className="badge-popup" onClick={e => e.stopPropagation()}>
        <div className="bp-firework">🎉</div>
        <div className="bp-header">{t('badge.obtained')}</div>
        <div className="bp-badge-wrap">
          <img
            src={spriteUrl(popup.badgeId)}
            alt={popup.badgeName}
            className="bp-badge-img"
            onError={e => { e.currentTarget.style.display = 'none' }}
          />
        </div>
        <div className="bp-badge-name">{t('badge.badge')} {popup.badgeName}</div>
        <p className="bp-message">
          {t('badge.congrats')} <strong>{popup.leader}</strong>
          {popup.gym && <>{t('badge.gym_of')} <strong>{popup.gym}</strong></>} !
          <br /><br />
          {t('badge.added_pre')} <strong>{t('badge.badge')} {popup.badgeName}</strong> {t('badge.added_suf')}
        </p>
        <div className="bp-actions">
          <button className="bp-btn-secondary" onClick={onContinue}>
            {t('badge.continue')}
          </button>
          <button className="bp-btn-primary" style={{ background: game.color }} onClick={onViewBadges}>
            {t('badge.view')}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── MODAL PHOTO SOUVENIR ────────────────────────────────────────────────────

function TrophyModal({ game, profile, pokemon, onClose }) {
  const { locale } = useLocale()
  const [slots, setSlots] = useState(() => {
    try {
      const team = JSON.parse(localStorage.getItem(`team-${game.id}`) || '[]')
      const arr = Array(6).fill(null)
      team.forEach((p, i) => { if (i < 6) arr[i] = p })
      return arr
    } catch { return Array(6).fill(null) }
  })
  const [searches, setSearches]   = useState(() => [])
  const [suggestions, setSuggestions] = useState(Array(6).fill([]))
  const [trainerName, setTrainerName] = useState(() => profile?.name || '')
  const [date, setDate] = useState(() => {
    const d = new Date()
    const dd = String(d.getDate()).padStart(2, '0')
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    return `${d.getFullYear()}-${mm}-${dd}`
  })
  const [saved, setSaved] = useState(false)

  function handleSearch(idx, val) {
    const newSearches = [...searches]
    newSearches[idx] = val
    setSearches(newSearches)

    const newSlots = [...slots]
    newSlots[idx] = null
    setSlots(newSlots)

    if (!val.trim()) {
      const s = [...suggestions]; s[idx] = []; setSuggestions(s); return
    }
    const q = val.toLowerCase()
    const s = [...suggestions]
    s[idx] = pokemon.filter(p => p.nameFr.toLowerCase().includes(q) || p.name.toLowerCase().includes(q)).slice(0, 5)
    setSuggestions(s)
  }

  function selectPokemon(idx, p) {
    const ns = [...slots]; ns[idx] = p; setSlots(ns)
    const nr = [...searches]; nr[idx] = p.nameFr; setSearches(nr)
    const sg = [...suggestions]; sg[idx] = []; setSuggestions(sg)
  }

  function clearSlot(idx) {
    const ns = [...slots]; ns[idx] = null; setSlots(ns)
    const nr = [...searches]; nr[idx] = ''; setSearches(nr)
  }

  function handleSave() {
    const trophy = {
      id: String(Date.now()),
      date,
      trainerName: trainerName.trim() || 'Dresseur',
      game: { id: game.id, name: game.name, color: game.color, emoji: game.emoji },
      team: slots,
    }
    try {
      const existing = JSON.parse(localStorage.getItem(`pjt-trophies-${game.id}`) || '[]')
      existing.push(trophy)
      localStorage.setItem(`pjt-trophies-${game.id}`, JSON.stringify(existing))
    } catch {}
    setSaved(true)
    setTimeout(onClose, 1800)
  }

  const t = useT()

  return (
    <div className="trm-backdrop" onClick={onClose}>
      <div className="trm-modal" onClick={e => e.stopPropagation()}>
        <div className="trm-header">
          <span className="trm-title">{t('trophy.title')}</span>
          <button className="trm-close" onClick={onClose}>✕</button>
        </div>

        {saved ? (
          <div className="trm-saved">{t('trophy.saved')}</div>
        ) : (
          <>
            <p className="trm-subtitle">{t('trophy.subtitle')}</p>

            <div className="trm-fields">
              <label className="trm-label">{t('trophy.trainer')}</label>
              <input
                className="trm-input"
                value={trainerName}
                onChange={e => setTrainerName(e.target.value)}
                placeholder={t('trophy.trainer_ph')}
              />
              <label className="trm-label">{t('trophy.date')}</label>
              <input
                className="trm-input"
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
              />
            </div>

            <div className="trm-slots-label">{t('trophy.team')}</div>
            <div className="trm-slots">
              {Array(6).fill(null).map((_, idx) => {
                const slot = slots[idx] ?? null
                const srch = searches[idx] ?? ''
                const sugg = suggestions[idx] ?? []
                return (
                  <div key={idx} className="trm-slot">
                    {slot ? (
                      <div className="trm-slot-filled">
                        <img
                          src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${slot.id}.png`}
                          alt={locale !== 'fr' ? slot.name : slot.nameFr}
                          className="trm-slot-sprite"
                        />
                        <span className="trm-slot-name">{locale !== 'fr' ? slot.name : slot.nameFr}</span>
                        <button className="trm-slot-clear" onClick={() => clearSlot(idx)}>✕</button>
                      </div>
                    ) : (
                      <div className="trm-slot-search">
                        <input
                          className="trm-slot-input"
                          placeholder={`Slot ${idx + 1}`}
                          value={srch}
                          onChange={e => handleSearch(idx, e.target.value)}
                        />
                        {sugg.length > 0 && (
                          <ul className="trm-sug-list">
                            {sugg.map(p => (
                              <li key={p.id} className="trm-sug-item" onMouseDown={() => selectPokemon(idx, p)}>
                                <img
                                  src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.id}.png`}
                                  alt=""
                                  className="trm-sug-sprite"
                                />
                                {locale !== 'fr' ? p.name : p.nameFr}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            <div className="trm-actions">
              <button className="trm-btn-skip" onClick={onClose}>{t('trophy.skip')}</button>
              <button className="trm-btn-save" style={{ background: game.color }} onClick={handleSave}>
                {t('trophy.save')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ─── COMPOSANT : ONGLET AVENTURE ─────────────────────────────────────────────

function AdventureTab({ game, profile, pokemon, caught, toggleCaught, obtainedMegas, toggleMega, onBadgeEarned, onSwitchTab }) {
  const t = useT()
  const tField = useTField()
  const zones    = game.zones    ?? null
  const chapters = game.chapters ?? null

  const [selectedChapterId, setSelectedChapterId] = useState(null)
  const [selectedZoneId,    setSelectedZoneId]    = useState(null)
  const [checklist, setChecklist] = useState(() => {
    const saved = localStorage.getItem(`pjt-adv-${game.id}`)
    return new Set(saved ? JSON.parse(saved) : [])
  })
  const [forcedUnlocks, setForcedUnlocks] = useState(() => {
    const saved = localStorage.getItem(`pjt-unlocked-${game.id}`)
    return new Set(saved ? JSON.parse(saved) : [])
  })
  const [badgePopup,   setBadgePopup]   = useState(null)
  const [lockedModal,  setLockedModal]  = useState(null)
  const [trophyModal,  setTrophyModal]  = useState(false)

  function toggleCheck(zoneId, item) {
    const key = `${zoneId}::${item}`
    const isChecking = !checklist.has(key)
    setChecklist(prev => {
      const updated = new Set(prev)
      if (updated.has(key)) updated.delete(key)
      else updated.add(key)
      localStorage.setItem(`pjt-adv-${game.id}`, JSON.stringify([...updated]))
      return updated
    })
    if (isChecking) {
      const zone = zones?.find(z => z.id === zoneId)
      if (zone?.gym && item.includes('Badge')) {
        const badgeId = zone.gym.badgeId
        const badgeInfo = game.badges?.find(b => b.id === badgeId)
        const badgesKey = `badges-${game.id}`
        const savedBadges = JSON.parse(localStorage.getItem(badgesKey) || '[]')
        if (!savedBadges.includes(badgeId)) {
          localStorage.setItem(badgesKey, JSON.stringify([...savedBadges, badgeId]))
          onBadgeEarned?.(badgeId)
        }
        setBadgePopup({
          badgeId,
          badgeName: badgeInfo?.name ?? `#${badgeId}`,
          leader: zone.gym.leader,
          gym: badgeInfo?.gym,
        })
      }
      if (zoneId === 'plateau-indigo' && item === 'Battre le Rival — Maître de la Ligue') {
        setTrophyModal(true)
      }
    }
  }

  function isChecked(zoneId, item) {
    return checklist.has(`${zoneId}::${item}`)
  }

  const STARTER_ID_TO_FR = {
    1: 'Bulbizarre', 4: 'Salamèche', 7: 'Carapuce',
    152: 'Germignon', 155: 'Héricendre', 158: 'Kaiminus',
    252: 'Arcko', 255: 'Poussifeu', 258: 'Gobou',
  }
  const starterFr = profile?.starterId ? (STARTER_ID_TO_FR[profile.starterId] ?? null) : null

  function filterChecklist(cl) {
    if (!starterFr) return cl
    return cl.filter(item => {
      const eq  = item.match(/si starter = (\S+)/)
      if (eq)  return eq[1] === starterFr
      const neq = item.match(/si starter ≠ (\S+)/)
      if (neq) return neq[1] !== starterFr
      return true
    })
  }

  function filterTrainers(trainers) {
    if (!trainers || !starterFr) return trainers || []
    const hasConditional = trainers.some(t => t.name?.match(/si \S+ choisi/))
    if (!hasConditional) return trainers
    return trainers.filter(t => {
      const m = t.name?.match(/si (\S+) choisi/)
      return !m || m[1] === starterFr
    })
  }

  function zoneCompletion(zone) {
    const cl = filterChecklist(zone.checklist)
    if (!cl.length) return null
    const done = cl.filter(item => isChecked(zone.id, item)).length
    return { done, total: cl.length }
  }

  function chapterCompletion(ch) {
    const chZ = ch.zoneIds.map(id => zones.find(z => z.id === id)).filter(Boolean)
    let done = 0, total = 0
    chZ.forEach(zone => filterChecklist(zone.checklist).forEach(item => {
      total++
      if (isChecked(zone.id, item)) done++
    }))
    return { done, total }
  }

  function openChapter(chId) {
    setSelectedChapterId(chId)
    setSelectedZoneId(null)
  }

  const badgePopupEl = badgePopup && (
    <BadgePopup
      popup={badgePopup}
      game={game}
      onContinue={() => setBadgePopup(null)}
      onViewBadges={() => { setBadgePopup(null); onSwitchTab?.('badges') }}
    />
  )

  if (!zones) {
    return (
      <div className="adv-coming">
        <div className="adv-coming-icon">🗺️</div>
        <h2 className="adv-coming-title">{t('adv.coming_title')}</h2>
        <p className="adv-coming-region">{game.name}</p>
      </div>
    )
  }

  // ── VUE TUILES ──
  function forceUnlock(chId) {
    setForcedUnlocks(prev => {
      const next = new Set(prev)
      next.add(chId)
      localStorage.setItem(`pjt-unlocked-${game.id}`, JSON.stringify([...next]))
      return next
    })
  }

  function isChapterLocked(idx) {
    if (idx === 0) return false
    const ch = chapters[idx]
    if (forcedUnlocks.has(ch.id)) return false
    const prev = chapters[idx - 1]
    const c = chapterCompletion(prev)
    return c.total === 0 || c.done < c.total
  }

  if (!selectedChapterId) {
    return (
      <>
        <div className="adv-grid-scroll">
        <div className="adv-ch-grid">
          {chapters.map((ch, idx) => {
            const comp     = chapterCompletion(ch)
            const chZ      = ch.zoneIds.map(id => zones.find(z => z.id === id)).filter(Boolean)
            const pct      = comp.total ? (comp.done / comp.total) * 100 : 0
            const isDone   = comp.total > 0 && comp.done === comp.total
            const isLocked = isChapterLocked(idx)
            return (
              <button
                key={ch.id}
                className={[
                  'adv-ch-tile',
                  isLocked ? 'adv-ch-tile-locked' : '',
                  isDone   ? 'adv-ch-tile-done'   : '',
                ].filter(Boolean).join(' ')}
                style={{ '--gc': game.color }}
                onClick={() => isLocked ? setLockedModal({ chId: ch.id }) : openChapter(ch.id)}
              >
                <img
                  src={`/assets/chapters/${game.id}/chapter-${ch.id}.png`}
                  alt=""
                  className="adv-ch-tile-bg"
                  onError={e => { e.currentTarget.style.display = 'none' }}
                />
                <div className="adv-ch-tile-overlay" />
                {isLocked && <span className="adv-ch-tile-lock">🔒</span>}
                {isDone   && <span className="adv-ch-tile-done-tag">{t('adv.done')}</span>}
                <div className="adv-ch-tile-content">
                  <div className="adv-ch-tile-label">{tField(ch, 'label')}</div>
                  <div className="adv-ch-tile-meta">{t('adv.zones', { n: chZ.length })}</div>
                  <div className="adv-ch-tile-bar-wrap">
                    <div className="adv-ch-tile-bar">
                      <div
                        className="adv-ch-tile-fill"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="adv-ch-tile-pct">{comp.done}/{comp.total}</span>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
        </div>

        {lockedModal && (() => {
          const ch  = chapters.find(c => c.id === lockedModal.chId)
          const idx = chapters.findIndex(c => c.id === lockedModal.chId)
          const prevCh = chapters[idx - 1]
          const prev = prevCh ? chapterCompletion(prevCh) : null
          return (
            <div className="adv-lock-overlay" onClick={() => setLockedModal(null)}>
              <div className="adv-lock-modal" onClick={e => e.stopPropagation()}>
                <div className="adv-lock-icon">🔒</div>
                <p className="adv-lock-title">{tField(ch, 'label')}</p>
                {prev && (
                  <p className="adv-lock-body">
                    {t('adv.unlock_body').split('<strong>')[0]}
                    <strong>{tField(prevCh, 'label')}</strong>
                    {t('adv.unlock_body').split('</strong>')[1] ?? ''}
                    <span className="adv-lock-prog"> ({prev.done}/{prev.total})</span>
                  </p>
                )}
                <div className="adv-lock-actions">
                  <button className="adv-lock-cancel" onClick={() => setLockedModal(null)}>
                    {t('adv.close')}
                  </button>
                  <button
                    className="adv-lock-confirm"
                    style={{ background: game.color }}
                    onClick={() => { forceUnlock(lockedModal.chId); setLockedModal(null); openChapter(lockedModal.chId) }}
                  >
                    {t('adv.unlock')}
                  </button>
                </div>
              </div>
            </div>
          )
        })()}

        {badgePopupEl}
        {trophyModal && (
          <TrophyModal
            game={game}
            profile={profile}
            pokemon={pokemon}
            onClose={() => setTrophyModal(false)}
          />
        )}
      </>
    )
  }

  // ── VUE CHAPITRE ──
  const selChapter = chapters.find(c => c.id === selectedChapterId)
  const chZones    = selChapter?.zoneIds.map(id => zones.find(z => z.id === id)).filter(Boolean) ?? []
  const selZone    = chZones.find(z => z.id === selectedZoneId) ?? null

  return (
    <>
      <div className="adv-chapter-view">

        {/* En-tête */}
        <div className="adv-cv-header">
          <button
            className="adv-cv-back"
            onClick={() => selZone ? setSelectedZoneId(null) : setSelectedChapterId(null)}
          >
            ← {selZone ? tField(selChapter, 'label') : t('adv.chapters')}
          </button>
          <span className="adv-cv-title">
            {selZone ? tField(selZone, 'name') : tField(selChapter, 'label')}
          </span>
        </div>

        {/* Grille de zones */}
        {!selZone && (
          <div className="adv-grid-scroll">
          <div className="adv-zone-grid">
            {chZones.map(zone => {
              const comp  = zoneCompletion(zone)
              const pct   = comp?.total > 0 ? (comp.done / comp.total) * 100 : 0
              const isDone = comp?.total > 0 && comp.done === comp.total
              return (
                <button
                  key={zone.id}
                  className={['adv-zt', isDone ? 'adv-zt-done' : ''].filter(Boolean).join(' ')}
                  style={{ '--gc': game.color }}
                  onClick={() => setSelectedZoneId(zone.id)}
                >
                  <img
                    src={`/assets/zones/${zone.id}.png`}
                    alt=""
                    className="adv-zt-bg"
                    onError={e => { e.currentTarget.style.display = 'none' }}
                  />
                  <div className="adv-zt-overlay" />
                  {isDone && <span className="adv-zt-done-tag">{t('adv.done')}</span>}
                  <div className="adv-zt-content">
                    <div className="adv-zt-icon">{zone.icon}</div>
                    <div className="adv-zt-label">{tField(zone, 'name')}</div>
                    {comp?.total > 0 && (
                      <div className="adv-zt-bar-wrap">
                        <div className="adv-zt-bar">
                          <div className="adv-zt-fill" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="adv-zt-pct">{comp.done}/{comp.total}</span>
                      </div>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
          </div>
        )}

        {/* Détail zone */}
        {selZone && (
          <div className="adv-cv-panel">
            <ZoneDetailPanel
              zone={selZone}
              game={game}
              isChecked={isChecked}
              toggleCheck={toggleCheck}
              caught={caught}
              toggleCaught={toggleCaught}
              obtainedMegas={obtainedMegas}
              toggleMega={toggleMega}
              pokemon={pokemon}
              zoneCompletion={zoneCompletion}
              filterChecklist={filterChecklist}
              filterTrainers={filterTrainers}
            />
          </div>
        )}

      </div>
      {badgePopupEl}
      {trophyModal && (
        <TrophyModal
          game={game}
          profile={profile}
          pokemon={pokemon}
          onClose={() => setTrophyModal(false)}
        />
      )}
    </>
  )
}

// ─── DONNÉES LÉGENDAIRES ─────────────────────────────────────────────────────

// ─── COMPOSANT : ONGLET LÉGENDAIRES ──────────────────────────────────────────

// ─── COMPOSANT : PAGE LORE LÉGENDAIRE ────────────────────────────────────────

function LegendaryLorePage({ lgd, game, caught, toggleCaught, onBack, pokemon = [] }) {
  const t = useT()
  const tField = useTField()
  const { locale } = useLocale()
  const lgdName = locale !== 'fr' ? (pokemon.find(p => p.id === lgd.id)?.name || lgd.nameFr) : lgd.nameFr
  const tc1 = TYPE_COLORS[lgd.types[0]] || '#888'
  const tc2 = TYPE_COLORS[lgd.types[1]] || tc1
  const isCaught = caught?.has(lgd.id) ?? false
  const spriteUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${lgd.id}.png`

  return (
    <div className="llp-page" style={{ '--tc1': tc1, '--tc2': tc2, '--gc': game.color }}>
      <div className="llp-bg" aria-hidden="true">
        <div className="llp-orb llp-orb-1" />
        <div className="llp-orb llp-orb-2" />
        <div className="llp-orb llp-orb-3" />
        <img className="llp-bg-art" src={spriteUrl} alt="" />
      </div>

      <button className="llp-back" onClick={onBack}>{t('lore.back')}</button>

      <div className="llp-hero">
        <div className="llp-aura" />
        <img className="llp-artwork" src={spriteUrl} alt={lgdName} />
      </div>

      <div className="llp-content">
        <div className="llp-identity">
          <div className="llp-types">
            {lgd.types.map(tp => (
              <span key={tp} className="pdx-badge" style={{ '--tc': TYPE_COLORS[tp] || '#888' }}>{t(`type.${tp}`)}</span>
            ))}
          </div>
          <h1 className="llp-name">{lgdName}</h1>
          <p className="llp-num">N°{String(lgd.id).padStart(3, '0')}</p>
        </div>

        {lgd.lore && (
          <section className="llp-section">
            <h2 className="llp-section-title"><span className="llp-section-icon">⚡</span>{t('lore.section_myth')}</h2>
            <p className="llp-lore-text">{tField(lgd, 'lore')}</p>
          </section>
        )}

        {lgd.anecdotes?.length > 0 && (
          <section className="llp-section">
            <h2 className="llp-section-title"><span className="llp-section-icon">📖</span>{t('lore.section_trivia')}</h2>
            <ul className="llp-anecdotes">
              {(tField(lgd, 'anecdotes') || lgd.anecdotes).map((a, i) => (
                <li key={i} className="llp-anecdote" style={{ animationDelay: `${0.35 + i * 0.1}s` }}>
                  <span className="llp-anecdote-bullet">◆</span>
                  {a}
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="llp-section">
          <h2 className="llp-section-title"><span className="llp-section-icon">🎮</span>{t('lore.section_game')}</h2>
          <div className="llp-game-info">
            <div className="llp-game-row">
              <span className="llp-game-label">{t('lore.location')}</span>
              <span className="llp-game-val">{tField(lgd, 'location')}</span>
            </div>
            {lgd.level && (
              <div className="llp-game-row">
                <span className="llp-game-label">{t('lore.level')}</span>
                <span className="llp-game-val">{lgd.level}</span>
              </div>
            )}
            {lgd.tip && (
              <div className="llp-game-tip">
                <span className="llp-tip-icon">💡</span>
                <p>{tField(lgd, 'tip')}</p>
              </div>
            )}
          </div>
        </section>

        <button
          className={`llp-catch-btn${isCaught ? ' caught' : ''}`}
          onClick={() => toggleCaught(lgd.id)}
        >
          {isCaught ? t('lore.caught') : t('lore.catch')}
        </button>
      </div>
    </div>
  )
}

// ─── COMPOSANT : ONGLET LÉGENDAIRES ──────────────────────────────────────────

// ─── COMPOSANT : MÉGA-ÉVOLUTIONS ─────────────────────────────────────────────

const MGA_STARTER_ID_TO_FR = { 252: 'Arcko', 255: 'Poussifeu', 258: 'Gobou' }

const MGA_GROUP_META = {
  hoenn: { labelKey: 'mga.group.hoenn', icon: '💎' },
  xy:    { labelKey: 'mga.group.xy',    icon: '✨' },
}


function MegasTab({ game, obtainedMegas, toggleMega, pokemon = [] }) {
  const t = useT()
  const tField = useTField()
  const { locale } = useLocale()
  const pokeMap = useMemo(() => Object.fromEntries(pokemon.map(p => [p.id, p])), [pokemon])
  const obtained   = obtainedMegas ?? new Set()
  const [openStone, setOpenStone] = useState(null)
  const [locStone,  setLocStone]  = useState(null)

  const megas = game.megas ?? []

  function toggle(stone) { toggleMega?.(stone) }

  function openTile(stone) {
    if (openStone === stone) { setOpenStone(null); setLocStone(null) }
    else { setOpenStone(stone); setLocStone(null) }
  }

  useEffect(() => {
    const fn = () => { setOpenStone(null); setLocStone(null) }
    document.addEventListener('click', fn)
    return () => document.removeEventListener('click', fn)
  }, [])

  const total      = megas.length
  const nbObtained = megas.filter(m => obtained.has(m.stone)).length

  const grouped = Object.entries(
    megas.reduce((acc, m) => { (acc[m.group] ??= []).push(m); return acc }, {})
  ).sort(([a]) => a === 'hoenn' ? -1 : 1)

  const renderTile = (m) => {
    const got           = obtained.has(m.stone)
    const isOpen        = openStone === m.stone
    const showLoc       = locStone  === m.stone
    const megaSpriteUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${m.megaId ?? m.id}.png`
    const fallbackUrl   = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${m.id}.png`

    return (
      <button
        key={m.stone}
        className={['adv-ch-tile', got ? 'lgd-tile-caught' : ''].filter(Boolean).join(' ')}
        style={{ '--gc': game.color }}
        onClick={e => { e.stopPropagation(); openTile(m.stone) }}
      >
        <img
          src={megaSpriteUrl}
          alt={locale !== 'fr' ? (pokeMap[m.id]?.name || m.nameFr) : m.nameFr}
          className={`adv-ch-tile-bg${got ? '' : ' lgd-img-hidden'}`}
          onError={e => { e.currentTarget.src = fallbackUrl; e.currentTarget.onerror = null }}
        />
        <div className="adv-ch-tile-overlay" />
        {got && <span className="adv-ch-tile-done-tag">{t('mga.obtained')}</span>}
        {m.starterReq && <span className="mga-tile-starter">🌱 {m.starterReq}</span>}
        <div className="adv-ch-tile-content">
          <div className="adv-ch-tile-label">{t('mga.prefix')}{locale !== 'fr' ? (pokeMap[m.id]?.name || m.nameFr) : m.nameFr}</div>
          <div className="adv-ch-tile-meta">{m.stone}</div>
        </div>

        {isOpen && (
          <div className="mga-action-panel" onClick={e => e.stopPropagation()}>
            {showLoc ? (
              <>
                <p className="mga-loc-text">📍 {tField(m, 'location')}</p>
                <button className="mga-cta mga-cta-back" onClick={() => setLocStone(null)}>{t('mga.back')}</button>
              </>
            ) : (
              <>
                <button
                  className={`mga-cta ${got ? 'mga-cta-remove' : 'mga-cta-got'}`}
                  style={{ '--gc': game.color }}
                  onClick={() => { toggle(m.stone); setOpenStone(null) }}
                >
                  {got ? t('mga.remove') : t('mga.got')}
                </button>
                <button
                  className="mga-cta mga-cta-loc"
                  onClick={() => setLocStone(m.stone)}
                >
                  {t('mga.how')}
                </button>
              </>
            )}
          </div>
        )}
      </button>
    )
  }

  return (
    <div className="lgd-wrapper mga-wrapper" style={{ height: '100%' }} onClick={() => { setOpenStone(null); setLocStone(null) }}>
      <div className="lgd-header">
        <h2 className="lgd-title">{t('mga.title')}</h2>
        <p className="lgd-subtitle">{t('mga.subtitle', { obtained: nbObtained, total })}</p>
      </div>

      {grouped.map(([key, items]) => {
        const meta          = MGA_GROUP_META[key] ?? { labelKey: null, icon: '💠' }
        const groupObtained = items.filter(m => obtained.has(m.stone)).length
        return (
          <div key={key}>
            <div className="lgd-group-header" style={{ '--gc': game.color }}>
              <span className="lgd-group-icon">{meta.icon}</span>
              <span className="lgd-group-label">{meta.labelKey ? t(meta.labelKey) : key}</span>
              <span className="lgd-group-count">{groupObtained} / {items.length}</span>
            </div>
            <div className="adv-ch-grid">
              {items.map(renderTile)}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function LegendairesTab({ game, caught, toggleCaught, unavailableBeastIds = new Set(), onSelectLegendary, pokemon = [] }) {
  const t = useT()
  const tField = useTField()
  const { locale } = useLocale()
  const pokeMap = useMemo(() => Object.fromEntries(pokemon.map(p => [p.id, p])), [pokemon])
  const legendaries = (game.legendaries ?? []).filter(l => !unavailableBeastIds.has(l.id))

  const badgeCount = (() => {
    try { return JSON.parse(localStorage.getItem(`badges-${game.id}`) || '[]').length }
    catch { return 0 }
  })()

  if (!legendaries.length) {
    return (
      <div className="lgd-empty">
        <div className="lgd-empty-icon">✨</div>
        <p>{t('lgd.empty')}</p>
      </div>
    )
  }

  const nbCaught = legendaries.filter(l => caught?.has(l.id)).length

  const GROUP_META = {
    hoenn: { labelKey: 'lgd.group.hoenn', icon: '🌊' },
    eon:   { labelKey: 'lgd.group.eon',   icon: '🌀' },
    event: { labelKey: 'lgd.group.event', icon: '🎫' },
  }
  const hasGroups = legendaries.some(l => l.group)
  const groups = hasGroups
    ? Object.entries(
        legendaries.reduce((acc, l) => {
          const key = l.group ?? 'other'
          ;(acc[key] ??= []).push(l)
          return acc
        }, {})
      ).sort(([a], [b]) => {
        const order = ['hoenn', 'eon', 'event', 'other']
        return order.indexOf(a) - order.indexOf(b)
      })
    : [['', legendaries]]

  const renderTile = (lgd, idx) => {
    const isCaught  = caught?.has(lgd.id) ?? false
    const isLocked  = !isCaught && lgd.storyReq != null && lgd.storyReq > badgeCount
    const spriteUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${lgd.id}.png`

    if (isLocked) {
      return (
        <div
          key={`${lgd.id}-${idx}`}
          className="adv-ch-tile lgd-tile-locked"
          style={{ '--gc': game.color }}
        >
          <img src={spriteUrl} alt="" className="adv-ch-tile-bg adv-ch-tile-silhouette" />
          <div className="adv-ch-tile-overlay" />
          <div className="lgd-lock-overlay">
            <span className="lgd-lock-icon">?</span>
            <div className="adv-ch-tile-label lgd-lock-label">???</div>
            <div className="lgd-lock-req">{t('lgd.required_badges', { n: lgd.storyReq })}</div>
          </div>
        </div>
      )
    }

    return (
      <button
        key={`${lgd.id}-${idx}`}
        className={`adv-ch-tile${isCaught ? ' lgd-tile-caught' : ''}`}
        style={{ '--gc': game.color }}
        onClick={() => onSelectLegendary(lgd)}
      >
        <img
          src={`/assets/legendaries/${lgd.id}.png`}
          alt=""
          className={`adv-ch-tile-bg${isCaught ? '' : ' lgd-img-hidden'}`}
          onError={e => { e.currentTarget.style.display = 'none' }}
        />
        <div className="adv-ch-tile-overlay" />
        {isCaught && <span className="adv-ch-tile-done-tag">{t('lgd.caught')}</span>}
        <div className="adv-ch-tile-content">
          <div className="adv-ch-tile-label">{locale !== 'fr' ? (pokeMap[lgd.id]?.name || lgd.nameFr) : lgd.nameFr}</div>
          <div className="adv-ch-tile-meta">📍 {tField(lgd, 'location')}</div>
          <div style={{ display:'flex', gap:'4px', flexWrap:'wrap' }}>
            {lgd.types.map(tp => (
              <span key={tp} className="pdx-badge" style={{ '--tc': TYPE_COLORS[tp] || '#888' }}>
                {t(`type.${tp}`)}
              </span>
            ))}
          </div>
        </div>
      </button>
    )
  }

  return (
    <div className="lgd-wrapper" style={{ height: '100%' }}>
      <div className="lgd-header">
        <h2 className="lgd-title">{t('lgd.title')}</h2>
        <p className="lgd-subtitle">{t('lgd.subtitle', { caught: nbCaught, total: legendaries.length })}</p>
      </div>

      {groups.map(([key, items]) => (
        <div key={key}>
          {hasGroups && key && (
            <div className="lgd-group-header" style={{ '--gc': game.color }}>
              <span className="lgd-group-icon">{GROUP_META[key]?.icon ?? '✨'}</span>
              <span className="lgd-group-label">{GROUP_META[key]?.labelKey ? t(GROUP_META[key].labelKey) : key}</span>
              <span className="lgd-group-count">
                {items.filter(l => caught?.has(l.id)).length} / {items.length}
              </span>
            </div>
          )}
          <div className="adv-ch-grid">
            {items.map((lgd, i) => renderTile(lgd, i))}
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── COMPOSANT : TEAM POPUP ──────────────────────────────────────────────────

function TeamPopup({ game, onClose, onGoToPC }) {
  const { locale } = useLocale()
  const t = useT()
  const storageKey = `team-${game.id}`
  const [team, setTeam] = useState(() => {
    const saved = localStorage.getItem(storageKey)
    return saved ? JSON.parse(saved) : []
  })

  function remove(id) {
    const updated = team.filter(p => p.id !== id)
    setTeam(updated)
    localStorage.setItem(storageKey, JSON.stringify(updated))
  }

  return (
    <div className="team-popup-backdrop" onClick={onClose}>
      <div className="team-popup" onClick={e => e.stopPropagation()}>
        <div className="team-popup-header">
          <span className="team-popup-title" style={{ color: game.color }}>
            {t('team.title', { n: team.length })}
          </span>
          <button className="team-popup-close" onClick={onClose}>✕</button>
        </div>
        <div className="team-popup-slots">
          {Array.from({ length: 6 }, (_, i) => {
            const poke = team[i]
            return (
              <div
                key={i}
                className={`team-popup-slot${poke ? ' filled' : ''}`}
                onClick={() => poke && remove(poke.id)}
                title={poke ? t('team.remove', { name: locale !== 'fr' ? poke.name : poke.nameFr }) : t('team.empty')}
              >
                {poke ? (
                  <>
                    <img src={poke.sprite} alt={locale !== 'fr' ? poke.name : poke.nameFr} />
                    <span>{locale !== 'fr' ? poke.name : poke.nameFr}</span>
                  </>
                ) : (
                  <span className="team-popup-empty">+</span>
                )}
              </div>
            )
          })}
        </div>
        <button className="team-popup-pc-btn" style={{ '--gc': game.color }} onClick={() => { onClose(); onGoToPC() }}>
          {t('team.manage')}
        </button>
      </div>
    </div>
  )
}

// ─── COMPOSANT : BOÎTE PC ────────────────────────────────────────────────────

const BOX_COLS = 10
const BOX_ROWS = 5
const BOX_SIZE = BOX_COLS * BOX_ROWS // 50 slots per box

function PCBox({ game, pokemon, caught, onSelectPokemon }) {
  const t = useT()
  const { locale } = useLocale()
  const storageKey = `team-${game.id}`
  const [team, setTeam] = useState(() => {
    try { const s = localStorage.getItem(storageKey); return s ? JSON.parse(s) : [] }
    catch { return [] }
  })
  const [boxPage, setBoxPage] = useState(0)
  const [hovered, setHovered] = useState(null)
  const [search, setSearch] = useState('')

  function saveTeam(t) { setTeam(t); localStorage.setItem(storageKey, JSON.stringify(t)) }
  function toggleTeam(poke) {
    if (team.some(p => p.id === poke.id)) saveTeam(team.filter(p => p.id !== poke.id))
    else if (team.length < 6) saveTeam([...team, poke])
  }

  const caughtList = pokemon.filter(p => caught.has(p.id))
  const searching  = search.trim().length > 0
  const filtered   = searching
    ? caughtList.filter(p =>
        p.nameFr.toLowerCase().includes(search.toLowerCase()) ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        String(p.id).includes(search.trim())
      )
    : caughtList
  const totalBoxes = Math.max(1, Math.ceil(filtered.length / BOX_SIZE))
  const safePage   = Math.min(boxPage, totalBoxes - 1)
  const pageStart  = safePage * BOX_SIZE
  const slots      = Array.from({ length: BOX_SIZE }, (_, i) => filtered[pageStart + i] || null)
  const teamFull   = team.length >= 6

  return (
    <div className="pcbox-screen" style={{ '--gc': game.color }}>
      <div className="pcbox-layout">

        {/* ── Storage box ── */}
        <div className="pcbox-box">
          <div className="pcbox-box-header">
            <button
              className="pcbox-arrow"
              onClick={() => setBoxPage(p => Math.max(0, p - 1))}
              disabled={safePage === 0}
            >◀</button>
            {searching ? (
              <span className="pcbox-box-title">
                {t('pc.results', { n: filtered.length, s: filtered.length !== 1 ? 's' : '' })}
              </span>
            ) : (
              <span className="pcbox-box-title">
                {t('pc.box', { n: safePage + 1 })}
                <span className="pcbox-box-sub">{t('pc.box_count', { n: filtered.slice(pageStart, pageStart + BOX_SIZE).length })}</span>
              </span>
            )}
            <button
              className="pcbox-arrow"
              onClick={() => setBoxPage(p => Math.min(totalBoxes - 1, p + 1))}
              disabled={safePage === totalBoxes - 1}
            >▶</button>
          </div>

          <div className="pcbox-search-bar">
            <span className="pcbox-search-icon">🔍</span>
            <input
              className="pcbox-search-input"
              type="text"
              placeholder={t('pc.search_ph')}
              value={search}
              onChange={e => { setSearch(e.target.value); setBoxPage(0) }}
            />
            {searching && (
              <button className="pcbox-search-clear" onClick={() => setSearch('')}>✕</button>
            )}
          </div>

          <div className="pcbox-slots">
            {slots.map((poke, i) => {
              const inTeam = poke && team.some(t => t.id === poke.id)
              const dimmed = poke && !inTeam && teamFull
              return (
                <div
                  key={i}
                  className={`pcbox-slot${poke ? ' has-mon' : ''}${inTeam ? ' in-team' : ''}${dimmed ? ' dimmed' : ''}`}
                  onMouseEnter={() => poke && setHovered(poke)}
                  onMouseLeave={() => setHovered(null)}
                  onClick={() => poke && !dimmed && toggleTeam(poke)}
                  onContextMenu={e => { e.preventDefault(); poke && onSelectPokemon(poke.id) }}
                  title={
                    !poke    ? ''
                    : inTeam ? t('pc.remove_team', { name: locale !== 'fr' ? poke.name : poke.nameFr })
                    : dimmed ? t('pc.full')
                    :          t('pc.add_team', { name: locale !== 'fr' ? poke.name : poke.nameFr })
                  }
                >
                  {poke && <img src={poke.sprite} alt={locale !== 'fr' ? poke.name : poke.nameFr} />}
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Party panel ── */}
        <div className="pcbox-party-panel">
          <div className="pcbox-party-label">{t('pc.party')}</div>
          <div className="pcbox-party-list">
            {Array.from({ length: 6 }, (_, i) => {
              const poke = team[i]
              return (
                <div
                  key={i}
                  className={`pcbox-party-slot${poke ? ' has-mon' : ''}`}
                  onClick={() => poke && toggleTeam(poke)}
                  title={poke ? t('pc.remove', { name: locale !== 'fr' ? poke.name : poke.nameFr }) : ''}
                >
                  {poke && <img src={poke.sprite} alt={locale !== 'fr' ? poke.name : poke.nameFr} />}
                </div>
              )
            })}
          </div>

          <div className={`pcbox-hover-card${hovered ? ' visible' : ''}`}>
            {hovered ? (
              <>
                <img src={hovered.sprite} alt={locale !== 'fr' ? hovered.name : hovered.nameFr} />
                <div className="pcbox-hover-name">{locale !== 'fr' ? hovered.name : hovered.nameFr}</div>
                <div className="pcbox-hover-num">N°{String(hovered.id).padStart(3, '0')}</div>
              </>
            ) : (
              <span className="pcbox-hover-hint" style={{ whiteSpace: 'pre-line' }}>{t('pc.hover_hint')}</span>
            )}
          </div>

          {caughtList.length === 0 && (
            <div className="pcbox-empty-hint" style={{ whiteSpace: 'pre-line' }}>{t('pc.empty')}</div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── COMPOSANT : GAME SCREEN ─────────────────────────────────────────────────

// DEVICE_TABS est désormais calculé dans GameScreen (conditionnel sur game.megas)

const WIDGET_IDS = [
  { id: 'types',    icon: '🔥', labelKey: 'widget.types'   },
  { id: 'calc',     icon: '🎯', labelKey: 'widget.calc'    },
  { id: 'map',      icon: '🗾', labelKey: 'widget.map'     },
  { id: 'badges',   icon: '🏅', labelKey: 'widget.badges'  },
  { id: 'guide',    icon: '📚', labelKey: 'widget.guide'   },
  { id: 'trophies', icon: '🏆', labelKey: 'widget.trophies'},
  { id: 'resets',   icon: '🎲', labelKey: 'widget.resets'  },
  { id: 'moves',    icon: '📖', labelKey: 'widget.moves'   },
]

function GameScreen({ game, cart, onBack, isDark, toggleTheme, onTabChange, onOpenBugReport }) {
  const t = useT()
  const { locale, setLocale } = useLocale()
  const deviceTabs = [
    { key: 'aventure',    icon: '🗺️', labelKey: 'tab.aventure'    },
    { key: 'legendaires', icon: '✨',  labelKey: 'tab.legendaires' },
    ...(game.megas?.length ? [{ key: 'megas', icon: '💫', labelKey: 'tab.megas' }] : []),
    { key: 'pc',          icon: '🖥️',  labelKey: 'tab.pc'          },
    { key: 'pokedex',     icon: '📖',  labelKey: 'tab.pokedex'     },
  ]
  const [tab, setTabInternal] = useState('aventure')
  function setTab(tb) { setTabInternal(tb); onTabChange?.(deviceTabs.find(d => d.key === tb)?.labelKey ?? tb) }
  const [openWidget, setOpenWidget]           = useState(null)
  const [widgetDrawerOpen, setWidgetDrawerOpen] = useState(false)
  const [selectedPokemonId, setSelectedPokemonId] = useState(null)
  const [pokemon, setPokemon]         = useState([])
  const [loadProgress, setLoadProgress] = useState(0)
  const [loadingPokemon, setLoadingPokemon] = useState(true)
  const pokeMap = useMemo(() => Object.fromEntries(pokemon.map(p => [p.id, p])), [pokemon])

  // Profil du dresseur — null = onboarding pas encore fait
  const [profile, setProfile] = useState(() => {
    const saved = localStorage.getItem(`pjt-save-${game.id}`)
    return saved ? JSON.parse(saved) : null
  })

  // Chiens légendaires — disponibilité conditionnelle au starter
  const starterBeastMap     = game.starterBeastMap ?? {}
  const allBeastIds         = game.allBeastIds ?? []
  const availableBeastId    = profile ? (starterBeastMap[profile.starterId] ?? null) : null
  const unavailableBeastIds = availableBeastId
    ? new Set(allBeastIds.filter(id => id !== availableBeastId))
    : new Set()

  // Pokémon attrapés — partagé entre Aventure et Pokédex
  const [caught, setCaught] = useState(() => {
    const saved = localStorage.getItem(`pjt-caught-${game.id}`)
    return new Set(saved ? JSON.parse(saved) : [])
  })
  const [legendaryPopup, setLegendaryPopup] = useState(null) // lgd object | null

  // Méga-Gemmes obtenues — partagé entre Aventure et Mégas
  const [obtainedMegas, setObtainedMegas] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem(`megas-${game.id}`) || '[]')) }
    catch { return new Set() }
  })
  const [megaPopup, setMegaPopup] = useState(null) // mega object | null

  function toggleMega(stoneKey) {
    const wasObtained = obtainedMegas.has(stoneKey)
    setObtainedMegas(prev => {
      const updated = new Set(prev)
      if (updated.has(stoneKey)) updated.delete(stoneKey)
      else updated.add(stoneKey)
      localStorage.setItem(`megas-${game.id}`, JSON.stringify([...updated]))
      return updated
    })
    if (!wasObtained) {
      const mega = (game.megas ?? []).find(m => m.stone === stoneKey)
      if (mega) setMegaPopup(mega)
    }
  }

  function toggleCaught(id) {
    const wasCaught = caught.has(id)
    setCaught(prev => {
      const updated = new Set(prev)
      if (updated.has(id)) updated.delete(id)
      else updated.add(id)
      localStorage.setItem(`pjt-caught-${game.id}`, JSON.stringify([...updated]))
      return updated
    })
    if (!wasCaught) {
      const lgd = (game.legendaries ?? []).find(l => l.id === id)
      if (lgd) setLegendaryPopup(lgd)
    }
  }

  const [selectedLegendary, setSelectedLegendary] = useState(null)
  const [ejecting, setEjecting] = useState(false)
  const [whichOpen, setWhichOpen] = useState(false)
  const [teamPopupOpen, setTeamPopupOpen] = useState(false)

  // Badges nouvellement obtenus (sparkle)
  const [newBadgeIds, setNewBadgeIds] = useState(new Set())
  useEffect(() => {
    if (openWidget === 'badges' && newBadgeIds.size > 0) {
      const timer = setTimeout(() => setNewBadgeIds(new Set()), 4500)
      return () => clearTimeout(timer)
    }
  }, [openWidget, newBadgeIds.size])

  useEffect(() => {
    fetchAllPokemon(setLoadProgress).then(data => {
      setPokemon(data)
      setLoadingPokemon(false)
    })
  }, [])

  // ── Onboarding (premier lancement) ──
  if (!profile) {
    return (
      <OnboardingScreen
        game={game}
        onComplete={p => {
          // Sauvegarde du profil
          localStorage.setItem(`pjt-save-${game.id}`, JSON.stringify(p))
          // Ajoute le starter en première position de l'équipe
          const teamKey = `pjt-team-${game.id}`
          const starterEntry = {
            id:     p.starterId,
            name:   p.starterName.toLowerCase(),
            nameFr: p.starterName,
            types:  p.starterTypes,
            sprite: p.starterSprite,
          }
          localStorage.setItem(teamKey, JSON.stringify([starterEntry]))
          setProfile(p)
        }}
      />
    )
  }

  // ── Fiche détail Pokémon ──
  if (selectedPokemonId) {
    return (
      <PokemonDetail
        pokemonId={selectedPokemonId}
        game={game}
        onBack={() => setSelectedPokemonId(null)}
        onOpenBugReport={onOpenBugReport}
      />
    )
  }

  if (selectedLegendary) {
    return (
      <>
        <LegendaryLorePage
          lgd={selectedLegendary}
          game={game}
          caught={caught}
          toggleCaught={toggleCaught}
          onBack={() => setSelectedLegendary(null)}
          pokemon={pokemon}
        />
        <button className="bugrep-overlay-btn" onClick={onOpenBugReport} title="Signaler un bug" aria-label="Signaler un bug">🐛</button>
      </>
    )
  }

  function handleEject() {
    if (ejecting) return
    setEjecting(true)
    setTimeout(() => onBack(), 500)
  }

  // ── Interface principale ──
  return (
    <div
      className={`game-device${ejecting ? ' game-device-exiting' : ''}`}
      style={{ '--game-color': game.color, '--game-gradient': game.gradient }}
    >
      {/* En-tête */}
      <header className="gd-header">
        {/* Slot cartouche — masqué sur mobile */}
        <div className="gd-slot">
          {cart && (
            <div
              className={`gd-mini-cart${ejecting ? ' gd-mini-cart-ejecting' : ''}`}
              onClick={handleEject}
              title={t('header.eject')}
            >
              <GBACart
                id={cart.id}
                name={cart.name}
                color={cart.color}
                gradient={cart.gradient}
                accent={cart.accent}
                available={true}
              />
            </div>
          )}
        </div>

        <div className="gd-header-center">
          <button
            className={`gd-hdr-btn${widgetDrawerOpen ? ' gd-hdr-btn--active' : ''}`}
            onClick={() => setWidgetDrawerOpen(o => !o)}
          >
            <span className="gd-hdr-btn-icon">🧩</span>
            <span>{t('header.tools')}</span>
          </button>
        </div>

        <div className="gd-header-right">
          <BmacButton size="small" />
          <button
            className={`theme-switch${isDark ? ' theme-switch--dark' : ''}`}
            onClick={toggleTheme}
            role="switch"
            aria-checked={isDark}
            title={isDark ? t('header.theme_day') : t('header.theme_night')}
            aria-label={isDark ? t('header.theme_day') : t('header.theme_night')}
          >
            <span className="theme-switch-thumb">{isDark ? '🌙' : '☀️'}</span>
          </button>
          <button
            className="theme-toggle-btn"
            onClick={() => setLocale(locale === 'fr' ? 'en' : 'fr')}
            title={t('header.lang')}
            aria-label={t('header.lang')}
            style={{ fontSize: '1.25rem', lineHeight: 1 }}
          >
            {locale === 'fr' ? '🇬🇧' : '🇫🇷'}
          </button>
        </div>
      </header>

      {/* Contenu de l'onglet actif */}
      <main className="gd-screen">
        {tab === 'aventure' && <AdventureTab game={game} profile={profile} pokemon={pokemon} caught={caught} toggleCaught={toggleCaught} obtainedMegas={obtainedMegas} toggleMega={toggleMega} onBadgeEarned={id => setNewBadgeIds(prev => new Set([...prev, id]))} onSwitchTab={setTab} />}
        {tab !== 'aventure' && (
          <div className="gd-scroll-pane">
            {tab === 'pc' && (
              <PCBox
                game={game}
                pokemon={pokemon}
                caught={caught}
                onSelectPokemon={setSelectedPokemonId}
              />
            )}
            {tab === 'pokedex' && (
              <Pokedex
                game={game}
                pokemon={pokemon}
                loading={loadingPokemon}
                loadProgress={loadProgress}
                onSelectPokemon={setSelectedPokemonId}
                caught={caught}
                toggleCaught={toggleCaught}
                unavailableBeastIds={unavailableBeastIds}
              />
            )}
            {tab === 'legendaires' && <LegendairesTab game={game} caught={caught} toggleCaught={toggleCaught} unavailableBeastIds={unavailableBeastIds} onSelectLegendary={setSelectedLegendary} pokemon={pokemon} />}
            {tab === 'megas'       && <MegasTab game={game} profile={profile} obtainedMegas={obtainedMegas} toggleMega={toggleMega} pokemon={pokemon} />}
          </div>
        )}
      </main>

      {/* Navigation */}
      <nav className="gd-nav">
        {/* Bouton Outils — visible uniquement sur mobile (dans la nav), caché sur desktop */}
        <button
          className={`gd-tab gd-tab-tools${widgetDrawerOpen ? ' gd-tab-active' : ''}`}
          onClick={() => setWidgetDrawerOpen(o => !o)}
        >
          <span className="gd-tab-icon">🧩</span>
          <span className="gd-tab-label">{t('header.tools')}</span>
        </button>
        {deviceTabs.map(dt => (
          <button
            key={dt.key}
            className={`gd-tab ${tab === dt.key ? 'gd-tab-active' : ''}`}
            onClick={() => setTab(dt.key)}
          >
            <span className="gd-tab-icon">{dt.icon}</span>
            <span className="gd-tab-label">{t(dt.labelKey)}</span>
          </button>
        ))}
      </nav>

      {/* Widget Picker Drawer */}
      {widgetDrawerOpen && (
        <div className="wdg-backdrop" onClick={() => setWidgetDrawerOpen(false)}>
          <div className="wdg-drawer" onClick={e => e.stopPropagation()}>
            <div className="wdg-drawer-handle" />
            <p className="wdg-drawer-title">{t('header.tools')}</p>
            <div className="wdg-grid">
              {WIDGET_IDS.map(w => (
                <button
                  key={w.id}
                  className="wdg-card"
                  onClick={() => { setOpenWidget(w.id); setWidgetDrawerOpen(false) }}
                >
                  <span className="wdg-card-icon">{w.icon}</span>
                  <span className="wdg-card-label">{t(w.labelKey)}</span>
                </button>
              ))}
              <button
                className="wdg-card"
                onClick={() => { setWhichOpen(true); setWidgetDrawerOpen(false) }}
              >
                <span className="wdg-card-icon">⚔️</span>
                <span className="wdg-card-label">{t('header.who')}</span>
              </button>
              <button
                className="wdg-card"
                onClick={() => { setTeamPopupOpen(true); setWidgetDrawerOpen(false) }}
              >
                <span className="wdg-card-icon">⚡</span>
                <span className="wdg-card-label">{t('header.team')}</span>
              </button>
            </div>
            <button
              className="wdg-bug-btn"
              onClick={() => { onOpenBugReport(); setWidgetDrawerOpen(false) }}
            >
              🐛 {t('header.bug')}
            </button>
          </div>
        </div>
      )}

      {/* Widget Fullscreen Overlay */}
      {openWidget && (
        <div className="wdg-overlay">
          {openWidget === 'map' ? (
            <button className="wdg-map-close" onClick={() => setOpenWidget(null)}>✕</button>
          ) : (
            <div className="wdg-overlay-header">
              <button className="wdg-overlay-close" onClick={() => setOpenWidget(null)}>✕</button>
              <span className="wdg-overlay-title">
                {WIDGET_IDS.find(w => w.id === openWidget)?.icon}{' '}
                {t(WIDGET_IDS.find(w => w.id === openWidget)?.labelKey ?? '')}
              </span>
            </div>
          )}
          <div className={`wdg-overlay-body${openWidget === 'map' ? ' wdg-overlay-body--map' : ''}`}>
            {openWidget === 'types'   && <TypesTable />}
            {openWidget === 'calc'    && <CaptureCalcWidget />}
            {openWidget === 'badges'  && <Badges game={game} newBadgeIds={newBadgeIds} />}
            {openWidget === 'map'     && <KantoMap game={game} onNavigate={() => setOpenWidget(null)} />}
            {openWidget === 'guide'   && <GuideWidget />}
            {openWidget === 'trophies'&& <TrophyWidget game={game} />}
            {openWidget === 'resets'  && <SoftResetWidget game={game} legendaries={(game.legendaries ?? []).filter(l => !unavailableBeastIds.has(l.id))} />}
            {openWidget === 'moves'   && <MovesWidget game={game} />}
          </div>
        </div>
      )}

      {/* Outil : Quel Pokémon envoyer ? */}
      {teamPopupOpen && (
        <TeamPopup
          game={game}
          onClose={() => setTeamPopupOpen(false)}
          onGoToPC={() => setTab('pc')}
        />
      )}

      <WhichPokemon game={game} pokemon={pokemon} open={whichOpen} onOpenChange={setWhichOpen} />

      {/* Popup célébration méga-gemme */}
      {megaPopup && (
        <div className="lgd-popup-backdrop" onClick={() => setMegaPopup(null)}>
          <div className="lgd-popup" style={{ '--tc': game.color }} onClick={e => e.stopPropagation()}>
            <div className="lgd-popup-sparkles" aria-hidden="true">
              {['✦','✦','✦','✦','✦','✦','✦','✦'].map((s, i) => (
                <span key={i} className="lgd-popup-spark" style={{ '--i': i }}>{s}</span>
              ))}
            </div>
            <div className="lgd-popup-sprite-wrap">
              <img
                className="lgd-popup-sprite"
                src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${megaPopup.megaId ?? megaPopup.id}.png`}
                alt={`Méga-${locale !== 'fr' ? (pokeMap[megaPopup.id]?.name || megaPopup.nameFr) : megaPopup.nameFr}`}
              />
            </div>
            <p className="lgd-popup-congrats">{t('popup.mga.congrats')}</p>
            <p className="lgd-popup-name">{t('mga.prefix')}{locale !== 'fr' ? (pokeMap[megaPopup.id]?.name || megaPopup.nameFr) : megaPopup.nameFr}</p>
            <p className="lgd-popup-msg">
              {t('popup.mga.pre')}<strong>{megaPopup.stone}</strong>{' '}
              {t('popup.mga.added')}{' '}
              <strong>{t('popup.mga.menu')}</strong>.
            </p>
            <div className="lgd-popup-actions">
              <button
                className="lgd-popup-btn lgd-popup-btn--primary"
                onClick={() => { setMegaPopup(null); setTab('megas') }}
              >
                {t('popup.mga.view')}
              </button>
              <button className="lgd-popup-btn" onClick={() => setMegaPopup(null)}>
                {t('popup.mga.continue')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Popup célébration légendaire */}
      {legendaryPopup && (
        <div className="lgd-popup-backdrop" onClick={() => setLegendaryPopup(null)}>
          <div className="lgd-popup" style={{ '--tc': TYPE_COLORS[legendaryPopup.types[0]] || '#888' }} onClick={e => e.stopPropagation()}>
            <div className="lgd-popup-sparkles" aria-hidden="true">
              {['✦','✦','✦','✦','✦','✦','✦','✦'].map((s, i) => (
                <span key={i} className="lgd-popup-spark" style={{ '--i': i }}>{s}</span>
              ))}
            </div>
            <div className="lgd-popup-sprite-wrap">
              <img
                className="lgd-popup-sprite"
                src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${legendaryPopup.id}.png`}
                alt={locale !== 'fr' ? (pokeMap[legendaryPopup.id]?.name || legendaryPopup.nameFr) : legendaryPopup.nameFr}
              />
            </div>
            <p className="lgd-popup-congrats">{t('popup.lgd.congrats')}</p>
            <p className="lgd-popup-name">{locale !== 'fr' ? (pokeMap[legendaryPopup.id]?.name || legendaryPopup.nameFr) : legendaryPopup.nameFr}</p>
            <p className="lgd-popup-msg">
              {t('popup.lgd.added')}
            </p>
            <div className="lgd-popup-actions">
              <button
                className="lgd-popup-btn lgd-popup-btn--primary"
                onClick={() => { setLegendaryPopup(null); setTab('legendaires') }}
              >
                {t('popup.lgd.view')}
              </button>
              <button className="lgd-popup-btn" onClick={() => setLegendaryPopup(null)}>
                {t('popup.lgd.continue')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── COMPOSANT : APP (HOME) ───────────────────────────────────────────────────

function App() {
  const [selectedGame,    setSelectedGame]    = useState(null)
  const [activeCart,      setActiveCart]      = useState(null)
  const [returningCartId, setReturningCartId] = useState(null)
  const [currentPage,     setCurrentPage]     = useState('Accueil')
  const [bugReportOpen,   setBugReportOpen]   = useState(false)
  const [isDark, setIsDark] = useState(
    () => document.documentElement.classList.contains('dark')
  )

  function toggleTheme() {
    document.body.classList.add('theme-transition')
    const next = !isDark
    if (next) document.documentElement.classList.add('dark')
    else       document.documentElement.classList.remove('dark')
    localStorage.setItem('theme', next ? 'dark' : 'light')
    setIsDark(next)
    setTimeout(() => document.body.classList.remove('theme-transition'), 400)
  }

  function handleSelectGame(game, cart) {
    setSelectedGame(game)
    setActiveCart(cart)
    setCurrentPage(game.name)
  }

  function handleEject() {
    const cartId = activeCart?.id
    setSelectedGame(null)
    setActiveCart(null)
    setCurrentPage('Accueil')
    setReturningCartId(cartId)
    setTimeout(() => setReturningCartId(null), 900)
  }

  if (selectedGame) {
    return (
      <>
        <GameScreen
          game={selectedGame}
          cart={activeCart}
          onBack={handleEject}
          isDark={isDark}
          toggleTheme={toggleTheme}
          onTabChange={tab => setCurrentPage(`${selectedGame.name} — ${tab}`)}
          onOpenBugReport={() => setBugReportOpen(true)}
        />
        <BugReport open={bugReportOpen} onClose={() => setBugReportOpen(false)} page={currentPage} />
      </>
    )
  }

  return (
    <>
      <ConsoleScreen
        games={games}
        onSelectGame={handleSelectGame}
        returningCartId={returningCartId}
        onOpenBugReport={() => setBugReportOpen(true)}
      />
      <BugReport open={bugReportOpen} onClose={() => setBugReportOpen(false)} page="Accueil" />
    </>
  )
}

export default App
