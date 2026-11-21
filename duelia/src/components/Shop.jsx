// Boutique : débloquer des thèmes avec ses lingots
import { useState } from 'react'
import TopicIcon from './TopicIcon.jsx'
import Mascot from './Mascot.jsx'
import { priceOf, isLockable } from '../lib/shop.js'

export function Shop({ topics, wallet, isLocked, onUnlock, onOpen, onBack, online }) {
  const [busy, setBusy] = useState(null)
  const lingots = wallet?.lingots ?? 0
  const lockable = topics.filter(isLockable)
  const locked = lockable.filter(isLocked).sort((a, b) => priceOf(a.id) - priceOf(b.id) || a.name.localeCompare(b.name))
  const owned = lockable.filter(t => !isLocked(t))
  return (
    <div className="screen shop">
      <header className="top">
        <button className="back" onClick={onBack} aria-label="Retour">←</button><h1>Boutique</h1>
        {wallet && <span className="wallet-pill"><i className="lt-coin" aria-hidden="true" />{lingots}</span>}
      </header>
      <section className="shop-hero">
        <Mascot pose="pirate" size={96} />
        <p>Dépense les lingots volés au Kraken pour débloquer de nouveaux thèmes. Gagne des lingots en jouant au <b>Butin</b>.</p>
      </section>
      {!online && <p className="inbox-empty">La boutique a besoin d'une connexion.</p>}
      {online && locked.length === 0 && <p className="inbox-empty">Tu as débloqué tous les thèmes ! 🏆</p>}
      {locked.length > 0 && <>
        <h3 className="sec-title">À débloquer <small>({locked.length})</small></h3>
        <ul className="shop-list">
          {locked.map(t => {
            const price = priceOf(t.id)
            const can = lingots >= price
            return (
              <li key={t.id}>
                <button className="shop-topic" onClick={() => onOpen(t)}>
                  <TopicIcon topic={t} size={48} />
                  <span><b>{t.name}</b><small>{t.questions.length} questions · {t.category}</small></span>
                </button>
                <button className={`btn btn-small ${can ? 'btn-gold' : 'btn-ghost'}`} disabled={!can || !online || busy === t.id}
                  onClick={async () => { setBusy(t.id); await onUnlock(t); setBusy(null) }}>
                  {busy === t.id ? '…' : can ? <>🔓 {price}</> : <>🔒 {price}</>}
                </button>
              </li>
            )
          })}
        </ul>
        {locked.some(t => lingots < priceOf(t.id)) && <p className="shop-note">Il te manque des lingots ? Une partie de Butin en rapporte jusqu'à 20, et +5 pour la première du jour.</p>}
      </>}
      {owned.length > 0 && <>
        <h3 className="sec-title">Déjà à toi <small>({owned.length})</small></h3>
        <div className="shop-owned">{owned.map(t => <button key={t.id} onClick={() => onOpen(t)} title={t.name}><TopicIcon topic={t} size={40} /></button>)}</div>
      </>}
    </div>
  )
}
