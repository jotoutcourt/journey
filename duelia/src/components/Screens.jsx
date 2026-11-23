import { useEffect, useRef, useState } from 'react'
import Avatar from './Avatar.jsx'
import TopicIcon from './TopicIcon.jsx'
import AiTag from './AiTag.jsx'
import ConfirmButton from './ConfirmButton.jsx'
import { CATEGORIES } from '../data/topics.js'
import { levelInfo } from '../lib/levels.js'
import { leaderboard } from '../lib/bots.js'
import { PERIODS, myPeriodScore, resetIn } from '../lib/periods.js'
import { tierOf, PLACEMENT, BEST_OF } from '../lib/rating.js'
import TierIcon from './TierIcon.jsx'
import { meEntry, resizeImage } from '../lib/profile.js'
import { topicTitle, nextTitle, ladderFor, TITLE_LEVELS } from '../lib/titles.js'
import { RecoverForm } from './AccountCard.jsx'
import Mascot from './Mascot.jsx'
import { InstallBanner } from './InstallCard.jsx'
import { decodeTopic } from '../lib/store.js'
import { sfx } from '../lib/sound.js'
import SurpriseBar from './Surprise.jsx'

const fmt = (n) => n.toLocaleString('fr-FR')


export function TopicTile({ topic, onClick, sub, price }) {
  return (
    <button className={`topic-tile ${price ? 'locked' : ''}`} onClick={onClick}>
      <span className="tt-icon"><TopicIcon topic={topic} size={76} />{price ? <span className="tt-lock">🔒 {price}</span> : null}</span>
      <b>{topic.name}</b>
      <small>{sub ?? topic.category}</small>
    </button>
  )
}

/* ---------------- Accueil ---------------- */
export function Home({ go, wallet, onSolo, oxygen, missions }) {
  const [choose, setChoose] = useState(false)
  const modesRef = useRef(null)
  // un appui en dehors des boutons Solo / À deux fait revenir « Jouer » (sans gêner l'appui sur les boutons, iPhone compris)
  useEffect(() => {
    if (!choose) return
    const away = (e) => { if (modesRef.current && !modesRef.current.contains(e.target)) setChoose(false) }
    const id = setTimeout(() => document.addEventListener('pointerdown', away), 0)
    return () => { clearTimeout(id); document.removeEventListener('pointerdown', away) }
  }, [choose])
  return (
    <div className="screen home immersive">
      {/* décor plein écran : grotte sous-marine, rayons de lumière et bulles */}
      <div className="home-bg" aria-hidden="true">
        <i className="rays" />
        <span className="home-bubbles">{Array.from({ length: 10 }, (_, k) => <i key={k} style={{ '--x': `${(k * 37) % 100}%`, '--d': `${6 + (k % 4)}s`, '--w': `${(k * 0.7) % 5}s`, '--s': `${8 + (k % 3) * 6}px` }} />)}</span>
      </div>
      <header className="top">
        <Brand />
        {missions}
        {wallet && <button className="wallet-pill" title="Boutique" onClick={() => go({ name: 'shop' })}><i className="lt-coin" aria-hidden="true" />{wallet.lingots}<span className="wp-shop">🏪</span></button>}
      </header>

      {/* Le jeu principal : L'Appât du Kraken */}
      <section className="kraken-hero">
        <img className="kh-art" src="/mascotte/pirate-anim.webp" alt="" aria-hidden="true" />
        <h1 className="kraken-sign-img"><img src="/decor/pancarte.webp" alt="L'Appât du Kraken" draggable="false" /></h1>
        <p className="kh-pitch">Cache tes lingots dans la bonne caisse avant que les tentacules du <b>Kraken</b> ne les reprennent.</p>
        {wallet?.daily_bonus && <span className="bh-bonus">🎁 +5 lingots sur ta première partie du jour</span>}
        {!choose
          ? <button className="kh-play" onClick={() => setChoose(true)}>Jouer</button>
          : <div className="kh-modes" ref={modesRef}>
            <button className="kh-play kh-mode" onClick={() => { setChoose(false); onSolo() }}><span aria-hidden="true">🏴‍☠️</span>Solo</button>
            <button className="kh-play kh-mode" onClick={() => { setChoose(false); go({ name: 'butin' }) }}><span aria-hidden="true">👥</span>À deux</button>
          </div>}
        {oxygen}
      </section>

      <InstallBanner />
    </div>
  )
}

