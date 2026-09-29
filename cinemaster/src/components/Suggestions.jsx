import { useCallback, useEffect, useMemo, useState } from 'react'
import { imdbUrl, searchImdb, suggestions, titleKey } from '../lib/suggestions.js'
import { useAccount } from '../lib/cloud.js'
import { UNIVERSES } from '../data/cards.js'
import { Icon } from './Icons.jsx'
import { haptic } from '../lib/feedback.js'

const IN_GAME = new Set(Object.values(UNIVERSES).map(u => titleKey(u.name)))

function fr(e) {
  const m = e?.message || ''
  if (/fetch|network|load failed/i.test(m)) return 'Connexion impossible. Vérifie ta connexion internet.'
  if (/limite/i.test(m)) return 'Tu as déjà proposé 5 univers aujourd’hui : reviens demain !'
  if (/trop court|check constraint/i.test(m)) return 'Titre invalide.'
  if (/connexion requise/i.test(m)) return 'Connecte-toi (onglet Profil) pour proposer ou voter.'
  if (/list_suggestions|does not exist|schema cache/i.test(m)) return 'Les propositions ne sont pas encore activées.'
  return m || 'Une erreur est survenue.'
}

// Petite affiche IMDb (ou emplacement vide)
function Poster({ src }) {
  return <span className="imdb-poster">{src && <img src={src} alt="" loading="lazy" referrerPolicy="no-referrer" onError={e => { e.currentTarget.hidden = true }} />}</span>
}

// Top 3 pour l'accueil
export function SuggestionsTeaser({ onOpen }) {
  const [top, setTop] = useState(null)
  useEffect(() => {
    if (!suggestions.available) return
    let alive = true
    suggestions.list().then(l => { if (alive) setTop(l.filter(s => s.status === 'open').slice(0, 3)) }).catch(() => {})
    return () => { alive = false }
  }, [])
  if (!suggestions.available) return null
  return (
    <button className="panel suggest-teaser" onClick={onOpen}>
      <span className="tile-icon"><Icon name="star" /></span>
      <span className="suggest-teaser-text">
        <b>Prochain univers</b>
        <small>
          {top?.length
            ? top.map((s, i) => `${i + 1}. ${s.title} (${s.votes})`).join(' · ')
            : 'Propose un film ou une série et vote pour tes préférés'}
        </small>
      </span>
      <Icon name="chevron" />
    </button>
  )
}

