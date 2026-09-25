import Card from './Card.jsx'
import { CARDS, UNIVERSES } from '../data/cards.js'
import { useCardImage, useImageCount } from '../lib/images.js'

function Item({ card, onSelect }) {
  const custom = useCardImage(card.id)
  return (
    <div className="grid-item">
      <Card card={card} onClick={() => onSelect(card)} />
      <span className={`img-badge ${custom ? 'has' : ''}`}>{custom ? 'Ton image' : 'Sans image'}</span>
    </div>
  )
}

// Toutes les cartes de la série, possédées ou non, pour y mettre ses propres images.
export default function Atelier({ onSelect }) {
  const count = useImageCount()
  return (
    <section className="atelier">
      <p className="guide-intro">
        Touche une carte pour lui donner ta propre image : photo du personnage, du lieu ou de l’objet.
        Le cadrage se fait automatiquement (l’image remplit l’illustration, centrée sur le haut pour garder les visages).
        Les images restent enregistrées sur cet appareil.
        <br /><strong>{count}/{CARDS.length}</strong> cartes illustrées.
      </p>
      {Object.entries(UNIVERSES).map(([key, u]) => (
        <div key={key} className="atelier-group">
          <h3>{u.name}</h3>
          <div className="card-grid">
            {CARDS.filter(c => c.u === key).map(c => <Item key={c.id} card={c} onSelect={onSelect} />)}
          </div>
        </div>
      ))}
    </section>
  )
}
