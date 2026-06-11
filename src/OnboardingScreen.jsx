import { useState } from 'react'

const STARTERS = {
  firered: [
    {
      id: 1,
      name: 'bulbasaur',
      nameFr: 'Bulbizarre',
      types: ['grass', 'poison'],
      hint: 'Solide dès le début — domine les 2 premières arènes',
    },
    {
      id: 4,
      name: 'charmander',
      nameFr: 'Salamèche',
      types: ['fire'],
      hint: 'Difficile au départ, redoutable dès le niveau 16',
    },
    {
      id: 7,
      name: 'squirtle',
      nameFr: 'Carapuce',
      types: ['water'],
      hint: 'Polyvalent, recommandé pour une première aventure',
    },
  ],
  leafgreen: [
    {
      id: 1,
      name: 'bulbasaur',
      nameFr: 'Bulbizarre',
      types: ['grass', 'poison'],
      hint: 'Solide dès le début — domine les 2 premières arènes',
    },
    {
      id: 4,
      name: 'charmander',
      nameFr: 'Salamèche',
      types: ['fire'],
      hint: 'Difficile au départ, redoutable dès le niveau 16',
    },
    {
      id: 7,
      name: 'squirtle',
      nameFr: 'Carapuce',
      types: ['water'],
      hint: 'Polyvalent, recommandé pour une première aventure',
    },
  ],
  heartgold: [
    {
      id: 152,
      name: 'chikorita',
      nameFr: 'Germignon',
      types: ['grass'],
      hint: 'Défensif, délicat au début mais très équilibré',
    },
    {
      id: 155,
      name: 'cyndaquil',
      nameFr: 'Héricendre',
      types: ['fire'],
      hint: 'Puissant et rapide, recommandé pour les débutants',
    },
    {
      id: 158,
      name: 'totodile',
      nameFr: 'Kaiminus',
      types: ['water'],
      hint: 'Attaque élevée, très efficace dès le départ',
    },
  ],
  soulsilver: [
    {
      id: 152,
      name: 'chikorita',
      nameFr: 'Germignon',
      types: ['grass'],
      hint: 'Défensif, délicat au début mais très équilibré',
    },
    {
      id: 155,
      name: 'cyndaquil',
      nameFr: 'Héricendre',
      types: ['fire'],
      hint: 'Puissant et rapide, recommandé pour les débutants',
    },
    {
      id: 158,
      name: 'totodile',
      nameFr: 'Kaiminus',
      types: ['water'],
      hint: 'Attaque élevée, très efficace dès le départ',
    },
  ],
  gold: [
    {
      id: 152,
      name: 'chikorita',
      nameFr: 'Germignon',
      types: ['grass'],
      hint: 'Défensif, délicat au début mais très équilibré',
    },
    {
      id: 155,
      name: 'cyndaquil',
      nameFr: 'Héricendre',
      types: ['fire'],
      hint: 'Puissant et rapide, recommandé pour les débutants',
    },
    {
      id: 158,
      name: 'totodile',
      nameFr: 'Kaiminus',
      types: ['water'],
      hint: 'Attaque élevée, très efficace dès le départ',
    },
  ],
  omegaruby: [
    {
      id: 252,
      name: 'treecko',
      nameFr: 'Arcko',
      types: ['grass'],
      hint: 'Vitesse exceptionnelle, stratégique en mid-game',
    },
    {
      id: 255,
      name: 'torchic',
      nameFr: 'Poussifeu',
      types: ['fire'],
      hint: 'Devient très puissant après l\'évolution en Braségali',
    },
    {
      id: 258,
      name: 'mudkip',
      nameFr: 'Gobou',
      types: ['water'],
      hint: 'Polyvalent Eau/Sol, recommandé pour les débutants',
    },
  ],
  alphasapphire: [
    {
      id: 252,
      name: 'treecko',
      nameFr: 'Arcko',
      types: ['grass'],
      hint: 'Vitesse exceptionnelle, stratégique en mid-game',
    },
    {
      id: 255,
      name: 'torchic',
      nameFr: 'Poussifeu',
      types: ['fire'],
      hint: 'Devient très puissant après l\'évolution en Braségali',
    },
    {
      id: 258,
      name: 'mudkip',
      nameFr: 'Gobou',
      types: ['water'],
      hint: 'Polyvalent Eau/Sol, recommandé pour les débutants',
    },
  ],
  sapphire: [
    {
      id: 252,
      name: 'treecko',
      nameFr: 'Arcko',
      types: ['grass'],
      hint: 'Vitesse exceptionnelle, stratégique en mid-game',
    },
    {
      id: 255,
      name: 'torchic',
      nameFr: 'Poussifeu',
      types: ['fire'],
      hint: 'Forme finale redoutable, recommandé aux joueurs expérimentés',
    },
    {
      id: 258,
      name: 'mudkip',
      nameFr: 'Gobou',
      types: ['water', 'ground'],
      hint: 'Défensif et solide, excellent pour débuter Hoenn',
    },
  ],
}

