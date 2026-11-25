import { useEffect, useRef, useState } from 'react'
import QuestionText from './QuestionText.jsx'
import Avatar from './Avatar.jsx'
import TopicIcon from './TopicIcon.jsx'
import AiTag from './AiTag.jsx'
import Mascot from './Mascot.jsx'
import ConfirmButton from './ConfirmButton.jsx'
import { botAnswer } from '../lib/bots.js'
import { levelInfo } from '../lib/levels.js'
import { topicTitle } from '../lib/titles.js'
import { TIME, pointsFor } from '../lib/duel.js'
import { sfx } from '../lib/sound.js'
import { DuelChat } from './Chat.jsx'
import { intro as introMusic, thinking } from '../lib/music.js'

// Intitulé du duel quand un joueur du top 10 mondial est en jeu
function bigMatch(ranks) {
  if (!ranks) return null
  const me = ranks.me <= 10 ? ranks.me : null, opp = ranks.opp <= 10 ? ranks.opp : null
  if (me && opp) return { title: 'Choc au sommet', line: `Top ${me} contre top ${opp} mondial` }
  if (opp) return { title: opp === 1 ? 'Face au n° 1' : 'Duel au sommet', line: `Tu affrontes le top ${opp} mondial` }
  if (me) return { title: 'Défense de ta place', line: `Tu défends ta place de top ${me} mondial` }
  return null
}

function RankPlate({ rank }) {
  if (!rank || rank > 10) return null
  return <span className={`vs-rank ${rank === 1 ? 'first' : ''}`}>{rank === 1 ? '👑 ' : ''}Top {rank} mondial</span>
}

// mode : 'live' (adversaire en direct), 'blind' (défi reçu : on joue sans voir l'adversaire),
// 'ghost' (défi envoyé : l'adversaire a déjà joué, ses réponses enregistrées s'affichent au fil des questions),
// 'remote' (vrai joueur en direct : les réponses passent par le serveur, link = { send, poll })
const GRACE = 3000 // délai accordé à un vrai adversaire après la fin du chrono (réseau)

