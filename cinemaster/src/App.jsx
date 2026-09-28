import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import BoosterOpening from './components/BoosterOpening.jsx'
import Collection from './components/Collection.jsx'
import CardModal from './components/CardModal.jsx'
import RarityGuide from './components/RarityGuide.jsx'
import Atelier from './components/Atelier.jsx'
import Pack from './components/Pack.jsx'
import PackCarousel from './components/PackCarousel.jsx'
import { Emblem } from './components/Brand.jsx'
import { Icon } from './components/Icons.jsx'
import { CARDS, CARDS_BY_ID } from './data/cards.js'
import { RARITIES } from './lib/rarity.js'
import { openBooster } from './lib/booster.js'
import { connectShared, loadImages } from './lib/images.js'
import AdminGate from './components/AdminGate.jsx'
import { PACK_COVERS } from './lib/packs.js'
import { BOOSTER_DUST_COST, MAX_BOOSTERS, REGEN_MS, initialState, load, regen, save } from './lib/storage.js'

const TABS = [
  { id: 'home', label: 'Accueil', icon: 'home' },
  { id: 'collection', label: 'Collection', icon: 'cards' },
  { id: 'guide', label: 'Raretés', icon: 'star' },
]
// L'Atelier (espace admin) n'est pas dans la barre d'onglets : lien discret en bas de page.


function formatDelay(ms) {
  const m = Math.max(0, Math.ceil(ms / 60000))
  return m >= 60 ? `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, '0')} min` : `${m} min`
}

// Jauge de boosters : barre de recharge, temps restant et nombre disponible.
function BoosterMeter({ boosters, nextIn }) {
  const full = boosters >= MAX_BOOSTERS
  const pct = full ? 100 : Math.round((1 - nextIn / REGEN_MS) * 100)
  return (
    <div className="meter">
      <div className="meter-pill">
        <Icon name="pack" />
        <div className="meter-track"><i style={{ width: `${pct}%` }} /></div>
        <span className="meter-time">
          <Icon name="clock" />
          {full ? 'Au complet' : formatDelay(nextIn)}
        </span>
      </div>
      <span className="meter-count" title="Boosters disponibles">
        <Icon name="pack" />
        <b>{boosters}</b>
      </span>
    </div>
  )
}

