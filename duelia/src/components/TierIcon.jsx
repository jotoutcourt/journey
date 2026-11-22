import { tierOf } from '../lib/rating.js'

// Pastille du rang (Bronze → Kraken) correspondant à une cote.
export default function TierIcon({ rating }) {
  const t = tierOf(rating)
  return <span className="tier-icon" title={t.name} aria-label={t.name}>{t.icon}</span>
}