// Écran : proposer, voter, classement
export default function Suggestions({ onBack, onLogin }) {
  const { session } = useAccount()
  const [list, setList] = useState(null)
  const [admin, setAdmin] = useState(false)
  const [title, setTitle] = useState('')
  const [kind, setKind] = useState('Série')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [pick, setPick] = useState(null)        // fiche IMDb choisie
  const [results, setResults] = useState(null)  // null : pas de recherche
  const [imdbDown, setImdbDown] = useState(false)

  // recherche IMDb pendant la saisie (petite pause pour ne pas chercher à chaque lettre)
  useEffect(() => {
    const q = title.trim()
    if (pick || q.length < 2 || imdbDown) return
    const ctrl = new AbortController()
    const t = setTimeout(() => {
      searchImdb(q, ctrl.signal).then(setResults).catch(e => { if (e.name !== 'AbortError') setImdbDown(true) })
    }, 250)
    return () => { clearTimeout(t); ctrl.abort() }
  }, [title, pick, imdbDown])

  const reload = useCallback(async () => {
    try { setList(await suggestions.list()); setError('') } catch (e) { setError(fr(e)); setList([]) }
  }, [])
  useEffect(() => {
    const t = setTimeout(reload, 0)
    return () => clearTimeout(t)
  }, [reload, session?.user?.id])
  useEffect(() => {
    if (!session) return
    let alive = true
    suggestions.isAdmin().then(a => { if (alive) setAdmin(a) })
    return () => { alive = false }
  }, [session])

  const key = titleKey(pick ? pick.title : title)
  const existing = useMemo(() => (pick
    ? list?.find(s => s.imdb_id === pick.imdb)
    : key && list?.find(s => !s.imdb_id && titleKey(s.title) === key)), [pick, key, list])
  const inGame = key.length > 1 && IN_GAME.has(key)
  // sans IMDb (hors service), on garde la saisie libre
  const canSend = !busy && !inGame && (pick || (imdbDown && title.trim().length >= 2))

  const act = async fn => {
    setBusy(true); setError('')
    try { await fn(); await reload() } catch (e) { setError(fr(e)) }
    setBusy(false)
  }
  const propose = e => {
    e.preventDefault()
    if (!canSend) return
    act(async () => {
      if (pick) await suggestions.propose(pick.title.slice(0, 100), pick.kind, pick)
      else await suggestions.propose(title.trim(), kind)
      haptic('medium'); setTitle(''); setPick(null); setResults(null)
    })
  }

  const open = list?.filter(s => s.status === 'open') || []
  const added = list?.filter(s => s.status === 'added') || []

  return (
    <section className="screen suggest">
      <div className="series-head">
        <button className="round-btn" onClick={onBack} aria-label="Retour"><Icon name="back" /></button>
        <div>
          <p className="eyebrow">Vote des joueurs</p>
          <h2>Prochain univers</h2>
        </div>
      </div>

      <div className="panel stat-block">
        <h3>Propose un film ou une série</h3>
        {session
          ? (
            <form className="account-form" onSubmit={propose}>
              {pick
                ? (
                  <div className="imdb-pick">
                    <Poster src={pick.poster} />
                    <span className="suggest-title"><b>{pick.title}</b><small>{pick.kind}{pick.year ? ` · ${pick.year}` : ''}</small></span>
                    <button type="button" className="link-btn" onClick={() => { setPick(null); setResults(null) }}>Changer</button>
                  </div>
                )
                : (
                  <div className="imdb-search">
                    <input
                      maxLength={100}
                      placeholder={imdbDown ? 'Ex. Gossip Girl, Twilight…' : 'Cherche un film ou une série…'}
                      value={title}
                      onChange={e => { setTitle(e.target.value); if (e.target.value.trim().length < 2) setResults(null) }}
                      autoComplete="off"
                      enterKeyHint="search"
                    />
                    {!imdbDown && results && title.trim().length >= 2 && (
                      <ul className="imdb-results">
                        {results.map(r => (
                          <li key={r.imdb}>
                            <button type="button" onClick={() => { setPick(r); setResults(null) }}>
                              <Poster src={r.poster} />
                              <span className="suggest-title">
                                <b>{r.title}</b>
                                <small>{r.kind}{r.year ? ` · ${r.year}` : ''}{r.cast ? ` · ${r.cast}` : ''}</small>
                              </span>
                            </button>
                          </li>
                        ))}
                        {results.length === 0 && <li className="imdb-none">Aucun film ou série trouvé sur IMDb.</li>}
                      </ul>
                    )}
                  </div>
                )}
              {imdbDown && !pick && (
                <div className="suggest-kind" role="radiogroup" aria-label="Type">
                  {['Série', 'Film'].map(k => (
                    <button type="button" key={k} role="radio" aria-checked={kind === k} className={kind === k ? 'is-on' : ''} onClick={() => setKind(k)}>{k}</button>
                  ))}
                </div>
              )}
              {inGame && <p className="muted small">Cet univers est déjà dans le jeu !</p>}
              {!inGame && existing && <p className="muted small">Déjà proposé : ta proposition comptera comme un vote pour « {existing.title} ».</p>}
              {!pick && !imdbDown && <p className="muted small">Choisis le bon titre dans la liste IMDb : pas de doublon, même avec une faute.</p>}
              <button className="pill-btn primary" disabled={!canSend}>{existing ? 'Voter pour lui' : 'Proposer'}</button>
            </form>
          )
          : (
            <>
              <p className="muted small">Connecte-toi pour proposer un univers et voter (un vote par personne et par titre).</p>
              <button className="pill-btn primary" onClick={onLogin}>Me connecter</button>
            </>
          )}
        {error && <p className="error">{error}</p>}
      </div>

      <div className="panel stat-block">
        <h3>Classement</h3>
        {list === null && <p className="muted small">Chargement…</p>}
        {list && open.length === 0 && !error && <p className="muted small">Aucune proposition pour l’instant : sois le premier !</p>}
        <ol className="suggest-list">
          {open.map((s, i) => (
            <li key={s.id} className={i === 0 ? 'is-first' : ''}>
              <span className="suggest-rank">{i + 1}</span>
              <span className="suggest-title">
                <b>{s.imdb_id ? <a href={imdbUrl(s.imdb_id)} target="_blank" rel="noreferrer">{s.title}</a> : s.title}</b>
                <small>{s.kind}{s.year ? ` · ${s.year}` : ''}{s.mine ? ' · proposé par toi' : ''}</small>
              </span>
              <button
                className={`suggest-vote ${s.voted ? 'is-on' : ''}`}
                disabled={busy || !session}
                onClick={() => act(async () => { await suggestions.toggleVote(s.id); haptic('light') })}
                aria-label={s.voted ? 'Retirer mon vote' : 'Voter'}
              >
                <span aria-hidden="true">{s.voted ? '♥' : '♡'}</span> {s.votes}
              </button>
              {admin && (
                <span className="suggest-admin">
                  <button className="link-btn" disabled={busy} onClick={() => act(() => suggestions.setStatus(s.id, 'added'))}>Ajouté</button>
                  <button className="link-btn" disabled={busy} onClick={() => { if (confirm(`Supprimer « ${s.title} » ?`)) act(() => suggestions.remove(s.id)) }}>Supprimer</button>
                </span>
              )}
            </li>
          ))}
        </ol>
      </div>

      {added.length > 0 && (
        <div className="panel stat-block">
          <h3>Déjà ajoutés grâce à vos votes</h3>
          <ul className="suggest-list is-done">
            {added.map(s => (
              <li key={s.id}>
                <span className="suggest-rank">✓</span>
                <span className="suggest-title"><b>{s.title}</b><small>{s.kind} · {s.votes} vote{s.votes > 1 ? 's' : ''}</small></span>
                {admin && <button className="link-btn" disabled={busy} onClick={() => act(() => suggestions.setStatus(s.id, 'open'))}>Remettre au vote</button>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
