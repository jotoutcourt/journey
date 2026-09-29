// Images personnalisées des cartes et des boosters, ajoutées depuis l'Atelier.
//
// Trois stockages :
// - EN LIGNE (Supabase, site et appli installée) : espace de fichiers public
//   « card-images » + index `card_images`. Images vues par tous les joueurs,
//   sur tous les appareils ; seul un compte admin peut en déposer.
// - PARTAGÉ (page publiée sur claude.ai) : fichiers dans le stockage d'images
//   de la page (`assets`) + index `images/<clé>` dans sa base (`db`).
// - LOCAL (IndexedDB, cet appareil) : quand aucun des deux n'est disponible.
// À l'affichage : partagé, puis en ligne, puis local.
import { useSyncExternalStore } from 'react'
import { CARDS, UNIVERSES, fileKeys, migrateId, slug } from '../data/cards.js'
import { supabase } from './cloud.js'

const BUCKET = 'card-images'

const DB_NAME = 'cinemaster-images' // nom historique, conservé pour garder les images
const STORE = 'images'
const MAX_SIDE = 1000

const urls = new Map()        // cardId → object URL (images locales)
const shared = new Map()      // cardId → { asset, url } (images partagées)
const online = new Map()      // cardId → { path, url } (images en ligne)
let onlineAdmin = false       // compte connecté autorisé à déposer en ligne
let dbNs = null               // base partagée (null hors claude.ai)
let assetsNs = null           // stockage d'images (null si pas le droit d'écrire)
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

// Connexion au stockage partagé de la page publiée. Sans effet ailleurs.
export async function connectShared() {
  const claude = typeof window !== 'undefined' ? window.claude : null
  if (!claude?.use) return
  try {
    dbNs = await claude.use('db')
    if (!dbNs) return
    dbNs.collection('images').onSnapshot(snap => {
      shared.clear()
      for (const d of snap.docs) {
        const asset = d.data()?.asset
        if (typeof asset === 'string') shared.set(d.id, { asset, url: `/_blob/${asset}` })
      }
      emit()
    }, () => { /* abonnement terminé : on garde les images déjà connues */ })
    assetsNs = await claude.use('assets')
    emit()
  } catch { /* partage indisponible : mode local */ }
}

// Images en ligne (Supabase) : lues par tout le monde, sans compte.
const publicUrl = (path, t) => `${supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl}?v=${t}`

async function fetchOnline() {
  const { data, error } = await supabase.from('card_images').select('key, path, updated_at')
  if (error) return
  online.clear()
  for (const r of data) online.set(r.key, { path: r.path, url: publicUrl(r.path, Date.parse(r.updated_at)) })
  emit()
}

async function checkAdmin() {
  const { data } = await supabase.rpc('is_admin')
  onlineAdmin = data === true
  emit()
}

export function connectOnline() {
  if (!supabase) return
  fetchOnline()
  checkAdmin()
  supabase.auth.onAuthStateChange(() => { checkAdmin() })
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') fetchOnline()
  })
}

async function setOnline(cardId, blob) {
  const path = `${cardId}.jpg`
  const up = await supabase.storage.from(BUCKET).upload(path, blob, { upsert: true, contentType: 'image/jpeg', cacheControl: '3600' })
  if (up.error) throw up.error
  const updated = new Date().toISOString()
  const { error } = await supabase.from('card_images').upsert({ key: cardId, path, updated_at: updated })
  if (error) throw error
  online.set(cardId, { path, url: publicUrl(path, Date.parse(updated)) })
  emit()
}

// 'shared' (claude.ai) ou 'online' (admin connecté) : les images déposées
// deviennent celles de tout le monde. Sinon 'local' : cet appareil seulement.
export const storageMode = () => (dbNs && assetsNs ? 'shared' : onlineAdmin ? 'online' : 'local')

export async function setImage(cardId, file) {
  const blob = await shrink(file, formatFor(cardId))
  if (storageMode() === 'shared') return setShared(cardId, blob)
  if (storageMode() === 'online') return setOnline(cardId, blob)
  await tx('readwrite', s => s.put(blob, cardId))
  if (urls.has(cardId)) URL.revokeObjectURL(urls.get(cardId))
  urls.set(cardId, URL.createObjectURL(blob))
  emit()
}

async function setShared(cardId, blob) {
  const previous = shared.get(cardId)?.asset
  const { id } = await assetsNs.upload(blob, { type: 'image/jpeg' })
  await dbNs.doc(`images/${cardId}`).set({ asset: id, updatedAt: Date.now() })
  shared.set(cardId, { asset: id, url: `/_blob/${id}` })
  emit()
  // l'ancienne image n'est plus référencée : on la supprime
  if (previous && previous !== id) assetsNs.delete(previous).catch(() => {})
}

export async function removeImage(cardId) {
  if (storageMode() === 'shared' && shared.has(cardId)) {
    const { asset } = shared.get(cardId)
    await dbNs.doc(`images/${cardId}`).delete()
    shared.delete(cardId)
    emit()
    await assetsNs.delete(asset).catch(() => {})
    return
  }
  if (storageMode() === 'online' && online.has(cardId)) {
    const { path } = online.get(cardId)
    const { error } = await supabase.from('card_images').delete().eq('key', cardId)
    if (error) throw error
    online.delete(cardId)
    emit()
    await supabase.storage.from(BUCKET).remove([path]).catch(() => {})
    return
  }
  await tx('readwrite', s => s.delete(cardId))
  if (urls.has(cardId)) URL.revokeObjectURL(urls.get(cardId))
  urls.delete(cardId)
  emit()
}

const subscribe = l => (listeners.add(l), () => listeners.delete(l))

export function useCardImage(cardId) {
  return useSyncExternalStore(subscribe, () => shared.get(cardId)?.url ?? online.get(cardId)?.url ?? urls.get(cardId))
}

export function useImageCount() {
  useSyncExternalStore(subscribe, () => version)
  return new Set([...shared.keys(), ...online.keys(), ...urls.keys()]).size
}

export function useStorageMode() {
  useSyncExternalStore(subscribe, () => version)
  return storageMode()
}

// Images locales pas encore partagées (déposées avant l'activation du partage).
export function useLocalOnlyCount() {
  useSyncExternalStore(subscribe, () => version)
  const mode = storageMode()
  const remote = mode === 'online' ? online : shared
  return [...urls.keys()].filter(k => !remote.has(k)).length
}

// Envoie les images locales de cet appareil dans le stockage partagé.
export async function publishLocalImages(onProgress) {
  const mode = storageMode()
  if (mode === 'local') return 0
  const remote = mode === 'online' ? online : shared
  const keys = [...urls.keys()].filter(k => !remote.has(k))
  let done = 0
  for (const key of keys) {
    const blob = await tx('readonly', s => s.get(key))
    if (blob) await (mode === 'online' ? setOnline(key, blob) : setShared(key, blob))
    onProgress?.(++done, keys.length)
  }
  return done
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
