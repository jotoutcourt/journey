// Progression : chaque niveau demande un peu plus d'XP que le précédent.
export const needFor = (level) => 100 + 60 * (level - 1)

export function levelInfo(xp = 0) {
  let level = 1, acc = 0
  while (xp >= acc + needFor(level)) { acc += needFor(level); level++ }
  return { level, into: xp - acc, need: needFor(level), title: titleFor(level) }
}

const TITLES = [
  [30, 'Légende'], [20, 'Maître'], [15, 'Expert'], [10, 'Connaisseur'],
  [6, 'Initié'], [3, 'Apprenti'], [1, 'Débutant'],
]
export const titleFor = (level) => TITLES.find(([min]) => level >= min)[1]
