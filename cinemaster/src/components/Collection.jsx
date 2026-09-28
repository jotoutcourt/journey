import { useMemo, useState } from 'react'
import Card from './Card.jsx'
import { Icon } from './Icons.jsx'
import { CARDS, UNIVERSES, TYPES } from '../data/cards.js'
import { RARITIES, RARITY_KEYS } from '../lib/rarity.js'
import { packImageKey, useCardImage } from '../lib/images.js'

// Visuel d'une série : image de booster si elle existe, sinon l'image de
// son premier personnage, sinon le pictogramme sur le dégradé de la série.
function SeriesCover({ u }) {
  const lead = CARDS.find(c => c.u === u && c.type === 'CHAR') || CARDS.find(c => c.u === u)
  const packImg = useCardImage(packImageKey(u))
  const leadImg = useCardImage(lead?.id)
  const img = packImg || leadImg || lead?.image
  return (
    <span className="series-cover">
      {img ? <img src={img} alt="" draggable="false" loading="lazy" /> : <span className="series-emoji">{lead?.emoji}</span>}
    </span>
  )
}

// Collection : d'abord la liste des séries, puis les cartes de la série choisie.
export default function Collection({ owned, onSelect, onRecycleAll, duplicateDust }) {
  const [universe, setUniverse] = useState(null)

  const series = useMemo(() => Object.entries(UNIVERSES).map(([u, info]) => {
    const cards = CARDS.filter(c => c.u === u)
    return { u, info, total: cards.length, have: cards.filter(c => owned[c.id]).length }
  }), [owned])

  if (!universe) {
    const have = series.reduce((a, s) => a + s.have, 0)
    return (
      <section className="collection">
        <div className="filters">
          <span className="filter-count">{have}/{CARDS.length} cartes</span>
          {duplicateDust > 0 && (
            <button className="btn small" onClick={onRecycleAll}>
              Recycler les doublons (+{duplicateDust} pellicules)
            </button>
          )}
        </div>
        <div className="series-grid">
          {series.map(({ u, info, total, have }, i) => (
            <button
              key={u}
              className={`series-tile ${have === total ? 'is-complete' : ''}`}
              style={{ '--c1': info.c1, '--c2': info.c2, '--i': i }}
              onClick={() => { setUniverse(u); window.scrollTo({ top: 0 }) }}
            >
              <SeriesCover u={u} />
              <span className="series-text">
                <span className="series-kind">{info.kind}</span>
                <span className="series-name">{info.name}</span>
                <span className="series-bar"><i style={{ width: `${Math.round(have / total * 100)}%` }} /></span>
                <span className="series-count"><b>{have}</b>/{total}{have === total && ' · Complète'}</span>
              </span>
            </button>
          ))}
        </div>
      </section>
    )
  }

  return <SeriesView u={universe} owned={owned} onSelect={onSelect} onBack={() => setUniverse(null)} />
}

function SeriesView({ u, owned, onSelect, onBack }) {
  const [type, setType] = useState('all')
  const [rarity, setRarity] = useState('all')
  const [onlyOwned, setOnlyOwned] = useState(false)

  const universe = u
  const list = useMemo(() => CARDS.filter(c =>
    c.u === universe &&
    (type === 'all' || c.type === type) &&
    (rarity === 'all' || c.rarity === rarity) &&
    (!onlyOwned || owned[c.id])
  ), [universe, type, rarity, onlyOwned, owned])

  const ownedInList = list.filter(c => owned[c.id]).length

  return (
    <section className="collection">
      <div className="series-head" style={{ '--c1': UNIVERSES[u].c1, '--c2': UNIVERSES[u].c2 }}>
        <button className="round-btn" onClick={onBack} aria-label="Retour aux séries"><Icon name="back" /></button>
        <div>
          <p className="eyebrow">{UNIVERSES[u].kind}</p>
          <h2>{UNIVERSES[u].name}</h2>
        </div>
      </div>
      <div className="filters">
        <select value={type} onChange={e => setType(e.target.value)} aria-label="Type">
          <option value="all">Tous les types</option>
          {Object.entries(TYPES).map(([k, t]) => <option key={k} value={k}>{t.label}</option>)}
        </select>
        <select value={rarity} onChange={e => setRarity(e.target.value)} aria-label="Rareté">
          <option value="all">Toutes les raretés</option>
          {RARITY_KEYS.map(k => <option key={k} value={k}>{RARITIES[k].symbol} {RARITIES[k].label}</option>)}
        </select>
        <label className="toggle">
          <input type="checkbox" checked={onlyOwned} onChange={e => setOnlyOwned(e.target.checked)} />
          Possédées
        </label>
        <span className="filter-count">{ownedInList}/{list.length}</span>
      </div>

      <div className="card-grid">
        {list.map(c => owned[c.id]
          ? (
            <div key={c.id} className="grid-item">
              <Card card={c} onClick={() => onSelect(c)} />
              {owned[c.id] > 1 && <span className="count-badge">×{owned[c.id]}</span>}
            </div>
          ) : (
            <div key={c.id} className="grid-item">
              <div className="card-slot" style={{ '--c1': c.universe.c1, '--c2': c.universe.c2 }}>
                <span className="slot-num">{String(c.number).padStart(3, '0')}</span>
                <span className="slot-q">?</span>
                <span className="slot-meta">{c.typeInfo.short}</span>
                <span className="slot-rarity">{RARITIES[c.rarity].symbol}</span>
              </div>
            </div>
          ))}
      </div>
      {list.length === 0 && <p className="empty">Aucune carte ne correspond à ces filtres.</p>}
    </section>
  )
}
