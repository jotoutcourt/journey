import { useEffect, useMemo, useState } from 'react'
import Avatar from './Avatar.jsx'
import TopicIcon from './TopicIcon.jsx'
import ConfirmButton from './ConfirmButton.jsx'
import { CATEGORIES } from '../data/topics.js'
import { levelInfo } from '../lib/levels.js'
import { getCommunity, leaderboard } from '../lib/bots.js'
import { PERIODS, myPeriodXp, resetIn } from '../lib/periods.js'
import { meEntry } from '../lib/profile.js'
import { topicTitle, nextTitle, ladderFor, TITLE_LEVELS } from '../lib/titles.js'
import { dayKey } from '../lib/tower.js'
import { decodeTopic } from '../lib/store.js'
import { sfx } from '../lib/sound.js'

const fmt = (n) => n.toLocaleString('fr-FR')

function XpBar({ xp }) {
  const l = levelInfo(xp)
  return (
    <div className="xpbar">
      <div className="xpbar-track"><i style={{ width: `${(l.into / l.need) * 100}%` }} /></div>
      <small>{l.into} / {l.need} XP</small>
    </div>
  )
}

export function TopicTile({ topic, onClick, sub }) {
  return (
    <button className="topic-tile" onClick={onClick}>
      <TopicIcon topic={topic} size={76} />
      <b>{topic.name}</b>
      <small>{sub ?? topic.category}</small>
    </button>
  )
}

