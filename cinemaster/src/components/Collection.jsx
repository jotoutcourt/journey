import { useMemo, useState } from 'react'
import Card from './Card.jsx'
import { CARDS, UNIVERSES, TYPES } from '../data/cards.js'
import { RARITIES, RARITY_KEYS } from '../lib/rarity.js'

export default function Collection({ owned, onSelect, onRecycleAll, duplicateDust }) {
  const [universe, setUniverse] = useState('all')
  const [type, setType] = useState('all')
  const [rarity, setRarity] = useState('all')
  const [onlyOwned, setOnlyOwned] = useState(false)

  const list = useMemo(() => CARDS.filter(c =>
    (universe === 'all' || c.u === universe) &&
    (type === 'all' || c.type === type) &&
    (rarity === 'all' || c.rarity === rarity) &&
    (!onlyOwned || owned[c.id])
  ), [universe, type, rarity, onlyOwned, owned])

  const ownedInList = list.filter(c => owned[c.id]).length

  return (
    <section className="collection">
      <div className="filters">
        <select value={universe} onChange={e => setUniverse(e.target.value)} aria-label="Univers">
          <option value="all">Tous les univers</option>
          {Object.entries(UNIVERSES).map(([k, u]) => <option key={k} value={k}>{u.name}</option>)}
        </select>
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
        {duplicateDust > 0 && (
          <button className="btn small" onClick={onRecycleAll}>
            Recycler les doublons (+{duplicateDust} pellicules)
          </button>
        )}
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
                <span className="slot-meta">{c.typeInfo.short} · {c.universe.name}</span>
                <span className="slot-rarity">{RARITIES[c.rarity].symbol}</span>
              </div>
            </div>
          ))}
      </div>
      {list.length === 0 && <p className="empty">Aucune carte ne correspond à ces filtres.</p>}
    </section>
  )
}
