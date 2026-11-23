// Stickers du livre : un par thème, débloqué au dernier titre du thème (niveau 15).
import { levelInfo, needFor } from './levels.js'

export const STICKER_LEVEL = 15
// XP de thème nécessaire pour débloquer le sticker (6 860 au niveau 15)
export const STICKER_XP = Array.from({ length: STICKER_LEVEL - 1 }, (_, i) => needFor(i + 1)).reduce((a, b) => a + b, 0)
export const STICKERS = [
  { id: 'swiftie', topic: 'taylor-swift', name: 'Kraken Swiftie' },
  { id: 'directioner', topic: 'one-direction', name: 'Kraken Directioner' },
  { id: 'chirurgien', topic: 'c-greys', name: 'Kraken chirurgien' },
  { id: 'tribut', topic: 'hunger-games', name: 'Kraken tribut' },
  { id: 'chef', topic: 'ici-tout-commence', name: 'Kraken chef étoilé' },
  { id: 'enchante', topic: 'c-disney', name: 'Kraken enchanté' },
  { id: 'erudit', topic: 'culture-g', name: 'Kraken érudit' },
  { id: 'artiste', topic: 'art', name: 'Kraken de la Renaissance' },
  { id: 'tour-eiffel', topic: 'monuments', name: 'Kraken géant de Paris' },
  { id: 'central-perk', topic: 'c-friends', name: 'Kraken de Central Perk' },
  { id: 'pionniere', topic: 'petite-maison', name: 'Kraken de la prairie' },
  { id: 'roi-animaux', topic: 'animaux', name: 'Kraken roi des animaux' },
  { id: 'girlband', topic: 'pop-girlies', name: 'Kraken Pop Girlies' },
  { id: 'wisteria', topic: 'c-desperate', name: 'Kraken de Wisteria Lane' },
  { id: 'tapis-rouge', topic: 'cinema', name: 'Kraken du tapis rouge' },
  { id: 'buteur', topic: 'foot', name: 'Kraken buteur' },
  { id: 'labo', topic: 'sciences', name: 'Kraken de labo' },
  { id: 'dictee', topic: 'orthographe', name: 'Kraken de la dictée' },
].map(s => ({ ...s, img: `/stickers/${s.id}.webp`, png: `/stickers/${s.id}.png` }))

export const stickerFor = (topicId) => STICKERS.find(s => s.topic === topicId)
export const stickerById = (id) => STICKERS.find(s => s.id === id)

// Débloqué d'après la progression locale (le serveur revérifie avant de le coller)
export const unlockedLocally = (st) => STICKERS.filter(s => levelInfo(st.topicStats?.[s.topic]?.xp || 0).level >= STICKER_LEVEL)

// Télécharger un sticker sur le téléphone : partage de l'image (Enregistrer l'image / WhatsApp…) ou téléchargement
export async function saveSticker(s) {
  const blob = await (await fetch(s.png)).blob()
  const file = new File([blob], `kraken-${s.id}.png`, { type: 'image/png' })
  if (navigator.canShare?.({ files: [file] })) {
    try { await navigator.share({ files: [file], title: s.name }); return 'shared' } catch (e) { if (e?.name === 'AbortError') return 'cancel' }
  }
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url; a.download = file.name
  document.body.appendChild(a); a.click(); a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
  return 'downloaded'
}

// Décors du livre : gratuits et illimités, le joueur les pose (et les retire) où il veut
export const DECOR = ['etoiles-rouges', 'appareil-photo', 'smiley', 'etoiles', 'nuage', 'soleil', 'washi', 'bisou', 'tulipes',
  'boule-disco', 'couronne', 'coeur-fleche', 'cachet-coeur', 'chat', 'avion', 'van',
  'arc-en-ciel', 'grenouille', 'chat-rieur', 'telephone', 'monstre-vert', 'piments', 'mygale', 'monstre-bleu', 'alien', 'dino', 'lettres', 'ticket', 'fantome', 'bulles'].map(id => ({ id, img: `/book/deco/${id}.webp` }))
export const decorById = (id) => DECOR.find(d => d.id === id)
