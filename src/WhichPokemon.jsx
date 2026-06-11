import { useState, useEffect, useRef } from 'react'

const EFFECTIVENESS = {
  normal:   { rock:0.5, ghost:0, steel:0.5 },
  fire:     { fire:0.5, water:0.5, rock:0.5, dragon:0.5, grass:2, ice:2, bug:2, steel:2 },
  water:    { water:0.5, grass:0.5, dragon:0.5, fire:2, ground:2, rock:2 },
  electric: { electric:0.5, grass:0.5, dragon:0.5, ground:0, flying:2, water:2 },
  grass:    { fire:0.5, grass:0.5, poison:0.5, flying:0.5, bug:0.5, dragon:0.5, steel:0.5, water:2, ground:2, rock:2 },
  ice:      { water:0.5, ice:0.5, fire:0.5, steel:0.5, grass:2, ground:2, flying:2, dragon:2 },
  fighting: { poison:0.5, bug:0.5, psychic:0.5, flying:0.5, fairy:0.5, ghost:0, normal:2, ice:2, rock:2, dark:2, steel:2 },
  poison:   { poison:0.5, ground:0.5, rock:0.5, ghost:0.5, steel:0, grass:2, fairy:2 },
  ground:   { grass:0.5, bug:0.5, flying:0, fire:2, electric:2, poison:2, rock:2, steel:2 },
  flying:   { electric:0.5, rock:0.5, steel:0.5, grass:2, fighting:2, bug:2 },
  psychic:  { psychic:0.5, steel:0.5, dark:0, fighting:2, poison:2 },
  bug:      { fire:0.5, fighting:0.5, flying:0.5, ghost:0.5, steel:0.5, fairy:0.5, grass:2, psychic:2, dark:2 },
  rock:     { fighting:0.5, ground:0.5, steel:0.5, fire:2, ice:2, flying:2, bug:2 },
  ghost:    { normal:0, dark:0.5, ghost:2, psychic:2 },
  dragon:   { steel:0.5, fairy:0, dragon:2 },
  dark:     { fighting:0.5, dark:0.5, fairy:0.5, ghost:2, psychic:2 },
  steel:    { fire:0.5, water:0.5, electric:0.5, steel:0.5, ice:2, rock:2, fairy:2 },
  fairy:    { fire:0.5, poison:0.5, steel:0.5, fighting:2, dragon:2, dark:2 },
}

const TYPE_FR = {
  normal: 'Normal',   fire: 'Feu',      water: 'Eau',
  electric: 'Électk', grass: 'Plante',  ice: 'Glace',
  fighting: 'Combat', poison: 'Poison', ground: 'Sol',
  flying: 'Vol',      psychic: 'Psy',   bug: 'Insecte',
  rock: 'Roche',      ghost: 'Spectre', dragon: 'Dragon',
  dark: 'Ténèbres',   steel: 'Acier',   fairy: 'Fée',
}

const TYPE_COLORS = {
  normal: '#9099A1',   fire: '#FF6C35',    water: '#4D90D5',
  electric: '#F4D23C', grass: '#63BB5B',   ice: '#74CEC0',
  fighting: '#CE4265', poison: '#AB6AC8',  ground: '#D97845',
  flying: '#8FA9DE',   psychic: '#F97176', bug: '#90C12C',
  rock: '#C9BB8A',     ghost: '#5269AD',   dragon: '#0B6DC3',
  dark: '#5A5366',     steel: '#5A8EA2',   fairy: '#EC8FE6',
}

const CATEGORY_ORDER = { good: 0, neutral: 1, bad: 2 }

