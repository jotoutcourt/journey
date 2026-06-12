import { useEffect } from 'react'

export default function LegalModal({ open, onClose }) {
  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="legal-backdrop" onClick={onClose}>
      <div className="legal-modal" onClick={e => e.stopPropagation()}>
        <button className="legal-close" onClick={onClose} aria-label="Fermer">✕</button>

        <h2 className="legal-title">Mentions légales</h2>

        <section className="legal-section">
          <h3>Éditeur du site</h3>
          <p>Ce site est édité à titre personnel par <strong>jotoutcourt</strong>.</p>
        </section>

        <section className="legal-section">
          <h3>Hébergeur</h3>
          <p>
            <strong>Vercel Inc.</strong><br />
            340 Pine Street, Suite 900<br />
            San Francisco, CA 94104, États-Unis<br />
            <a href="https://vercel.com" target="_blank" rel="noopener noreferrer">vercel.com</a>
          </p>
        </section>

        <section className="legal-section">
          <h3>Propriété intellectuelle</h3>
          <p>
            Pokémon Journey Tracker est un projet fan <strong>non officiel et non commercial</strong>.
            Pokémon, ainsi que tous les noms, personnages et éléments associés, sont des marques déposées
            de <strong>Nintendo / Game Freak / The Pokémon Company</strong>.
            Ce projet n'est ni affilié, ni approuvé, ni sponsorisé par ces sociétés.
          </p>
          <p>
            Les sprites et données utilisés proviennent de{' '}
            <a href="https://pokeapi.co" target="_blank" rel="noopener noreferrer">PokéAPI</a> (open source).
          </p>
        </section>

        <section className="legal-section">
          <h3>Données personnelles</h3>
          <p>
            Ce site ne collecte aucune donnée personnelle identifiable.
            Le compteur de visiteurs en ligne repose sur un identifiant de session anonyme
            stocké temporairement en mémoire vive (non persistant). Aucun cookie de traçage
            n'est utilisé.
          </p>
          <p>
            Votre progression (Pokémon capturés, badges, notes) est enregistrée
            uniquement dans le stockage local de votre navigateur (<em>localStorage</em>)
            et ne quitte jamais votre appareil.
          </p>
        </section>

        <section className="legal-section">
          <h3>Services tiers</h3>
          <p>
            Ce site utilise <strong>Google Fonts</strong> pour le chargement des polices.
            Cette utilisation entraîne la transmission de votre adresse IP à Google LLC lors
            du premier chargement de la page.
          </p>
        </section>
      </div>
    </div>
  )
}
