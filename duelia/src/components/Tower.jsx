import { useEffect, useRef, useState } from 'react'
import Avatar from './Avatar.jsx'
import TopicIcon from './TopicIcon.jsx'
import {
  MAX_HEARTS, BOSS_EVERY, BOSS_ROUNDS, BONUSES, DOORS,
  newRun, towerTopics, isBossFloor, isDoorFloor, doorChoices, timeFor, pickQuestion,
  pointsFor, maybeBonus, bossFor, bossAnswer, dailyBoard, dayKey,
} from '../lib/tower.js'
import { meEntry } from '../lib/profile.js'
import { sfx } from '../lib/sound.js'

const fmt = (n) => n.toLocaleString('fr-FR')

/* ---------- Bandeau du haut : cœurs, étage, score, record ---------- */
function Hud({ run, record, onQuit }) {
  const toBoss = Math.ceil(run.floor / BOSS_EVERY) * BOSS_EVERY - run.floor // 0 = on est à l'étage du boss
  return (
    <div className="t-hud">
      <button className="icon-btn small" onClick={onQuit} aria-label="Quitter la tour">✕</button>
      <div className="t-hearts" aria-label={`${run.hearts} cœurs sur ${MAX_HEARTS}`}>
        {Array.from({ length: MAX_HEARTS }, (_, i) => <span key={i} className={i < run.hearts ? 'on' : ''}>♥</span>)}
      </div>
      <div className="t-floor"><small>Étage</small><b>{run.floor}</b></div>
      <div className="t-score"><small>Score</small><b>{fmt(run.score)}</b></div>
      <div className="t-progress">
        <div className="t-ladder">
          {Array.from({ length: BOSS_EVERY }, (_, i) => {
            const f = run.floor - ((run.floor - 1) % BOSS_EVERY) + i
            return <i key={i} className={`${f < run.floor ? 'done' : f === run.floor ? 'cur' : ''} ${isBossFloor(f) ? 'boss' : ''} ${record && f === record ? 'rec' : ''}`} />
          })}
        </div>
        <small>{toBoss === 0 ? 'Étage du boss' : `Boss dans ${toBoss} étage${toBoss > 1 ? 's' : ''}`}{record ? ` · record : étage ${record}` : ''}</small>
      </div>
      {run.bonus && <div className="t-held" title={BONUSES[run.bonus].desc}>{BONUSES[run.bonus].icon} {BONUSES[run.bonus].name}</div>}
    </div>
  )
}

