import { useState, useEffect } from 'react'

const TYPE_COLORS = {
  normal: '#9099A1', fire: '#FF6C35',    water: '#4D90D5',
  electric: '#F4D23C', grass: '#63BB5B', ice: '#74CEC0',
  fighting: '#CE4265', poison: '#AB6AC8', ground: '#D97845',
  flying: '#8FA9DE',  psychic: '#F97176', bug: '#90C12C',
  rock: '#C9BB8A',    ghost: '#5269AD',   dragon: '#0B6DC3',
  dark: '#5A5366',    steel: '#5A8EA2',   fairy: '#EC8FE6',
}

function shinyProb(n) {
  if (n <= 0) return 0
  return (1 - Math.pow(8191 / 8192, n)) * 100
}

function fmtTime(secs) {
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = secs % 60
  if (h > 0) return `${h}h${String(m).padStart(2, '0')}m${String(s).padStart(2, '0')}s`
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function miniSprite(id) {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`
}

function shinyStar(id) {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${id}.png`
}

export default function SoftResetWidget({ game, legendaries }) {
  const storageKey = `pjt-resets-${game.id}`

  const [data, setData] = useState(() => {
    try { return JSON.parse(localStorage.getItem(storageKey) || '{}') }
    catch { return {} }
  })
  const [, setTick] = useState(0)
  const [showShiny, setShowShiny] = useState({})

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000)
    return () => clearInterval(id)
  }, [])

  function getElapsed(id) {
    const e = data[id] || { count: 0, elapsed: 0, runSince: null }
    return e.elapsed + (e.runSince ? Math.floor((Date.now() - e.runSince) / 1000) : 0)
  }

  function getEntry(id) {
    return data[id] || { count: 0, elapsed: 0, runSince: null }
  }

  function update(id, fn) {
    setData(prev => {
      const entry = prev[id] || { count: 0, elapsed: 0, runSince: null }
      const next = fn(entry)
      const saved = {}
      for (const [k, v] of Object.entries({ ...prev, [id]: next })) {
        saved[k] = v.runSince
          ? { ...v, elapsed: v.elapsed + Math.floor((Date.now() - v.runSince) / 1000), runSince: null }
          : v
      }
      localStorage.setItem(storageKey, JSON.stringify(saved))
      return { ...prev, [id]: next }
    })
  }

  function increment(id) {
    update(id, e => ({ ...e, count: e.count + 1 }))
  }

  function decrement(id) {
    update(id, e => ({ ...e, count: Math.max(0, e.count - 1) }))
  }

  function toggleTimer(id) {
    update(id, e => e.runSince
      ? { ...e, elapsed: e.elapsed + Math.floor((Date.now() - e.runSince) / 1000), runSince: null }
      : { ...e, runSince: Date.now() }
    )
  }

  function resetEntry(id) {
    update(id, () => ({ count: 0, elapsed: 0, runSince: null }))
  }

  if (!legendaries?.length) {
    return <div className="srs-empty">Aucun légendaire disponible pour cette version.</div>
  }

  return (
    <div className="srs-root">
      <p className="srs-intro">
        Compteur de soft resets pour la chasse aux chromatiques.
        Probabilité cumulée basée sur les cotes Gen 3 (1/8192).
      </p>
      {legendaries.map(lgd => {
        const entry = getEntry(lgd.id)
        const elapsed = getElapsed(lgd.id)
        const prob = shinyProb(entry.count)
        const isRunning = !!entry.runSince
        const hasData = entry.count > 0 || elapsed > 0
        const isShiny = showShiny[lgd.id]

        return (
          <div key={lgd.id} className="srs-card">
            <div className="srs-card-left">
              <div
                className="srs-sprite-wrap"
                onClick={() => setShowShiny(p => ({ ...p, [lgd.id]: !p[lgd.id] }))}
                title={isShiny ? 'Voir normal' : 'Voir chromatique'}
              >
                <img
                  src={isShiny ? shinyStar(lgd.id) : miniSprite(lgd.id)}
                  alt={lgd.nameFr}
                  className="srs-sprite"
                />
                {isShiny && <span className="srs-shiny-tag">✨</span>}
              </div>
              <div className="srs-poke-info">
                <div className="srs-name">{lgd.nameFr}</div>
                <div className="srs-loc">{lgd.location}</div>
                <div className="srs-types">
                  {lgd.types.map(t => (
                    <span key={t} className="srs-type-pill" style={{ background: TYPE_COLORS[t] || '#888' }}>
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="srs-card-right">
              <div className="srs-counter-row">
                <button className="srs-btn" onClick={() => decrement(lgd.id)}>−</button>
                <span className="srs-count">{entry.count}</span>
                <button className="srs-btn srs-btn--add" onClick={() => increment(lgd.id)}>+</button>
                <span className="srs-resets-label">resets</span>
                {hasData && (
                  <button className="srs-reset-btn" onClick={() => resetEntry(lgd.id)} title="Remettre à zéro">↺</button>
                )}
              </div>

              <div className="srs-timer-row">
                <span className={`srs-time${isRunning ? ' srs-time--running' : ''}`}>
                  ⏱ {fmtTime(elapsed)}
                </span>
                <button
                  className={`srs-timer-btn${isRunning ? ' srs-timer-btn--on' : ''}`}
                  onClick={() => toggleTimer(lgd.id)}
                >
                  {isRunning ? '⏸ Pause' : '▶ Lancer'}
                </button>
              </div>

              <div className="srs-prob-wrap">
                <div className="srs-prob-bar">
                  <div
                    className="srs-prob-fill"
                    style={{ width: `${Math.min(prob, 100)}%`, background: prob > 50 ? '#22a84a' : prob > 20 ? '#f59e0b' : '#4D90D5' }}
                  />
                </div>
                <span className="srs-prob-text">
                  {prob < 0.01 ? '< 0.01' : prob.toFixed(prob < 1 ? 3 : 1)}% de chances d'avoir eu un chromatique
                </span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
