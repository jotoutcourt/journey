// Voix entre les deux joueurs du Butin : connexion directe entre les téléphones (WebRTC).
// Le serveur ne fait que transmettre les messages de mise en relation (duo_signal / duo_signals_since).
// Négociation « polie » : les deux côtés peuvent activer leur micro à tout moment, dans n'importe quel ordre.
import { useCallback, useEffect, useRef, useState } from 'react'
import * as api from './account.js'

const ICE = [{ urls: ['stun:stun.l.google.com:19302', 'stun:stun.cloudflare.com:3478'] }]

// Niveau sonore d'un flux (0 à 1), pour animer l'avatar de celui qui parle
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

export function useDuoVoice(gameId, polite, active) {
  const [mic, setMic] = useState('off') // off | asking | on | muted | denied | unsupported
  const [link, setLink] = useState('idle') // idle | connecting | connected | failed
  const [partnerMic, setPartnerMic] = useState(false)
  const [speaking, setSpeaking] = useState({ me: false, partner: false })
  const [needTap, setNeedTap] = useState(false)
  const r = useRef({}) // pc, stream, audio, ctx, meters, after, queue, pending ICE…

  const send = useCallback((kind, payload) => api.duoSignal(gameId, kind, payload ?? {}).catch(() => {}), [gameId])

  // Crée (ou recrée) la connexion
  const build = useCallback(() => {
    const s = r.current
    s.pc?.close()
    const pc = new RTCPeerConnection({ iceServers: ICE })
    if (import.meta.env.DEV) window.__kvoice = s
    s.pc = pc; s.makingOffer = false; s.ignoreOffer = false; s.pendingIce = []
    pc.onnegotiationneeded = async () => {
      try {
        s.makingOffer = true
        await pc.setLocalDescription()
        await send('offer', pc.localDescription.toJSON())
      } catch { /* renégociation suivante */ } finally { s.makingOffer = false }
    }
    pc.onicecandidate = ({ candidate }) => { if (candidate) send('ice', candidate.toJSON()) }
    pc.onconnectionstatechange = () => {
      const st = pc.connectionState
      setLink(st === 'connected' ? 'connected' : st === 'failed' ? 'failed' : st === 'closed' ? 'idle' : 'connecting')
    }
    pc.ontrack = (e) => {
      const stream = e.streams[0] || new MediaStream([e.track])
      if (!s.audio) { s.audio = new Audio(); s.audio.autoplay = true; s.audio.playsInline = true }
      s.audio.srcObject = stream
      s.audio.play().then(() => setNeedTap(false)).catch(() => setNeedTap(true))
      if (s.ctx) s.partnerLevel = meter(s.ctx, stream)
      s.remoteStream = stream
    }
    if (s.stream) s.stream.getTracks().forEach(t => pc.addTrack(t, s.stream))
    return pc
  }, [send])

  // Traite un message de l'autre téléphone
  const handle = useCallback(async (m) => {
    const s = r.current
    if (m.kind === 'mic') { setPartnerMic(!!m.payload.on); return }
    if (m.kind === 'bye') { setPartnerMic(false); setLink('idle'); build(); return }
    const pc = s.pc || build()
    if (m.kind === 'offer' || m.kind === 'answer') {
      const desc = m.payload
      const collision = desc.type === 'offer' && (s.makingOffer || pc.signalingState !== 'stable')
      s.ignoreOffer = !polite && collision
      if (s.ignoreOffer) return
      await pc.setRemoteDescription(desc)
      for (const c of s.pendingIce.splice(0)) await pc.addIceCandidate(c).catch(() => {})
      if (desc.type === 'offer') {
        await pc.setLocalDescription()
        await send('answer', pc.localDescription.toJSON())
      }
    } else if (m.kind === 'ice') {
      if (!pc.remoteDescription) s.pendingIce.push(m.payload)
      else await pc.addIceCandidate(m.payload).catch(() => {})
    }
  }, [build, polite, send])

  // Démarrage : on ignore l'historique, on prévient l'autre qu'on (re)part de zéro, puis on écoute
  useEffect(() => {
    if (!active || typeof RTCPeerConnection === 'undefined') return
    const s = r.current
    let alive = true, busy = false
    s.after = null
    s.queue = Promise.resolve()
    build()
    const poll = async () => {
      if (busy) return
      busy = true
      try {
        if (s.after == null) {
          const old = await api.duoSignalsSince(gameId, 0)
          s.after = old.length ? old[old.length - 1].seq : 0
          await send('bye')
          return
        }
        const list = await api.duoSignalsSince(gameId, s.after)
        for (const m of list) {
          s.after = m.seq
          s.queue = s.queue.then(() => (alive ? handle(m) : null)).catch(() => {})
        }
      } catch { /* réseau : on réessaie */ } finally { busy = false }
    }
    poll()
    const id = setInterval(poll, 900)
    // qui parle ? (mesuré 6 fois par seconde)
    const lv = setInterval(() => {
      // seuil bas + maintien 0,5 s : l'avatar reste animé pendant les petites pauses de la voix
      const t = performance.now()
      if (s.myLevel && s.micOn && s.myLevel() > 0.03) s.meAt = t
      if (s.partnerLevel && s.partnerLevel() > 0.03) s.partnerAt = t
      const me = t - (s.meAt || -1e9) < 500
      const partner = t - (s.partnerAt || -1e9) < 500
      setSpeaking(p => (p.me === me && p.partner === partner ? p : { me, partner }))
    }, 160)
    return () => {
      alive = false; clearInterval(id); clearInterval(lv)
      send('bye')
      s.pc?.close(); s.pc = null
      s.stream?.getTracks().forEach(t => t.stop()); s.stream = null
      if (s.audio) { s.audio.srcObject = null; s.audio = null }
      s.ctx?.close().catch(() => {}); s.ctx = null; s.myLevel = null; s.partnerLevel = null
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, gameId])

  // Bouton micro (doit être appelé pendant un appui : iOS exige un geste pour le micro et le son)
  const toggleMic = useCallback(async () => {
    const s = r.current
    if (!navigator.mediaDevices?.getUserMedia || typeof RTCPeerConnection === 'undefined') { setMic('unsupported'); return }
    if (!s.ctx) {
      try {
        s.ctx = new (window.AudioContext || window.webkitAudioContext)()
        if (s.remoteStream) s.partnerLevel = meter(s.ctx, s.remoteStream)
      } catch { /* pas d'indicateur de voix */ }
    }
    s.ctx?.resume?.()
    s.audio?.play().then(() => setNeedTap(false)).catch(() => {})
    if (mic === 'on') { s.stream?.getAudioTracks().forEach(t => { t.enabled = false }); s.micOn = false; setMic('muted'); send('mic', { on: false }); return }
    if (mic === 'muted') { s.stream?.getAudioTracks().forEach(t => { t.enabled = true }); s.micOn = true; setMic('on'); send('mic', { on: true }); return }
    setMic('asking')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } })
      s.stream = stream
      if (s.ctx) s.myLevel = meter(s.ctx, stream)
      const pc = s.pc || build()
      stream.getTracks().forEach(t => pc.addTrack(t, stream))
      s.micOn = true
      setMic('on')
      send('mic', { on: true })
    } catch {
      setMic('denied')
    }
  }, [mic, build, send])

  // Si le navigateur a bloqué la lecture du son de l'autre : un simple appui la relance
  const unlock = useCallback(() => {
    const s = r.current
    s.ctx?.resume?.()
    s.audio?.play().then(() => setNeedTap(false)).catch(() => {})
  }, [])

  return { mic, link, partnerMic, speaking, needTap, toggleMic, unlock }
}
