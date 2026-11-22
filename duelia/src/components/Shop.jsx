// Boutique : débloquer des thèmes avec ses lingots
import { useState } from 'react'
import TopicIcon from './TopicIcon.jsx'
import Mascot from './Mascot.jsx'
import { priceOf, isLockable } from '../lib/shop.js'
import { CATEGORIES } from '../data/topics.js'

export function Shop({ topics, wallet, isLocked, onUnlock, onOpen, onBack, online }) {
  const [busy, setBusy] = useState(null)
  const lingots = wallet?.lingots ?? 0
  const lockable = topics.filter(isLockable)
  const locked = lockable.filter(isLocked).sort((a, b) => priceOf(a.id) - priceOf(b.id) || a.name.localeCompare(b.name))
  const owned = lockable.filter(t => !isLocked(t))
  // Classement par catégorie : filtre en haut, et en « Tous » la liste est rangée par catégorie
  const [cat, setCat] = useState('Tous')
  const order = (c) => { const i = CATEGORIES.indexOf(c); return i < 0 ? 99 : i }
  const cats = [...new Set(locked.map(t => t.category))].sort((a, b) => order(a) - order(b))
  const shown = cat === 'Tous' ? cats : cats.includes(cat) ? [cat] : cats
  return (
    <div className="screen shop">
      <header className="top">
        <button className="back" onClick={onBack} aria-label="Retour">←</button><h1>Boutique</h1>
        {wallet && <span className="wallet-pill"><i className="lt-coin" aria-hidden="true" />{lingots}</span>}
      </header>
      <section className="shop-hero">
        <Mascot pose="pirate" size={96} />
        <p>Dépense les lingots volés au Kraken pour débloquer de nouveaux thèmes. Gagne des lingots en jouant à <b>L'Appât du Kraken</b>.</p>
      </section>
      {!online && <p className="inbox-empty">La boutique a besoin d'une connexion.</p>}
      {online && locked.length === 0 && <p className="inbox-empty">Tu as débloqué tous les thèmes ! 🏆</p>}
      {locked.length > 0 && <>
        <h3 className="sec-title">À débloquer <small>({locked.length})</small></h3>
        {cats.length > 1 && (
          <div className="chips shop-chips" role="tablist" aria-label="Catégories">
            {['Tous', ...cats].map(c => (
              <button key={c} role="tab" aria-selected={c === cat} className={`chip ${c === cat ? 'on' : ''}`} onClick={() => setCat(c)}>
                {c} <small>{c === 'Tous' ? locked.length : locked.filter(t => t.category === c).length}</small>
              </button>
            ))}
          </div>
        )}
        {shown.map(c => (
          <section key={c} className="shop-cat">
            {(cat === 'Tous' && cats.length > 1) && <h4 className="shop-cat-title">{c}</h4>}
            <ul className="shop-list">
          {locked.filter(t => t.category === c).map(t => {
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
          </section>
        ))}
        {locked.some(t => lingots < priceOf(t.id)) && <p className="shop-note">Il te manque des lingots ? Une partie de l'Appât du Kraken en rapporte jusqu'à 20, et +5 pour la première du jour.</p>}
      </>}
      {owned.length > 0 && <>
        <h3 className="sec-title">Déjà à toi <small>({owned.length})</small></h3>
        <div className="shop-owned">{owned.map(t => <button key={t.id} onClick={() => onOpen(t)} title={t.name}><TopicIcon topic={t} size={40} /></button>)}</div>
      </>}
    </div>
  )
}

/* ---------- Premier lancement : choisir ses 5 thèmes gratuits ---------- */
export function StarterPick({ topics, count = 5, onDone }) {
  const [picked, setPicked] = useState([])
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState(null)
  const list = topics.filter(isLockable)
  const toggle = (id) => setPicked(p => (p.includes(id) ? p.filter(x => x !== id) : p.length < count ? [...p, id] : p))
  return (
    <div className="screen starter-pick">
      <Mascot pose="pirate" size={110} />
      <h1>Choisis tes {count} thèmes</h1>
      <p className="sp-sub">Ils sont à toi, gratuitement. Les autres se débloquent plus tard avec les lingots volés au Kraken.</p>
      <div className="sp-dock">
        <button className="kh-play sp-go" disabled={picked.length !== count || busy} onClick={async () => {
          setBusy(true); setErr(null)
          try { await onDone(picked) } catch { setErr('Impossible d\'enregistrer ton choix : vérifie ta connexion.') }
          setBusy(false)
        }}>{picked.length === count ? (busy ? '…' : 'C\'est parti !') : `${picked.length} / ${count} choisis`}</button>
      </div>
      <div className="grid sp-grid">
        {list.map(t => (
          <button key={t.id} className={`topic-tile pickable ${picked.includes(t.id) ? 'picked' : ''}`} onClick={() => toggle(t.id)}>
            <TopicIcon topic={t} size={64} /><b>{t.name}</b>
          </button>
        ))}
      </div>
      {err && <p className="recover-err">{err}</p>}
    </div>
  )
}
