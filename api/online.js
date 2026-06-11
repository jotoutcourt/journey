// Vercel Serverless Function — tracks online users via periodic pings
// Sessions expire after 2 minutes of inactivity

const sessions = new Map() // sessionId -> lastSeen ms
const SESSION_TTL = 2 * 60 * 1000

function cleanup() {
  const now = Date.now()
  for (const [id, ts] of sessions) {
    if (now - ts > SESSION_TTL) sessions.delete(id)
  }
}

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST')
  res.setHeader('Cache-Control', 'no-store')

  if (req.method === 'OPTIONS') { res.status(200).end(); return }

  cleanup()

  if (req.method === 'POST') {
    const sessionId = req.body?.sessionId
    if (sessionId && typeof sessionId === 'string' && sessionId.length < 64) {
      sessions.set(sessionId, Date.now())
    }
  }

  res.status(200).json({ count: Math.max(1, sessions.size) })
}
