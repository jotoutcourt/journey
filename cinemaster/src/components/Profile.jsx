import { useMemo, useState } from 'react'
import Card from './Card.jsx'
import { CARDS, CARDS_BY_ID, UNIVERSES } from '../data/cards.js'
import { RARITIES, RARITY_KEYS } from '../lib/rarity.js'
import { setFeedback, useFeedbackSettings } from '../lib/feedback.js'
import { completionOf, slotsFor } from '../lib/universes.js'
import { MAX_BOOSTERS } from '../lib/storage.js'
import { disablePush, enablePush, pushSupport, usePushEnabled } from '../lib/push.js'

function Toggle({ label, hint, checked, onChange }) {
  return (
    <label className="setting">
      <span>
        <b>{label}</b>
        {hint && <small>{hint}</small>}
      </span>
      <input type="checkbox" role="switch" checked={checked} onChange={e => onChange(e.target.checked)} />
    </label>
  )
}

// Profil : statistiques de jeu, réglages et remise à zéro.
// Réglage des notifications : demande la permission au premier appui.
function PushToggle({ fullAt }) {
  const on = usePushEnabled()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  if (pushSupport === 'unsupported') return null
  if (pushSupport === 'install') {
    return (
      <div className="setting">
        <span>
          <b>Notifications</b>
          <small>Sur iPhone, installe d’abord PopCard sur l’écran d’accueil (Partager → Sur l’écran d’accueil), puis active-les depuis l’appli.</small>
        </span>
      </div>
    )
  }
  const change = async v => {
    setBusy(true); setError('')
    try { await (v ? enablePush(fullAt) : disablePush()) } catch (e) {
      setError(e.message === 'refusé'
        ? 'Notifications refusées : autorise-les dans les réglages du téléphone pour PopCard.'
        : 'Impossible d’activer les notifications pour le moment.')
    }
    setBusy(false)
  }
  return (
    <>
      <label className="setting">
        <span>
          <b>Notifications</b>
          <small>Quand tes {MAX_BOOSTERS} boosters sont prêts</small>
        </span>
        <input type="checkbox" role="switch" checked={on} disabled={busy} onChange={e => change(e.target.checked)} />
      </label>
      {error && <p className="error">{error}</p>}
    </>
  )
}

export default function Profile({ state, onReset, confirmReset, setConfirmReset, account, fullAt }) {
  const fx = useFeedbackSettings()
  const stats = state.stats || {}
  const owned = CARDS.filter(c => state.owned[c.id]).length
  const best = stats.best && CARDS_BY_ID[stats.best.id]

  // ses univers les plus proches d'être complets (hors Gold : c'est ce qui
  // débloque un univers de plus)
  const nearly = useMemo(() => (state.universes || []).map(u => {
    const { have, total } = completionOf(u, state.owned)
    return { u, info: UNIVERSES[u], have, total, pct: have / total }
  }).filter(s => s.have > 0 && s.have < s.total).sort((a, b) => b.pct - a.pct).slice(0, 3), [state.owned, state.universes])

  const pulledMax = Math.max(1, ...RARITY_KEYS.map(k => stats.byRarity?.[k] || 0))

  return (
    <section className="screen profile">
      {account}

      <div className="stat-tiles">
        <div className="panel stat"><b>{state.opened}</b><span>boosters ouverts</span></div>
        <div className="panel stat"><b>{stats.pulled || 0}</b><span>cartes tirées</span></div>
        <div className="panel stat"><b>{owned}<small>/{CARDS.length}</small></b><span>cartes différentes</span></div>
        <div className="panel stat"><b>{state.dust}</b><span>pellicules</span></div>
      </div>

      {best && (
        <div className="panel best">
          <div className="best-card"><Card card={best} interactive={false} /></div>
          <div>
            <p className="eyebrow">Meilleure carte tirée</p>
            <h3>{best.first} {best.last}</h3>
            <span className="rarity-chip" style={{ '--rc': RARITIES[best.rarity].color }}>
              {RARITIES[best.rarity].symbol} {RARITIES[best.rarity].label}
            </span>
            <p className="best-series">{best.universe.name}</p>
          </div>
        </div>
      )}

      <div className="panel stat-block">
        <h3>Cartes tirées par rareté</h3>
        <ul className="rarity-bars">
          {RARITY_KEYS.map(k => {
            const n = stats.byRarity?.[k] || 0
            return (
              <li key={k}>
                <span className="rb-label" style={{ color: RARITIES[k].color }}>{RARITIES[k].symbol}</span>
                <span className="rb-name">{RARITIES[k].label}</span>
                <span className="rb-bar"><i style={{ width: `${(n / pulledMax) * 100}%`, background: RARITIES[k].color }} /></span>
                <b>{n}</b>
              </li>
            )
          })}
        </ul>
      </div>

      {nearly.length > 0 && (
        <div className="panel stat-block">
          <h3>Presque complètes</h3>
          <p className="muted small">Hors Gold · une collection complète débloque un univers ({(state.universes || []).length}/{slotsFor(state)} univers).</p>
          <ul className="nearly">
            {nearly.map(s => (
              <li key={s.u} style={{ '--c1': s.info.c1, '--c2': s.info.c2 }}>
                <span className="nearly-name">{s.info.name}</span>
                <span className="series-bar"><i style={{ width: `${Math.round(s.pct * 100)}%` }} /></span>
                <span className="nearly-count">{s.total - s.have === 1 ? 'Plus qu’une carte !' : `Encore ${s.total - s.have}`}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="panel stat-block settings">
        <h3>Réglages</h3>
        <Toggle label="Sons" hint="Déchirure, cartes, carillon des cartes rares" checked={fx.sound} onChange={v => setFeedback({ sound: v })} />
        <Toggle label="Vibrations" hint="Quand une carte rare apparaît" checked={fx.haptics} onChange={v => setFeedback({ haptics: v })} />
        <PushToggle fullAt={fullAt} />
      </div>

      <div className="panel reset-panel">
        {confirmReset
          ? (
            <>
              <p>Effacer toute ta collection, tes boosters et tes pellicules ?</p>
              <div className="reset-actions">
                <button className="pill-btn danger" onClick={onReset}>Oui, tout remettre à zéro</button>
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
}
