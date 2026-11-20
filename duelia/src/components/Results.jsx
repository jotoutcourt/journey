import { useEffect, useState } from 'react'
import Avatar from './Avatar.jsx'
import { levelInfo } from '../lib/levels.js'
import { topicTitle } from '../lib/titles.js'
import { sfx } from '../lib/sound.js'

function useCountUp(target, delay = 0, dur = 700) {
  const [v, setV] = useState(0)
  useEffect(() => {
    let raf, start
    const id = setTimeout(() => {
      const step = (now) => {
        start ??= now
        const k = Math.min(1, (now - start) / dur)
        setV(Math.round(target * (1 - Math.pow(1 - k, 3))))
        if (k < 1) raf = requestAnimationFrame(step)
      }
      raf = requestAnimationFrame(step)
    }, delay)
    return () => { clearTimeout(id); cancelAnimationFrame(raf) }
  }, [target, delay, dur])
  return v
}

function Stat({ label, value, prefix = '', tone, delay }) {
  const v = useCountUp(value, delay)
  return (
    <div className={`stat-tile ${tone}`} style={{ animationDelay: `${delay}ms` }}>
      <small>{label}</small>
      <b>{prefix}{v}</b>
    </div>
  )
}

function LevelRing({ before, after, topic }) {
  const a = levelInfo(before), b = levelInfo(after)
  const [k, setK] = useState(a.into / a.need)
  const [shown, setShown] = useState(a)
  useEffect(() => {
    const from = levelInfo(before), to = levelInfo(after)
    const up = to.level > from.level
    const t1 = setTimeout(() => setK(up ? 1 : to.into / to.need), 1500)
    const t2 = up ? setTimeout(() => { setShown(to); setK(0); sfx.levelUp() }, 2500) : null
    const t3 = up ? setTimeout(() => setK(to.into / to.need), 2650) : null
    return () => [t1, t2, t3].forEach(clearTimeout)
  }, [before, after])
  const R = 54, C = 2 * Math.PI * R
  return (
    <div className={`level-ring ${shown.level > a.level ? 'up' : ''}`}>
      <svg viewBox="0 0 130 130">
        <circle cx="65" cy="65" r={R} className="ring-bg" />
        <circle cx="65" cy="65" r={R} className="ring-fg" strokeDasharray={C}
          strokeDashoffset={C * (1 - k)} style={{ transition: k === 0 ? 'none' : undefined }} />
      </svg>
      <div className="ring-txt">
        <small>Niveau</small>
        <b>{shown.level}</b>
        <em className="ring-title">{topicTitle(topic, shown.level)}</em>
      </div>
      <p className="ring-sub">
        {shown.level > a.level ? <span className="lvl-up">Niveau {shown.level} : {topicTitle(topic, shown.level)}</span>
          : <>Encore <b>{b.need - b.into} XP</b> pour le niveau {b.level + 1}</>}
      </p>
    </div>
  )
}

export default function Results({ data, me, onRematch, onAnother, onTopic, onShare }) {
  const { outcome, myScore, oppScore, opponent, topic, bonuses, total, before, after, log, questions } = data
  const [showRecap, setShowRecap] = useState(false)
  useEffect(() => { if (outcome === 'win') sfx.win(); else if (outcome === 'lose') sfx.lose() }, [outcome])
  const title = { win: 'Victoire !', lose: 'Défaite', draw: 'Égalité' }[outcome]

  return (
    <div className={`results ${outcome}`}>
      {outcome === 'win' && <div className="confetti" aria-hidden="true">{Array.from({ length: 24 }, (_, i) => <i key={i} style={{ '--i': i }} />)}</div>}
      <p className="results-topic">{topic.icon} {topic.name}</p>
      <h1 className="results-title">{title}</h1>
      {outcome === 'win' && opponent.champion && <div className="champ-beaten">👑 Tu as battu le champion du thème !</div>}

      <div className="faceoff">
        <div className={`fo ${outcome === 'win' ? 'winner' : ''}`}>
          <Avatar seed={me.avatar} photo={me.photo} size={84} ring="var(--me)" />
          <b>{me.name}</b>
          <span className="fo-score me">{myScore}</span>
        </div>
        <span className="fo-vs">vs</span>
        <div className={`fo ${outcome === 'lose' ? 'winner' : ''}`}>
          <Avatar seed={opponent.avatar} size={84} ring="var(--opp)" />
          <b>{opponent.name}</b>
          <span className="fo-score opp">{oppScore}</span>
        </div>
      </div>

      <div className="stat-row">
        <Stat label="Score" value={myScore} tone="t-cyan" delay={300} />
        <Stat label="Arrivée" value={bonuses.finish} prefix="+" tone="t-amber" delay={500} />
        <Stat label="Victoire" value={bonuses.victory} prefix="+" tone="t-green" delay={700} />
        <Stat label="Parfait" value={bonuses.perfect} prefix="+" tone="t-pink" delay={900} />
        {bonuses.exploit > 0 && <Stat label="Exploit" value={bonuses.exploit} prefix="+" tone="t-gold" delay={1000} />}
        {bonuses.defense > 0 && <Stat label="Défense" value={bonuses.defense} prefix="+" tone="t-gold" delay={1050} />}
        <Stat label="XP total" value={total} tone="t-violet" delay={1100} />
      </div>
      {bonuses.exploit > 0 && <p className="bonus-note">🏆 Prime d'exploit : tu as battu le top {data.ranksBefore?.opp} mondial du thème.</p>}
      {data.exploitMissed && <p className="bonus-note muted">Tu as déjà touché la prime d'exploit contre {data.opponent.name} aujourd'hui. Reviens demain pour la regagner.</p>}

      <LevelRing before={before} after={after} topic={topic} />

      {data.ranks && (
        <div className="result-ranks">
          <div><small>Semaine</small><b>#{data.ranks.week}</b></div>
          <div><small>Mois</small><b>#{data.ranks.month}</b></div>
          <div><small>Toujours</small><b>#{data.ranks.all}</b></div>
        </div>
      )}

      <div className="results-actions">
        <button className="btn btn-primary" onClick={onRematch}>Revanche</button>
        <button className="btn btn-secondary" onClick={onAnother}>Nouvel adversaire</button>
        <button className="btn btn-ghost" onClick={() => setShowRecap(s => !s)}>{showRecap ? 'Masquer' : 'Voir'} les réponses</button>
        <button className="btn btn-ghost" onClick={onShare}>Partager</button>
        <button className="btn btn-ghost wide" onClick={onTopic}>Retour au thème</button>
      </div>

      {showRecap && (
        <ol className="recap">
          {questions.map((q, i) => {
            const m = log.me[i], o = log.opp[i]
            return (
              <li key={i}>
                <p>{q.q}</p>
                <div className="recap-row">
                  <span className={m?.pts ? 'ok' : 'ko'}>Toi {m?.pts ? `+${m.pts}` : '✗'}</span>
                  <span className="recap-ans">{q.options[q.correct]}</span>
                  <span className={o?.pts ? 'ok' : 'ko'}>{o?.pts ? `+${o.pts}` : '✗'} {opponent.name}</span>
                </div>
              </li>
            )
          })}
        </ol>
      )}
    </div>
  )
}
