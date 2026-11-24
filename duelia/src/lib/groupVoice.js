// Voix à plusieurs (La Traque du Kraken) : une connexion directe vers chaque autre joueur humain (WebRTC « maillé »).
// Même négociation « polie » que la voix du Butin : le plus grand identifiant cède en cas d'offres croisées.
import { useCallback, useEffect, useRef, useState } from 'react'
import * as api from './account.js'

const ICE = [{ urls: ['stun:stun.l.google.com:19302', 'stun:stun.cloudflare.com:3478'] }]

function meter(ctx, stream) {
  const src = ctx.createMediaStreamSource(stream)
  const an = ctx.createAnalyser()
  an.fftSize = 512
  src.connect(an)
  const buf = new Uint8Array(an.fftSize)
  return () => {
    an.getByteTimeDomainData(buf)
    let sum = 0
    for (const v of buf) sum += (v - 128) * (v - 128)
    return Math.sqrt(sum / buf.length) / 128
  }
}

export function useGroupVoice(gameId, myId, peerIds, active) {
  const [mic, setMic] = useState('off') // off | asking | on | muted | denied | unsupported
  const [peerMic, setPeerMic] = useState({}) // id -> bool
  const [speaking, setSpeaking] = useState({}) // id (ou 'me') -> bool
  const [needTap, setNeedTap] = useState(false)
  const r = useRef({ peers: {} })
  const peersKey = peerIds.slice().sort().join(',')

  const send = useCallback((to, kind, payload) => api.traqueSignal(gameId, to, kind, payload ?? {}).catch(() => {}), [gameId])

  const build = useCallback((id) => {
    const s = r.current
    s.peers[id]?.pc?.close()
    const pc = new RTCPeerConnection({ iceServers: ICE })
    const p = { pc, makingOffer: false, pendingIce: [], audio: s.peers[id]?.audio, level: null }
    s.peers[id] = p
    pc.onnegotiationneeded = async () => {
      try { p.makingOffer = true; await pc.setLocalDescription(); await send(id, 'offer', pc.localDescription.toJSON()) }
      catch { /* renégociation suivante */ } finally { p.makingOffer = false }
    }
    pc.onicecandidate = ({ candidate }) => { if (candidate) send(id, 'ice', candidate.toJSON()) }
    pc.ontrack = (e) => {
      const stream = e.streams[0] || new MediaStream([e.track])
      if (!p.audio) { p.audio = new Audio(); p.audio.autoplay = true; p.audio.playsInline = true }
      p.audio.srcObject = stream
      p.audio.play().then(() => setNeedTap(false)).catch(() => setNeedTap(true))
      p.stream = stream
      if (s.ctx) p.level = meter(s.ctx, stream)
    }
    if (s.stream) s.stream.getTracks().forEach(t => pc.addTrack(t, s.stream))
    return p
  }, [send])

  const handle = useCallback(async (m) => {
    const s = r.current
    const id = m.from
    if (m.kind === 'mic') { setPeerMic(x => ({ ...x, [id]: !!m.payload.on })); return }
    if (m.kind === 'bye') { setPeerMic(x => ({ ...x, [id]: false })); build(id); return }
    const p = s.peers[id] || build(id)
    const pc = p.pc
    const polite = myId > id
    if (m.kind === 'offer' || m.kind === 'answer') {
      const desc = m.payload
      const collision = desc.type === 'offer' && (p.makingOffer || pc.signalingState !== 'stable')
      if (!polite && collision) return // offre croisée : on garde la nôtre
      await pc.setRemoteDescription(desc)
      for (const c of p.pendingIce.splice(0)) await pc.addIceCandidate(c).catch(() => {})
      if (desc.type === 'offer') { await pc.setLocalDescription(); await send(id, 'answer', pc.localDescription.toJSON()) }
    } else if (m.kind === 'ice') {
      if (!pc.remoteDescription) p.pendingIce.push(m.payload)
      else await pc.addIceCandidate(m.payload).catch(() => {})
    }
  }, [build, myId, send])

  useEffect(() => {
    if (!active || !myId || typeof RTCPeerConnection === 'undefined') return
    const s = r.current
    const ids = peersKey ? peersKey.split(',') : []
    let alive = true, busy = false
    s.after = null
    s.queue = Promise.resolve()
    ids.forEach(id => build(id))
    const poll = async () => {
      if (busy) return
      busy = true
      try {
        if (s.after == null) {
          const old = await api.traqueSignalsSince(gameId, 0)
          s.after = old.length ? old[old.length - 1].seq : 0
          ids.forEach(id => send(id, 'bye'))
          return
        }
        const list = await api.traqueSignalsSince(gameId, s.after)
        for (const m of list) {
          s.after = m.seq
          if (!ids.includes(m.from)) continue
          s.queue = s.queue.then(() => (alive ? handle(m) : null)).catch(() => {})
        }
      } catch { /* réseau : on réessaie */ } finally { busy = false }
    }
    poll()
    // micro déjà ouvert (ex. quelqu'un vient d'arriver au salon) : on le signale aux nouveaux venus
    if (s.stream && s.micOn) ids.forEach(id => send(id, 'mic', { on: true }))
    const iv = setInterval(poll, 900)
    const lv = setInterval(() => {
      const t = performance.now()
      s.at = s.at || {}
      if (s.myLevel && s.micOn && s.myLevel() > 0.03) s.at.me = t
      for (const id of ids) if (s.peers[id]?.level && s.peers[id].level() > 0.03) s.at[id] = t
      const next = Object.fromEntries(['me', ...ids].map(k => [k, t - (s.at[k] || -1e9) < 500]))
      setSpeaking(prev => (Object.keys(next).every(k => prev[k] === next[k]) ? prev : next))
    }, 160)
    return () => {
      alive = false; clearInterval(iv); clearInterval(lv)
      ids.forEach(id => { send(id, 'bye'); s.peers[id]?.pc?.close(); if (s.peers[id]?.audio) s.peers[id].audio.srcObject = null })
      s.peers = {}
      // le micro reste ouvert quand seuls les participants changent (il n'est coupé qu'à la sortie)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, gameId, myId, peersKey])

  // sortie du vocal (fin, raccroché, écran quitté) : on coupe vraiment le micro
  useEffect(() => {
    const s = r.current
    const close = () => {
      s.stream?.getTracks().forEach(t => t.stop()); s.stream = null; s.micOn = false
      s.ctx?.close().catch(() => {}); s.ctx = null; s.myLevel = null
    }
    if (!active) { close(); setTimeout(() => { setMic(m => (m === 'unsupported' ? m : 'off')); setPeerMic({}) }, 0) }
  }, [active])
  useEffect(() => () => {
    const s = r.current
    s.stream?.getTracks().forEach(t => t.stop()); s.stream = null
    s.ctx?.close().catch(() => {}); s.ctx = null
  }, [])

  const toggleMic = useCallback(async () => {
    const s = r.current
    const ids = peersKey ? peersKey.split(',') : []
    if (!navigator.mediaDevices?.getUserMedia || typeof RTCPeerConnection === 'undefined') { setMic('unsupported'); return }
    if (!s.ctx) {
      try {
        s.ctx = new (window.AudioContext || window.webkitAudioContext)()
        for (const id of ids) if (s.peers[id]?.stream) s.peers[id].level = meter(s.ctx, s.peers[id].stream)
      } catch { /* pas d'indicateur */ }
    }
    s.ctx?.resume?.()
    for (const id of ids) s.peers[id]?.audio?.play().then(() => setNeedTap(false)).catch(() => {})
    if (mic === 'on') { s.stream?.getAudioTracks().forEach(t => { t.enabled = false }); s.micOn = false; setMic('muted'); ids.forEach(id => send(id, 'mic', { on: false })); return }
    if (mic === 'muted') { s.stream?.getAudioTracks().forEach(t => { t.enabled = true }); s.micOn = true; setMic('on'); ids.forEach(id => send(id, 'mic', { on: true })); return }
    setMic('asking')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } })
      s.stream = stream
      if (s.ctx) s.myLevel = meter(s.ctx, stream)
      for (const id of ids) { const p = s.peers[id] || build(id); stream.getTracks().forEach(t => p.pc.addTrack(t, stream)) }
      s.micOn = true
      setMic('on')
      ids.forEach(id => send(id, 'mic', { on: true }))
    } catch { setMic('denied') }
  }, [mic, build, send, peersKey])

  const unlock = useCallback(() => {
    const s = r.current
    s.ctx?.resume?.()
    for (const id in s.peers) s.peers[id]?.audio?.play().then(() => setNeedTap(false)).catch(() => {})
  }, [])

  return { mic, peerMic, speaking, needTap, toggleMic, unlock }
}
