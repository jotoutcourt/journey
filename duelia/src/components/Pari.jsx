import { useEffect, useMemo, useRef, useState } from 'react'
import TopicIcon from './TopicIcon.jsx'
import Mascot from './Mascot.jsx'
import Avatar from './Avatar.jsx'
import { START, ROUNDS, PARI_TIME, stepsFor, planGame, pariTopics, betRange, betFor, settle, gainFor, oddsFor, pariDay, TIERS, tierFor, nextTier } from '../lib/pari.js'
import { levelInfo } from '../lib/levels.js'
import { sfx } from '../lib/sound.js'
import { thinking } from '../lib/music.js'

const fmt = (n) => Math.round(n).toLocaleString('fr-FR')

// Le Pari : 10 manches, on mise avant de voir la question
export default function Pari({ topics, st, daily, onFinish, onExit, board, loadBoard }) {
  const [seed] = useState(() => (daily ? 'daily:' + pariDay() : Math.random().toString(36).slice(2)))
  const playable = useMemo(() => pariTopics(topics, daily), [topics, daily])
  const rounds = useMemo(() => planGame(playable, seed), [playable, seed])
  const [phase, setPhase] = useState('intro') // intro → bet → question → reveal → … → end
  const [round, setRound] = useState(0)
  const [bank, setBank] = useState(START)
  const [share, setShare] = useState(0.25)
  const [bet, setBet] = useState(0)
  const [betShare, setBetShare] = useState(0.25)
  const [choice, setChoice] = useState(null)
  const [joker, setJoker] = useState(true)
  const [hidden, setHidden] = useState([])
  const [left, setLeft] = useState(PARI_TIME)
  const [history, setHistory] = useState([])
  const startRef = useRef(0)
  const finished = useRef(false)

  const r = rounds[round]
  const topic = playable.find(t => t.id === r?.topicId)
  const { min, last } = betRange(bank, round)
  const proposed = betFor(bank, round, share)

  // Chrono de la question
  useEffect(() => {
    if (phase !== 'question') return
    startRef.current = performance.now()
    let lastSec = 15
    const stopMusic = thinking(PARI_TIME)
    const iv = setInterval(() => {
      const l = Math.max(0, PARI_TIME - (performance.now() - startRef.current))
      setLeft(l)
      const s = Math.ceil(l / 1000)
      if (s < lastSec) { lastSec = s; if (s <= 3 && s > 0) sfx.tick() }
      if (l <= 0) { clearInterval(iv); setChoice(c => c ?? -1); setPhase('reveal') }
    }, 100)
    return () => { clearInterval(iv); stopMusic() }
  }, [phase])

  // Dévoilement : on encaisse ou on perd, puis manche suivante
  useEffect(() => {
    if (phase !== 'reveal') return
    const ok = choice === r.q.correct
    if (ok) sfx.good(); else sfx.bad()
    const next = settle(bank, bet, ok, round, betShare)
    const id = setTimeout(() => {
      setHistory(h => [...h, { topicId: r.topicId, bet, ok, bank: next, delta: next - bank }])
      setBank(next)
      if (next <= 0 || round >= ROUNDS - 1) setPhase('end')
      else { setRound(x => x + 1); setChoice(null); setHidden([]); setShare(round + 1 === ROUNDS - 1 ? 0.5 : 0.25); setPhase('bet') }
    }, 2200)
    return () => clearTimeout(id)
  }, [phase]) // eslint-disable-line react-hooks/exhaustive-deps

  // Fin de partie : record, partie du jour envoyée au classement
  useEffect(() => {
    if (phase !== 'end' || finished.current) return
    finished.current = true
    if (bank > START) sfx.win(); else sfx.lose()
    onFinish({ bank, daily, day: daily ? pariDay() : null, history: [...history] })
  }, [phase]) // eslint-disable-line react-hooks/exhaustive-deps

  // Partie du jour : on charge le classement pour afficher le score à battre
  useEffect(() => { if (daily && phase === 'intro') loadBoard?.() }, [daily]) // eslint-disable-line react-hooks/exhaustive-deps
  const leader = daily && board && board !== 'offline' ? board.top?.[0] : null

  function answer(i) {
    if (phase !== 'question' || choice !== null) return
    setChoice(i)
    setPhase('reveal')
  }
  function useJoker() {
    if (!joker || phase !== 'question') return
    const wrong = [0, 1, 2, 3].filter(k => k !== r.q.correct)
    const keep = wrong[Math.floor(Math.random() * 3)]
    setHidden(wrong.filter(k => k !== keep))
    setJoker(false)
  }

  if (!playable.length) return (
    <div className="screen pari"><p className="inbox-empty">Pas assez de thèmes pour jouer.</p><button className="btn btn-ghost wide" onClick={onExit}>Retour</button></div>
  )

  if (phase === 'intro') return (
    <div className="screen pari pari-intro">
      <Mascot pose="anim" size={170} className="pari-mascot" />
      <h1>Le Pari{daily ? ' du jour' : ''}</h1>
      <p className="pari-lead">Tu pars avec <b>{fmt(START)} jetons</b>. À chaque manche, tu découvres seulement le <b>thème</b>… et tu mises avant de voir la question.</p>
      <ul className="pari-rules">
        <li>✅ Bonne réponse : tu gagnes ta mise <b>× la cote</b> — plus tu mises gros, plus la cote monte (jusqu'à ×2,5 pour un tapis)</li>
        <li>❌ Mauvaise réponse ou temps écoulé : tu perds ta mise</li>
        <li>⏱️ 15 secondes par question · 10 manches</li>
        <li>✂️ Un joker 50/50 pour toute la partie</li>
        <li>🔥 Dernière manche : mise d'au moins <b>la moitié de ton tapis</b></li>
        <li>🏅 Paliers : {TIERS.map(t => `${t.icon} ${fmt(t.min)}`).join(' · ')}</li>
      </ul>
      {daily && leader && <p className="pari-beat">🎯 Le n° 1 du jour, {leader.name}, a <b>{fmt(leader.score)} jetons</b> — à battre !</p>}
      {daily && board && board !== 'offline' && !leader && <p className="pari-beat">🎯 Personne n'a encore joué aujourd'hui : prends la tête !</p>}
      {daily && <p className="pari-note">Mêmes thèmes et mêmes questions pour tous aujourd'hui. Seule ta première partie compte au classement.</p>}
      <button className="btn btn-primary wide" onClick={() => { sfx.tap(); setPhase('bet') }}>C'est parti</button>
      <button className="btn btn-ghost wide" onClick={onExit}>Retour</button>
    </div>
  )

  if (phase === 'end') {
    const gain = bank - START
    return (
      <div className="screen pari pari-end">
        <Mascot pose={gain > 0 ? 'victoire' : 'defaite'} size={150} className="results-mascot" />
        <h1>{bank <= 0 ? 'Ruiné !' : gain > 0 ? 'Bien joué !' : 'Partie terminée'}</h1>
        <div className="pari-final"><small>Tapis final</small><b>{fmt(bank)}</b><span>jetons</span></div>
        <p className={`pari-delta ${gain >= 0 ? 'up' : 'down'}`}>{gain >= 0 ? '+' : ''}{fmt(gain)} par rapport au départ</p>
        {tierFor(bank) ? <p className="pari-medal">{tierFor(bank).icon} Palier {tierFor(bank).name} atteint !</p>
          : <p className="pari-note">Aucun palier atteint : le bronze 🥉 commence à {fmt(TIERS[0].min)} jetons. Ose miser plus gros !</p>}
        <ol className="pari-recap">
          {history.map((h, i) => {
            const t = playable.find(x => x.id === h.topicId)
            return <li key={i} className={h.ok ? 'ok' : 'ko'}><TopicIcon topic={t} size={22} /><span className="pr-name">{t?.name}</span><b>{h.delta >= 0 ? '+' : '−'}{fmt(Math.abs(h.delta))}</b></li>
          })}
        </ol>
        {daily && <PariBoard board={board} load={loadBoard} />}
        <button className="btn btn-primary wide" onClick={onExit}>Terminer</button>
      </div>
    )
  }

  const lvl = levelInfo(st.topicStats[topic.id]?.xp || 0)
  const secs = Math.ceil(left / 1000)
  const ok = choice === r.q.correct

  return (
    <div className="screen pari" style={{ '--c': topic.color }}>
      <div className="pari-top">
        <button className="icon-btn" onClick={onExit} aria-label="Quitter">✕</button>
        <div className="pari-round">Manche <b>{round + 1}</b>/{ROUNDS}</div>
        <div className="pari-bank"><small>Tapis</small><b>{fmt(bank)}</b>
          {nextTier(bank) ? <span className="pari-next">prochain palier {nextTier(bank).icon} {fmt(nextTier(bank).min)}</span> : <span className="pari-next">💎 palier max !</span>}
        </div>
      </div>
      <div className="pari-dots">{rounds.map((_, i) => <i key={i} className={i < history.length ? (history[i].ok ? 'ok' : 'ko') : i === round ? 'cur' : ''} />)}</div>

      {phase === 'bet' && (
        <div className="pari-bet" key={'b' + round}>
          <TopicIcon topic={topic} size={104} />
          <h2>{topic.name}</h2>
          <small className="pari-lvl">Ton niveau dans ce thème : {lvl.level}</small>
          {last && <p className="pari-last">🔥 Dernière manche : mise d'au moins {fmt(min)}</p>}
          <p className="pari-ask">Combien mises-tu ?</p>
          <div className={`pari-steps n${stepsFor(round).length}`}>
            {stepsFor(round).map(s => {
              const v = betFor(bank, round, s)
              return (
                <button key={s} className={`pari-step ${share === s ? 'on' : ''}`} onClick={() => { sfx.tap(); setShare(s) }}>
                  <b>{s === 1 ? 'Tapis' : `${s * 100} %`}</b><small>{fmt(v)}</small><em>×{String(oddsFor(s)).replace('.', ',')}</em>
                </button>
              )
            })}
          </div>
          <div className="pari-stake"><span>Mise</span><b>{fmt(proposed)}</b><span>Bonne réponse : <b className="up">+{fmt(gainFor(proposed, round, share))}</b> · Erreur : <b className="down">−{fmt(proposed)}</b></span></div>
          <button className="btn btn-primary wide" onClick={() => { setBet(proposed); setBetShare(share); setLeft(PARI_TIME); setPhase('question') }}>Je mise {fmt(proposed)}</button>
        </div>
      )}

      {(phase === 'question' || phase === 'reveal') && (
        <div className="pari-q" key={'q' + round}>
          <div className="pari-qhead">
            <span className="pari-chip"><TopicIcon topic={topic} size={20} /> {topic.name}</span>
            <span className={`pari-timer ${secs <= 3 && phase === 'question' ? 'hurry' : ''}`}>{phase === 'question' ? `${secs} s` : ''}</span>
            <span className="pari-chip gold">Mise {fmt(bet)}</span>
          </div>
          <div className="pari-bar"><i style={{ width: `${(left / PARI_TIME) * 100}%` }} /></div>
          <h2 className="question">{r.q.q}</h2>
          <div className="options">
            {r.q.options.map((opt, i) => {
              let cls = 'opt'
              if (hidden.includes(i)) cls += ' gone'
              if (phase === 'reveal' && i === r.q.correct) cls += ' ok'
              else if (phase === 'reveal' && choice === i) cls += ' ko'
              else if (phase === 'reveal') cls += ' dim'
              return <button key={i} className={cls} disabled={phase !== 'question' || hidden.includes(i)} onClick={() => answer(i)} style={{ animationDelay: `${120 + i * 70}ms` }}><span className="opt-txt">{opt}</span></button>
            })}
          </div>
          {phase === 'question' && joker && <button className="btn btn-ghost pari-joker" onClick={useJoker}>✂️ Joker 50/50</button>}
          {phase === 'reveal' && (
            <p className={`pari-result ${ok ? 'up' : 'down'}`} role="status">
              {ok ? `+${fmt(gainFor(bet, round, betShare))} jetons` : choice === -1 ? `Temps écoulé : −${fmt(bet)}` : `−${fmt(bet)} jetons`}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

// Classement du jour (vrais joueurs)
export function PariBoard({ board, load }) {
  useEffect(() => { load?.() }, [load])
  if (!board) return <p className="pari-note">Chargement du classement du jour…</p>
  if (board === 'offline') return <div className="offline-card"><Mascot pose="hors-ligne" size={80} /><p>Classement indisponible sans connexion.</p></div>
  return (
    <section className="pari-board">
      <h3 className="sec-title">Classement du jour <small>({board.count} joueur{board.count > 1 ? 's' : ''})</small></h3>
      <ol>
        {board.top.map(r => (
          <li key={r.rank + r.name} className={r.me ? 'me' : ''}>
            <span className="pb-rank">{r.rank === 1 ? '👑' : `#${r.rank}`}</span>
            <Avatar seed={r.avatar} photo={r.photo} size={30} />
            <span className="pb-name">{r.flag} {r.name}</span>
            <b>{fmt(r.score)}</b>
          </li>
        ))}
      </ol>
      {board.me && board.me.rank > 20 && <p className="pari-note">Toi : #{board.me.rank} avec {fmt(board.me.score)} jetons</p>}
    </section>
  )
}
