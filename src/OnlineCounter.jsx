import { useEffect, useState, useRef } from 'react'

const SESSION_KEY = 'pjt-session-id'
const PING_INTERVAL = 45_000 // 45s

function getSessionId() {
  let id = sessionStorage.getItem(SESSION_KEY)
  if (!id) {
    id = Math.random().toString(36).slice(2) + Date.now().toString(36)
    sessionStorage.setItem(SESSION_KEY, id)
  }
  return id
}

async function ping() {
  try {
    const res = await fetch('/api/online', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: getSessionId() }),
    })
    if (!res.ok) return null
    const { count } = await res.json()
    return count
  } catch {
    return null
  }
}

export default function OnlineCounter() {
  const [count, setCount] = useState(null)
  const timer = useRef(null)

  useEffect(() => {
    let alive = true

    async function tick() {
      const n = await ping()
      if (alive && n !== null) setCount(n)
      if (alive) timer.current = setTimeout(tick, PING_INTERVAL)
    }

    tick()
    return () => {
      alive = false
      clearTimeout(timer.current)
    }
  }, [])

  if (count === null) return null

  return (
    <span className="online-counter">
      <span className="online-counter-dot" />
      {count} en ligne
    </span>
  )
}
