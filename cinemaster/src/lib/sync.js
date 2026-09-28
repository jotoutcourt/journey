// Synchronisation de la collection avec le compte en ligne.
// Règle simple : la version la plus récente gagne.
// - Connexion sur un appareil qui a déjà une partie différente de celle en
//   ligne : le joueur choisit laquelle garder (`conflict`).
// - Ensuite : chaque changement est envoyé 2 s plus tard ; au retour sur
//   l'appli, on récupère la version en ligne si un autre appareil a joué.
// - Les cartes gagnées par des échanges (livraisons) sont ajoutées au passage.
import { useCallback, useEffect, useRef, useState } from 'react'
import { cloud, useAccount } from './cloud.js'
import { normalize } from './storage.js'

const hasProgress = s => s.opened > 0 || Object.keys(s.owned).length > 0

function applyDeliveries(state, list) {
  if (!list.length) return state
  const owned = { ...state.owned }
  for (const d of list) owned[d.card_id] = Math.max(0, (owned[d.card_id] || 0) + d.qty)
  return { ...state, owned }
}

export function useCloudSync(state, setState) {
  const { session } = useAccount()
  const uid = session?.user?.id
  const [status, setStatus] = useState('idle')   // idle | syncing | ok | error
  const [pending, setConflict] = useState(null)  // { uid, server } en attente du choix
  const conflict = pending && pending.uid === uid ? pending : null
  const ready = useRef(false)                    // réconciliation faite pour ce compte
  const latest = useRef(state)
  const pulled = useRef(null)                    // état venu du serveur (pas à renvoyer)
  useEffect(() => { latest.current = state }, [state])

  const deliver = useCallback(async () => {
    const list = await cloud.takeDeliveries()
    if (list.length) setState(s => applyDeliveries(s, list))
    return list
  }, [setState])

  // Compare la version locale et celle en ligne, garde la plus récente.
  const reconcile = useCallback(async ({ first }) => {
    setStatus('syncing')
    try {
      const server = await cloud.fetchSave()
      const local = latest.current
      const synced = cloud.lastSynced()
      if (!server) {
        await cloud.pushSave(local)
      } else if (first && synced === 0 && hasProgress(local)
        && JSON.stringify(local.owned) !== JSON.stringify(server.data.owned)) {
        setConflict({ uid, server })
        setStatus('idle')
        return
      } else if (server.updatedAt > synced) {
        const next = normalize(server.data)
        pulled.current = next
        setState(next)
        cloud.markSynced(server.updatedAt)
      } else if (local !== pulled.current) {
        await cloud.pushSave(local)
      }
      ready.current = true
      await deliver()
      setStatus('ok')
    } catch {
      setStatus('error')
    }
  }, [deliver, setState, uid])

  // connexion (ou changement de compte)
  useEffect(() => {
    ready.current = false
    if (!uid) return
    const t = setTimeout(() => reconcile({ first: true }), 0)
    return () => clearTimeout(t)
  }, [uid, reconcile])

  // envoi 2 s après chaque changement
  useEffect(() => {
    if (!uid || !ready.current || state === pulled.current) return
    const t = setTimeout(async () => {
      try { await cloud.pushSave(latest.current); setStatus('ok') } catch { setStatus('error') }
    }, 2000)
    return () => clearTimeout(t)
  }, [state, uid])

  // retour sur l'appli : un autre appareil a peut-être joué
  useEffect(() => {
    if (!uid) return
    const onVisible = () => { if (document.visibilityState === 'visible' && ready.current) reconcile({ first: false }) }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [uid, reconcile])

  // choix du joueur en cas de conflit
  const resolve = useCallback(async keep => {
    const server = conflict?.server
    setConflict(null)
    if (!server) return
    try {
      if (keep === 'server') {
        const next = normalize(server.data)
        pulled.current = next
        setState(next)
        cloud.markSynced(server.updatedAt)
      } else {
        await cloud.pushSave(latest.current)
      }
      ready.current = true
      await deliver()
      setStatus('ok')
    } catch {
      setStatus('error')
    }
  }, [conflict, deliver, setState])

  return { status, conflict, resolve, deliver }
}
