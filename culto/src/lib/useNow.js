import { useEffect, useState } from 'react'

// Heure courante, rafraîchie régulièrement (vies qui se rechargent, minuit…)
export function useNow(every = 15000) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), every)
    const wake = () => setNow(Date.now())
    document.addEventListener('visibilitychange', wake)
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', wake) }
  }, [every])
  return now
}

export function fmtWait(ms) {
  const m = Math.max(1, Math.ceil(ms / 60000))
  return m >= 60 ? `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, '0')}` : `${m} min`
}
