// ─── DONNÉES GUIDE HeartGold / SoulSilver — Johto ────────────────────────────
// Structure identique à firered.js.
// Exclusivités de version : HG = 'HG', SS = 'SS'
// Les dresseurs sont identiques entre les deux versions.
// Seules les tables de rencontres sauvages diffèrent.

// ── Badges Johto ─────────────────────────────────────────────────────────────
export const JOHTO_BADGES = [
  { id: 1, name: 'Zen',     gym: 'Ecorpines',    leader: 'Germain'  },
  { id: 2, name: 'Ruche',   gym: 'Azalée',       leader: 'Égide'    },
  { id: 3, name: 'Plaine',  gym: 'Doublonville', leader: 'Marina'   },
  { id: 4, name: 'Brume',   gym: 'Ecortica',     leader: 'Mortimer' },
  { id: 5, name: 'Tempête', gym: 'Rotoculte',    leader: 'Katsuro'  },
  { id: 6, name: 'Minéral', gym: 'Oliville',     leader: 'Jasmin'   },
  { id: 7, name: 'Glace',   gym: 'Mahogville',   leader: 'Rémi'     },
  { id: 8, name: 'Montée',  gym: 'Quaydre',      leader: 'Ondine'   },
]

// ── Légendaires ───────────────────────────────────────────────────────────────
// HG : Lugia accessible librement, Ho-Oh après les 16 badges
// SS : Ho-Oh accessible librement, Lugia après les 16 badges
export const JOHTO_LEGENDARIES = [
  { id: 249, nameFr: 'Lugia',      location: 'Gouffre Argenté',    types: ['psychic','flying'], version: 'SS' },
  { id: 249, nameFr: 'Lugia',      location: 'Gouffre Argenté',    types: ['psychic','flying'], version: 'HG' },
  { id: 250, nameFr: 'Ho-Oh',      location: 'Tour Cramoisie',     types: ['fire','flying'],    version: 'HG' },
  { id: 250, nameFr: 'Ho-Oh',      location: 'Tour Cramoisie',     types: ['fire','flying'],    version: 'SS' },
  { id: 243, nameFr: 'Raikou',     location: 'Johto — itinérant',  types: ['electric'] },
  { id: 244, nameFr: 'Entei',      location: 'Johto — itinérant',  types: ['fire'] },
  { id: 245, nameFr: 'Suicune',    location: 'Lac Clarté / Johto', types: ['water'] },
  { id: 483, nameFr: 'Dialga',     location: 'Safari (Sinnoh)',    types: ['steel','dragon'],   version: 'HG' },
  { id: 484, nameFr: 'Palkia',     location: 'Safari (Sinnoh)',    types: ['water','dragon'],   version: 'SS' },
  { id: 382, nameFr: 'Kyogre',     location: "Grotte de l'Abîme",  types: ['water'],            version: 'SS' },
  { id: 383, nameFr: 'Groudon',    location: 'Grotte de la Terre', types: ['ground'],           version: 'HG' },
  { id: 380, nameFr: 'Latias',     location: 'Johto — itinérant',  types: ['dragon','psychic'], version: 'SS' },
  { id: 381, nameFr: 'Latios',     location: 'Johto — itinérant',  types: ['dragon','psychic'], version: 'HG' },
  { id: 384, nameFr: 'Rayquaza',   location: 'Tour Dracolosse',    types: ['dragon','flying'] },
  { id: 480, nameFr: 'Créhelf',    location: 'Ruines de Alph',     types: ['psychic'] },
  { id: 481, nameFr: 'Créfollet',  location: 'Marais Safari',      types: ['psychic'] },
  { id: 482, nameFr: 'Créfadet',   location: 'Zone de Combat',     types: ['psychic'] },
  { id: 487, nameFr: 'Giratina',   location: 'Tour Dracolosse',    types: ['ghost','dragon'] },
  { id: 486, nameFr: 'Regigigas',  location: 'Temple Onyx (Sinnoh)',types: ['normal'] },
  { id: 485, nameFr: 'Heatran',    location: 'Ile des Artisans',   types: ['fire','steel'] },
  { id: 488, nameFr: 'Cresselia',  location: 'Ile Plume',          types: ['psychic'] },
  { id: 491, nameFr: 'Darkrai',    location: 'Ile Sombre (Evento)',types: ['dark'] },
  { id: 492, nameFr: 'Shaymin',    location: 'Evento',             types: ['grass'] },
  { id: 493, nameFr: 'Arceus',     location: 'Evento',             types: ['normal'] },
]

// ── Starter beast map (starter id → bête légendaire liée) ─────────────────────
export const JOHTO_STARTER_BEAST_MAP = { 152: 245, 155: 244, 158: 243 }
export const JOHTO_BEAST_IDS = [243, 244, 245]

// ── Chapitres ─────────────────────────────────────────────────────────────────
// À remplir au fur et à mesure
export const CHAPTERS = []

// ── Zones ─────────────────────────────────────────────────────────────────────
// À remplir au fur et à mesure
// Chaque zone suit la même structure que firered.js :
// { id, name, type, icon, tip, encounters, items, checklist, trainers }
// encounters : [{ method, label?, pokemon: [{ id, nameFr, rate, levels?, version? }] }]
export const ZONES = []
