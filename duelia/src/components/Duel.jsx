import { useEffect, useRef, useState } from 'react'
import Avatar from './Avatar.jsx'
import TopicIcon from './TopicIcon.jsx'
import AiTag from './AiTag.jsx'
import ConfirmButton from './ConfirmButton.jsx'
import { botAnswer } from '../lib/bots.js'
import { levelInfo } from '../lib/levels.js'
import { topicTitle } from '../lib/titles.js'
import { TIME, pointsFor } from '../lib/duel.js'
import { sfx } from '../lib/sound.js'
import { intro as introMusic, thinking } from '../lib/music.js'

// Question à image (silhouette noire jusqu'au dévoilement). Si l'image ne charge pas,
// on bascule sur une question écrite qui garde la même réponse.
function PictureQuestion({ q, revealed }) {
  const [failed, setFailed] = useState(false)
  if (failed) return <h2 className="question">Quel Pokémon porte le n° {q.dex} du Pokédex national ?</h2>
  return (
    <div className="pic-q">
      <h2 className="question small">{q.q}</h2>
      <img src={q.img} alt="" className={revealed ? 'shown' : 'silhouette'} onError={() => setFailed(true)} draggable="false" />
    </div>
  )
}

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
// 'ghost' (défi envoyé : l'adversaire a déjà joué, ses réponses enregistrées s'affichent au fil des questions)
export default function Duel({ topic, me, opponent, ranks, questions, onFinish, onQuit, mode = 'live', ghost }) {
  const blind = mode === 'blind'
  const [phase, setPhase] = useState('vs') // vs → banner → play → reveal → … → done
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
  const q = questions[round]
  const last = round === rounds - 1
  const mult = last ? 2 : 1

  // Écran face-à-face
  useEffect(() => {
    if (phase !== 'vs') return
    const big = !!bigMatch(ranks)
    if (big) sfx.bigVs()
    const stopMusic = introMusic(big ? 4.8 : 2.9, big)
    const id = setTimeout(() => setPhase('banner'), big ? 4800 : 2900)
    return () => { clearTimeout(id); stopMusic() }
  }, [phase, ranks])

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
      : mode === 'blind' ? { choice: -1, t: Infinity }
      : botAnswer(opponent, q, TIME)
    const timers = []
    let lastSec = 10
    const iv = setInterval(() => {
      const l = Math.max(0, TIME - (performance.now() - startRef.current))
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
      if (mode !== 'blind') setTheirs(o => o ?? { choice: -1, t: TIME, pts: 0 })
    }, TIME))
    return () => { clearInterval(iv); timers.forEach(clearTimeout) }
  }, [phase, opponent, q, mult, mode, ghost, round])

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
    const id = setTimeout(() => onFinish({ myScore, oppScore, log, questions }), 500)
    return () => clearTimeout(id)
  }, [phase, myScore, oppScore, log, questions, onFinish])

  function answer(i, at) {
    if (phase !== 'play' || mine) return
    const t = Math.max(0, Math.min(TIME, at - startRef.current))
    const ok = i === q.correct
    const pts = ok ? pointsFor(t, mult) : 0
    setMine({ choice: i, t, pts })
    if (ok) { setMyScore(s => s + pts); setPop(pts); sfx.good() }
    else { sfx.bad(); navigator.vibrate?.(120) }
  }

  const myLvl = levelInfo(me.topicXp)
  const oppLvl = levelInfo(opponent.xp)

  if (phase === 'vs') {
    const big = bigMatch(ranks)
    return (
      <div className={`vs-screen ${big ? 'big' : ''} ${mode !== 'live' && !big ? 'has-async' : ''}`}>
        {big && <div className="vs-rays" aria-hidden="true" />}
        <div className="vs-side vs-left">
          {ranks?.me === 1 && <div className="champ-badge">👑 Champion du thème</div>}
          <Avatar seed={me.avatar} photo={me.photo} size={128} ring={ranks?.me <= 10 ? 'var(--gold)' : 'var(--me)'} className="vs-av" />
          <b>{me.name}</b>
          <span>Niv. {myLvl.level} · {topicTitle(topic, myLvl.level)}</span>
          <RankPlate rank={ranks?.me} />
        </div>
        <div className="vs-mark"><span>VS</span></div>
        <div className="vs-side vs-right">
          {opponent.champion && <div className="champ-badge">👑 Champion du thème</div>}
          <Avatar seed={opponent.avatar} size={128} ring={ranks?.opp <= 10 ? 'var(--gold)' : 'var(--opp)'} className="vs-av" />
          <b>{opponent.flag} {opponent.name}<AiTag on={opponent.ai} /></b>
          <span>{opponent.id === 'ami' ? 'Jouera après toi' : `Niv. ${oppLvl.level} · ${topicTitle(topic, oppLvl.level)}`}</span>
          <RankPlate rank={ranks?.opp} />
        </div>
        <div className="vs-topic"><TopicIcon topic={topic} size={30} /> {topic.name}</div>
        {mode !== 'live' && !big && (
          <div className="vs-async" role="status">
            {blind
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
      <div className="duel-top">
        <ConfirmButton className="icon-btn quit" onConfirm={onQuit} confirmLabel="Abandonner ?" aria-label="Abandonner">✕</ConfirmButton>
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
          <Avatar seed={opponent.avatar} size={46} ring="var(--opp)" className={theirs && phase === 'play' ? 'answered' : ''} />
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

      {phase === 'banner' ? (
        <div className="banner" key={'b' + round}>
          {last ? <><b>Dernière question</b><span className="x2">Points ×2</span></> : <><small>Question</small><b>{round + 1}</b></>}
        </div>
      ) : (
        <div className="qa" key={'q' + round}>
          {q.img ? <PictureQuestion q={q} revealed={reveal} /> : <h2 className="question">{q.q}</h2>}
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
                  {reveal && !blind && theirs?.choice === i && <span className="mark mark-opp"><Avatar seed={opponent.avatar} size={22} /></span>}
                </button>
              )
            })}
          </div>
          {reveal && mine?.choice === -1 && <p className="timeout-msg">Temps écoulé !</p>}
        </div>
      )}
    </div>
  )
}
