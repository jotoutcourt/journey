// Niveaux de rareté : symbole imprimé sur la carte, style visuel, valeur de recyclage.
export const RARITIES = {
  'commune':     { label: 'Commune',      symbol: '●',  layout: 'framed', foil: 'none',    dust: 1,  color: '#9aa0a6' },
  'peu-commune': { label: 'Peu commune',  symbol: '◆',  layout: 'framed', foil: 'none',    dust: 2,  color: '#5ec27a' },
  'rare':        { label: 'Rare',         symbol: '★',  layout: 'framed', foil: 'reverse', dust: 5,  color: '#5ec8ff' },
  'holo':        { label: 'Holo Rare',    symbol: '★H', layout: 'framed', foil: 'holo',    dust: 10, color: '#b388ff' },
  'ultra':       { label: 'Full Art',     symbol: '★★', layout: 'full',   foil: 'rainbow', dust: 25, color: '#ff7eb6' },
  'secrete':     { label: 'Secrète Gold', symbol: '★★★', layout: 'full',  foil: 'gold',    dust: 50, color: '#ffd166' },
}

export const RARITY_KEYS = Object.keys(RARITIES)

export const rarityRank = r => RARITY_KEYS.indexOf(r)
