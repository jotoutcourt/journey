import { UNIVERSES } from '../data/cards.js'
import { SeriesCover } from './Collection.jsx'
import { Icon } from './Icons.jsx'

function left(ms) {
  const h = Math.max(1, Math.ceil(ms / 3600000))
  return h >= 24 ? `${Math.floor(h / 24)} j ${h % 24} h` : `${h} h`
}

// Encadré du booster vedette : en cours le week-end, annoncé en semaine.
export default function Featured({ featured, now, onOpen }) {
  if (!featured) return null
  const info = UNIVERSES[featured.u]
  return (
    <button
      className={`panel featured ${featured.active ? 'is-on' : ''}`}
      style={{ '--c1': info.c1, '--c2': info.c2 }}
      onClick={featured.active ? onOpen : undefined}
      disabled={!featured.active}
    >
      <SeriesCover u={featured.u} />
      <span className="featured-text">
        <span className="eyebrow">{featured.active ? `Vedette · encore ${left(featured.end - now)}` : `Vedette ce week-end · dans ${left(featured.start - now)}`}</span>
        <b>Booster {info.name}</b>
        <small>Plus de chances de Holo, Full Art et Gold</small>
      </span>
      {featured.active && <Icon name="chevron" />}
    </button>
  )
}
