import { useCallback, useEffect, useMemo, useState } from 'react'
import BoosterOpening from './components/BoosterOpening.jsx'
import Collection from './components/Collection.jsx'
import CardModal from './components/CardModal.jsx'
import RarityGuide from './components/RarityGuide.jsx'
import Atelier from './components/Atelier.jsx'
import Pack from './components/Pack.jsx'
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

export default function App() {
  const [state, setState] = useState(() => regen(load()))
  const [tab, setTab] = useState('boosters')
  const [pull, setPull] = useState(null) // { cards, newIds }
  const [selected, setSelected] = useState(null)
  const [now, setNow] = useState(() => Date.now())

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

  return (
    <div className="app">
      <header className="topbar">
        <h1 className="logo"><span>Ciné</span>Master</h1>
        <div className="stats">
          <span className="stat" title="Boosters disponibles">🎴 {state.boosters}/{MAX_BOOSTERS}</span>
          <span className="stat" title="Pellicules (recyclage des doublons)">🎞️ {state.dust}</span>
          <span className="stat" title="Progression de la collection">📖 {ownedCount}/{CARDS.length}</span>
        </div>
      </header>

      <div className="progress" aria-label={`Collection complétée à ${completion} %`}>
        <div className="progress-fill" style={{ width: `${completion}%` }} />
      </div>

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
            <BoosterOpening
              key={pull.key}
              cards={pull.cards}
              cover={pull.cover}
              isNew={id => pull.newIds.has(id)}
              canOpenAgain={canOpen}
              onAgain={() => open(pull.cover)}
              onDone={() => { setPull(null); setTab('collection') }}
            />
          ) : (
            <section className="shop">
              <h2>Choisis ton booster</h2>
              <p className="muted">
                Série 1 · Premières Séances · {CARDS.length} cartes : personnages, lieux cultes et objets cultes.
              </p>
              <div className="pack-row">
                {PACK_COVERS.map(cover => (
                  <div key={cover.id} className="pack-slot">
                    <Pack cover={cover} disabled={!canOpen} onClick={() => open(cover)} />
                  </div>
                ))}
              </div>
              <p className="muted small">
                {state.boosters > 0
                  ? `${state.boosters} booster${state.boosters > 1 ? 's' : ''} gratuit${state.boosters > 1 ? 's' : ''} disponible${state.boosters > 1 ? 's' : ''}`
                  : canOpen
                    ? `Plus de booster gratuit : celui-ci coûte ${BOOSTER_DUST_COST} 🎞️`
                    : 'Plus de booster : recycle tes doublons dans la collection pour gagner des pellicules.'}
                {state.boosters < MAX_BOOSTERS && ` · prochain dans ${formatDelay(nextIn)}`}
              </p>
            </section>
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
        Jeu de fans non officiel · Collection sauvegardée sur cet appareil
      </footer>
    </div>
  )
}
