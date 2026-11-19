import { dayKey } from '../lib/store.js'
import { Heart } from './Icons.jsx'

export default function Practice({ s, now, onChallenge, onReview, onPractice }) {
  const today = dayKey(new Date(now))
  const challengeDone = s.challenge === today
  const doneLessons = Object.keys(s.lessons).length
  const n = s.mistakes.length
  return (
    <div className="page">
      <h1 className="page-title">Réviser</h1>

      <button className={`big-card challenge ${challengeDone ? 'done' : ''}`} onClick={onChallenge}>
        <div className="bc-emoji">🎯</div>
        <div className="bc-body">
          <div className="bc-title">Le défi du jour</div>
          <div className="bc-sub">{challengeDone ? 'Réussi aujourd\'hui ! Tu peux le rejouer pour le plaisir.' : '8 questions piochées dans tous les thèmes. Bonus de 10 XP.'}</div>
        </div>
        <div className="bc-badge">{challengeDone ? '✓' : '+10'}</div>
      </button>

      <button className="big-card mistakes" disabled={!n} onClick={onReview}>
        <div className="bc-emoji">🧠</div>
        <div className="bc-body">
          <div className="bc-title">Mes erreurs</div>
          <div className="bc-sub">
            {n ? <>{n} question{n > 1 ? 's' : ''} à retravailler. Chaque bonne réponse rend une vie <Heart size={14} />.</> : 'Aucune erreur en attente. Bien joué !'}
          </div>
        </div>
        {n > 0 && <div className="bc-badge">{n}</div>}
      </button>

      <button className="big-card practice" onClick={onPractice}>
        <div className="bc-emoji">🔁</div>
        <div className="bc-body">
          <div className="bc-title">Entraînement libre</div>
          <div className="bc-sub">{doneLessons ? `Des questions au hasard parmi tes ${doneLessons} leçon${doneLessons > 1 ? 's' : ''} terminée${doneLessons > 1 ? 's' : ''}.` : 'Des questions au hasard pour découvrir les thèmes.'}</div>
        </div>
      </button>

      <p className="hint-text">Astuce : réviser avant un dîner, c'est l'assurance d'avoir toujours une anecdote sous le coude.</p>
    </div>
  )
}
