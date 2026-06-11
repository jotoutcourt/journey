import { useState, useEffect } from 'react'

const TYPE_COLORS = {
  normal: '#9099A1', fire: '#FF6C35',    water: '#4D90D5',
  electric: '#F4D23C', grass: '#63BB5B', ice: '#74CEC0',
  fighting: '#CE4265', poison: '#AB6AC8', ground: '#D97845',
  flying: '#8FA9DE',  psychic: '#F97176', bug: '#90C12C',
  rock: '#C9BB8A',    ghost: '#5269AD',   dragon: '#0B6DC3',
  dark: '#5A5366',    steel: '#5A8EA2',   fairy: '#EC8FE6',
}

const TYPE_FR = {
  normal: 'Normal', fire: 'Feu', water: 'Eau', electric: 'Électk',
  grass: 'Plante', ice: 'Glace', fighting: 'Combat', poison: 'Poison',
  ground: 'Sol', flying: 'Vol', psychic: 'Psy', bug: 'Insecte',
  rock: 'Roche', ghost: 'Spectre', dragon: 'Dragon', dark: 'Ténèbres',
  steel: 'Acier', fairy: 'Fée',
}

function fmtMove(slug) {
  return slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

function miniSprite(id) {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`
}

const MOVES_CACHE_KEY = 'pjt-moves-v1'

function loadMovesCache() {
  try { return JSON.parse(localStorage.getItem(MOVES_CACHE_KEY) || '{}') }
  catch { return {} }
}

function saveMovesCache(cache) {
  localStorage.setItem(MOVES_CACHE_KEY, JSON.stringify(cache))
}

async function fetchMoves(id) {
  const cache = loadMovesCache()
  if (cache[id]) return cache[id]

  const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}/`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = await res.json()

  const moves = []
  for (const entry of data.moves) {
    const detail = entry.version_group_details.find(
      d => d.version_group.name === 'firered-leafgreen' && d.move_learn_method.name === 'level-up'
    )
    if (detail && detail.level_learned_at > 0) {
      moves.push({ level: detail.level_learned_at, name: entry.move.name })
    }
  }
  moves.sort((a, b) => a.level - b.level)

  cache[id] = moves
  saveMovesCache(cache)
  return moves
}

function loadTeam(gameId) {
  try {
    const saved = localStorage.getItem(`team-${gameId}`)
    return saved ? JSON.parse(saved).slice(0, 6) : []
  } catch { return [] }
}

function PokemonMovesCard({ poke, gameId }) {
  const lvlKey = `pjt-mlvl-${gameId}`
  const [level, setLevel] = useState(() => {
    try { return JSON.parse(localStorage.getItem(lvlKey) || '{}')[poke.id] || '' }
    catch { return '' }
  })
  const [moves, setMoves] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  useEffect(() => {
    setLoading(true)
    fetchMoves(poke.id)
      .then(m => { setMoves(m); setLoading(false) })
      .catch(() => { setError(true); setLoading(false) })
  }, [poke.id])

  function handleLevelChange(val) {
    const n = val === '' ? '' : Math.max(1, Math.min(100, parseInt(val, 10) || 1))
    setLevel(n === '' ? '' : n)
    try {
      const stored = JSON.parse(localStorage.getItem(lvlKey) || '{}')
      if (n === '') delete stored[poke.id]
      else stored[poke.id] = n
      localStorage.setItem(lvlKey, JSON.stringify(stored))
    } catch {}
  }

  const currentLevel = parseInt(level, 10) || 0

  const past     = moves?.filter(m => m.level <= currentLevel) ?? []
  const upcoming = moves?.filter(m => m.level > currentLevel) ?? []

  return (
    <div className="mvw-card">
      <div className="mvw-card-header">
        <img src={miniSprite(poke.id)} alt={poke.nameFr} className="mvw-sprite" />
        <div className="mvw-card-info">
          <div className="mvw-name">{poke.nameFr}</div>
          <div className="mvw-types">
            {poke.types.map(t => (
              <span key={t} className="mvw-type-pill" style={{ background: TYPE_COLORS[t] || '#888' }}>
                {TYPE_FR[t] || t}
              </span>
            ))}
          </div>
        </div>
        <div className="mvw-level-wrap">
          <label className="mvw-level-label">Niv.</label>
          <input
            type="number"
            className="mvw-level-input"
            min="1" max="100"
            value={level}
            onChange={e => handleLevelChange(e.target.value)}
            placeholder="—"
          />
        </div>
      </div>

      {loading && <div className="mvw-loading">Chargement…</div>}
      {error && <div className="mvw-error">Impossible de charger les moves.</div>}

      {moves && (
        <div className="mvw-moves">
          {currentLevel > 0 && upcoming.length === 0 && (
            <div className="mvw-all-learned">✅ Tous les moves appris !</div>
          )}

          {currentLevel > 0 && upcoming.length > 0 && (
            <div className="mvw-section">
              <div className="mvw-section-title">Prochains moves</div>
              {upcoming.slice(0, 5).map(m => (
                <div key={m.level + m.name} className="mvw-move mvw-move--next">
                  <span className="mvw-move-lvl">Niv.{m.level}</span>
                  <span className="mvw-move-name">{fmtMove(m.name)}</span>
                </div>
              ))}
            </div>
          )}

          {currentLevel > 0 && past.length > 0 && (
            <details className="mvw-past-details">
              <summary className="mvw-past-summary">Déjà appris ({past.length})</summary>
              <div className="mvw-section">
                {past.slice().reverse().map(m => (
                  <div key={m.level + m.name} className="mvw-move mvw-move--past">
                    <span className="mvw-move-lvl">Niv.{m.level}</span>
                    <span className="mvw-move-name">{fmtMove(m.name)}</span>
                  </div>
                ))}
              </div>
            </details>
          )}

          {currentLevel === 0 && (
            <div className="mvw-section">
              <div className="mvw-section-title">Tous les moves level-up</div>
              {moves.map(m => (
                <div key={m.level + m.name} className="mvw-move">
                  <span className="mvw-move-lvl">Niv.{m.level}</span>
                  <span className="mvw-move-name">{fmtMove(m.name)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function MovesWidget({ game }) {
  const [team, setTeam] = useState(() => loadTeam(game.id))

  useEffect(() => {
    setTeam(loadTeam(game.id))
  }, [game.id])

  if (!team.length) {
    return (
      <div className="mvw-empty">
        <div className="mvw-empty-icon">📖</div>
        <p>Aucun Pokémon dans ton équipe.</p>
        <p className="mvw-empty-hint">Ajoute des Pokémon dans l'onglet Équipe pour voir leurs moves.</p>
      </div>
    )
  }

  return (
    <div className="mvw-root">
      <p className="mvw-intro">
        Moves appris par montée de niveau (Fire Red / Leaf Green).
        Entre ton niveau actuel pour voir les prochains moves.
        Les noms sont en anglais (noms officiels de la ROM).
      </p>
      {team.map(poke => (
        <PokemonMovesCard key={poke.id} poke={poke} gameId={game.id} />
      ))}
    </div>
  )
}
