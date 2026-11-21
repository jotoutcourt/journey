import Mascot from './Mascot.jsx'
import { useEffect, useState } from 'react'
import Avatar from './Avatar.jsx'
import AiTag from './AiTag.jsx'
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
      </div>
      {/* le titre est affiché sous l'anneau : les titres longs débordaient du cercle */}
      {shown.level <= a.level && <p className="ring-name">{topicTitle(topic, shown.level)}</p>}
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
  const [sent, setSent] = useState(null)
  const linkish = data.link || data.fromLink
  // L'ami renvoie son résultat au challenger (partage, sinon copie du lien)
  async function sendReply() {
    const text = `J'ai relevé ton défi sur « ${topic.name} » dans Kraken : ${myScore} à ${oppScore} ! Ouvre ce lien pour voir le résultat :`
    try { await navigator.share({ title: 'Kraken', text, url: data.link.url }); setSent('shared'); return } catch { /* refusé : on copie */ }
    try { await navigator.clipboard.writeText(`${text} ${data.link.url}`); setSent('copied') } catch { setSent('manual') }
  }
  useEffect(() => { if (outcome === 'win') sfx.win(); else if (outcome === 'lose') sfx.lose() }, [outcome])
  const title = { win: 'Victoire !', lose: 'Défaite', draw: 'Égalité' }[outcome]

  return (
    <div className={`results ${outcome}`}>
      {outcome === 'win' && <div className="confetti" aria-hidden="true">{Array.from({ length: 24 }, (_, i) => <i key={i} style={{ '--i': i }} />)}</div>}
      <p className="results-topic">{topic.icon} {topic.name}</p>
      <Mascot pose={outcome === 'win' ? 'victoire' : outcome === 'lose' ? 'defaite' : 'neutre'} size={150} className="results-mascot" />
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
          <b>{opponent.name}<AiTag on={opponent.ai} /></b>
          <span className="fo-score opp">{oppScore}</span>
        </div>
      </div>

      {data.noXp && (
        <p className="bonus-note muted">
          {data.unknownMine ? 'Ce défi a été lancé depuis un autre appareil : seul le score de ton ami est connu ici.'
            : data.alreadyCounted ? 'Ce résultat a déjà été compté : pas d\'XP en double.'
              : 'Ce thème n\'existe pas sur ton appareil : le duel ne rapporte pas d\'XP.'}
        </p>
      )}
      {!data.noXp && <div className="stat-row">
        <Stat label="Score" value={myScore} tone="t-cyan" delay={300} />
        <Stat label="Arrivée" value={bonuses.finish} prefix="+" tone="t-amber" delay={500} />
        <Stat label="Victoire" value={bonuses.victory} prefix="+" tone="t-green" delay={700} />
        <Stat label="Parfait" value={bonuses.perfect} prefix="+" tone="t-pink" delay={900} />
        {bonuses.exploit > 0 && <Stat label="Exploit" value={bonuses.exploit} prefix="+" tone="t-gold" delay={1000} />}
        {bonuses.defense > 0 && <Stat label="Défense" value={bonuses.defense} prefix="+" tone="t-gold" delay={1050} />}
        <Stat label="XP total" value={total} tone="t-violet" delay={1100} />
      </div>}
      {bonuses.exploit > 0 && <p className="bonus-note">🏆 Prime d'exploit : tu as battu le top {data.ranksBefore?.opp} mondial du thème.</p>}
      {data.exploitMissed && <p className="bonus-note muted">Tu as déjà touché la prime d'exploit contre {data.opponent.name} aujourd'hui. Reviens demain pour la regagner.</p>}

      {!data.noXp && <LevelRing before={before} after={after} topic={topic} />}

      {data.ranks && (
        <div className="result-ranks">
          <div><small>Semaine</small><b>#{data.ranks.week}</b></div>
          <div><small>Mois</small><b>#{data.ranks.month}</b></div>
          <div><small>Toujours</small><b>#{data.ranks.all}</b></div>
        </div>
      )}

      {data.link && (
        <div className="link-reply">
          {data.autoSent === 'ok' && <p className="link-ok" role="status">✓ Résultat envoyé automatiquement à {data.link.to}</p>}
          {data.autoSent === 'sending' && <p className="link-sending" role="status">Envoi du résultat à {data.link.to}…</p>}
          {data.autoSent === 'failed' && <p className="link-fail" role="status">Envoi automatique impossible (pas de connexion ?). Envoie-lui le lien :</p>}
          <button className={`btn ${data.autoSent === 'ok' ? 'btn-ghost' : 'btn-gold'} wide`} onClick={sendReply}>
            📤 {data.autoSent === 'ok' ? `Lui envoyer aussi un message` : `Envoyer mon résultat à ${data.link.to}`}
          </button>
          {sent === 'copied' && <p className="link-ok" role="status">Lien copié : colle-le dans un message à {data.link.to}.</p>}
          {sent === 'manual' && <textarea className="link-manual" readOnly rows={3} value={data.link.url} onFocus={e => e.target.select()} />}
          {!sent && data.autoSent !== 'ok' && <small>Si l'envoi automatique échoue, ce lien permet à {data.link.to} de voir qui a gagné.</small>}
        </div>
      )}

      <div className="results-actions">
        <button className="btn btn-primary" onClick={onRematch}>{linkish ? 'Défier en retour' : 'Revanche'}</button>
        <button className="btn btn-secondary" onClick={onAnother}>{linkish ? 'Accueil' : 'Nouvel adversaire'}</button>
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
