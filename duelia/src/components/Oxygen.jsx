// Bouteilles d'oxygène 🫧 : une par partie du Butin, 1 regagnée toutes les 30 min, recharge contre des lingots.
import { useEffect, useState } from 'react'
import Mascot from './Mascot.jsx'

const mmss = (ms) => { const s = Math.max(0, Math.ceil(ms / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` }

// Temps restant avant la prochaine bouteille, recalculé chaque seconde (et rechargement du solde quand il arrive à 0)
function useNext(oxy, at, onDue) {
  const [now, setNow] = useState(at)
  useEffect(() => {
    if (!oxy?.next_ms) return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [oxy?.next_ms, at])
  const left = oxy?.next_ms ? oxy.next_ms - (now - at) : null
  useEffect(() => { if (left != null && left <= 0) onDue?.() }, [left != null && left <= 0]) // eslint-disable-line react-hooks/exhaustive-deps
  return left
}

function Bottles({ n, max }) {
  return <span className="oxy-bottles" aria-label={`${n} bouteilles sur ${max}`}>{Array.from({ length: max }, (_, i) => <i key={i} className={i < n ? 'full' : ''} />)}</span>
}

/* ---------- Carte de l'accueil ---------- */
export function OxygenCard({ wallet, at, onRefill, onDue }) {
  const oxy = wallet?.oxygen
  const left = useNext(oxy, at, onDue)
  const [busy, setBusy] = useState(false)
  if (!oxy) return null
  const full = oxy.bottles >= oxy.max
  const canPay = (wallet.lingots || 0) >= oxy.refill
  return (
    <section className="oxy-card">
      <div className="oxy-head">
        <b>Oxygène</b>
        <Bottles n={oxy.bottles} max={oxy.max} />
      </div>
      <small>{full ? 'Réserve pleine : une bouteille par plongée dans l\'antre du Kraken.' : `Prochaine bouteille dans ${mmss(left ?? 0)}`}</small>
      {!full && (
        <button className="btn btn-small btn-secondary" disabled={!canPay || busy} onClick={async () => { setBusy(true); await onRefill(); setBusy(false) }}>
          {canPay ? `🫧 Remplir · ${oxy.refill} lingots` : `Il faut ${oxy.refill} lingots pour remplir`}
        </button>
      )}
    </section>
  )
}

/* ---------- Version discrète sous le bouton Jouer (sans cadre) ---------- */
export function OxygenInline({ wallet, at, onRefill, onDue }) {
  const oxy = wallet?.oxygen
  const left = useNext(oxy, at, onDue)
  const [busy, setBusy] = useState(false)
  if (!oxy) return null
  const full = oxy.bottles >= oxy.max
  const canPay = (wallet.lingots || 0) >= oxy.refill
  return (
    <div className="oxy-inline">
      <Bottles n={oxy.bottles} max={oxy.max} />
      {!full && <small>+1 dans {mmss(left ?? 0)}{canPay && <> · <button className="link-btn" disabled={busy} onClick={async () => { setBusy(true); await onRefill(); setBusy(false) }}>remplir ({oxy.refill} lingots)</button></>}</small>}
    </div>
  )
}

/* ---------- Plus d'oxygène ---------- */
export function OxygenSheet({ wallet, at, onRefill, onDue, onClose, partner }) {
  const oxy = wallet?.oxygen
  const left = useNext(oxy, at, onDue)
  const [busy, setBusy] = useState(false)
  const canPay = (wallet?.lingots || 0) >= (oxy?.refill || 15)
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" role="dialog" aria-labelledby="oxy-title" onClick={e => e.stopPropagation()}>
        <Mascot pose="defaite" size={110} />
        <h2 id="oxy-title">{partner ? `${partner} n'a plus d'oxygène` : 'Plus d\'oxygène !'}</h2>
        {partner
          ? <p className="sheet-sub">Ton coéquipier doit attendre une bouteille ou recharger sa réserve.</p>
          : <>
            {oxy && <Bottles n={oxy.bottles} max={oxy.max} />}
            <p className="sheet-sub">{left != null ? <>Prochaine bouteille dans <b>{mmss(left)}</b>.</> : 'Il faut une bouteille par plongée.'}</p>
            <button className="btn btn-gold wide" disabled={!canPay || busy} onClick={async () => { setBusy(true); const ok = await onRefill(); setBusy(false); if (ok) onClose() }}>
              {canPay ? `🫧 Remplir la réserve · ${oxy?.refill || 15} lingots` : `Il te faut ${oxy?.refill || 15} lingots (tu en as ${wallet?.lingots || 0})`}
            </button>
          </>}
        <button className="btn btn-ghost wide" onClick={onClose}>Fermer</button>
      </div>
    </div>
  )
}
