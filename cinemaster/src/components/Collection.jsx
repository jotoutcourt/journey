import { useMemo, useState } from 'react'
import Card from './Card.jsx'
import { Icon } from './Icons.jsx'
import { CARDS, UNIVERSES, TYPES } from '../data/cards.js'
import { RARITIES, RARITY_KEYS } from '../lib/rarity.js'
import { packImageKey, useCardImage } from '../lib/images.js'
import { packFor } from '../lib/packs.js'
import { completionOf } from '../lib/universes.js'

// Visuel d'une série : image de booster si elle existe, sinon l'image de
// son premier personnage, sinon le pictogramme sur le dégradé de la série.
export function SeriesCover({ u }) {
  const lead = packFor(u)
  const packImg = useCardImage(packImageKey(u))
  const leadImg = useCardImage(lead?.id)
  const img = packImg || leadImg || lead?.image
  return (
    <span className="series-cover">
      {img ? <img src={img} alt="" draggable="false" loading="lazy" /> : <span className="series-emoji">{lead?.emoji}</span>}
    </span>
  )
}

function SeriesTile({ s, i, onOpen }) {
  const { u, info, total, have, goal, locked } = s
  return (
    <button
      className={`series-tile ${goal.done ? 'is-complete' : ''} ${locked ? 'is-locked' : ''}`}
      style={{ '--c1': info.c1, '--c2': info.c2, '--i': i }}
      onClick={() => onOpen(u)}
    >
      <SeriesCover u={u} />
      <span className="series-text">
        <span className="series-kind">{info.kind}{locked && <> · <Icon name="lock" /> À débloquer</>}</span>
        <span className="series-name">{info.name}</span>
        {!locked && <span className="series-bar"><i style={{ width: `${Math.round(goal.have / goal.total * 100)}%` }} /></span>}
        <span className="series-count">
          {locked
            ? `${total} cartes`
            : goal.done
              ? <>Complète hors Gold · <b>{have}</b>/{total}</>
              : <><b>{goal.have}</b>/{goal.total} hors Gold</>}
        </span>
      </span>
    </button>
  )
}

// Collection : d'abord la liste des séries (les siennes, puis celles à
// débloquer), puis les cartes de la série choisie.
export default function Collection({ universes, owned, onSelect, onRecycleAll, duplicateDust }) {
  const [universe, setUniverse] = useState(null)

  const series = useMemo(() => Object.entries(UNIVERSES).map(([u, info]) => {
    const cards = CARDS.filter(c => c.u === u)
    return {
      u, info,
      total: cards.length,
      have: cards.filter(c => owned[c.id]).length,
      goal: completionOf(u, owned),
      locked: !universes.includes(u),
    }
  }), [owned, universes])

  const open = u => { setUniverse(u); window.scrollTo({ top: 0 }) }

  if (!universe) {
    const have = series.reduce((a, s) => a + s.have, 0)
    const mine = universes.map(u => series.find(s => s.u === u)).filter(Boolean)
    const locked = series.filter(s => s.locked)
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
        <h3 className="series-group">Tes univers</h3>
        <div className="series-grid">
          {mine.map((s, i) => <SeriesTile key={s.u} s={s} i={i} onOpen={open} />)}
        </div>
        {locked.length > 0 && (
          <>
            <h3 className="series-group">À débloquer</h3>
            <p className="series-hint">Complète une de tes collections (toutes les cartes sauf les Gold) pour choisir un univers de plus.</p>
            <div className="series-grid">
              {locked.map((s, i) => <SeriesTile key={s.u} s={s} i={mine.length + i} onOpen={open} />)}
            </div>
          </>
        )}
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
