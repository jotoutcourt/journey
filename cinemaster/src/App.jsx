import { useCallback, useEffect, useMemo, useState } from 'react'
import BoosterOpening from './components/BoosterOpening.jsx'
import Collection from './components/Collection.jsx'
import CardModal from './components/CardModal.jsx'
import RarityGuide from './components/RarityGuide.jsx'
import Atelier from './components/Atelier.jsx'
import Pack from './components/Pack.jsx'
import { Wordmark } from './components/Brand.jsx'
import { CARDS, CARDS_BY_ID } from './data/cards.js'
import { RARITIES } from './lib/rarity.js'
import { openBooster } from './lib/booster.js'
import { loadImages } from './lib/images.js'
import { BOOSTER_DUST_COST, MAX_BOOSTERS, REGEN_MS, load, regen, save } from './lib/storage.js'

const TABS = [
  { id: 'boosters', label: 'Boosters' },
  { id: 'collection', label: 'Collection' },
  { id: 'guide', label: 'Raretés' },
  { id: 'atelier', label: 'Atelier' },
]

// Trois boosters au choix, comme en boutique : seule l'illustration change.
const PACK_COVERS = ['dark-vador', 'daenerys-targaryen', 'la-delorean']
  .map(slug => CARDS.find(c => c.id.endsWith(slug)))
  .filter(Boolean)

function formatDelay(ms) {
  const m = Math.max(0, Math.ceil(ms / 60000))
  return m >= 60 ? `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, '0')}` : `${m} min`
}

function Ticket({ label, value, meter }) {
  return (
    <div className="ticket">
      <span className="ticket-label">{label}</span>
      <span className="ticket-value">{value}</span>
      {meter !== undefined && <span className="ticket-meter"><i style={{ width: `${meter}%` }} /></span>}
    </div>
  )
}

// Scène éclairée par le faisceau du projecteur, avec de la poussière en suspension.
const DUST = Array.from({ length: 16 }, (_, i) => ({
  left: `${(i * 37) % 100}%`,
  top: `${(i * 53) % 90}%`,
  delay: `${-(i * 1.7) % 12}s`,
  size: `${2 + (i % 3)}px`,
}))

function Stage({ children }) {
  return (
    <section className="stage">
      <div className="beam" aria-hidden="true" />
      <div className="dust" aria-hidden="true">
        {DUST.map((d, i) => (
          <i key={i} style={{ left: d.left, top: d.top, animationDelay: d.delay, width: d.size, height: d.size }} />
        ))}
      </div>
      {children}
    </section>
  )
}

