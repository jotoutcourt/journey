// Images personnalisées des cartes, ajoutées depuis l'Atelier.
// Stockées dans IndexedDB (trop lourdes pour localStorage), sur cet appareil.
import { useSyncExternalStore } from 'react'

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
    const store = db.transaction(STORE).objectStore(STORE)
    await new Promise((resolve, reject) => {
      const req = store.openCursor()
      req.onsuccess = () => {
        const cur = req.result
        if (!cur) return resolve()
        urls.set(cur.key, URL.createObjectURL(cur.value))
        cur.continue()
      }
      req.onerror = () => reject(req.error)
    })
    emit()
  } catch { /* IndexedDB indisponible : les illustrations générées restent */ }
}

// Redimensionne l'image (côté max 1000 px) pour garder un stockage léger.
async function shrink(file) {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  return new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.88))
}

export async function setImage(cardId, file) {
  const blob = await shrink(file)
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
