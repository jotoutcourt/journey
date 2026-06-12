import { useState } from 'react'
import { GBACart } from './GBACart.jsx'
import { useT, useLocale } from './i18n/index.jsx'
import OnlineCounter from './OnlineCounter.jsx'
import LegalModal from './LegalModal.jsx'

const BMAC_URL = import.meta.env.VITE_BMAC_URL || 'https://buymeacoffee.com/jotoutcourt'

const CARTS = [
  {
    id: 'firered',
    name: 'Rouge Feu',
    color: '#cc2200',
    gradient: 'linear-gradient(160deg, #cc2200 0%, #7a1100 100%)',
    accent: '#ff6633',
    available: true,
    beta: true,
  },
  {
    id: 'leafgreen',
    name: 'Vert Feuille',
    color: '#1a7a35',
    gradient: 'linear-gradient(160deg, #1a7a35 0%, #0d4a1f 100%)',
    accent: '#44dd77',
    available: true,
    beta: true,
  },
  {
    id: 'omegaruby',
    name: 'Rubis Oméga',
    color: '#b01010',
    gradient: 'linear-gradient(160deg, #b01010 0%, #6a0808 100%)',
    accent: '#ff5533',
    available: false,
  },
  {
    id: 'alphasapphire',
    name: 'Saphir Alpha',
    color: '#1155cc',
    gradient: 'linear-gradient(160deg, #1155cc 0%, #0a2e80 100%)',
    accent: '#55aaff',
    available: false,
  },
]

export { CARTS }

export function ConsoleScreen({ games, onSelectGame, returningCartId, onOpenBugReport }) {
  const t = useT()
  const { locale, setLocale } = useLocale()
  const [activeCartId, setActiveCartId] = useState(null)
  const [legalOpen, setLegalOpen] = useState(false)

  function insert(cart) {
    if (!cart.available || activeCartId) return
    setActiveCartId(cart.id)
    setTimeout(() => {
      const game = games.find(g => g.id === cart.id)
      onSelectGame(game, cart)
    }, 550)
  }

  return (
    <div className="cs-page">
      <div className={`cs-home ${activeCartId ? 'cs-home-out' : ''}`}>
        <header className="cs-header">
          <h1 className="cs-title">Pokémon<br />Journey Tracker</h1>
          <p className="cs-sub">{t('console.sub')}</p>
          <div className="cs-lang-toggle">
            <button
              className={`cs-lang-btn${locale === 'fr' ? ' cs-lang-btn--active' : ''}`}
              onClick={() => setLocale('fr')}
            >FR</button>
            <button
              className={`cs-lang-btn${locale === 'en' ? ' cs-lang-btn--active' : ''}`}
              onClick={() => setLocale('en')}
            >EN</button>
          </div>
        </header>

        <div className="carts-row">
          {CARTS.map((cart, idx) => {
            const isActive    = activeCartId === cart.id
            const isOther     = activeCartId && !isActive
            const isReturning = returningCartId === cart.id
            return (
              <div
                key={cart.id}
                className={[
                  'cart-wrapper',
                  cart.available ? 'cart-wrapper-available' : 'cart-wrapper-locked',
                  isOther     ? 'cart-wrapper-fading'    : '',
                  isActive    ? 'cart-wrapper-selecting' : '',
                  isReturning ? 'cart-returning'         : '',
                ].filter(Boolean).join(' ')}
                style={isReturning ? { '--ri': idx } : {}}
                onClick={() => insert(cart)}
              >
                <GBACart
                  id={cart.id}
                  name={cart.name}
                  color={cart.color}
                  gradient={cart.gradient}
                  accent={cart.accent}
                  available={cart.available}
                />
                {cart.beta && <span className="cart-beta-badge">BETA</span>}
                <div className="cart-hover-name" style={{ '--cc': cart.color }}>
                  {cart.available ? `Pokémon ${cart.name}` : 'Bientôt disponible'}
                </div>
              </div>
            )
          })}
        </div>

        <p className="shelf-hint">{t('console.hint')}</p>
      </div>

      <footer className="app-footer">
        <span className="app-footer-text">
          Pokémon Journey Tracker — Projet fan non officiel &nbsp;·&nbsp;
          <button className="app-footer-legal" onClick={() => setLegalOpen(true)}>Mentions légales</button>
        </span>
        <OnlineCounter />
        <div className="app-footer-right">
          {BMAC_URL && (
            <a href={BMAC_URL} target="_blank" rel="noopener noreferrer" className="bmac-btn bmac-btn--small">
              ☕ Buy me a coffee
            </a>
          )}
          <button className="app-footer-bug" onClick={onOpenBugReport}>🐛 Signaler un bug</button>
        </div>
      </footer>
      <LegalModal open={legalOpen} onClose={() => setLegalOpen(false)} />
    </div>
  )
}