/* ---------- Une question chronométrée (avec ou sans adversaire) ---------- */
function TowerQuestion({ q, time, opponent, plan, bonus, onUseBonus, onDone, me }) {
  const [left, setLeft] = useState(time)
  const [mine, setMine] = useState(null)
  const [theirs, setTheirs] = useState(null)
  const [hidden, setHidden] = useState([])
  const [frozen, setFrozen] = useState(false)
  const [reveal, setReveal] = useState(false)
  const elapsed = useRef(0)
  const freezeLeft = useRef(0)

  // Chrono : il n'avance pas pendant le gel.
  useEffect(() => {
    let last = performance.now()
    let lastSec = Math.ceil(time / 1000)
    const iv = setInterval(() => {
      const now = performance.now(), dt = now - last
      last = now
      if (freezeLeft.current > 0) {
        freezeLeft.current -= dt
        if (freezeLeft.current <= 0) setFrozen(false)
        return
      }
      elapsed.current = Math.min(time, elapsed.current + dt)
      const l = time - elapsed.current
      setLeft(l)
      const s = Math.ceil(l / 1000)
      if (s < lastSec) { lastSec = s; if (s <= 3 && s > 0) sfx.tick() }
      if (plan && elapsed.current >= plan.t) setTheirs(t => t ?? plan)
      if (l <= 0) {
        setMine(m => m ?? { choice: -1, t: time })
        if (plan) setTheirs(t => t ?? { choice: -1, t: time })
      }
    }, 80)
    return () => clearInterval(iv)
  }, [time, plan])

  // Tout le monde a répondu → on dévoile, puis on passe la main.
  useEffect(() => {
    if (!mine || (plan && !theirs) || reveal) return
    const t1 = setTimeout(() => setReveal(true), 350)
    return () => clearTimeout(t1)
  }, [mine, theirs, plan, reveal])

  useEffect(() => {
    if (!reveal) return
    const t2 = setTimeout(() => onDone({
      ok: mine.choice === q.correct, left: time - mine.t,
      theirOk: theirs ? theirs.choice === q.correct : false, theirLeft: theirs ? time - theirs.t : 0,
    }), 1500)
    return () => clearTimeout(t2)
  }, [reveal, mine, theirs, q, time, onDone])

  function answer(i) {
    if (mine) return
    const ok = i === q.correct
    setMine({ choice: i, t: elapsed.current })
    if (ok) sfx.good(); else { sfx.bad(); navigator.vibrate?.(120) }
  }

  function use(kind) {
    if (mine) return
    if (kind === 'freeze') { freezeLeft.current = 5000; setFrozen(true) }
    if (kind === 'half') {
      const wrong = [0, 1, 2, 3].filter(i => i !== q.correct)
      wrong.splice(Math.floor(Math.random() * 3), 1) // on en garde une
      setHidden(wrong)
    }
    sfx.tap()
    onUseBonus(kind)
  }

  const R = 26, C = 2 * Math.PI * R
  const usable = bonus && BONUSES[bonus].when === 'question' && !mine
  return (
    <div className="t-question">
      <div className="t-q-top">
        {opponent && <div className="t-vs-me"><Avatar seed={me.avatar} photo={me.photo} size={40} ring="var(--me)" /></div>}
        <div className={`clock ${left <= 3000 && !mine ? 'hurry' : ''} ${frozen ? 'frozen' : ''}`}>
          <svg viewBox="0 0 60 60">
            <circle cx="30" cy="30" r={R} className="clock-bg" />
            <circle cx="30" cy="30" r={R} className="clock-fg" strokeDasharray={C} strokeDashoffset={C * (1 - left / time)} />
          </svg>
          <span>{frozen ? '❄️' : reveal ? '' : Math.ceil(left / 1000)}</span>
        </div>
        {opponent && <div className={`t-vs-opp ${theirs && !reveal ? 'answered' : ''}`}><Avatar seed={opponent.avatar} size={40} ring="var(--gold)" /></div>}
      </div>
      <h2 className="question">{q.q}</h2>
      <div className="options">
        {q.options.map((opt, i) => {
          let cls = 'opt'
          if (mine && mine.choice === i) cls += i === q.correct ? ' ok' : ' ko'
          if (reveal && i === q.correct) cls += ' ok'
          if (reveal && i !== q.correct && mine?.choice !== i) cls += ' dim'
          if (hidden.includes(i)) cls += ' gone'
          return (
            <button key={i} className={cls} onClick={() => answer(i)} disabled={!!mine || hidden.includes(i)} style={{ animationDelay: `${100 + i * 60}ms` }}>
              {mine?.choice === i && <span className="mark mark-me"><Avatar seed={me.avatar} photo={me.photo} size={22} /></span>}
              <span className="opt-txt">{opt}</span>
              {reveal && opponent && theirs?.choice === i && <span className="mark mark-opp"><Avatar seed={opponent.avatar} size={22} /></span>}
            </button>
          )
        })}
      </div>
      {usable && (
        <button className="btn btn-secondary t-use" onClick={() => use(bonus)}>
          {BONUSES[bonus].icon} Utiliser {BONUSES[bonus].name}
        </button>
      )}
      {reveal && mine?.choice === -1 && <p className="timeout-msg">Temps écoulé !</p>}
    </div>
  )
}

