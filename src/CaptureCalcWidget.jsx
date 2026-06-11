import { useState, useEffect, useRef } from 'react'

const POKEBALLS = [
  { id:'poke',   name:'Poké Ball',   rate:1 },
  { id:'great',  name:'Super Ball',  rate:1.5 },
  { id:'ultra',  name:'Hyper Ball',  rate:2 },
  { id:'master', name:'Master Ball', rate:255 },
  { id:'safari', name:'Safari Ball', rate:1.5 },
  { id:'net',    name:'Filet Ball',  rate:3 },
  { id:'dive',   name:'Plong. Ball', rate:3.5 },
  { id:'repeat', name:'Bis Ball',    rate:3 },
  { id:'luxury', name:'Luxe Ball',   rate:1 },
]

const STATUS_MODS = [
  { id:'none',  name:'Aucun',                        mod:1 },
  { id:'burn',  name:'Paralysie / Brûlure / Poison', mod:1.5 },
  { id:'sleep', name:'Sommeil / Glace',              mod:2 },
]

const STATS_CACHE_KEY = 'pjt-pokemon-stats-v1'

function calcCaptureProb(captureRate, hp, maxHP, ballRate, statusMod) {
  const a = Math.min(255, Math.floor(((3 * maxHP - 2 * hp) / (3 * maxHP)) * captureRate * ballRate * statusMod))
  if (a >= 255) return 100
  const b = Math.floor(65536 / Math.pow(255 / a, 3 / 8))
  return Math.min(100, Math.pow(b / 65536, 4) * 100)
}

function hpFromLevel(baseHP, level, iv = 15, ev = 0) {
  return Math.floor(((2 * baseHP + iv + Math.floor(ev / 4)) * level) / 100) + level + 10
}

function loadStatsCache() {
  try { return JSON.parse(localStorage.getItem(STATS_CACHE_KEY) || '{}') } catch { return {} }
}

function saveStatsCache(cache) {
  try { localStorage.setItem(STATS_CACHE_KEY, JSON.stringify(cache)) } catch {}
}

async function fetchPokemonStats(id) {
  const cache = loadStatsCache()
  if (cache[id]) return cache[id]
  const [pokeRes, specRes] = await Promise.all([
    fetch(`https://pokeapi.co/api/v2/pokemon/${id}/`),
    fetch(`https://pokeapi.co/api/v2/pokemon-species/${id}/`),
  ])
  const [poke, spec] = await Promise.all([pokeRes.json(), specRes.json()])
  const baseHP = poke.stats.find(s => s.stat.name === 'hp')?.base_stat ?? 45
  const captureRate = spec.capture_rate ?? 45
  const stats = { baseHP, captureRate }
  cache[id] = stats
  saveStatsCache(cache)
  return stats
}

function loadPokemonList() {
  try {
    const raw = localStorage.getItem('pjt-pokemon-v9')
    if (!raw) return []
    return JSON.parse(raw)
  } catch { return [] }
}

const COMMON_RATES = [
  { label: 'Légendaires (3)',  rate: 3   },
  { label: 'Rare (45)',        rate: 45  },
  { label: 'Commun (128)',     rate: 128 },
  { label: 'Magicarpe (255)', rate: 255 },
]