export default function Duel({ topic, me, opponent, ranks, questions, onFinish, onQuit, onForfeit, mode = 'live', ghost, link, chatPeer }) {
  const blind = mode === 'blind'
  const remote = mode === 'remote'
  const remoteRef = useRef({ got: new Map(), sent: new Set(), misses: 0 })
  const [phase, setPhase] = useState('vs') // vs → count (3, 2, 1, GO) → banner → play → reveal → … → done
  const [count, setCount] = useState(3)
  const [round, setRound] = useState(0)
  const [myScore, setMyScore] = useState(0)
  const [oppScore, setOppScore] = useState(0)
  const [mine, setMine] = useState(null)
  const [theirs, setTheirs] = useState(null)
  const [left, setLeft] = useState(TIME)
  const [pop, setPop] = useState(null)
  const [oppPop, setOppPop] = useState(null)
  const startRef = useRef(0)
  const [log, setLog] = useState({ me: [], opp: [] })

  const rounds = questions.length
  // Photos (thème « Quel est cet animal ? ») : on les charge toutes dès le début du duel
  useEffect(() => {
    for (const x of questions) { const m = /\[photo:([^\]]+)\]/.exec(x.q || ''); if (m) new Image().src = m[1] }
  }, [questions])
  const q = questions[round]
  const last = round === rounds - 1
  const mult = last ? 2 : 1

  // Duel en direct : on relève les réponses de l'adversaire toutes les 0,4 s
  useEffect(() => {
    if (!remote || !link || phase === 'done') return
    let busy = false
    const iv = setInterval(async () => {
      if (busy) return
      busy = true
      try {
        const list = await link.poll()
        for (const a of list || []) remoteRef.current.got.set(a.round, a)
      } catch { /* réseau : on réessaie */ }
      busy = false
    }, 400)
    return () => clearInterval(iv)
  }, [remote, link, phase])

  // … et on envoie la sienne dès qu'on a répondu (ou que le temps est écoulé)
  useEffect(() => {
    if (!remote || !link || !mine || phase !== 'play') return
    const sent = remoteRef.current.sent
    if (sent.has(round)) return
    sent.add(round)
    const push = (tries) => link.send(round, mine.choice, mine.t).catch(() => { if (tries > 0) setTimeout(() => push(tries - 1), 700) })
    push(5)
  }, [remote, link, mine, phase, round])

  // Écran face-à-face
  useEffect(() => {
    if (phase !== 'vs') return
    const big = !!bigMatch(ranks)
    if (big) sfx.bigVs()
    const stopMusic = introMusic(big ? 4.8 : 3.4, big)
    const id = setTimeout(() => setPhase('count'), big ? 4300 : 3000)
    return () => { clearTimeout(id); stopMusic() }
  }, [phase, ranks])

  // Décompte avant la première question : 3, 2, 1, GO
  useEffect(() => {
    if (phase !== 'count') return
    if (count === 0) sfx.vs(); else sfx.tick()
    const id = setTimeout(() => {
      if (count > 0) setCount(c => c - 1)
      else setPhase('banner')
    }, count === 0 ? 700 : 620)
    return () => clearTimeout(id)
  }, [phase, count])

  // Musique de réflexion tant qu'on n'a pas répondu
  useEffect(() => {
    if (phase !== 'play' || mine) return
    return thinking(TIME)
  }, [phase, mine])

  // Annonce de la question
  useEffect(() => {
    if (phase !== 'banner') return
    const id = setTimeout(() => {
      setMine(null); setTheirs(null); setLeft(TIME); setPop(null); setOppPop(null)
      setPhase('play')
    }, last ? 1700 : 1150)
    return () => clearTimeout(id)
  }, [phase, last])

  // Question en cours : chrono + réponse de l'adversaire
  useEffect(() => {
    if (phase !== 'play') return
    startRef.current = performance.now()
    const plan = mode === 'ghost' ? (ghost?.[round] || { choice: -1, t: Infinity })
      : mode === 'blind' || remote ? { choice: -1, t: Infinity }
      : botAnswer(opponent, q, TIME)
    const timers = []
    let lastSec = 10
    let applied = false
    const showTheirs = (a) => {
      remoteRef.current.misses = 0
      if (a.choice < 0) { setTheirs(o => o ?? { choice: -1, t: TIME, pts: 0 }); return }
      const ok = a.choice === q.correct
      const pts = ok ? pointsFor(a.t, mult) : 0
      setTheirs({ choice: a.choice, t: a.t, pts })
      if (ok) { setOppScore(s => s + pts); setOppPop(pts); sfx.oppScore() }
    }
    const iv = setInterval(() => {
      const elapsed = performance.now() - startRef.current
      // réponse du vrai adversaire reçue : affichée au moment où il a répondu
      if (remote && !applied && remoteRef.current.got.has(round)) {
        applied = true
        const a = remoteRef.current.got.get(round)
        timers.push(setTimeout(() => showTheirs(a), Math.max(0, a.t - elapsed)))
      }
      const l = Math.max(0, TIME - elapsed)
      setLeft(l)
      const s = Math.ceil(l / 1000)
      if (s < lastSec) { lastSec = s; if (s <= 3 && s > 0) sfx.tick() }
    }, 100)
    if (Number.isFinite(plan.t) && plan.t < TIME && plan.choice >= 0) {
      timers.push(setTimeout(() => {
        const ok = plan.choice === q.correct
        const pts = ok ? pointsFor(plan.t, mult) : 0
        setTheirs({ choice: plan.choice, t: plan.t, pts })
        if (ok) { setOppScore(s => s + pts); setOppPop(pts); sfx.oppScore() }
      }, plan.t))
    }
    timers.push(setTimeout(() => {
      setLeft(0)
      setMine(m => m ?? { choice: -1, t: TIME, pts: 0 })
      if (mode !== 'blind' && !remote) setTheirs(o => o ?? { choice: -1, t: TIME, pts: 0 })
    }, TIME))
    // vrai adversaire silencieux : après un délai de grâce (supprimé s'il semble parti), on passe
    if (remote) {
      const grace = remoteRef.current.misses >= 2 ? 0 : GRACE
      timers.push(setTimeout(() => {
        if (applied) return
        applied = true
        remoteRef.current.misses++
        setTheirs(o => o ?? { choice: -1, t: TIME, pts: 0 })
      }, TIME + grace))
    }
    return () => { clearInterval(iv); timers.forEach(clearTimeout) }
  }, [phase, opponent, q, mult, mode, ghost, round, remote])

  // Les deux ont répondu → on dévoile
  useEffect(() => {
    if (phase !== 'play' || !mine || (!blind && !theirs)) return
    const id = setTimeout(() => {
      setLog(l => {
        const me = [...l.me], opp = [...l.opp]
        me[round] = mine
        if (!blind) opp[round] = theirs
        return { me, opp }
      })
      setPhase('reveal')
    }, 450)
    return () => clearTimeout(id)
  }, [phase, mine, theirs, round, blind])

  // Dévoilement puis question suivante
  useEffect(() => {
    if (phase !== 'reveal') return
    const id = setTimeout(() => {
      if (round >= rounds - 1) setPhase('done')
      else { setRound(r => r + 1); setPhase('banner') }
    }, 2000)
    return () => clearTimeout(id)
  }, [phase, round, rounds])

  useEffect(() => {
    if (phase !== 'done') return
    const local = { myScore, oppScore, log, questions }
    // Duel en direct : le score officiel est recalculé par le serveur à partir des réponses enregistrées
    if (remote && link?.result) {
      let alive = true
      const id = setTimeout(() => {
        const timeout = new Promise(res => setTimeout(() => res(null), 4000))
        Promise.race([link.result().catch(() => null), timeout]).then(res => {
          if (!alive) return
          onFinish(res ? { ...local, myScore: res.me, oppScore: res.opp, verified: true } : local)
        })
      }, 500)
      return () => { alive = false; clearTimeout(id) }
    }
    const id = setTimeout(() => onFinish(local), 500)
    return () => clearTimeout(id)
  }, [phase, myScore, oppScore, log, questions, onFinish, remote, link])

  function answer(i, at) {
    if (phase !== 'play' || mine) return
    const t = Math.max(0, Math.min(TIME, at - startRef.current))
    const ok = i === q.correct
    const pts = ok ? pointsFor(t, mult) : 0
    setMine({ choice: i, t, pts })
    if (ok) { setMyScore(s => s + pts); setPop(pts); sfx.good() }
    else { sfx.bad(); navigator.vibrate?.(120) }
  }

  // Abandon d'un duel en direct : on prévient l'adversaire (questions restantes sans réponse)
  function quit() {
    if (remote && link) {
      for (let r = 0; r < rounds; r++) if (!remoteRef.current.sent.has(r)) link.send(r, -1, TIME).catch(() => {})
    }
    // contre un ami : abandonner = défaite (questions restantes sans réponse)
    if (onForfeit) {
      const me2 = Array.from({ length: rounds }, (_, i) => log.me[i] || { choice: -1, t: TIME, pts: 0 })
      const opp2 = Array.from({ length: rounds }, (_, i) => log.opp[i] || { choice: -1, t: TIME, pts: 0 })
      onForfeit({ myScore, oppScore, log: { me: me2, opp: opp2 }, questions })
      return
    }
    onQuit()
  }

  const myLvl = levelInfo(me.topicXp)
  const oppLvl = levelInfo(opponent.xp)

  if (phase === 'count') {
    return (
      <div className="duel countdown">
        <img className="duel-deco" src="/decor/tentacules.webp" alt="" aria-hidden="true" draggable="false" />
        <Mascot pose="combat-anim" size={340} className="count-mascot" />
        <div key={count} className={`count-num ${count === 0 ? 'go' : ''}`}>{count === 0 ? 'GO !' : count}</div>
      </div>
    )
  }

  if (phase === 'vs') {
    const big = bigMatch(ranks)
    return (
      <div className={`vs-screen ${big ? 'big' : ''} ${mode !== 'live' && !big ? 'has-async' : ''}`}>
        <video className="vs-bg" src="/decor/vs-fond.mp4" poster="/decor/vs-fond-debut.webp" autoPlay muted playsInline preload="auto" aria-hidden="true" />
        <div className="vs-rays" aria-hidden="true" />
        <div className="vs-glow" aria-hidden="true" />
        <div className="vs-side vs-left">
          {ranks?.me === 1 && <div className="champ-badge">👑 Champion du thème</div>}
          <Avatar seed={me.avatar} photo={me.photo} size={128} ring={ranks?.me <= 10 ? 'var(--gold)' : 'var(--me)'} className="vs-av" />
          <div className="vs-txt">
            <b>{me.name}</b>
            <span>Niv. {myLvl.level} · {topicTitle(topic, myLvl.level)}</span>
          </div>
          <RankPlate rank={ranks?.me} />
        </div>
        <div className="vs-mark"><span>VS</span></div>
        <div className="vs-side vs-right">
          {opponent.champion && <div className="champ-badge">👑 Champion du thème</div>}
          <Avatar seed={opponent.avatar} photo={opponent.photo} size={128} ring={ranks?.opp <= 10 ? 'var(--gold)' : 'var(--opp)'} className="vs-av" />
          <div className="vs-txt">
            <b>{opponent.flag} {opponent.name}<AiTag on={opponent.ai} /></b>
            <span>{opponent.id === 'ami' ? 'Jouera après toi' : `Niv. ${oppLvl.level} · ${topicTitle(topic, oppLvl.level)}`}</span>
          </div>
          <RankPlate rank={ranks?.opp} />
        </div>
        <div className="vs-topic"><TopicIcon topic={topic} size={30} /> {topic.name}</div>
        {mode !== 'live' && !big && (
          <div className="vs-async" role="status">
            {remote
              ? <><b>Duel en direct</b><span>{opponent.name} est un vrai joueur, en ligne en ce moment. Que le plus rapide gagne !</span></>
              : blind
              ? <><b>Défi différé</b><span>{opponent.name} jouera ces questions de son côté. Tu ne verras son score qu'à la fin.</span></>
              : <><b>{opponent.name} a déjà joué</b><span>Ses réponses vont apparaître au fil des questions. Le résultat tombe à la fin.</span></>}
          </div>
        )}
        {big && (
          <div className="vs-headline" role="status">
            <small>{big.title}</small>
            <b>{big.line}</b>
          </div>
        )}
      </div>
    )
  }

  const total = myScore + oppScore
  const share = total ? (myScore / total) * 100 : 50
  const secs = Math.ceil(left / 1000)
  const reveal = phase === 'reveal' || phase === 'done'
  const R = 26, C = 2 * Math.PI * R

  return (
    <div className="duel">
      <img className="duel-deco" src="/decor/tentacules.webp" alt="" aria-hidden="true" draggable="false" />
      <div className="duel-top">
        <ConfirmButton className="icon-btn quit" onConfirm={quit} confirmLabel="Abandonner ?" aria-label="Abandonner">✕</ConfirmButton>
        <div className="pl pl-me">
          <Avatar seed={me.avatar} photo={me.photo} size={46} ring="var(--me)" />
          <div className="pl-txt">
            <small>{me.name}</small>
            <strong className="score">{myScore}</strong>
          </div>
          {pop != null && <span key={'p' + round} className="pts-pop me">+{pop}</span>}
        </div>
        <div className={`clock ${secs <= 3 && phase === 'play' ? 'hurry' : ''}`}>
          <svg viewBox="0 0 60 60">
            <circle cx="30" cy="30" r={R} className="clock-bg" />
            <circle cx="30" cy="30" r={R} className="clock-fg"
              strokeDasharray={C} strokeDashoffset={C * (1 - left / TIME)} />
          </svg>
          <span>{phase === 'play' ? secs : reveal ? '' : 10}</span>
        </div>
        <div className="pl pl-opp">
          <div className="pl-txt right">
            <small>{opponent.name}{opponent.champion ? ' 👑' : ''}<AiTag on={opponent.ai} /></small>
            <strong className="score">{blind ? '?' : oppScore}</strong>
          </div>
          <Avatar seed={opponent.avatar} photo={opponent.photo} size={46} ring="var(--opp)" className={theirs && phase === 'play' ? 'answered' : ''} />
          {oppPop != null && <span key={'o' + round} className="pts-pop opp">+{oppPop}</span>}
        </div>
      </div>

      <div className={`tug ${blind ? 'tug-blind' : ''}`}><i style={{ width: `${blind ? 100 : share}%` }} /></div>

      <div className="round-dots">
        {questions.map((_, i) => {
          const m = log.me[i]
          const cls = m
            ? (m && m.pts > 0 ? 'ok' : 'ko') : i === round ? 'cur' : ''
          return <span key={i} className={cls} />
        })}
      </div>

      {/* barre en segments : une manche par segment, verte si j'ai bien répondu, rouge sinon */}
      <div className="segbar" aria-hidden="true">
        {questions.map((_, i) => {
          const m = log.me[i]
          let cls = i === round && !m ? 'cur' : ''
          // Vert = j'ai bien répondu, rouge = faux ou pas de réponse (qui a été le plus rapide se voit au score)
          if (m) cls = m.pts > 0 ? 'good' : 'bad'
          return <i key={i} className={cls} />
        })}
      </div>

      {phase === 'banner' ? (
        <div className="banner" key={'b' + round}>
          {last ? <><b>Dernière question</b><span className="x2">Points ×2</span></> : <><small>Question</small><b>{round + 1}</b></>}
        </div>
      ) : (
        <div className="qa" key={'q' + round}>
          <h2 className="question"><QuestionText text={q.q} /></h2>
          <div className="options">
            {q.options.map((opt, i) => {
              let cls = 'opt'
              if (mine && mine.choice === i) cls += i === q.correct ? ' ok' : ' ko'
              if (reveal && i === q.correct) cls += ' ok'
              if (reveal && i !== q.correct && mine?.choice !== i) cls += ' dim'
              return (
                <button key={i} className={cls} onClick={(e) => answer(i, e.timeStamp)} disabled={!!mine || phase !== 'play'}
                  style={{ animationDelay: `${120 + i * 70}ms` }}>
                  {mine?.choice === i && <span className="mark mark-me"><Avatar seed={me.avatar} photo={me.photo} size={22} /></span>}
                  <span className="opt-txt">{opt}</span>
                  {reveal && !blind && theirs?.choice === i && <span className="mark mark-opp"><Avatar seed={opponent.avatar} photo={opponent.photo} size={22} /></span>}
                </button>
              )
            })}
          </div>
          {reveal && mine?.choice === -1 && <p className="timeout-msg">Temps écoulé !</p>}
        </div>
      )}
      {chatPeer && <DuelChat peer={chatPeer} />}
    </div>
  )
}
