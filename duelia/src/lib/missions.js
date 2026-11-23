// Missions quotidiennes : chargement depuis le serveur et petits utilitaires
import { useEffect, useState } from 'react'
import * as api from './account.js'

// Données des missions + rafraîchissement (au montage, au retour dans l'appli et à minuit)
export function useMissions(enabled) {
  const [data, setData] = useState(null)
  const refresh = () => api.getMissions().then(d => { if (d) setData(d) }).catch(() => {})
  useEffect(() => {
    if (!enabled) return
    refresh()
    const onVisible = () => { if (document.visibilityState === 'visible') refresh() }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [enabled])
  return [data, refresh, setData]
}

export const isDone = (m) => m.progress >= m.target
export const missionsToClaim = (data) => (data?.missions || []).filter(m => isDone(m) && !m.claimed).length

