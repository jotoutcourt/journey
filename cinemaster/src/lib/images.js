// Images personnalisées des cartes, ajoutées depuis l'Atelier.
// Stockées dans IndexedDB (trop lourdes pour localStorage), sur cet appareil.
import { useSyncExternalStore } from 'react'
import { CARDS, UNIVERSES, fileKeys, migrateId, slug } from '../data/cards.js'

const DB_NAME = 'cinemaster-images'
const STORE = 'images'
const MAX_SIDE = 1000

const urls = new Map()        // cardId → object URL
const listeners = new Set()
let version = 0

const emit = () => { version++; listeners.forEach(l => l()) }

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function tx(mode, fn) {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const t = db.transaction(STORE, mode)
    const result = fn(t.objectStore(STORE))
    t.oncomplete = () => resolve(result.result)
    t.onerror = () => reject(t.error)
  })
}

export async function loadImages() {
  try {
    const db = await openDb()
    const store = db.transaction(STORE, 'readwrite').objectStore(STORE)
    await new Promise((resolve, reject) => {
      const req = store.openCursor()
      req.onsuccess = () => {
        const cur = req.result
        if (!cur) return resolve()
        const key = migrateId(cur.key)
        if (key !== cur.key) {
          // ancienne clé numérotée : on déplace l'image sous l'identifiant stable
          store.put(cur.value, key)
          cur.delete()
        }
        urls.set(key, URL.createObjectURL(cur.value))
        cur.continue()
      }
      req.onerror = () => reject(req.error)
    })
    emit()
  } catch { /* IndexedDB indisponible : les illustrations générées restent */ }
}

// Redimensionne l'image (côté max 1000 px par défaut) pour garder un stockage
// léger. Avec `aspect` (largeur / hauteur), l'image est d'abord recadrée à ce
// format, centrée.
async function shrink(file, { maxSide = MAX_SIDE, aspect } = {}) {
  const bitmap = await createImageBitmap(file)
  let sx = 0, sy = 0, sw = bitmap.width, sh = bitmap.height
  if (aspect) {
    if (sw / sh > aspect) { sw = sh * aspect; sx = (bitmap.width - sw) / 2 }
    else { sh = sw / aspect; sy = (bitmap.height - sh) / 2 }
  }
  const scale = Math.min(1, maxSide / Math.max(sw, sh))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(sw * scale)
  canvas.height = Math.round(sh * scale)
  canvas.getContext('2d').drawImage(bitmap, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height)
  return new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.9))
}

// Format imposé pour certaines images : le booster complet a les proportions du sachet.
export const PACK_ASPECT = 58 / 100
const FORMATS = { full: { maxSide: 1600, aspect: PACK_ASPECT } }
const formatFor = id => (id.startsWith('booster-') && id.endsWith('-full') ? FORMATS.full : undefined)

export async function setImage(cardId, file) {
  const blob = await shrink(file, formatFor(cardId))
  await tx('readwrite', s => s.put(blob, cardId))
  if (urls.has(cardId)) URL.revokeObjectURL(urls.get(cardId))
  urls.set(cardId, URL.createObjectURL(blob))
  emit()
}

export async function removeImage(cardId) {
  await tx('readwrite', s => s.delete(cardId))
  if (urls.has(cardId)) URL.revokeObjectURL(urls.get(cardId))
  urls.delete(cardId)
  emit()
}

const subscribe = l => (listeners.add(l), () => listeners.delete(l))

export function useCardImage(cardId) {
  return useSyncExternalStore(subscribe, () => urls.get(cardId))
}

export function useImageCount() {
  useSyncExternalStore(subscribe, () => version)
  return urls.size
}

// Import groupé : chaque fichier est associé à la carte dont il porte le nom
// (« rachel-full.jpg », « rachel-green-gold.png », « derek-shepherd.jpg »…).
// Illustration dédiée d'un booster : « booster-star-wars.jpg » → clé « booster-sw »
export const packImageKey = u => `booster-${u}`
export const packFileName = u => `booster-${slug(UNIVERSES[u].name)}`
// Booster complet (de haut en bas) : « booster-star-wars-complet.jpg » → « booster-sw-full »
export const packFullKey = u => `booster-${u}-full`
export const packFullFileName = u => `${packFileName(u)}-complet`

const BY_FILE_KEY = new Map([
  ...CARDS.flatMap(c => fileKeys(c).map(k => [k, c])),
  ...Object.keys(UNIVERSES).map(u => [packFileName(u), { id: packImageKey(u) }]),
  ...Object.keys(UNIVERSES).map(u => [packFullFileName(u), { id: packFullKey(u) }]),
])

export function cardForFile(name) {
  return BY_FILE_KEY.get(slug(name.replace(/\.[^.]+$/, '')))
}

export async function importFiles(files, onProgress) {
  const images = [...files].filter(f => f.type.startsWith('image/') || /\.(jpe?g|png|webp|gif|avif)$/i.test(f.name))
  const imported = []
  const unknown = []
  for (const [i, file] of images.entries()) {
    const card = cardForFile(file.name)
    if (!card) {
      unknown.push(file.name)
    } else {
      try {
        await setImage(card.id, file)
        imported.push(card)
      } catch {
        unknown.push(file.name)
      }
    }
    onProgress?.(i + 1, images.length)
  }
  return { imported, unknown }
}
