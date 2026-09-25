import Card from './Card.jsx'
import { CARDS } from '../data/cards.js'
import { RARITIES, RARITY_KEYS } from '../lib/rarity.js'
import { SLOTS } from '../lib/booster.js'
import { BOOSTER_DUST_COST, MAX_BOOSTERS, REGEN_MS } from '../lib/storage.js'

const DESCRIPTIONS = {
  'commune': 'Cadre classique, sans effet.',
  'peu-commune': 'Cadre classique, symbole ◆.',
  'rare': 'Reverse holo : le cadre de la carte brille, l’illustration reste mate.',
  'holo': 'Holographique : l’illustration scintille aux couleurs de l’arc-en-ciel.',
  'ultra': 'Full art : l’illustration couvre toute la carte, effet arc-en-ciel et paillettes.',
  'secrete': 'Secrète gold : feuille d’or, numérotée au-delà du total de la série.',
}

const rareOdds = SLOTS.at(-1)

export default function RarityGuide() {
  return (
    <section className="guide">
      <p className="guide-intro">
        Chaque booster contient <strong>5 cartes</strong> : 3 communes (ou peu communes), 1 peu commune
        (ou rare) et 1 emplacement rare garanti. Tu reçois un booster toutes
        les {REGEN_MS / 3600000} h (max {MAX_BOOSTERS}), ou tu peux en acheter un
        avec {BOOSTER_DUST_COST} 🎞️ pellicules obtenues en recyclant tes doublons.
        Passe la souris (ou le doigt) sur une carte pour faire bouger les reflets.
      </p>
      <div className="guide-grid">
        {RARITY_KEYS.map(k => {
          const example = CARDS.find(c => c.rarity === k)
          const r = RARITIES[k]
          return (
            <article key={k} className="guide-item">
              <div className="guide-card"><Card card={example} /></div>
              <h3><span style={{ color: r.color }}>{r.symbol}</span> {r.label}</h3>
              <p>{DESCRIPTIONS[k]}</p>
              <p className="muted">
                {CARDS.filter(c => c.rarity === k).length} cartes
                {rareOdds[k] ? ` · ${rareOdds[k]} % dans l’emplacement rare` : ''}
                {' · '}recyclage {r.dust} 🎞️
              </p>
            </article>
          )
        })}
      </div>
    </section>
  )
}