export default function App() {
  const [state, setState] = useState(() => regen(load()))
  const [tab, setTab] = useState('boosters')
  const [pull, setPull] = useState(null) // { cards, newIds }
  const [selected, setSelected] = useState(null)
  const [now, setNow] = useState(() => Date.now())
  const [choosing, setChoosing] = useState(null)

  useEffect(() => { save(state) }, [state])
  useEffect(() => { loadImages() }, [])

  useEffect(() => {
    const t = setInterval(() => {
      setNow(Date.now())
      setState(s => regen(s))
    }, 15000)
    return () => clearInterval(t)
  }, [])

  const ownedCount = CARDS.filter(c => state.owned[c.id]).length
  const completion = Math.round((ownedCount / CARDS.length) * 100)

  const duplicateDust = useMemo(() => Object.entries(state.owned).reduce(
    (sum, [id, n]) => sum + (n > 1 && CARDS_BY_ID[id] ? (n - 1) * RARITIES[CARDS_BY_ID[id].rarity].dust : 0), 0
  ), [state.owned])

  const canOpen = state.boosters > 0 || state.dust >= BOOSTER_DUST_COST

  const open = useCallback((cover = PACK_COVERS[0]) => {
    if (!canOpen) return
    const cards = openBooster()
    const newIds = new Set(cards.filter(c => !state.owned[c.id]).map(c => c.id))
    setState(s => {
      const owned = { ...s.owned }
      for (const c of cards) owned[c.id] = (owned[c.id] || 0) + 1
      const useFree = s.boosters > 0
      return {
        ...s,
        owned,
        opened: s.opened + 1,
        boosters: useFree ? s.boosters - 1 : s.boosters,
        regenAt: useFree && s.boosters >= MAX_BOOSTERS ? Date.now() : s.regenAt,
        dust: useFree ? s.dust : s.dust - BOOSTER_DUST_COST,
      }
    })
    setPull({ cards, newIds, cover, key: Date.now() })
  }, [canOpen, state.owned])

  const recycle = id => setState(s => {
    const n = s.owned[id] || 0
    if (n <= 1) return s
    return {
      ...s,
      owned: { ...s.owned, [id]: n - 1 },
      dust: s.dust + RARITIES[CARDS_BY_ID[id].rarity].dust,
    }
  })

  const recycleAll = () => setState(s => {
    let dust = s.dust
    const owned = { ...s.owned }
    for (const [id, n] of Object.entries(owned)) {
      if (n > 1 && CARDS_BY_ID[id]) {
        dust += (n - 1) * RARITIES[CARDS_BY_ID[id].rarity].dust
        owned[id] = 1
      }
    }
    return { ...s, owned, dust }
  })

  const nextIn = state.boosters < MAX_BOOSTERS ? state.regenAt + REGEN_MS - now : 0

  // Le booster choisi s'avance pendant que les autres quittent la scène,
  // puis l'ouverture commence.
  const choose = cover => {
    if (!canOpen || choosing) return
    setChoosing(cover.id)
    setTimeout(() => {
      setChoosing(null)
      open(cover)
    }, 560)
  }

  const plural = n => (n > 1 ? 's' : '')

  return (
    <div className="app">
      <div className="grain" aria-hidden="true" />

      <header className="topbar">
        <div className="brand">
          <Wordmark />
          <span className="brand-sub">Série 1 — Premières Séances</span>
        </div>
        <div className="tickets">
          <Ticket label="Boosters" value={`${state.boosters}/${MAX_BOOSTERS}`} />
          <Ticket label="Pellicules" value={state.dust} />
          <Ticket label="Collection" value={`${ownedCount}/${CARDS.length}`} meter={completion} />
        </div>
      </header>

      <nav className="tabs">
        {TABS.map(t => (
          <button key={t.id} className={tab === t.id ? 'active' : ''} onClick={() => { setTab(t.id); setPull(null) }}>
            {t.label}
          </button>
        ))}
      </nav>

      <main>
        {tab === 'boosters' && (pull
          ? (
            <Stage>
              <BoosterOpening
                key={pull.key}
                cards={pull.cards}
                cover={pull.cover}
                isNew={id => pull.newIds.has(id)}
                canOpenAgain={canOpen}
                onAgain={() => open(pull.cover)}
                onDone={() => { setPull(null); setTab('collection') }}
              />
            </Stage>
          ) : (
            <Stage>
              <div className="stage-head">
                <p className="eyebrow">{CARDS.length} cartes · personnages, lieux et objets cultes</p>
                <h2>Choisis ton booster</h2>
              </div>
              <div className={`pack-row ${choosing ? 'is-choosing' : ''}`}>
                {PACK_COVERS.map((cover, i) => (
                  <div
                    key={cover.id}
                    className={`pack-slot ${choosing === cover.id ? 'is-chosen' : ''}`}
                    style={{ '--i': i }}
                  >
                    <div className="pack-bob">
                      <Pack cover={cover} disabled={!canOpen} onClick={() => choose(cover)} />
                    </div>
                    <div className="pack-floor" />
                  </div>
                ))}
              </div>
              <p className="stage-foot">
                {state.boosters > 0
                  ? `${state.boosters} booster${plural(state.boosters)} gratuit${plural(state.boosters)}`
                  : canOpen
                    ? `Booster à ${BOOSTER_DUST_COST} pellicules`
                    : 'Plus de booster · recycle tes doublons pour gagner des pellicules'}
                {state.boosters < MAX_BOOSTERS && ` · prochain dans ${formatDelay(nextIn)}`}
              </p>
            </Stage>
          ))}

        {tab === 'collection' && (
          <Collection
            owned={state.owned}
            onSelect={card => setSelected({ card })}
            onRecycleAll={recycleAll}
            duplicateDust={duplicateDust}
          />
        )}

        {tab === 'guide' && <RarityGuide />}

        {tab === 'atelier' && <Atelier onSelect={card => setSelected({ card, edit: true })} />}
      </main>

      {selected && (
        <CardModal
          card={selected.card}
          edit={selected.edit}
          count={state.owned[selected.card.id] || 0}
          onClose={() => setSelected(null)}
          onRecycle={() => recycle(selected.card.id)}
        />
      )}

      <footer className="foot">
        Jeu de fans non officiel, non affilié aux ayants droit · Collection sauvegardée sur cet appareil
      </footer>
    </div>
  )
}