const TYPE_COLORS = {
  grass: '#63BB5B', poison: '#AB6AC8', fire: '#FF6C35', water: '#4D90D5',
  ground: '#D97845', flying: '#8FA9DE', normal: '#9099A1',
}

const TYPE_FR = {
  grass: 'Plante', poison: 'Poison', fire: 'Feu', water: 'Eau',
  ground: 'Sol', flying: 'Vol', normal: 'Normal',
}

export function OnboardingScreen({ game, onComplete }) {
  const [step, setStep]       = useState(1)
  const [trainerName, setTrainerName] = useState('')
  const [starter, setStarter] = useState(null)

  const starters = STARTERS[game.id] || []

  function finish() {
    onComplete({
      trainerName: trainerName.trim(),
      starterId:    starter.id,
      starterName:  starter.nameFr,
      starterTypes: starter.types,
      starterSprite: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${starter.id}.png`,
    })
  }

  return (
    <div
      className="onb-page"
      style={{ '--gc': game.color, '--gg': game.gradient }}
    >
      <div className="onb-inner">

        {/* ── ÉTAPE 1 : Nom du dresseur ── */}
        {step === 1 && (
          <div className="onb-step">
            <div className="onb-badge" style={{ color: game.color }}>
              {game.emoji} Pokémon {game.name}
            </div>
            <h2 className="onb-question">
              Quel surnom as-tu<br />choisi dans le jeu ?
            </h2>
            <p className="onb-sub">
              Le nom de ton dresseur tel qu'il apparaît dans la cartouche
            </p>
            <input
              className="onb-input"
              type="text"
              placeholder="ex : Sacha, Red, Ash…"
              value={trainerName}
              onChange={e => setTrainerName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && trainerName.trim() && setStep(2)}
              autoFocus
              maxLength={12}
            />
            <button
              className="onb-btn"
              style={{ background: game.color }}
              disabled={!trainerName.trim()}
              onClick={() => setStep(2)}
            >
              Continuer →
            </button>
          </div>
        )}

        {/* ── ÉTAPE 2 : Choix du starter ── */}
        {step === 2 && (
          <div className="onb-step">
            <div className="onb-badge" style={{ color: game.color }}>
              👤 {trainerName}
            </div>
            <h2 className="onb-question">
              Quel starter<br />as-tu choisi ?
            </h2>
            <p className="onb-sub">
              Il sera automatiquement ajouté à ton équipe
            </p>
            <div className="onb-starters">
              {starters.map(s => (
                <div
                  key={s.id}
                  className={`onb-starter ${starter?.id === s.id ? 'selected' : ''}`}
                  style={starter?.id === s.id ? { '--sc': game.color } : {}}
                  onClick={() => setStarter(s)}
                >
                  <img
                    src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${s.id}.png`}
                    alt={s.nameFr}
                    className="onb-starter-img"
                  />
                  <div className="onb-starter-name">{s.nameFr}</div>
                  <div className="onb-starter-types">
                    {s.types.map(t => (
                      <span
                        key={t}
                        className="onb-type"
                        style={{ background: TYPE_COLORS[t] || '#888' }}
                      >
                        {TYPE_FR[t] || t}
                      </span>
                    ))}
                  </div>
                  <p className="onb-starter-hint">{s.hint}</p>
                </div>
              ))}
            </div>
            <div className="onb-nav-row">
              <button className="onb-btn-ghost" onClick={() => setStep(1)}>
                ← Retour
              </button>
              <button
                className="onb-btn"
                style={{ background: game.color }}
                disabled={!starter}
                onClick={() => setStep(3)}
              >
                Choisir {starter?.nameFr ?? ''}
              </button>
            </div>
          </div>
        )}

        {/* ── ÉTAPE 3 : Confirmation ── */}
        {step === 3 && starter && (
          <div className="onb-step onb-confirm">
            <img
              src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${starter.id}.png`}
              alt={starter.nameFr}
              className="onb-confirm-img"
            />
            <div className="onb-confirm-trainer">{trainerName}</div>
            <div className="onb-confirm-with">avec {starter.nameFr}</div>
            <div className="onb-confirm-msg" style={{ color: game.color }}>
              Que ton aventure commence !
            </div>
            <button
              className="onb-btn onb-btn-lg"
              style={{ background: game.color }}
              onClick={finish}
            >
              Entrer dans le jeu ✓
            </button>
          </div>
        )}

      </div>
    </div>
  )
}