/* ---------- La tour ---------- */
export default function Tower({ topics, profile, daily, towerState, onFinish, onExit }) {
  const pool = towerTopics(topics, daily)
  const byId = (id) => topics.find(t => t.id === id)
  const record = towerState?.best?.floor || 0
  const dailyDone = daily && towerState?.daily?.day === dayKey()

  const [run, setRun] = useState(() => newRun(daily))
  const [phase, setPhase] = useState('intro')
  const [doors, setDoors] = useState(null)
  const [question, setQuestion] = useState(null)
  const [bet, setBet] = useState(1)
  const [boss, setBoss] = useState(null) // { foe, round, mine, theirs, q, plan }
  const [flash, setFlash] = useState(null)
  const [beatRecord, setBeatRecord] = useState(false)
  const [final, setFinal] = useState(null)
  // Fixé au départ de la partie : cette tentative compte-t-elle pour la tour du jour ?
  const [counts, setCounts] = useState(false)

  const topic = run.topicId ? byId(run.topicId) : null
  const me = { ...meEntry(profile) }

  function say(text) { setFlash(f => ({ text, k: (f?.k || 0) + 1 })) }
  useEffect(() => {
    if (!flash) return
    const id = setTimeout(() => setFlash(null), 1800)
    return () => clearTimeout(id)
  }, [flash])

  // Enchaîne vers l'étage suivant (porte, boss ou question).
  function advance(next) {
    if (next.hearts <= 0) return finish(next)
    if (record && next.floor === record + 1 && !beatRecord) { setBeatRecord(true); say('Nouveau record !'); sfx.levelUp() }
    setRun(next)
    if (isDoorFloor(next.floor)) { setDoors(doorChoices(next, pool)); setPhase('door') }
    else if (isBossFloor(next.floor)) startBoss(next)
    else setPhase('card')
  }

  function start() {
    const r = newRun(daily)
    setCounts(daily && !dailyDone)
    setRun(r); setDoors(doorChoices(r, pool)); setPhase('door'); sfx.vs()
  }

  function chooseDoor(choice) {
    const next = { ...run, topicId: choice.topicId, door: choice.door }
    setRun(next)
    sfx.tap()
    if (isBossFloor(next.floor)) startBoss(next)
    else setPhase('card')
  }

  function placeBet(mult) {
    setBet(mult)
    setRun(r => ({ ...r, bonus: null }))
    say(`Pari ×${mult} : bonne chance !`)
  }

  function showQuestion() {
    setQuestion(pickQuestion(run, topic))
    setPhase('question')
  }

  function useBonus() { setRun(r => ({ ...r, bonus: null })) }

  function onAnswered({ ok, left }) {
    let next = { ...run, asked: [...run.asked, question.key], floor: run.floor + 1 }
    if (ok) {
      const pts = pointsFor(left, DOORS[run.door].mult, bet)
      next.score += pts
      next.correct += 1
      const drop = maybeBonus(run)
      if (drop) { next.bonus = drop; say(`${BONUSES[drop].icon} Bonus trouvé : ${BONUSES[drop].name}`) }
      else say(`+${pts}`)
    } else if (run.bonus === 'shield') {
      next.bonus = null
      say('🛡️ Le bouclier encaisse l\'erreur')
    } else {
      next.hearts -= bet > 1 ? 2 : 1
      say(bet > 1 ? 'Pari perdu : −2 cœurs' : '−1 cœur')
    }
    setBet(1)
    setQuestion(null)
    advance(next)
  }

  /* ----- Boss ----- */
  function startBoss(r) {
    const t = byId(r.topicId)
    setBoss({ foe: bossFor(t), round: 0, mine: 0, theirs: 0, q: null, plan: null })
    setPhase('boss-intro')
    sfx.vs()
  }

  function bossRound() {
    const t = byId(run.topicId)
    const q = pickQuestion(run, t, 'boss-q' + boss.round)
    const plan = bossAnswer(run, boss.foe, q, boss.round, timeFor(run))
    setBoss(b => ({ ...b, q, plan }))
    setPhase('boss')
  }

  function onBossAnswered({ ok, left, theirOk, theirLeft }) {
    const time = timeFor(run)
    const mine = boss.mine + (ok ? pointsFor(left, 1) : 0)
    const theirs = boss.theirs + (theirOk ? pointsFor(Math.min(theirLeft, time), 1) : 0)
    const asked = [...run.asked, boss.q.key]
    if (boss.round + 1 < BOSS_ROUNDS) {
      setRun(r => ({ ...r, asked }))
      setBoss(b => ({ ...b, mine, theirs, round: b.round + 1, q: null, plan: null }))
      setPhase('boss-intro')
      return
    }
    const won = mine > theirs
    const next = {
      ...run, asked, floor: run.floor + 1,
      hearts: won ? Math.min(MAX_HEARTS, run.hearts + 1) : run.hearts - 1,
      score: run.score + mine + (won ? 100 : 0), bosses: run.bosses + (won ? 1 : 0),
    }
    setBoss(b => ({ ...b, mine, theirs, won, round: BOSS_ROUNDS, next }))
    setPhase('boss-result')
    if (won) sfx.win(); else sfx.lose()
  }

  function finish(last) {
    const result = { floor: last.floor, score: last.score, correct: last.correct, bosses: last.bosses }
    setRun(last)
    setFinal(result)
    setPhase('over')
    onFinish(result, daily)
  }

  /* ----- Rendu ----- */
  if (phase === 'intro') {
    return (
      <div className="screen tower t-intro">
        <header className="top">
          <button className="icon-btn" onClick={onExit} aria-label="Retour">←</button>
          <h1>{daily ? 'La tour du jour' : "L'Ascension"}</h1>
        </header>
        <div className="t-tower-art" aria-hidden="true">
          {Array.from({ length: 7 }, (_, i) => <i key={i} style={{ '--i': i }} />)}
        </div>
        <ul className="t-rules">
          <li><b>♥ 3 cœurs.</b> Une erreur en coûte un. Plus de cœurs, fin de l'ascension.</li>
          <li><b>🚪 Tous les 3 étages</b>, choisis ta porte : un thème facile ou un thème difficile qui rapporte 50 % de plus.</li>
          <li><b>👑 Tous les 10 étages</b>, un boss : 3 questions contre le champion du thème. Victoire : +1 cœur et +100 points.</li>
          <li><b>🎁 Des bonus</b> tombent en route : {Object.values(BONUSES).map(b => `${b.icon} ${b.name}`).join(', ')}. Un seul à la fois.</li>
        </ul>
        {daily && (
          <p className="t-daily-note">
            {dailyDone
              ? `Tu as déjà fait ta tentative du jour (étage ${towerState.daily.floor}). Tu peux rejouer pour t'entraîner, sans changer ton classement.`
              : 'Même tour pour tout le monde aujourd\'hui : mêmes portes, mêmes questions, mêmes bonus. Seule ta première tentative compte.'}
          </p>
        )}
        {!daily && record > 0 && <p className="t-daily-note">Ton record : <b>étage {record}</b> ({fmt(towerState.best.score)} points). Ton fantôme t'attend là-haut.</p>}
        <button className="btn btn-primary wide" onClick={start}>Commencer l'ascension</button>
      </div>
    )
  }

  const hud = <Hud run={run} record={record} onQuit={() => finish({ ...run, hearts: 0 })} />
  const flashEl = flash && <div key={flash.k} className="t-flash">{flash.text}</div>

  if (phase === 'door' && doors) {
    return (
      <div className="screen tower">
        {hud}{flashEl}
        <h2 className="t-title">Choisis ta porte</h2>
        <div className="t-doors">
          {doors.map(d => {
            const t = byId(d.topicId), cfg = DOORS[d.door]
            return (
              <button key={d.topicId} className={`t-door ${d.door}`} onClick={() => chooseDoor(d)} style={{ '--c': t.color }}>
                <TopicIcon topic={t} size={72} />
                <b>{t.name}</b>
                <span className="t-tag">{cfg.label}</span>
                <small>{cfg.time / 1000} s par question{cfg.mult > 1 ? ` · points ×${cfg.mult}` : ''}</small>
              </button>
            )
          })}
        </div>
        <p className="t-hint">Tu restes sur ce thème pendant 3 étages.</p>
      </div>
    )
  }

  if (phase === 'card' && topic) {
    return (
      <div className="screen tower">
        {hud}{flashEl}
        <div className="t-card" style={{ '--c': topic.color }}>
          <small>Étage {run.floor}</small>
          <TopicIcon topic={topic} size={88} />
          <b>{topic.name}</b>
          <span className={`t-tag ${run.door}`}>{DOORS[run.door].label} · {timeFor(run) / 1000} s</span>
          {bet > 1 && <span className="t-bet-on">🎲 Pari ×{bet} en jeu</span>}
        </div>
        {run.bonus === 'bet' && bet === 1 && (
          <div className="t-bet">
            <p>🎲 Tu tiens un <b>Pari</b>. Tu connais le thème : tu mises ?</p>
            <div className="t-bet-row">
              <button className="btn btn-gold" onClick={() => placeBet(2)}>Miser ×2</button>
              <button className="btn btn-gold" onClick={() => placeBet(3)}>Miser ×3</button>
            </div>
            <small>Si tu te trompes, tu perds 2 cœurs. Tu peux aussi garder ton pari pour plus tard.</small>
          </div>
        )}
        <button className="btn btn-primary wide" onClick={showQuestion}>Voir la question</button>
      </div>
    )
  }

  if (phase === 'question' && question) {
    return (
      <div className="screen tower">
        {hud}{flashEl}
        <TowerQuestion key={question.key + run.floor} q={question} time={timeFor(run)} bonus={run.bonus}
          onUseBonus={useBonus} onDone={onAnswered} me={me} />
      </div>
    )
  }

  if (phase === 'boss-intro' && boss) {
    const t = byId(run.topicId)
    return (
      <div className="screen tower">
        {hud}{flashEl}
        <div className="t-boss-intro">
          <span className="champ-badge">👑 Boss de l'étage {run.floor}</span>
          <div className="t-boss-faces">
            <Avatar seed={me.avatar} photo={me.photo} size={84} ring="var(--me)" />
            <span className="t-boss-score">{boss.mine} – {boss.theirs}</span>
            <Avatar seed={boss.foe.avatar} size={84} ring="var(--gold)" />
          </div>
          <b>{boss.foe.flag} {boss.foe.name}</b>
          <small>Champion · {t.name}</small>
          <p>Question {boss.round + 1} sur {BOSS_ROUNDS}. Le meilleur total l'emporte.</p>
          <button className="btn btn-gold wide" onClick={bossRound}>{boss.round === 0 ? 'Affronter le champion' : 'Question suivante'}</button>
        </div>
      </div>
    )
  }

  if (phase === 'boss' && boss?.q) {
    return (
      <div className="screen tower">
        {hud}{flashEl}
        <TowerQuestion key={boss.q.key + boss.round} q={boss.q} time={timeFor(run)} opponent={boss.foe} plan={boss.plan}
          bonus={run.bonus} onUseBonus={useBonus} onDone={onBossAnswered} me={me} />
      </div>
    )
  }

  if (phase === 'boss-result' && boss) {
    return (
      <div className="screen tower">
        {hud}
        <div className={`t-boss-intro ${boss.won ? 'won' : 'lost'}`}>
          <h2 className="t-title">{boss.won ? 'Champion vaincu !' : 'Le champion résiste'}</h2>
          <div className="t-boss-faces">
            <Avatar seed={me.avatar} photo={me.photo} size={84} ring="var(--me)" />
            <span className="t-boss-score">{boss.mine} – {boss.theirs}</span>
            <Avatar seed={boss.foe.avatar} size={84} ring="var(--gold)" />
          </div>
          <p>{boss.won ? '+1 cœur et +100 points.' : 'Tu perds un cœur, mais tu continues de monter.'}</p>
          <button className="btn btn-primary wide" onClick={() => advance(boss.next)}>Continuer</button>
        </div>
      </div>
    )
  }

  if (phase === 'over' && final) {
    const board = daily ? dailyBoard(topics, me, counts ? final : towerState?.daily) : null
    const myRank = board?.find(r => r.isMe)?.rank
    const newRecord = !daily && final.floor > record
    return (
      <div className="screen tower t-over">
        <h1 className="results-title">{newRecord ? 'Nouveau record !' : 'Fin de l\'ascension'}</h1>
        <div className="t-final">
          <div><small>Étage atteint</small><b>{final.floor}</b></div>
          <div><small>Score</small><b>{fmt(final.score)}</b></div>
          <div><small>Bonnes réponses</small><b>{final.correct}</b></div>
          <div><small>Boss vaincus</small><b>{final.bosses}</b></div>
        </div>
        {!daily && <p className="t-daily-note">{newRecord ? `Ancien record : étage ${record || '–'}.` : `Ton record reste l'étage ${record}.`}</p>}
        {daily && (
          <>
            <p className="t-daily-note">{!counts ? 'Partie d\'entraînement : ton classement du jour ne change pas.' : `Tu es ${myRank === 1 ? '1er' : `${myRank}e`} de la tour du jour.`}</p>
            <ol className="ranking t-board">
              {board.slice(0, 10).concat(myRank > 10 ? [board[myRank - 1]] : []).map(r => (
                <li key={r.id} className={`rank-row ${r.isMe ? 'me' : ''}`}>
                  <span className="rk">{r.rank === 1 ? '👑' : r.rank}</span>
                  <Avatar seed={r.avatar} photo={r.photo} size={36} />
                  <div className="rk-info"><b>{r.flag} {r.isMe ? `${r.name} (toi)` : r.name}</b><small>{fmt(r.score)} points</small></div>
                  <span className="rk-xp">Étage {r.floor}</span>
                </li>
              ))}
            </ol>
          </>
        )}
        <div className="results-actions">
          <button className="btn btn-primary" onClick={() => { setPhase('intro'); setBeatRecord(false); setFinal(null) }}>Rejouer</button>
          <button className="btn btn-ghost" onClick={onExit}>Accueil</button>
        </div>
      </div>
    )
  }

  return null
}
