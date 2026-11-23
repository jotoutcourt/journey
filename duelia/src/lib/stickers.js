// Stickers du livre : un par thème, débloqué au dernier titre du thème (niveau 15).
import { levelInfo } from './levels.js'

export const STICKER_LEVEL = 15
export const STICKERS = [
  { id: 'swiftie', topic: 'taylor-swift', name: 'Kraken Swiftie' },
  { id: 'chirurgien', topic: 'c-greys', name: 'Kraken chirurgien' },
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