/* ---------------- Accueil ---------------- */
export function Home({ st, topics, go, quickDuel }) {
  const me = st.profile
  const lvl = levelInfo(st.xp)
  const followed = topics.filter(t => st.follows.includes(t.id))
  const popular = [...topics].filter(t => t.official).sort((a, b) => b.followers - a.followers).slice(0, 6)
  const champs = useMemo(() => {
    const pool = followed.length ? followed : popular
    return pool.slice(0, 4).map(t => ({ topic: t, champ: getCommunity(t)[0] }))
  }, [followed, popular])

  return (
    <div className="screen home">
      <header className="top">
        <Brand />
      </header>

      <section className="me-card" onClick={() => go({ name: 'profile' })}>
        <Avatar seed={me.avatar} photo={me.photo} size={64} ring="var(--me)" />
        <div className="me-info">
          <b>{me.name}</b>
          <span>Niveau {lvl.level} · {lvl.title}</span>
          <XpBar xp={st.xp} />
        </div>
      </section>

      <button className="quick-duel" onClick={quickDuel}>
        <span className="qd-glyph" aria-hidden="true"><Chevrons /></span>
        <span className="qd-txt"><b>Duel rapide</b><small>Un thème au hasard parmi les tiens, un adversaire à ta taille</small></span>
      </button>

      <section className="tower-card">
        <div className="tc-head">
          <span className="tc-art" aria-hidden="true"><i /><i /><i /><i /></span>
          <div>
            <b>L'Ascension</b>
            <small>Mode solo · 3 cœurs, des portes à choisir, un boss tous les 10 étages</small>
          </div>
        </div>
        <div className="tc-actions">
          <button className="btn btn-secondary" onClick={() => go({ name: 'tower' })}>
            Grimper{st.tower?.best ? ` · record étage ${st.tower.best.floor}` : ''}
          </button>
          <button className="btn btn-gold" onClick={() => go({ name: 'tower', daily: true })}>
            {st.tower?.daily?.day === dayKey() ? `Tour du jour · étage ${st.tower.daily.floor}` : 'Tour du jour'}
          </button>
        </div>
      </section>

      {followed.length > 0 && (
        <section>
          <h3 className="sec-title">Mes thèmes</h3>
          <div className="hscroll">
            {followed.map(t => (
              <TopicTile key={t.id} topic={t} onClick={() => go({ name: 'topic', id: t.id })}
                sub={topicTitle(t, levelInfo(st.topicStats[t.id]?.xp).level)} />
            ))}
          </div>
        </section>
      )}

      <section>
        <h3 className="sec-title">Champions à détrôner</h3>
        <div className="champ-list">
          {champs.map(({ topic, champ }) => (
            <div key={topic.id} className="champ-row">
              <Avatar seed={champ.avatar} size={44} ring="var(--gold)" />
              <div className="champ-info">
                <b>{champ.flag} {champ.name}</b>
                <small>👑 Champion · {topic.name}</small>
              </div>
              <button className="btn btn-small btn-gold" onClick={() => go({ name: 'match', id: topic.id, forceChampion: true })}>Défier</button>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h3 className="sec-title">Thèmes populaires</h3>
        <div className="grid">
          {popular.map(t => <TopicTile key={t.id} topic={t} onClick={() => go({ name: 'topic', id: t.id })} />)}
        </div>
      </section>

      {st.history.length > 0 && (
        <section>
          <h3 className="sec-title">Dernières parties</h3>
          <ul className="history">
            {st.history.slice(0, 8).map((h, i) => (
              <li key={i} className={h.outcome}>
                <Avatar seed={h.oppAvatar} size={36} />
                <div><b>{h.oppName}{h.champion ? ' 👑' : ''}</b><small>{h.topicName}</small></div>
                <span className="h-score">{h.myScore}–{h.oppScore}</span>
                <span className="h-tag">{{ win: 'V', lose: 'D', draw: 'N' }[h.outcome]}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

export function Brand() {
  return <div className="brand"><Chevrons /><span>Duelia</span></div>
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
export function Topics({ topics, go, importTopic }) {
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('Tous')
  const [code, setCode] = useState('')
  const [importErr, setImportErr] = useState(false)
  const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  const match = (t) => (cat === 'Tous' || t.category === cat) && (!q || norm(t.name + ' ' + t.category).includes(norm(q)))
  const official = topics.filter(t => t.official && match(t))
  const mine = topics.filter(t => t.own && match(t))
  const community = topics.filter(t => !t.official && !t.own && match(t))

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
      <header className="top"><h1>Thèmes</h1></header>
      <input className="search" placeholder="Rechercher un thème…" value={q} onChange={e => setQ(e.target.value)} />
      <div className="chips">
        {['Tous', ...CATEGORIES].map(c => (
          <button key={c} className={`chip ${c === cat ? 'on' : ''}`} onClick={() => setCat(c)}>{c}</button>
        ))}
      </div>

      {official.length > 0 && <>
        <h3 className="sec-title">Thèmes officiels</h3>
        <div className="grid">
          {official.map(t => <TopicTile key={t.id} topic={t} onClick={() => go({ name: 'topic', id: t.id })} />)}
        </div>
      </>}

      <h3 className="sec-title">Mes créations</h3>
      <div className="grid">
        <button className="topic-tile create-tile" onClick={() => go({ name: 'create' })}>
          <span className="topic-icon plus" style={{ width: 76, height: 76 }}>+</span>
          <b>Créer un thème</b>
          <small>Tes questions, tes règles</small>
        </button>
        {mine.map(t => <TopicTile key={t.id} topic={t} onClick={() => go({ name: 'topic', id: t.id })} sub={`${t.questions.length} questions`} />)}
      </div>

      {community.length > 0 && <h3 className="sec-title">Créés par les joueurs</h3>}
      <div className="grid">
        {community.map(t => <TopicTile key={t.id} topic={t} onClick={() => go({ name: 'topic', id: t.id })} sub={`par ${t.by}`} />)}
      </div>

      <div className="import-box">
        <p>Un ami t'a envoyé un thème ? Colle le lien ici :</p>
        <div className="import-row">
          <input value={code} onChange={e => { setCode(e.target.value); setImportErr(false) }} placeholder="https://…#t=…" />
          <button className="btn btn-small btn-primary" onClick={doImport} disabled={!code.trim()}>Ajouter</button>
        </div>
        {importErr && <p className="import-err">Ce lien ne contient pas de thème valide. Vérifie que tu l'as copié en entier.</p>}
      </div>
    </div>
  )
}

/* ---------------- Page d'un thème ---------------- */
export function TopicPage({ st, topic, go, toggleFollow, shareTopic, deleteTopic }) {
  const stats = st.topicStats[topic.id] || { xp: 0, played: 0, wins: 0, seen: [] }
  const lvl = levelInfo(stats.xp)
  const following = st.follows.includes(topic.id)
  const meRow = { ...meEntry(st.profile), allXp: stats.xp }
  const board = leaderboard(topic, meRow, stats.xp)
  const ranks = PERIODS.map(p => ({ ...p, rank: leaderboard(topic, meRow, myPeriodXp(stats, p.id), p.id).find(r => r.isMe).rank }))
  const champ = board[0]
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
          <button className="btn btn-primary" onClick={() => go({ name: 'match', id: topic.id })}>Jouer</button>
          <button className={`btn ${following ? 'btn-ghost' : 'btn-secondary'}`} onClick={() => toggleFollow(topic.id)}>
            {following ? '✓ Suivi' : '+ Suivre'}
          </button>
          <button className="btn btn-ghost" onClick={() => go({ name: 'ranking', id: topic.id })}>Classement</button>
        </div>
      </div>
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

      <div className="tp-stats">
        <div><small>Ton niveau</small><b>{lvl.level}</b></div>
        <div><small>Abonnés</small><b>{fmt(followers)}</b></div>
        <div><small>Questions</small><b>{topic.questions.length}</b></div>
      </div>
      <button className="tp-stats tp-ranks" onClick={() => go({ name: 'ranking', id: topic.id })}>
        {ranks.map(r => <div key={r.id}><small>{r.id === 'all' ? 'Toujours' : r.label}</small><b>#{r.rank}</b></div>)}
      </button>

      <div className={`champ-card ${champ.isMe ? 'mine' : ''}`}>
        <Avatar seed={champ.avatar} photo={champ.photo} size={56} ring="var(--gold)" />
        <div className="champ-info">
          <small>👑 Champion du thème</small>
          <b>{champ.isMe ? 'C\'est toi !' : `${champ.flag} ${champ.name}`}</b>
          <small>{fmt(champ.xp)} XP · niveau {levelInfo(champ.xp).level}</small>
        </div>
        {!champ.isMe && <button className="btn btn-small btn-gold" onClick={() => go({ name: 'match', id: topic.id, forceChampion: true })}>Défier</button>}
      </div>

      {!topic.official && (
        <div className="tp-owner">
          <button className="btn btn-ghost" onClick={() => shareTopic(topic)}>🔗 Partager ce thème</button>
          {topic.own && <button className="btn btn-ghost" onClick={() => go({ name: 'create', id: topic.id })}>✏️ Modifier</button>}
          {(topic.own || topic.imported) && <ConfirmButton className="btn btn-ghost danger" onConfirm={() => deleteTopic(topic)} confirmLabel="Supprimer pour de bon ?">Supprimer</ConfirmButton>}
        </div>
      )}
    </div>
  )
}

/* ---------------- Classement ---------------- */
export function Ranking({ st, topic, go }) {
  const stats = st.topicStats[topic.id] || { xp: 0 }
  const [kind, setKind] = useState('week')
  const period = PERIODS.find(p => p.id === kind)
  const rows = leaderboard(topic, { ...meEntry(st.profile), allXp: stats.xp }, myPeriodXp(stats, kind), kind)
  const reset = resetIn(kind)
  useEffect(() => {
    document.querySelector('.rank-row.me')?.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }, [kind])
  return (
    <div className="screen">
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
        {reset ? <>XP gagné depuis le début {kind === 'week' ? 'de la semaine' : 'du mois'} · remise à zéro dans <b>{reset}</b></> : <>Tout l'XP gagné dans ce thème</>}
      </p>
      <ol className="ranking">
        {rows.map(r => {
          const l = levelInfo(r.allXp ?? r.xp)
          return (
            <li key={r.id} className={`rank-row ${r.isMe ? 'me' : ''} ${r.champion ? 'champ' : ''}`}>
              <span className="rk">{r.champion ? '👑' : r.rank}</span>
              <Avatar seed={r.avatar} photo={r.photo} size={40} ring={r.champion ? 'var(--gold)' : undefined} />
              <div className="rk-info">
                <b>{r.flag} {r.isMe ? `${r.name} (toi)` : r.name}</b>
                <small>{r.champion ? period.champ : `Niv. ${l.level} · ${topicTitle(topic, l.level)}`}</small>
              </div>
              <span className="rk-xp">{fmt(r.xp)}<small> XP</small></span>
              {!r.isMe && <button className="btn btn-small btn-secondary" onClick={() => go({ name: 'match', id: topic.id, opponentId: r.id })}>Défier</button>}
            </li>
          )
        })}
      </ol>
    </div>
  )
}

/* ---------------- Recherche d'adversaire ---------------- */
export function Matchmaking({ topic, opponent, onReady, onCancel }) {
  const [found, setFound] = useState(false)
  useEffect(() => {
    const t1 = setTimeout(() => { setFound(true); sfx.tap() }, 1400 + Math.random() * 1200)
    return () => clearTimeout(t1)
  }, [])
  useEffect(() => {
    if (!found) return
    const t2 = setTimeout(onReady, 900)
    return () => clearTimeout(t2)
  }, [found, onReady])
  return (
    <div className="matchmaking">
      <TopicIcon topic={topic} size={96} />
      <h2>{topic.name}</h2>
      <div className={`radar ${found ? 'found' : ''}`}>
        <span /><span /><span />
        {found && <Avatar seed={opponent.avatar} size={96} ring={opponent.champion ? 'var(--gold)' : 'var(--opp)'} className="found-av" />}
      </div>
      <p className="mm-status">{found ? <>Adversaire trouvé : <b>{opponent.name}</b>{opponent.champion ? ' 👑' : ''}</> : 'Recherche d\'un adversaire…'}</p>
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
export function Onboarding({ topics, onDone }) {
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [seed, setSeed] = useState(() => Math.random().toString(36).slice(2))
  const [picked, setPicked] = useState([])
  const official = topics.filter(t => t.official || t.community)
  const toggle = (id) => setPicked(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id])

  if (step === 0) {
    return (
      <div className="screen onboarding">
        <Brand />
        <h1 className="ob-title">Des duels de quiz,<br />sur tous les sujets.</h1>
        <p className="ob-sub">Réponds juste, réponds vite : chaque seconde gagnée te donne des points d'avance.</p>
        <div className="ob-av">
          <Avatar seed={seed} size={140} ring="var(--me)" />
          <button className="btn btn-small btn-ghost" onClick={() => setSeed(Math.random().toString(36).slice(2))}>🎲 Une autre créature</button>
        </div>
        <input className="ob-name" value={name} maxLength={18} onChange={e => setName(e.target.value)} placeholder="Ton pseudo" autoFocus />
        <button className="btn btn-primary wide" disabled={!name.trim()} onClick={() => setStep(1)}>Continuer</button>
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
        <button className="btn btn-primary wide" onClick={() => onDone({ name: name.trim(), avatar: seed, follows: picked })}>
          {picked.length ? `C'est parti (${picked.length})` : 'Passer'}
        </button>
      </div>
    </div>
  )
}