export function Brand({ big = false }) {
  return <div className={`brand ${big ? 'big' : ''}`}><img src="/mascotte/logo.webp" alt="Kraken" className="brand-logo" draggable="false" /></div>
}
export function Chevrons() {
  return (
    <svg viewBox="0 0 64 64" className="chev" aria-hidden="true">
      <path d="M12 16l16 16-16 16" stroke="var(--me)" />
      <path d="M52 16L36 32l16 16" stroke="var(--opp)" />
    </svg>
  )
}

/* ---------------- Thèmes ---------------- */
export function Topics({ topics, go, importTopic, extra, onRequest, lockPrice = () => 0 }) {
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('Tous')
  const [code, setCode] = useState('')
  const [importErr, setImportErr] = useState(false)
  const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  const match = (t) => (cat === 'Tous' || t.category === cat) && (!q || norm(t.name + ' ' + t.category).includes(norm(q)))
  // thèmes débloqués d'abord, puis ceux à acheter (du moins cher au plus cher)
  const official = topics.filter(t => t.official && match(t)).map((t, i) => [t, i]).sort((a, b) => lockPrice(a[0]) - lockPrice(b[0]) || a[1] - b[1]).map(([t]) => t)
  // thèmes reçus par lien (hors thèmes publiés déjà installés)
  const received = topics.filter(t => !t.official && !t.own && !t.shared && match(t))

  function doImport() {
    const raw = code.trim()
    const m = raw.match(/#t=([\w-]+)/)
    const t = decodeTopic(m ? m[1] : raw)
    if (!t) { setImportErr(true); return }
    setImportErr(false)
    importTopic(t)
    setCode('')
  }

  return (
    <div className="screen">
      <header className="top"><h1>Thèmes</h1><button className="btn btn-small btn-gold shop-btn" onClick={() => go({ name: 'shop' })}>🏪 Boutique</button></header>
      <input className="search" placeholder="Rechercher un thème…" value={q} onChange={e => setQ(e.target.value)} />
      <div className="chips">
        {['Tous', ...CATEGORIES].map(c => (
          <button key={c} className={`chip ${c === cat ? 'on' : ''}`} onClick={() => setCat(c)}>{c}</button>
        ))}
      </div>

      {official.length > 0 && <>
        <h3 className="sec-title">Thèmes officiels</h3>
        <div className="grid">
          {official.map(t => <TopicTile key={t.id} topic={t} price={lockPrice(t)} onClick={() => go({ name: 'topic', id: t.id })} />)}
        </div>
      </>}


      {extra}

      {received.length > 0 && <>
        <h3 className="sec-title">Reçus par lien</h3>
        <div className="grid">
          {received.map(t => <TopicTile key={t.id} topic={t} onClick={() => go({ name: 'topic', id: t.id })} sub={t.by ? `par ${t.by}` : 'reçu d\'un ami'} />)}
        </div>
      </>}

      <div className="import-box">
        <p>Un ami t'a envoyé un thème ? Colle le lien ici :</p>
        <div className="import-row">
          <input value={code} onChange={e => { setCode(e.target.value); setImportErr(false) }} placeholder="https://…#t=…" />
          <button className="btn btn-small btn-primary" onClick={doImport} disabled={!code.trim()}>Ajouter</button>
        </div>
        {importErr && <p className="import-err">Ce lien ne contient pas de thème valide. Vérifie que tu l'as copié en entier.</p>}
      </div>

      {/* toujours visible en bas de l'écran Thèmes */}
      <div className="idea-dock">
        <button className="idea-btn" onClick={onRequest}>
          <span aria-hidden="true">💡</span>
          <span><b>Des idées de thème ?</b><small>Fais-le nous savoir !</small></span>
          <i aria-hidden="true">›</i>
        </button>
      </div>
    </div>
  )
}

/* ---------------- Page d'un thème ---------------- */
export function TopicPage({ st, topic, go, toggleFollow, shareTopic, deleteTopic, onUnpublish, onPlay, lockPrice = 0, lingots = 0, onUnlock, friends = [], onChallengeFriend }) {
  const stats = st.topicStats[topic.id] || { xp: 0, played: 0, wins: 0, seen: [] }
  const lvl = levelInfo(stats.xp)
  const following = st.follows.includes(topic.id)
  const meRow = { ...meEntry(st.profile), allXp: stats.xp }
  const board = leaderboard(topic, meRow, myPeriodScore(stats, 'all'))
  const ranks = PERIODS.map(p => ({ ...p, rank: leaderboard(topic, meRow, myPeriodScore(stats, p.id), p.id).find(r => r.isMe).rank }))
  const champ = board[0]
  const champFriend = friends.find(f => f.player_id === champ.playerId)
  const followers = (topic.followers || 0) + (following ? 1 : 0)
  const seenPct = Math.round(((stats.seen?.length || 0) / topic.questions.length) * 100)

  return (
    <div className="screen topic-page" style={{ '--c': topic.color }}>
      <header className="top">
        <button className="icon-btn" onClick={() => go({ name: 'topics' })} aria-label="Retour">←</button>
        <h1 className="ellipsis">{topic.name}</h1>
      </header>
      <div className="tp-hero">
        <TopicIcon topic={topic} size={128} />
        <div className="tp-actions">
          {lockPrice
            ? <button className={`btn ${lingots >= lockPrice ? 'btn-gold' : 'btn-ghost'}`} disabled={lingots < lockPrice} onClick={() => onUnlock(topic)}>{lingots >= lockPrice ? `🔓 Débloquer · ${lockPrice}` : `🔒 ${lockPrice} lingots`}</button>
            : <button className="btn btn-primary" onClick={() => onPlay(topic)}>Jouer</button>}
          <button className={`btn ${following ? 'btn-ghost' : 'btn-secondary'}`} onClick={() => toggleFollow(topic.id)}>
            {following ? '✓ Suivi' : '+ Suivre'}
          </button>
          <button className="btn btn-ghost" onClick={() => go({ name: 'ranking', id: topic.id })}>Classement</button>
        </div>
      </div>
      {lockPrice > 0 && <p className="tp-locked">🔒 Thème à débloquer dans la boutique pour {lockPrice} lingots. {lingots < lockPrice ? `Il t'en manque ${lockPrice - lingots} : joue à L'Appât du Kraken pour en gagner.` : ''}</p>}
      <p className="tp-tagline">{topic.tagline || `Un thème créé par ${topic.by}`}{!topic.official && <> · par <b>{topic.by}</b></>}</p>

      <div className="progress-label"><small>Questions découvertes</small><small>{seenPct} %</small></div>
      <div className="progress"><i style={{ width: `${seenPct}%` }} /></div>

      <div className="tp-title">
        <span className="tp-title-badge">{topicTitle(topic, lvl.level)}</span>
        {(() => {
          const nx = nextTitle(topic, lvl.level)
          return <small>{nx ? <>Prochain titre : <b>{nx.title}</b> au niveau {nx.level}</> : 'Tu as atteint le titre le plus haut de ce thème.'}</small>
        })()}
      </div>

      <SurpriseBar topicId={topic.id} xp={stats.xp} onOpen={() => go({ name: 'book' })} />

      <div className="tp-stats">
        <div><small>Ton niveau</small><b>{lvl.level}</b></div>
        <div><small>Abonnés</small><b>{fmt(followers)}</b></div>
        <div><small>Questions</small><b>{topic.questions.length}</b></div>
      </div>
      <button className="tp-stats tp-ranks" onClick={() => go({ name: 'ranking', id: topic.id })}>
        {ranks.map(r => <div key={r.id}><small>{r.id === 'all' ? 'Toujours' : r.label}</small><b>{r.rank ? `#${r.rank}` : '–'}</b></div>)}
      </button>

      {champ.champion && (
        <div className={`champ-card ${champ.isMe ? 'mine' : ''}`}>
          <Avatar seed={champ.avatar} photo={champ.photo} size={56} ring="var(--gold)" />
          <div className="champ-info">
            <small>👑 Champion du thème</small>
            <b>{champ.isMe ? 'C\'est toi !' : `${champ.flag} ${champ.name}`}</b>
            <small><TierIcon rating={champ.xp} /> {tierOf(champ.xp).name} · cote {fmt(champ.xp)}</small>
          </div>
          {!champ.isMe && champFriend && onChallengeFriend && <button className="btn btn-small btn-gold" onClick={() => onChallengeFriend(champFriend)}>Défier</button>}
        </div>
      )}

      {!topic.official && (
        <div className="tp-owner">
          <button className="btn btn-ghost" onClick={() => shareTopic(topic)}>🔗 Partager ce thème</button>
          {topic.own && <button className="btn btn-ghost" onClick={() => go({ name: 'create', id: topic.id })}>✏️ Modifier</button>}
          {topic.own && topic.published && <ConfirmButton className="btn btn-ghost" onConfirm={() => onUnpublish(topic)} confirmLabel="Ne plus publier ?">🌍 Publié · Retirer</ConfirmButton>}
          {(topic.own || topic.imported) && <ConfirmButton className="btn btn-ghost danger" onConfirm={() => deleteTopic(topic)} confirmLabel="Supprimer pour de bon ?">Supprimer</ConfirmButton>}
        </div>
      )}
    </div>
  )
}

/* ---------------- Classement ---------------- */
export function Ranking({ st, topic, go, friends = [], onChallenge }) {
  const stats = st.topicStats[topic.id] || { xp: 0 }
  const [kind, setKind] = useState('week')
  const rows = leaderboard(topic, { ...meEntry(st.profile), allXp: stats.xp }, myPeriodScore(stats, kind), kind)
  const reset = resetIn(kind)
  const friendOf = (r) => friends.find(f => f.player_id === r.playerId)
  const ranked = rows.filter(r => r.rank && r.xp > 0)
  const isAll = kind === 'all'
  const unit = (r) => (isAll ? <><TierIcon rating={r.xp} /> {fmt(r.xp)}</> : <>{fmt(r.xp)}<small> pts</small></>)
  const meStats = stats
  const podium = ranked.length >= 2 ? ranked.slice(0, 3) : []
  const rest = rows.slice(podium.length)
  useEffect(() => {
    document.querySelector('.rank-row.me')?.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }, [kind])
  const challenge = (r) => { const f = friendOf(r); return f && onChallenge ? <button className="btn btn-small btn-secondary" onClick={() => onChallenge(f)}>Défier</button> : null }
  return (
    <div className="screen ranking-screen" style={{ '--c': topic.color }}>
      <header className="top">
        <button className="icon-btn" onClick={() => go({ name: 'topic', id: topic.id })} aria-label="Retour">←</button>
        <h1 className="ellipsis">Classement · {topic.name}</h1>
      </header>
      <div className="seg" role="tablist">
        {PERIODS.map(p => (
          <button key={p.id} role="tab" aria-selected={p.id === kind} className={p.id === kind ? 'on' : ''} onClick={() => setKind(p.id)}>{p.label}</button>
        ))}
      </div>
      <p className="rank-note">
        {isAll
          ? <>Cote de niveau : elle monte quand tu gagnes, surtout contre plus fort que toi. Classé après {PLACEMENT} parties.</>
          : <>Total de tes {BEST_OF} meilleures parties {kind === 'week' ? 'de la semaine' : 'du mois'} · remise à zéro dans <b>{reset}</b></>}
      </p>
      {podium.length > 0 && (
        <div className={`podium n${podium.length}`}>
          {podium.map(r => (
            <div key={r.id} className={`pod pod${r.rank} ${r.isMe ? 'me' : ''}`}>
              {r.rank === 1 && <span className="pod-crown">👑</span>}
              <Avatar seed={r.avatar} photo={r.photo} size={r.rank === 1 ? 64 : 52} ring={r.rank === 1 ? 'var(--gold)' : r.rank === 2 ? '#d7dcef' : '#e3a06b'} />
              <b className="ellipsis">{r.isMe ? 'Toi' : r.name}</b>
              <small>{unit(r)}</small>
              <div className="pod-step">{r.rank}</div>
            </div>
          ))}
        </div>
      )}
      {ranked.length < 2 && (
        <p className="rank-empty">{ranked.length === 1 && rows[0].isMe ? 'Tu es seul en tête pour l\'instant.' : isAll ? 'Personne n\'a encore fini ses parties de placement.' : 'Personne n\'a encore joué sur cette période.'} Invite tes amis à jouer ce thème pour remplir le classement !</p>
      )}
      <ol className="ranking">
        {rest.map(r => {
          const l = levelInfo(r.allXp ?? r.xp)
          return (
            <li key={r.id} className={`rank-row ${r.isMe ? 'me' : ''} ${r.unranked ? 'unranked' : ''}`}>
              <span className="rk">{r.rank ?? '–'}</span>
              <Avatar seed={r.avatar} photo={r.photo} size={40} />
              <div className="rk-info">
                <b>{r.flag} {r.isMe ? `${r.name} (toi)` : r.name}</b>
                <small>{r.unranked
                  ? (isAll ? `En placement · ${Math.min(meStats.rated || 0, PLACEMENT)}/${PLACEMENT} parties` : 'Pas encore de partie sur cette période')
                  : isAll ? `${tierOf(r.xp).name} · Niv. ${l.level}` : `Niv. ${l.level} · ${topicTitle(topic, l.level)}`}</small>
              </div>
              {!r.unranked && <span className="rk-xp">{unit(r)}</span>}
              {!r.isMe && challenge(r)}
            </li>
          )
        })}
      </ol>
    </div>
  )
}

/* ---------------- Recherche d'adversaire ---------------- */
const SEARCH_MS = 20000

// Recherche d'un vrai joueur sur le thème pendant 20 s ; sinon (ou sur demande) adversaire IA.
export function Matchmaking({ topic, opponent, live, makeQuestions, onLive, onReady, onCancel }) {
  // précharge la pieuvre boxeuse de l'écran face-à-face
  useEffect(() => { ['/mascotte/combat-anim.webp', '/decor/vs-fond-debut.webp', '/decor/tentacules.webp'].forEach(src => { new Image().src = src }); fetch('/decor/vs-fond.mp4').catch(() => {}) }, [])
  const [searching, setSearching] = useState(!!live)
  const [secs, setSecs] = useState(0)
  const [found, setFound] = useState(false)
  const stopRef = useRef(null)

  useEffect(() => {
    if (!searching) return
    let alive = true, busy = false
    const questions = makeQuestions()
    const t0 = Date.now()
    const stop = async (toAi) => {
      if (!alive) return
      alive = false
      clearInterval(iv)
      // dernier coup d'œil : quelqu'un nous a peut-être trouvé entre-temps
      try {
        const m = toAi ? await live.find(questions) : null
        if (m) { onLive(m); return }
        await live.leave()
      } catch { /* hors ligne : on joue contre l'IA */ }
      if (toAi) setSearching(false)
    }
    stopRef.current = stop
    const poll = async () => {
      if (!alive || busy) return
      setSecs(Math.floor((Date.now() - t0) / 1000))
      if (Date.now() - t0 > SEARCH_MS) return stop(true)
      busy = true
      try {
        const m = await live.find(questions)
        if (m && alive) { alive = false; clearInterval(iv); sfx.tap(); onLive(m) }
      } catch { if (alive) { alive = false; clearInterval(iv); setSearching(false) } }
      busy = false
    }
    const iv = setInterval(poll, 1500)
    poll()
    return () => { if (alive) { alive = false; clearInterval(iv); live.leave().catch(() => {}) } }
  }, [searching, live, makeQuestions, onLive])

  useEffect(() => {
    if (searching) return
    const t1 = setTimeout(() => { setFound(true); sfx.tap() }, 1400 + Math.random() * 1200)
    return () => clearTimeout(t1)
  }, [searching])
  useEffect(() => {
    if (!found) return
    const t2 = setTimeout(onReady, 900)
    return () => clearTimeout(t2)
  }, [found, onReady])

  if (searching) {
    return (
      <div className="matchmaking">
        <TopicIcon topic={topic} size={96} />
        <h2>{topic.name}</h2>
        <div className="radar live"><span /><span /><span /><Mascot pose="attente" size={250} className="radar-mascot wait" /></div>
        <p className="mm-status">Recherche d'un vrai joueur en ligne… <b>{secs} s</b></p>
        <p className="mm-hint">Si personne n'arrive d'ici 20 secondes, tu joues contre un adversaire IA.</p>
        <button className="btn btn-primary" onClick={() => stopRef.current?.(true)}>Jouer contre l'IA maintenant</button>
        <button className="btn btn-ghost" onClick={() => { stopRef.current?.(false); onCancel() }}>Annuler</button>
      </div>
    )
  }
  return (
    <div className="matchmaking">
      <TopicIcon topic={topic} size={96} />
      <h2>{topic.name}</h2>
      <div className={`radar ${found ? 'found' : ''}`}>
        <span /><span /><span />
        {!found && <Mascot pose="attente" size={250} className="radar-mascot wait" />}
        {found && <Avatar seed={opponent.avatar} size={96} ring={opponent.champion ? 'var(--gold)' : 'var(--opp)'} className="found-av" />}
      </div>
      <p className="mm-status">{found ? <>Adversaire IA : <b>{opponent.name}</b>{opponent.champion ? ' 👑' : ''}<AiTag on={opponent.ai} /></> : 'Préparation de ton adversaire IA…'}</p>
      {!found && <button className="btn btn-ghost" onClick={onCancel}>Annuler</button>}
    </div>
  )
}

/* ---------------- Créer un thème ---------------- */
const ICONS = ['🎯', '🎨', '🎸', '🌍', '🧬', '🏀', '🍕', '🐉', '🚀', '📚', '🎭', '🕹️', '🌿', '🏰', '🎤', '🧩']
const COLORS = ['#ff5d73', '#ffb648', '#f2c94c', '#3ddc84', '#2ee6c5', '#2ec4ff', '#5b7cff', '#7c5cff', '#e85dff', '#ff7ad9']
const MIN_Q = 7
const emptyQ = () => ({ q: '', a: ['', '', '', ''] })

export function CreateTopic({ st, existing, onSave, go }) {
  const [name, setName] = useState(existing?.name || '')
  const [icon, setIcon] = useState(existing?.icon || '🎯')
  const [color, setColor] = useState(existing?.color || '#7c5cff')
  const [category, setCategory] = useState(existing?.category || 'Culture')
  const [tagline, setTagline] = useState(existing?.tagline || '')
  const [qs, setQs] = useState(existing?.questions?.map(q => ({ q: q.q, a: [...q.a] })) || [emptyQ()])
  // Les 8 titres de niveau : pré-remplis avec ceux du thème (ou de sa catégorie), modifiables un par un
  const defaultsFor = (cat) => ladderFor({ id: existing?.id, category: cat })
  const [ladder, setLadder] = useState(() => [...ladderFor(existing || { category: 'Culture' })])
  const [ladderTouched, setLadderTouched] = useState(!!existing?.ladder)
  const changeCategory = (cat) => {
    setCategory(cat)
    if (!ladderTouched) setLadder([...defaultsFor(cat)])
  }
  const setTitle = (i, v) => { setLadderTouched(true); setLadder(l => l.map((t, k) => (k === i ? v : t))) }
  const resetLadder = () => { setLadderTouched(false); setLadder([...defaultsFor(category)]) }

  const complete = qs.filter(q => q.q.trim() && q.a.every(a => a.trim()))
  const ok = name.trim() && complete.length >= MIN_Q

  const setQ = (i, patch) => setQs(list => list.map((q, j) => j === i ? { ...q, ...patch } : q))
  const setA = (i, k, v) => setQs(list => list.map((q, j) => j === i ? { ...q, a: q.a.map((a, n) => n === k ? v : a) } : q))

  function save() {
    onSave({
      id: existing?.id || 'u-' + Date.now().toString(36),
      name: name.trim(), icon, color, category, tagline: tagline.trim(),
      by: st.profile.name, own: true, community: true, followers: 0,
      questions: complete.map(q => ({ q: q.q.trim(), a: q.a.map(a => a.trim()) })),
      // titres personnalisés seulement si on y a touché ; une case vide reprend le titre par défaut
      ...(ladderTouched ? { ladder: ladder.map((t, i) => t.trim() || defaultsFor(category)[i]) } : {}),
    })
  }

  const preview = { name: name || 'Mon thème', icon, color }
  return (
    <div className="screen create">
      <header className="top">
        <button className="icon-btn" onClick={() => go(existing ? { name: 'topic', id: existing.id } : { name: 'topics' })} aria-label="Retour">←</button>
        <h1>{existing ? 'Modifier le thème' : 'Créer un thème'}</h1>
      </header>

      <div className="create-head">
        <TopicIcon topic={preview} size={96} />
        <div className="field grow">
          <label>Nom du thème</label>
          <input value={name} maxLength={40} onChange={e => setName(e.target.value)} placeholder="Ex. : Les dessins animés des années 90" />
          <label>Description courte</label>
          <input value={tagline} maxLength={80} onChange={e => setTagline(e.target.value)} placeholder="Pour les vrais connaisseurs" />
        </div>
      </div>

      <div className="field">
        <label>Icône</label>
        <div className="picker">
          {ICONS.map(ic => <button key={ic} className={ic === icon ? 'on' : ''} onClick={() => setIcon(ic)}>{ic}</button>)}
          <input className="emoji-in" value={icon} maxLength={4} onChange={e => setIcon(e.target.value || '🎯')} aria-label="Emoji personnalisé" />
        </div>
      </div>
      <div className="field">
        <label>Couleur</label>
        <div className="picker">
          {COLORS.map(c => <button key={c} className={`swatch ${c === color ? 'on' : ''}`} style={{ background: c }} onClick={() => setColor(c)} aria-label={c} />)}
        </div>
      </div>
      <div className="field">
        <label>Catégorie</label>
        <select value={category} onChange={e => changeCategory(e.target.value)}>
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
      </div>

      <h3 className="sec-title">Titres de niveau</h3>
      <p className="ladder-hint">Le titre que portent les joueurs selon leur niveau dans ce thème, du premier au plus prestigieux.</p>
      <div className="ladder-editor">
        {ladder.map((t, i) => (
          <label key={i} className="ladder-row">
            <span>Niv. {TITLE_LEVELS[i]}{i === ladder.length - 1 ? '+' : ''}</span>
            <input id={`ladder-${i}`} value={t} maxLength={32} onChange={e => setTitle(i, e.target.value)} placeholder={defaultsFor(category)[i]} />
          </label>
        ))}
      </div>
      {ladderTouched && <button className="btn btn-small btn-ghost" onClick={resetLadder}>Revenir aux titres par défaut</button>}

      <h3 className="sec-title">Questions <small>({complete.length}/{MIN_Q} minimum)</small></h3>
      {qs.map((q, i) => (
        <div key={i} className="q-editor">
          <div className="q-head">
            <b>#{i + 1}</b>
            {qs.length > 1 && <button className="icon-btn small" onClick={() => setQs(l => l.filter((_, j) => j !== i))} aria-label="Supprimer la question">✕</button>}
          </div>
          <textarea value={q.q} maxLength={200} onChange={e => setQ(i, { q: e.target.value })} placeholder="Ta question…" rows={2} />
          {q.a.map((a, k) => (
            <input key={k} className={k === 0 ? 'good' : 'bad'} value={a} maxLength={80}
              onChange={e => setA(i, k, e.target.value)}
              placeholder={k === 0 ? '✓ Bonne réponse' : `✗ Mauvaise réponse ${k}`} />
          ))}
        </div>
      ))}
      <button className="btn btn-ghost wide" onClick={() => setQs(l => [...l, emptyQ()])}>+ Ajouter une question</button>

      <div className="sticky-save">
        <button className="btn btn-primary wide" disabled={!ok} onClick={save}>
          {ok ? 'Publier le thème' : `Encore ${Math.max(0, MIN_Q - complete.length)} question(s) complète(s)${name.trim() ? '' : ' et un nom'}`}
        </button>
      </div>
    </div>
  )
}

/* ---------------- Premier lancement ---------------- */
export function Onboarding({ topics, onDone, onRecover }) {
  const [step, setStep] = useState(0)
  const [recovering, setRecovering] = useState(false)
  const [name, setName] = useState('')
  // Choix de l'avatar : une sélection de monstres, ou une photo de l'appareil
  const newSeeds = () => Array.from({ length: 8 }, () => Math.random().toString(36).slice(2))
  const [seeds, setSeeds] = useState(newSeeds)
  const [seed, setSeed] = useState(() => seeds[0])
  const [photo, setPhoto] = useState(null)
  const [photoErr, setPhotoErr] = useState(null)
  const [picked, setPicked] = useState([])
  const shuffleSeeds = () => { const s = newSeeds(); setSeeds(s); setSeed(s[0]); setPhoto(null) }
  async function pickPhoto(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) { setPhotoErr('Ce fichier n\'est pas une image.'); return }
    try { setPhoto(await resizeImage(file, 256, 256)); setPhotoErr(null) }
    catch { setPhotoErr('Impossible de lire cette image. Essaie une photo JPEG ou PNG.') }
  }
  const official = topics.filter(t => t.official || t.community)
  const toggle = (id) => setPicked(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id])

  if (step === 0) {
    return (
      <div className="screen onboarding">
        <Brand big />
        <h1 className="ob-title">Des duels de quiz,<br />sur tous les sujets.</h1>
        <p className="ob-sub">Réponds juste, réponds vite : chaque seconde gagnée te donne des points d'avance.</p>
        <div className="ob-av">
          <Avatar key={photo ? 'photo' : seed} seed={seed} photo={photo} size={132} ring="var(--me)" />
          <p className="ob-av-label">{photo ? 'Ta photo' : 'Choisis ton monstre'}</p>
          <div className="ob-monsters" role="radiogroup" aria-label="Monstres">
            {seeds.map(s => (
              <button key={s} role="radio" aria-checked={!photo && s === seed} className={`ob-monster ${!photo && s === seed ? 'on' : ''}`}
                onClick={() => { setSeed(s); setPhoto(null) }} aria-label="Choisir ce monstre">
                <Avatar seed={s} size={52} />
              </button>
            ))}
          </div>
          <div className="ob-av-actions">
            <button className="btn btn-small btn-ghost" onClick={shuffleSeeds}>🎲 D'autres monstres</button>
            <label className="btn btn-small btn-ghost">
              📷 {photo ? 'Changer la photo' : 'Mettre une photo'}
              <input id="ob-photo" type="file" accept="image/*" hidden onChange={pickPhoto} />
            </label>
          </div>
          {photo && <button className="btn btn-small btn-ghost" onClick={() => setPhoto(null)}>Reprendre un monstre</button>}
          {photoErr && <p className="recover-err" role="alert">{photoErr}</p>}
        </div>
        <input className="ob-name" value={name} maxLength={18} onChange={e => setName(e.target.value)} placeholder="Ton pseudo" />
        <button className="btn btn-primary wide" disabled={!name.trim()} onClick={() => setStep(1)}>Continuer</button>
        {!recovering
          ? <button className="btn btn-ghost wide" onClick={() => setRecovering(true)}>J'ai déjà un compte</button>
          : <RecoverForm onRecover={onRecover} />}
      </div>
    )
  }
  return (
    <div className="screen onboarding">
      <header className="top">
        <button className="icon-btn" onClick={() => setStep(0)} aria-label="Retour">←</button>
        <h1>Tes centres d'intérêt</h1>
      </header>
      <p className="ob-sub">Choisis quelques thèmes à suivre. Tu pourras en ajouter d'autres plus tard.</p>
      <div className="grid">
        {official.map(t => (
          <button key={t.id} className={`topic-tile pickable ${picked.includes(t.id) ? 'picked' : ''}`} onClick={() => toggle(t.id)}>
            <TopicIcon topic={t} size={76} />
            <b>{t.name}</b>
            <small>{t.category}</small>
          </button>
        ))}
      </div>
      <div className="sticky-save">
        <button className="btn btn-primary wide" onClick={() => onDone({ name: name.trim(), avatar: seed, photo, follows: picked })}>
          {picked.length ? `C'est parti (${picked.length})` : 'Passer'}
        </button>
      </div>
    </div>
  )
}