function miniSprite(id) {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`
}

function getMult(atkType, defTypes) {
  return defTypes.reduce((acc, dt) => {
    const v = (EFFECTIVENESS[atkType] || {})[dt]
    return acc * (v === undefined ? 1 : v)
  }, 1)
}

function analyzeMatchup(myPoke, opp) {
  const offResults = myPoke.types.map(t => ({ type: t, mult: getMult(t, opp.types) }))
  const best = offResults.reduce((a, b) => b.mult > a.mult ? b : a)

  const defMults = opp.types.map(t => ({ type: t, mult: getMult(t, myPoke.types) }))
  const worstDef = defMults.reduce((a, b) => b.mult > a.mult ? b : a)
  const maxIncoming = worstDef.mult

  let category
  if (best.mult >= 2 && maxIncoming < 2) category = 'good'
  else if (maxIncoming >= 2) category = 'bad'
  else category = 'neutral'

  const tooltip = buildTooltip(myPoke, opp, best, worstDef)

  return { category, bestOffType: best.type, bestOffMult: best.mult, maxIncoming, worstDefType: worstDef.type, tooltip }
}

function buildTooltip(myPoke, opp, best, worstDef) {
  const oppTypes = opp.types.map(t => TYPE_FR[t] || t).join('/')
  const myTypes  = myPoke.types.map(t => TYPE_FR[t] || t).join('/')
  const lines = []

  // Offensive
  if (best.mult === 0)    lines.push(`⚫ ${TYPE_FR[best.type]} est immunisé par ${oppTypes}`)
  else if (best.mult === 4) lines.push(`✅ ${TYPE_FR[best.type]} inflige 4× contre ${oppTypes}`)
  else if (best.mult === 2) lines.push(`✅ ${TYPE_FR[best.type]} est super efficace contre ${oppTypes}`)
  else if (best.mult < 1)  lines.push(`🔻 Aucune attaque efficace (résistance ${oppTypes})`)
  else                      lines.push(`⚪ ${TYPE_FR[best.type]} est neutre contre ${oppTypes}`)

  // Defensive
  if (worstDef.mult === 0)     lines.push(`🛡️ Immunisé à ${TYPE_FR[worstDef.type]}`)
  else if (worstDef.mult === 4) lines.push(`❌ ${TYPE_FR[worstDef.type]} inflige 4× contre ${myTypes}`)
  else if (worstDef.mult === 2) lines.push(`⚠️ ${TYPE_FR[worstDef.type]} inflige 2× contre ${myTypes}`)
  else if (worstDef.mult < 1)  lines.push(`🛡️ Résistance à ${TYPE_FR[worstDef.type]}`)

  return lines.join('\n')
}

function loadTeam(gameId) {
  try {
    const saved = localStorage.getItem(`team-${gameId}`)
    return saved ? JSON.parse(saved).slice(0, 6) : []
  } catch { return [] }
}

function TypePill({ type }) {
  return (
    <span className="wpk-type-pill" style={{ background: TYPE_COLORS[type] || '#888' }}>
      {TYPE_FR[type] || type}
    </span>
  )
}

function ResultCard({ myPoke, result, index, opponentName }) {
  const [showTip, setShowTip] = useState(false)
  const { category, bestOffType, bestOffMult, maxIncoming, tooltip } = result

  const multLabel = bestOffMult === 4 ? '4×'
    : bestOffMult === 2 ? '2×'
    : bestOffMult === 0 ? 'Immunisé'
    : bestOffMult < 1   ? `${bestOffMult}×`
    : '1×'

  return (
    <div
      className={`wpk-card wpk-card--${category}`}
      style={{ animationDelay: `${index * 40}ms` }}
    >
      {category === 'good' && <span className="wpk-badge wpk-badge--good">✅ Recommandé</span>}
      {category === 'bad'  && <span className="wpk-badge wpk-badge--bad">❌ À éviter</span>}

      <div className="wpk-card-top">
        <img src={miniSprite(myPoke.id)} alt={myPoke.nameFr} className="wpk-sprite" />
        <div className="wpk-card-info">
          <div className="wpk-card-name">{myPoke.nameFr}</div>
          {myPoke.level && <div className="wpk-card-level">Niv. {myPoke.level}</div>}
          <div className="wpk-types">
            {myPoke.types.map(t => <TypePill key={t} type={t} />)}
          </div>
        </div>
      </div>

      <div className="wpk-card-move">
        <span className="wpk-move-label">Meilleure attaque :</span>
        <span className="wpk-move-type" style={{ background: TYPE_COLORS[bestOffType] || '#888' }}>
          {TYPE_FR[bestOffType] || bestOffType}
        </span>
        <span className={`wpk-move-mult wpk-move-mult--${bestOffMult >= 2 ? 'super' : bestOffMult === 0 ? 'zero' : bestOffMult < 1 ? 'half' : 'neutral'}`}>
          {multLabel}
        </span>
        <button
          className="wpk-why-btn"
          onClick={() => setShowTip(v => !v)}
          title="Pourquoi ?"
        >?</button>
      </div>

      {showTip && (
        <div className="wpk-tooltip">
          {tooltip.split('\n').map((line, i) => <div key={i}>{line}</div>)}
          <div className="wpk-tooltip-note">* basé sur les types uniquement</div>
        </div>
      )}
    </div>
  )
}

export default function WhichPokemon({ game, pokemon, open: externalOpen, onOpenChange }) {
  const [internalOpen, setInternalOpen] = useState(false)
  const open    = externalOpen  !== undefined ? externalOpen  : internalOpen
  const setOpen = onOpenChange  !== undefined ? onOpenChange  : setInternalOpen
  const [team, setTeam]             = useState([])
  const [search, setSearch]         = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [opponent, setOpponent]     = useState(null)
  const [results, setResults]       = useState(null)
  const [notFound, setNotFound]     = useState(false)

  const inputRef = useRef(null)
  const listRef  = useRef(null)

  // Refresh team from storage each time modal opens
  useEffect(() => {
    if (open) {
      setTeam(loadTeam(game.id))
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open, game.id])

  // Check if team non-empty for button visibility
  const [hasTeam, setHasTeam] = useState(() => loadTeam(game.id).length > 0)
  useEffect(() => {
    setHasTeam(loadTeam(game.id).length > 0)
  }, [game.id])

  function handleSearchChange(val) {
    setSearch(val)
    setOpponent(null)
    setResults(null)
    setNotFound(false)
    if (!val.trim()) { setSuggestions([]); return }
    const q = val.toLowerCase()
    setSuggestions(
      pokemon.filter(p => p.nameFr.toLowerCase().includes(q) || p.name.toLowerCase().includes(q)).slice(0, 7)
    )
  }

  function selectOpponent(p) {
    setSearch(p.nameFr)
    setSuggestions([])
    setOpponent(p)
    runAnalysis(p)
  }

  function runAnalysis(opp) {
    const currentTeam = loadTeam(game.id)
    if (!currentTeam.length) { setResults([]); return }
    const analyzed = currentTeam.map(myPoke => ({
      poke: myPoke,
      result: analyzeMatchup(myPoke, opp),
    }))
    analyzed.sort((a, b) => CATEGORY_ORDER[a.result.category] - CATEGORY_ORDER[b.result.category])
    setResults(analyzed)
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (suggestions.length > 0) { selectOpponent(suggestions[0]); return }
    const q = search.toLowerCase().trim()
    const found = pokemon.find(p => p.nameFr.toLowerCase() === q || p.name.toLowerCase() === q)
    if (found) selectOpponent(found)
    else setNotFound(true)
  }

  function close() {
    setOpen(false)
    setSearch('')
    setSuggestions([])
    setOpponent(null)
    setResults(null)
    setNotFound(false)
  }

  // Close suggestions on outside click
  useEffect(() => {
    const fn = e => {
      if (listRef.current && !listRef.current.contains(e.target)) setSuggestions([])
    }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])

  // Escape key to close modal
  useEffect(() => {
    const fn = e => { if (e.key === 'Escape') close() }
    if (open) document.addEventListener('keydown', fn)
    return () => document.removeEventListener('keydown', fn)
  }, [open])

  return (
    <>
      {/* FAB interne — affiché uniquement si pas de contrôle externe */}
      {onOpenChange === undefined && hasTeam && (
        <button className="wpk-fab" onClick={() => setOpen(true)}>
          <span>⚔️</span>
          Qui envoyer ?
        </button>
      )}

      {/* Modal */}
      {open && (
        <div className="wpk-backdrop" onClick={close}>
          <div className="wpk-modal" onClick={e => e.stopPropagation()}>
            <div className="wpk-modal-header">
              <h2 className="wpk-modal-title">Quel Pokémon envoyer ?</h2>
              <button className="wpk-close" onClick={close}>✕</button>
            </div>
            <p className="wpk-subtitle">Entrez le Pokémon adverse</p>

            <form onSubmit={handleSubmit} autoComplete="off">
              <div className="wpk-search-wrap" ref={listRef}>
                <input
                  ref={inputRef}
                  type="text"
                  className="wpk-search-input"
                  placeholder="Ex : Onix, Raichu, Dracolosse…"
                  value={search}
                  onChange={e => handleSearchChange(e.target.value)}
                />
                {suggestions.length > 0 && (
                  <ul className="wpk-suggestions">
                    {suggestions.map(p => (
                      <li key={p.id} className="wpk-sug-item" onMouseDown={() => selectOpponent(p)}>
                        <img src={miniSprite(p.id)} alt="" className="wpk-sug-sprite" />
                        <span className="wpk-sug-name">{p.nameFr}</span>
                        <div className="wpk-sug-types">
                          {p.types.map(t => (
                            <span key={t} style={{ background: TYPE_COLORS[t] }} className="wpk-sug-type">{TYPE_FR[t]}</span>
                          ))}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </form>

            {notFound && (
              <p className="wpk-not-found">Pokémon introuvable, vérifie l'orthographe</p>
            )}

            {results !== null && opponent && (
              <div className="wpk-results">
                <div className="wpk-results-header">
                  <img src={miniSprite(opponent.id)} alt={opponent.nameFr} className="wpk-opp-sprite" />
                  <div>
                    <div className="wpk-opp-name">{opponent.nameFr}</div>
                    <div className="wpk-opp-types">
                      {opponent.types.map(t => <TypePill key={t} type={t} />)}
                    </div>
                  </div>
                </div>
                {results.length === 0 ? (
                  <p className="wpk-not-found">Paramétrez votre équipe actuelle pour utiliser cet outil</p>
                ) : (
                  <div className="wpk-cards">
                    {results.map(({ poke, result }, i) => (
                      <ResultCard
                        key={poke.id}
                        myPoke={poke}
                        result={result}
                        index={i}
                        opponentName={opponent.nameFr}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