export default function App() {
  const [state, setState] = useState(() => regen(load()))
  const [tab, setTab] = useState('home')
  const [detail, setDetail] = useState(null)  // booster affiché en grand
  const [pull, setPull] = useState(null)      // booster en cours d'ouverture
  const [selected, setSelected] = useState(null)
  const [now, setNow] = useState(() => Date.now())
  const [confirmReset, setConfirmReset] = useState(false)

  useEffect(() => { save(state) }, [state])
  useEffect(() => { loadImages(); connectShared() }, [])

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
  const nextIn = state.boosters < MAX_BOOSTERS ? state.regenAt + REGEN_MS - now : 0

  // Verrou : un double appui (ou booster + bouton en même temps) ne doit
  // ouvrir qu'un seul booster. Il est relâché une fois l'ouverture affichée.
  const opening = useRef(false)
  useEffect(() => { opening.current = false }, [pull])

  const open = useCallback((cover = PACK_COVERS[0]) => {
    if (!canOpen || opening.current) return
    opening.current = true
    const cards = openBooster({ theme: cover.u })
    const newIds = new Set(cards.filter(c => !state.owned[c.id]).map(c => c.id))
    setState(s => {
      const useFree = s.boosters > 0
      // dernière vérification sur l'état réel : jamais de solde négatif
      if (!useFree && s.dust < BOOSTER_DUST_COST) return s
      const owned = { ...s.owned }
      for (const c of cards) owned[c.id] = (owned[c.id] || 0) + 1
      return {
        ...s,
        owned,
        opened: s.opened + 1,
        boosters: useFree ? s.boosters - 1 : s.boosters,
        regenAt: useFree && s.boosters >= MAX_BOOSTERS ? Date.now() : s.regenAt,
        dust: useFree ? s.dust : s.dust - BOOSTER_DUST_COST,
      }
    })
    setPull({ cards, newIds, cover, ownedBefore: state.owned, key: Date.now() })
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

  // Remise à zéro : collection, boosters et pellicules. Les images de l'Atelier restent.
  const resetCollection = () => {
    setState(initialState())
    setPull(null)
    setDetail(null)
    setSelected(null)
    setConfirmReset(false)
    setTab('home')
  }

  const goTab = id => {
    setTab(id)
    setPull(null)
    setDetail(null)
    window.scrollTo({ top: 0 })
  }

  const otherPack = () => setDetail(PACK_COVERS[(PACK_COVERS.indexOf(detail) + 1) % PACK_COVERS.length])

  // Écran courant
  let screen
  if (pull) {
    screen = (
      <section className="screen screen-open" style={{ '--c1': pull.cover.universe.c1, '--c2': pull.cover.universe.c2 }}>
        <BoosterOpening
          key={pull.key}
          cards={pull.cards}
          cover={pull.cover}
          isNew={id => pull.newIds.has(id)}
          ownedBefore={pull.ownedBefore}
          canOpenAgain={canOpen}
          onAgain={() => open(pull.cover)}
          onDone={() => { setPull(null); setDetail(null); goTab('collection') }}
        />
      </section>
    )
  } else if (tab === 'home' && detail) {
    screen = (
      <section className="screen pack-detail" style={{ '--c1': detail.universe.c1, '--c2': detail.universe.c2 }}>
        {/* un fond par booster, en fondu (opacité seule) quand on coulisse */}
        {PACK_COVERS.map(c => (
          <div
            key={c.id}
            className={`detail-bg ${c === detail ? 'is-on' : ''}`}
            style={{ '--c1': c.universe.c1 }}
            aria-hidden="true"
          />
        ))}
        <BoosterMeter boosters={state.boosters} nextIn={nextIn} />
        <PackCarousel
          current={detail}
          onChange={setDetail}
          onOpen={() => open(detail)}
          disabled={!canOpen}
        />
        <p className="detail-note">
          {state.boosters > 0
            ? `${state.boosters} booster${state.boosters > 1 ? 's' : ''} disponible${state.boosters > 1 ? 's' : ''}`
            : canOpen
              ? `Plus de booster gratuit : ouvre-le avec ${BOOSTER_DUST_COST} pellicules`
              : 'Plus de booster · recycle tes doublons pour gagner des pellicules'}
        </p>
        <button className="pill-btn primary big" onClick={() => open(detail)} disabled={!canOpen}>
          {state.boosters > 0 ? 'Ouvrir un booster' : `Ouvrir (${BOOSTER_DUST_COST} pellicules)`}
        </button>
        <div className="detail-nav">
          <button className="pill-btn soft" onClick={() => goTab('guide')}>Taux de tirage</button>
          <button className="round-btn" onClick={() => setDetail(null)} aria-label="Retour">
            <Icon name="back" />
          </button>
          <button className="pill-btn soft" onClick={otherPack}>
            Autre booster <Icon name="chevron" />
          </button>
        </div>
      </section>
    )
  } else if (tab === 'home') {
    screen = (
      <section className="screen home">
        <div className="panel pack-panel">
          <div className="pack-panel-bg" aria-hidden="true" />
          <div className="pack-row">
            {PACK_COVERS.map((cover, i) => (
              <div
                key={cover.id}
                className="pack-slot"
                style={{ '--i': i, '--d': i - (PACK_COVERS.length - 1) / 2, '--ad': Math.abs(i - (PACK_COVERS.length - 1) / 2), zIndex: 10 - Math.abs(i - (PACK_COVERS.length - 1) / 2) * 2 }}
              >
                <Pack cover={cover} onClick={() => setDetail(cover)} />
              </div>
            ))}
          </div>
          <BoosterMeter boosters={state.boosters} nextIn={nextIn} />
        </div>

        <div className="tiles">
          <button className="panel tile" onClick={() => goTab('collection')}>
            <span className="tile-icon"><Icon name="cards" /></span>
            <span className="tile-title">Collection</span>
            <span className="tile-sub">{ownedCount}/{CARDS.length} cartes</span>
            <span className="tile-bar"><i style={{ width: `${completion}%` }} /></span>
          </button>
          <button className="panel tile" onClick={() => goTab('guide')}>
            <span className="tile-icon"><Icon name="star" /></span>
            <span className="tile-title">Raretés</span>
            <span className="tile-sub">Taux et effets</span>
          </button>
        </div>

        <div className="panel dust-panel">
          <span className="dust-icon"><Icon name="film" /></span>
          <div>
            <b>{state.dust} pellicules</b>
            <p>Recycle tes doublons dans la collection. {BOOSTER_DUST_COST} pellicules = 1 booster.</p>
          </div>
        </div>
      </section>
    )
  } else if (tab === 'collection') {
    screen = (
      <section className="screen">
        <Collection
          owned={state.owned}
          onSelect={card => setSelected({ card })}
          onRecycleAll={recycleAll}
          duplicateDust={duplicateDust}
        />
        <div className="panel reset-panel">
          {confirmReset
            ? (
              <>
                <p>Effacer toute ta collection, tes boosters et tes pellicules ?</p>
                <div className="reset-actions">
                  <button className="pill-btn danger" onClick={resetCollection}>Oui, tout remettre à zéro</button>
                  <button className="pill-btn soft" onClick={() => setConfirmReset(false)}>Annuler</button>
                </div>
              </>
            )
            : (
              <>
                <p>Recommencer une collection depuis le début.</p>
                <button className="pill-btn soft" onClick={() => setConfirmReset(true)}>Réinitialiser ma collection</button>
              </>
            )}
        </div>
      </section>
    )
  } else if (tab === 'guide') {
    screen = <section className="screen"><RarityGuide /></section>
  } else {
    screen = (
      <section className="screen">
        <AdminGate>
          <Atelier onSelect={card => setSelected({ card, edit: true })} />
        </AdminGate>
      </section>
    )
  }

  return (
    <div className="app">
      <header className="appbar">
        <button className="brand" onClick={() => goTab('home')} aria-label="Accueil">
          <Emblem />
          <span>Pop<b>Card</b></span>
        </button>
        <div className="appbar-pills">
          <span className="chip" title="Pellicules"><Icon name="film" />{state.dust}</span>
          <span className="chip" title="Collection"><Icon name="cards" />{ownedCount}/{CARDS.length}</span>
        </div>
      </header>

      <main key={pull ? `open-${pull.key}` : `${tab}-${detail ? 'booster' : ''}`} className="main">
        {screen}
      </main>

      <p className="legal">
        Jeu de fans non officiel, non affilié aux ayants droit
        {!pull && (
          <>
            {' · '}
            <button className="admin-link" onClick={() => goTab('atelier')}>
              <Icon name="lock" /> Admin
            </button>
          </>
        )}
      </p>

      {!pull && (
        <nav className="tabbar" aria-label="Navigation">
          {TABS.map(t => (
            <button
              key={t.id}
              className={tab === t.id ? 'active' : ''}
              onClick={() => goTab(t.id)}
              aria-label={t.label}
            >
              <Icon name={t.icon} />
              <span>{t.label}</span>
            </button>
          ))}
        </nav>
      )}

      {selected && (
        <CardModal
          card={selected.card}
          edit={selected.edit}
          count={state.owned[selected.card.id] || 0}
          onClose={() => setSelected(null)}
          onRecycle={() => recycle(selected.card.id)}
        />
      )}
    </div>
  )
}
