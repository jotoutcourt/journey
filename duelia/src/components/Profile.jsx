import { useMemo, useRef, useState } from 'react'
import Avatar from './Avatar.jsx'
import TopicIcon from './TopicIcon.jsx'
import ConfirmButton from './ConfirmButton.jsx'
import AccountCard from './AccountCard.jsx'
import InstallCard from './InstallCard.jsx'
import { PushCard } from './Social.jsx'
import AdminLog from './AdminLog.jsx'
import { levelInfo } from '../lib/levels.js'
import { topicTitle } from '../lib/titles.js'
import { COUNTRIES, computeStats, bestBadge, resizeImage } from '../lib/profile.js'
import PawnCollection from './PawnCollection.jsx'
import { STICKERS, STICKER_LEVEL, unlockedLocally } from '../lib/stickers.js'

const fmt = (n) => n.toLocaleString('fr-FR')
const pct = (n, total) => (total ? Math.round((n / total) * 100) : 0)

// Couleurs des catégories (palette catégorielle validée sur le fond sombre de l'appli).
const CAT_COLORS = ['var(--c1)', 'var(--c2)', 'var(--c3)', 'var(--c4)', 'var(--c5)', 'var(--c6)']

/* ---------- Victoires / nuls / défaites : une barre empilée ---------- */
function OutcomeBar({ wins, draws, losses }) {
  const total = wins + draws + losses
  const parts = [
    { key: 'win', label: 'Victoires', n: wins },
    { key: 'draw', label: 'Nuls', n: draws },
    { key: 'lose', label: 'Défaites', n: losses },
  ]
  return (
    <div className="outcome">
      <div className="outcome-bar" role="img" aria-label={parts.map(p => `${p.label} ${pct(p.n, total)} %`).join(', ')}>
        {parts.filter(p => p.n > 0).map(p => (
          <i key={p.key} className={`ob-${p.key}`} style={{ flexGrow: p.n }} title={`${p.label} : ${p.n} (${pct(p.n, total)} %)`} />
        ))}
      </div>
      <div className="outcome-legend">
        {parts.map(p => (
          <div key={p.key} className={`ol ol-${p.key}`}>
            <span className="ol-dot" aria-hidden="true" />
            <small>{p.label}</small>
            <b>{pct(p.n, total)} %</b>
            <small className="ol-n">{fmt(p.n)} partie{p.n > 1 ? 's' : ''}</small>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ---------- XP par catégorie : anneau + légende ---------- */
function CategoryDonut({ data, total }) {
  const [active, setActive] = useState(null)
  // 5 catégories principales, le reste regroupé dans « Autres »
  const slices = data.length > 6
    ? [...data.slice(0, 5), ['Autres', data.slice(5).reduce((s, [, v]) => s + v, 0)]]
    : data
  const sum = slices.reduce((s, [, v]) => s + v, 0)
  const R = 54, W = 18, C = 2 * Math.PI * R
  const GAP = slices.length > 1 ? 2 : 0 // 2 px d'espace entre les segments
  const starts = slices.reduce((acc, _s, i) => [...acc, i ? acc[i - 1] + (slices[i - 1][1] / sum) * C : 0], [])
  const shown = active != null ? slices[active] : null

  return (
    <div className="donut-wrap">
      <svg viewBox="0 0 140 140" className="donut" role="img" aria-label="Répartition de l'XP par catégorie">
        <circle cx="70" cy="70" r={R} fill="none" stroke="var(--card2)" strokeWidth={W} />
        {slices.map(([name, v], i) => {
          const len = (v / sum) * C
          return (
            <circle key={name} cx="70" cy="70" r={R} fill="none"
              stroke={CAT_COLORS[i]} strokeWidth={active === i ? W + 4 : W}
              strokeDasharray={`${Math.max(0.5, len - GAP)} ${C}`} strokeDashoffset={-starts[i]}
              transform="rotate(-90 70 70)" className="donut-seg"
              opacity={active == null || active === i ? 1 : 0.35}
              onMouseEnter={() => setActive(i)} onMouseLeave={() => setActive(null)}
              onClick={() => setActive(a => (a === i ? null : i))}>
              <title>{`${name} : ${fmt(v)} XP (${pct(v, sum)} %)`}</title>
            </circle>
          )
        })}
        <text x="70" y={shown ? 64 : 68} textAnchor="middle" className="donut-big">{fmt(shown ? shown[1] : total)}</text>
        <text x="70" y={shown ? 82 : 86} textAnchor="middle" className="donut-small">{shown ? `${pct(shown[1], sum)} %` : 'XP total'}</text>
      </svg>
      <ul className="donut-legend">
        {slices.map(([name, v], i) => (
          <li key={name} className={active === i ? 'on' : ''}
            onMouseEnter={() => setActive(i)} onMouseLeave={() => setActive(null)}
            onClick={() => setActive(a => (a === i ? null : i))}>
            <span className="sw" style={{ background: CAT_COLORS[i] }} aria-hidden="true" />
            <span className="dl-name">{name}</span>
            <b>{fmt(v)}</b>
          </li>
        ))}
      </ul>
    </div>
  )
}

/* ---------- Édition du profil ---------- */
function ProfileEditor({ profile, onSave, onCancel }) {
  const [name, setName] = useState(profile.name)
  const [bio, setBio] = useState(profile.bio || '')
  const [flag, setFlag] = useState(profile.flag || '🇫🇷')
  const [photo, setPhoto] = useState(profile.photo || null)
  const [cover, setCover] = useState(profile.cover || null)
  const [err, setErr] = useState(null)

  async function pick(e, w, h, set) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) { setErr('Ce fichier n\'est pas une image.'); return }
    try { set(await resizeImage(file, w, h)); setErr(null) }
    catch { setErr('Impossible de lire cette image. Essaie une photo au format JPEG ou PNG.') }
  }

  const country = COUNTRIES.find(c => c[0] === flag)
  return (
    <div className="pf-edit">
      <div className="pf-edit-cover" style={cover ? { backgroundImage: `url(${cover})` } : undefined}>
        <label className="btn btn-small btn-ghost">
          📷 {cover ? 'Changer la couverture' : 'Ajouter une couverture'}
          <input type="file" accept="image/*" hidden onChange={e => pick(e, 720, 320, setCover)} />
        </label>
        {cover && <button className="btn btn-small btn-ghost" onClick={() => setCover(null)}>Retirer</button>}
      </div>

      <div className="pf-edit-photo">
        <Avatar seed={profile.avatar} photo={photo} size={96} ring="var(--me)" />
        <div className="pf-edit-photo-actions">
          <label className="btn btn-small btn-primary">
            📷 {photo ? 'Changer la photo' : 'Choisir une photo'}
            <input id="pf-photo" type="file" accept="image/*" hidden onChange={e => pick(e, 256, 256, setPhoto)} />
          </label>
          {photo && <button className="btn btn-small btn-ghost" onClick={() => setPhoto(null)}>Reprendre ma créature</button>}
        </div>
      </div>
      <p className="pf-hint">Depuis ton téléphone, tu peux prendre une photo ou en choisir une dans ta galerie. Elle est recadrée et reste sur ton appareil.</p>
      {err && <p className="pf-err">{err}</p>}

      <div className="field">
        <label htmlFor="pf-name">Pseudo</label>
        <input id="pf-name" value={name} maxLength={18} onChange={e => setName(e.target.value)} />
      </div>
      <div className="field">
        <label htmlFor="pf-country">Pays</label>
        <select id="pf-country" value={flag} onChange={e => setFlag(e.target.value)}>
          {COUNTRIES.map(([f, n]) => <option key={n} value={f}>{f} {n}</option>)}
        </select>
      </div>
      <div className="field">
        <label htmlFor="pf-bio">Bio <small>({bio.length}/150)</small></label>
        <textarea id="pf-bio" value={bio} maxLength={150} rows={3} onChange={e => setBio(e.target.value)}
          placeholder="Fan de capitales, imbattable sur les années 90…" />
      </div>
      <div className="pf-edit-actions">
        <button className="btn btn-ghost" onClick={onCancel}>Annuler</button>
        <button className="btn btn-primary" disabled={!name.trim()}
          onClick={() => onSave({ name: name.trim(), bio: bio.trim(), flag, country: country?.[1], photo, cover })}>
          Enregistrer
        </button>
      </div>
    </div>
  )
}

/* ---------- Page profil ---------- */
function BookCard({ st, topics, onOpen }) {
  const got = unlockedLocally(st)
  const next = STICKERS.find(s => !got.includes(s) && topics.some(t => t.id === s.topic))
  return (
    <button className="pf-book" onClick={onOpen}>
      <span className="pf-book-cover">📖</span>
      <span className="pf-book-txt"><b>Mon livre de stickers</b>
        <small>{got.length ? `${got.length} / ${STICKERS.length} sticker${got.length > 1 ? 's' : ''} débloqué${got.length > 1 ? 's' : ''}` : next ? `Atteins le niveau ${STICKER_LEVEL} en ${topics.find(t => t.id === next.topic)?.name} pour ton premier sticker` : `Atteins le niveau ${STICKER_LEVEL} d'un thème pour ton premier sticker`}</small></span>
      <span className="pf-book-peek">{got.slice(0, 3).map(s => <img key={s.id} src={s.img} alt="" />)}</span>
    </button>
  )
}

export default function Profile({ st, topics, update, go, account, onMakeCode, onRecover, push, onPush, onFriends, friendCount, onBook }) {
  const me = st.profile
  const lvl = levelInfo(st.xp)
  const [editing, setEditingRaw] = useState(false)
  // En entrant ou sortant de l'édition, on remonte en haut de la page
  const setEditing = (v) => { setEditingRaw(v); document.querySelector('.view')?.scrollTo(0, 0) }
  const stats = useMemo(() => computeStats(st, topics), [st, topics])
  const badge = useMemo(() => bestBadge(st, topics), [st, topics])
  const country = COUNTRIES.find(c => c[0] === (me.flag || '🇫🇷'))
  const mine = topics.filter(t => st.topicStats[t.id]?.played)
    .sort((a, b) => (st.topicStats[b.id].xp || 0) - (st.topicStats[a.id].xp || 0))
  const created = st.custom.filter(t => t.own).length
  // menu caché : 5 appuis rapides sur sa photo ouvrent l'historique (le serveur vérifie l'accès)
  const [secret, setSecret] = useState(false)
  const taps = useRef([])
  const tapAvatar = () => {
    const now = Date.now()
    taps.current = [...taps.current.filter(t => now - t < 2000), now]
    if (taps.current.length >= 5) { taps.current = []; setSecret(true) }
  }

  if (editing) {
    return (
      <div className="screen profile">
        <header className="top">
          <button className="icon-btn" onClick={() => setEditing(false)} aria-label="Retour">←</button>
          <h1>Modifier le profil</h1>
        </header>
        <ProfileEditor profile={me} onCancel={() => setEditing(false)}
          onSave={(patch) => { update(s => ({ ...s, profile: { ...s.profile, ...patch } })); setEditing(false) }} />
      </div>
    )
  }

  const badgeWhen = { week: 'cette semaine', month: 'ce mois-ci', all: 'depuis toujours' }
  return (
    <div className="screen profile">
      <div className="pf-cover" style={me.cover ? { backgroundImage: `url(${me.cover})` } : undefined}>
        <button className="btn btn-small btn-ghost pf-edit-btn" onClick={() => setEditing(true)}>✏️ Modifier</button>
        <span onClick={tapAvatar}><Avatar seed={me.avatar} photo={me.photo} size={112} ring="var(--me)" /></span>
        {secret && <AdminLog onClose={() => setSecret(false)} />}
        <h1 className="pf-name">{me.name} <span className="pf-level">{lvl.level}</span></h1>
        <span className="pf-title">{lvl.title}</span>
        <span className="pf-country">{country?.[0]} {country?.[1]}</span>
      </div>

      {badge && (
        <div className="pf-ribbon">
          <b>{badge.rank === 1 ? `👑 Champion · ${badge.topic.name}` : `🏆 Top 10 · ${badge.topic.name} (#${badge.rank})`}</b>
          <span>{badgeWhen[badge.kind]}</span>
        </div>
      )}


      {me.bio
        ? <p className="pf-bio">{me.bio}</p>
        : <button className="pf-bio empty" onClick={() => setEditing(true)}>Ajoute une bio pour te présenter</button>}

      <div className="tp-stats pf-counts">
        <div><small>Parties</small><b className="c-red">{fmt(stats.played)}</b></div>
        <div><small>Thèmes suivis</small><b className="c-green">{st.follows.length}</b></div>
        <div><small>Thèmes créés</small><b className="c-blue">{created}</b></div>
      </div>

      <div className="pf-xp">
        <span>Niveau {lvl.level} · {fmt(st.xp)} XP</span>
        <div className="xpbar-track"><i style={{ width: `${(lvl.into / lvl.need) * 100}%` }} /></div>
        <small>{lvl.need - lvl.into} XP avant le niveau {lvl.level + 1}</small>
      </div>

      {onBook && <BookCard st={st} topics={topics} onOpen={onBook} />}

      <PawnCollection />

      <h3 className="sec-title">Statistiques</h3>
      {stats.played === 0 ? (
        <p className="pf-empty">Joue ton premier duel : tes victoires, ton score moyen et ton temps de réponse apparaîtront ici.</p>
      ) : (
        <>
          <section className="pf-card">
            <OutcomeBar wins={stats.wins} draws={stats.draws} losses={stats.losses} />
          </section>

          <section className="pf-card">
            <h4>XP par catégorie</h4>
            <CategoryDonut data={stats.byCategory} total={stats.totalXp} />
          </section>

          <div className="pf-tiles">
            <div><small>Score moyen</small><b>{stats.avgScore ?? '–'}</b><span>points par duel</span></div>
            <div><small>Temps de réponse</small><b>{stats.avgTime != null ? stats.avgTime.toFixed(1).replace('.', ',') + ' s' : '–'}</b><span>en moyenne</span></div>
            <div><small>Bonnes réponses</small><b>{stats.accuracy != null ? stats.accuracy + ' %' : '–'}</b><span>de tes réponses</span></div>
          </div>
          {stats.avgScore == null && <p className="pf-note">Le score moyen, le temps de réponse et le taux de bonnes réponses se calculent à partir de ta prochaine partie.</p>}
        </>
      )}

      {mine.length > 0 && <>
        <h3 className="sec-title">Mes niveaux par thème</h3>
        <ul className="pf-topics">
          {mine.map(t => {
            const l = levelInfo(st.topicStats[t.id].xp)
            return (
              <li key={t.id} onClick={() => go({ name: 'topic', id: t.id })}>
                <TopicIcon topic={t} size={40} />
                <div><b>{t.name}</b><small>Niveau {l.level} · {topicTitle(t, l.level)}</small></div>
                <span>{fmt(st.topicStats[t.id].xp)} XP</span>
              </li>
            )
          })}
        </ul>
      </>}

      <h3 className="sec-title">Compte</h3>
      <AccountCard account={account} onMakeCode={onMakeCode} onRecover={onRecover} />
      <button className="btn btn-secondary wide" onClick={onFriends}>👥 Mes amis{friendCount ? ` (${friendCount})` : ''}</button>
      <PushCard status={push} onEnable={() => onPush(true)} onDisable={() => onPush(false)} />
      <InstallCard />

      <h3 className="sec-title">Réglages</h3>
      <label className="toggle">
        <input type="checkbox" checked={st.settings.sound} onChange={e => update(s => ({ ...s, settings: { ...s.settings, sound: e.target.checked } }))} />
        <span>Effets sonores</span>
      </label>
      <label className="toggle">
        <input type="checkbox" checked={st.settings.music !== false} disabled={!st.settings.sound}
          onChange={e => update(s => ({ ...s, settings: { ...s.settings, music: e.target.checked } }))} />
        <span>Musique pendant les duels{!st.settings.sound ? ' (active d\'abord les effets sonores)' : ''}</span>
      </label>
      <label className="toggle">
        <input type="checkbox" checked={st.settings.menuMusic !== false} disabled={!st.settings.sound}
          onChange={e => update(s => ({ ...s, settings: { ...s.settings, menuMusic: e.target.checked } }))} />
        <span>Musique de l'accueil et des menus{!st.settings.sound ? ' (active d\'abord les effets sonores)' : ''}</span>
      </label>
      <ConfirmButton className="btn btn-ghost danger wide" onConfirm={() => update(() => null)}
        confirmLabel="Tout effacer ? Appuie encore pour confirmer">Réinitialiser ma progression</ConfirmButton>
    </div>
  )
}