export default function CaptureCalcWidget() {
  const [captureRate, setCaptureRate] = useState(45)
  const [hp,    setHp]     = useState(50)
  const [maxHP, setMaxHP]  = useState(100)
  const [ball,  setBall]   = useState('poke')
  const [status, setStatus] = useState('none')

  // Recherche Pokémon
  const [search,      setSearch]      = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [selected,    setSelected]    = useState(null)   // { id, nameFr, name }
  const [statsLoading, setStatsLoading] = useState(false)
  const [baseHP,      setBaseHP]      = useState(null)

  // Niveau
  const [level, setLevel] = useState(null)
  const [useLevel, setUseLevel] = useState(false)

  const inputRef  = useRef(null)
  const listRef   = useRef(null)
  const [pokemonList] = useState(() => loadPokemonList())

  const ballRate  = POKEBALLS.find(b => b.id === ball)?.rate || 1
  const statusMod = STATUS_MODS.find(s => s.id === status)?.mod || 1
  const prob      = calcCaptureProb(captureRate, hp, maxHP, ballRate, statusMod)
  const probColor = prob >= 80 ? '#78c850' : prob >= 50 ? '#f5c842' : prob >= 20 ? '#f09030' : '#f04060'

  function handleSearchChange(val) {
    setSearch(val)
    if (!val.trim()) { setSuggestions([]); return }
    const q = val.toLowerCase()
    const hits = pokemonList
      .filter(p => p.nameFr.toLowerCase().includes(q) || p.name.toLowerCase().includes(q))
      .slice(0, 8)
    setSuggestions(hits)
  }

  async function selectPokemon(p) {
    setSelected(p)
    setSearch(p.nameFr)
    setSuggestions([])
    setStatsLoading(true)
    try {
      const stats = await fetchPokemonStats(p.id)
      setCaptureRate(stats.captureRate)
      setBaseHP(stats.baseHP)
      if (useLevel && level) {
        const estHP = hpFromLevel(stats.baseHP, level)
        setMaxHP(estHP)
        setHp(Math.max(1, Math.round(estHP / 4)))
      }
    } catch { /* keep manual values */ } finally {
      setStatsLoading(false)
    }
  }

  function handleLevelChange(val) {
    const lv = Math.max(1, Math.min(100, Number(val)))
    setLevel(lv)
    if (useLevel && baseHP) {
      const estHP = hpFromLevel(baseHP, lv)
      setMaxHP(estHP)
      setHp(Math.max(1, Math.round(estHP / 4)))
    }
  }

  function toggleUseLevel(checked) {
    setUseLevel(checked)
    if (checked && baseHP && level) {
      const estHP = hpFromLevel(baseHP, level)
      setMaxHP(estHP)
      setHp(Math.max(1, Math.round(estHP / 4)))
    }
  }

  function handleMaxHPChange(val) {
    const v = Number(val)
    setMaxHP(v)
    if (hp > v) setHp(v)
  }

  // Fermer suggestions si clic en dehors
  useEffect(() => {
    function onDown(e) {
      if (listRef.current && !listRef.current.contains(e.target) &&
          inputRef.current && !inputRef.current.contains(e.target)) {
        setSuggestions([])
      }
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  return (
    <div className="ccw-root">

      {/* ── Recherche Pokémon ── */}
      <section className="ccw-section">
        <div className="ccw-section-title">Pokémon {statsLoading && <span className="ccw-loading">chargement…</span>}</div>
        <div className="ccw-search-wrap" ref={listRef}>
          <input
            ref={inputRef}
            type="text"
            className="ccw-search-input"
            placeholder="Chercher par nom (ex : Ronflex, Alakazam…)"
            value={search}
            onChange={e => handleSearchChange(e.target.value)}
            onFocus={() => search && handleSearchChange(search)}
          />
          {suggestions.length > 0 && (
            <ul className="ccw-suggestions">
              {suggestions.map(p => (
                <li key={p.id} className="ccw-suggestion-item" onMouseDown={() => selectPokemon(p)}>
                  <img
                    src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.id}.png`}
                    alt=""
                    className="ccw-sug-sprite"
                  />
                  <span className="ccw-sug-name">{p.nameFr}</span>
                  <span className="ccw-sug-id">#{String(p.id).padStart(3, '0')}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* ── Niveau & HP auto ── */}
      <section className="ccw-section">
        <div className="ccw-section-title">Niveau du Pokémon sauvage</div>
        <div className="ccw-level-row">
          <input
            type="number" min={1} max={100}
            placeholder="Ex : 35"
            value={level ?? ''}
            onChange={e => handleLevelChange(e.target.value)}
            className="ccw-num-input ccw-level-input"
          />
          {baseHP && (
            <label className="ccw-level-auto-label">
              <input
                type="checkbox"
                checked={useLevel}
                onChange={e => toggleUseLevel(e.target.checked)}
              />
              <span>Auto HP{useLevel ? ` (Base ${baseHP})` : ''}</span>
            </label>
          )}
        </div>
        {useLevel && baseHP && level && (
          <p className="ccw-level-hint">
            PV estimés au Niv.{level} : environ <strong>{hpFromLevel(baseHP, level)}</strong>
            {' '}(25% PV = {Math.max(1, Math.round(hpFromLevel(baseHP, level) / 4))} PV restants)
          </p>
        )}
      </section>

      {/* ── Taux de capture ── */}
      <section className="ccw-section">
        <div className="ccw-section-title">Taux de capture du Pokémon</div>
        <div className="ccw-slider-row">
          <input
            type="range" min={1} max={255}
            value={captureRate}
            onChange={e => setCaptureRate(Number(e.target.value))}
            className="ccw-slider"
          />
          <input
            type="number" min={1} max={255}
            value={captureRate}
            onChange={e => setCaptureRate(Math.max(1, Math.min(255, Number(e.target.value))))}
            className="ccw-num-input"
          />
        </div>
        <div className="ccw-quick-rates">
          {COMMON_RATES.map(r => (
            <button
              key={r.label}
              className={`ccw-quick-btn ${captureRate === r.rate ? 'ccw-quick-active' : ''}`}
              onClick={() => setCaptureRate(r.rate)}
            >
              {r.rate}
            </button>
          ))}
        </div>
      </section>

      {/* ── PV ── */}
      <section className="ccw-section">
        <div className="ccw-section-title">Points de vie</div>
        <div className="ccw-hp-row">
          <div className="ccw-hp-col">
            <span className="ccw-hp-label">PV actuels</span>
            <div className="ccw-slider-row">
              <input
                type="range" min={1} max={maxHP}
                value={hp}
                onChange={e => setHp(Number(e.target.value))}
                className="ccw-slider"
              />
              <input
                type="number" min={1} max={maxHP}
                value={hp}
                onChange={e => setHp(Math.max(1, Math.min(maxHP, Number(e.target.value))))}
                className="ccw-num-input"
              />
            </div>
          </div>
          <div className="ccw-hp-col">
            <span className="ccw-hp-label">PV max</span>
            <div className="ccw-slider-row">
              <input
                type="range" min={1} max={500}
                value={maxHP}
                onChange={e => handleMaxHPChange(e.target.value)}
                className="ccw-slider"
              />
              <input
                type="number" min={1} max={500}
                value={maxHP}
                onChange={e => handleMaxHPChange(Math.max(1, Math.min(500, Number(e.target.value))))}
                className="ccw-num-input"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── Ball & Statut ── */}
      <section className="ccw-section ccw-section-row">
        <div className="ccw-select-group">
          <span className="ccw-hp-label">Poké Ball</span>
          <select value={ball} onChange={e => setBall(e.target.value)} className="ccw-select">
            {POKEBALLS.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
        <div className="ccw-select-group">
          <span className="ccw-hp-label">Statut</span>
          <select value={status} onChange={e => setStatus(e.target.value)} className="ccw-select">
            {STATUS_MODS.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      </section>

      {/* ── Résultat ── */}
      <section className="ccw-result" style={{ '--prob-color': probColor }}>
        <div className="ccw-result-label">Probabilité de capture</div>
        <div className="ccw-result-prob">{prob.toFixed(1)}%</div>
        <div className="ccw-result-bar">
          <div className="ccw-result-fill" style={{ width: `${Math.min(100, prob)}%` }} />
        </div>
        <div className="ccw-result-hint">
          {prob >= 80 ? '✅ Très facile' : prob >= 50 ? '🟡 Correct' : prob >= 20 ? '🟠 Difficile' : '🔴 Très difficile'}
          {' — '}environ 1 capture sur {prob > 0 ? Math.round(100 / prob) : '∞'} tentatives
        </div>
      </section>
    </div>
  )
}
