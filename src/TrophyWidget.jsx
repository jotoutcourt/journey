import { useState } from 'react'

function miniSprite(id) {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`
}

function TrophyCard({ trophy }) {
  return (
    <div className="trw-card" style={{ '--tc': trophy.game.color }}>
      <div className="trw-card-banner">
        <span className="trw-card-emoji">{trophy.game.emoji}</span>
        <div>
          <div className="trw-card-game">Pokémon {trophy.game.name}</div>
          <div className="trw-card-trainer">👤 {trophy.trainerName}</div>
        </div>
        <div className="trw-card-badge">🏆 Champion</div>
      </div>

      <div className="trw-team">
        {trophy.team.map((p, i) => p ? (
          <div key={i} className="trw-member">
            <img src={miniSprite(p.id)} alt={p.nameFr} className="trw-sprite" />
            <div className="trw-member-name">{p.nameFr}</div>
            {p.level && <div className="trw-member-level">Niv.{p.level}</div>}
          </div>
        ) : (
          <div key={i} className="trw-member trw-member--empty">
            <div className="trw-empty-slot" />
          </div>
        ))}
      </div>

      <div className="trw-card-date">{trophy.date}</div>
    </div>
  )
}

export default function TrophyWidget({ game }) {
  const [trophies] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(`pjt-trophies-${game.id}`) || '[]')
    } catch { return [] }
  })

  if (!trophies.length) {
    return (
      <div className="trw-empty">
        <div className="trw-empty-icon">🏆</div>
        <p className="trw-empty-msg">Pas encore de victoire contre la Ligue.</p>
        <p className="trw-empty-hint">Cochez "Battre le Rival — Maître de la Ligue" dans l'aventure pour créer ta première photo souvenir.</p>
      </div>
    )
  }

  return (
    <div className="trw-root">
      {trophies.map((t, i) => <TrophyCard key={t.id ?? i} trophy={t} />)}
    </div>
  )
}
