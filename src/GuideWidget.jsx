import { useState } from 'react'

function Section({ title, icon, children }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="gw-section">
      <button className="gw-section-btn" onClick={() => setOpen(o => !o)}>
        <span className="gw-section-label">{icon} {title}</span>
        <span className="gw-chevron">{open ? '▲' : '▼'}</span>
      </button>
      {open && <div className="gw-section-body">{children}</div>}
    </div>
  )
}

function GwTable({ headers, rows }) {
  return (
    <div className="gw-table-wrap">
      <table className="gw-table">
        <thead><tr>{headers.map((h, i) => <th key={i}>{h}</th>)}</tr></thead>
        <tbody>{rows.map((row, i) => (
          <tr key={i}>{row.map((cell, j) => <td key={j}>{cell}</td>)}</tr>
        ))}</tbody>
      </table>
    </div>
  )
}

function GwNote({ children }) {
  return <p className="gw-note">ℹ️ {children}</p>
}

// ── Données ────────────────────────────────────────────────

const BERRYPOWDER_ITEMS = [
  ['50',    'Poudrénergie'],
  ['50',    'Poudre Soin'],
  ['80',    'Racinénergie'],
  ['300',   'Herbe Rappel'],
  ['1 000', 'Protéine'],
  ['1 000', 'Fer'],
  ['1 000', 'Carbone'],
  ['1 000', 'Calcium'],
  ['1 000', 'Zinc'],
  ['1 000', 'PV Plus'],
  ['3 000', 'PP Plus'],
]

const HAPPINESS_ACTIONS = [
  ["Marcher 255 pas (50% de chance) — toute l'équipe", '+1', '—', '—'],
  ['Faire bichonner par Nina', '+3', '+2', '+1'],
  ['Utiliser une vitamine', '+5', '+3', '+2'],
  ['Utiliser un Super Bonbon (hors montée de niveau)', '+5', '+3', '+2'],
  ["Monter d'un niveau", '+5', '+3', '+2'],
  ["Combattre un Champion, Conseil 4 ou Maître — toute l'équipe", '+3', '+2', '+1'],
  ['Apprendre une CT ou CS', '+1', '+1', '0'],
  ['Utiliser un objet de boost en combat', '+1', '+1', '0'],
  ['Tomber KO contre ennemi < 30 niveaux de plus', '−1', '−1', '—'],
  ['Tomber KO contre ennemi ≥ 30 niveaux de plus / hors combat', '−5', '−5', '−10'],
  ['Utiliser Poudrénergie ou Poudre Soin', '−5', '−5', '−10'],
  ['Utiliser une Racinénergie', '−10', '−10', '−15'],
  ['Utiliser une Herbe Rappel', '—', '—', '—'],
]

const HAPPINESS_BONUSES = [
  ["Capturé / obtenu dans son lieu de naissance", "+1 à chaque gain"],
  ["Capturé dans une Luxe Ball", "+1 à chaque gain"],
  ["Tenir le Grelot Zen", "+50 % au gain de base (arrondi à l'entier inférieur)"],
]

const HAPPINESS_PHRASES = [
  ['255',     "Il ne pourrait pas t'aimer plus que maintenant. Ton Pokémon est vraiment heureux avec toi."],
  ['200–254', "Il a l'air heureux. Si seulement Rival pouvait voir tout ça et en tirer des leçons."],
  ['150–199', "Il t'aime bien. Continue comme ça."],
  ['100–149', "Il commence à s'attacher à toi. La confiance va s'instaurer entre vous deux."],
  ['50–99',   "Il n'est pas encore habitué à toi. Les Pokémon sont toujours un peu craintifs au début."],
  ['1–49',    "Joueur, je n'aime pas beaucoup la façon dont il te regarde. Tu devrais être un peu plus sympa avec."],
  ['0',       "…Ça me fait mal au cœur de dire ça, mais… Y'a-t-il une raison pour laquelle il te déteste tant ?"],
]

const HAPPINESS_POKEMON = [
  { name: 'Pichu',     evo: 'Pikachu',          note: "Monter d'un niveau avec bonheur ≥ 220" },
  { name: 'Mélo',      evo: 'Rondoudou',         note: "Monter d'un niveau avec bonheur ≥ 220" },
  { name: 'Mélofée',   evo: 'Mélodelfe',         note: "Monter d'un niveau avec bonheur ≥ 220" },
  { name: 'Togepi',    evo: 'Togetic',           note: "Monter d'un niveau avec bonheur ≥ 220" },
  { name: 'Nosferalto',evo: 'Crobat',            note: "Monter d'un niveau avec bonheur ≥ 220" },
  { name: 'Évoli',     evo: 'Mentali / Noctali', note: '⚠️ Non disponible dans RF/VF — pas de cycle jour/nuit' },
]

const SHINY_RESETS = [
  { name: 'Bulbizarre',  loc: 'Labo Pr. Chen — Bourg Palette',              note: 'SR avant de choisir' },
  { name: 'Salamèche',   loc: 'Labo Pr. Chen — Bourg Palette',              note: 'SR avant de choisir' },
  { name: 'Carapuce',    loc: 'Labo Pr. Chen — Bourg Palette',              note: 'SR avant de choisir' },
  { name: 'Évoli',       loc: 'Céladopole — bâtiment derrière Centre Pokémon', note: '' },
  { name: 'Lokhlass',    loc: 'Sylphe SARL — 7e étage',                    note: '' },
  { name: 'Ronflex',     loc: 'Route 12 & Route 16',                        note: '2 Ronflex distincts, SR avec Pokéflûte' },
  { name: 'Amonita',     loc: "Labo Cramois'Île (Fossile Dôme)",            note: '' },
  { name: 'Kabuto',      loc: "Labo Cramois'Île (Fossile Carapace)",        note: '' },
  { name: 'Ptéra',       loc: "Labo Cramois'Île (Vieil Ambre)",             note: '' },
  { name: 'Articodin',   loc: 'Îles Écume — B4',                           note: 'Niv. 50' },
  { name: 'Électhor',    loc: 'Centrale',                                   note: 'Niv. 50' },
  { name: 'Sulfura',     loc: 'Mont Braise — Île 1',                        note: 'Niv. 50' },
  { name: 'Méwtwo',      loc: 'Caverne Azurée',                             note: 'Niv. 70 — sauvegarder avant' },
  { name: 'Raikou',      loc: 'Kanto (errant)',                             note: 'Si starter = Carapuce — SR difficile' },
  { name: 'Entei',       loc: 'Kanto (errant)',                             note: 'Si starter = Bulbizarre — SR difficile' },
  { name: 'Suicune',     loc: 'Kanto (errant)',                             note: 'Si starter = Salamèche — SR difficile' },
  { name: 'Lugia',       loc: 'Île 3 (Ticket Vague requis)',                note: 'Niv. 60' },
  { name: 'Ho-Oh',       loc: 'Île 2 (Ticket Arc-en-Ciel requis)',          note: 'Niv. 70' },
  { name: 'Deoxys',      loc: 'Île 1 (Ticket Aurora requis)',               note: 'Niv. 30' },
]

const STICKERS = [
  ["Œufs (1)",        "Faire éclore 1 œuf"],
  ["Œufs (2)",        "Faire éclore 100 œufs"],
  ["Œufs (3)",        "Faire éclore 200 œufs"],
  ["Œufs (4)",        "Faire éclore 300 œufs"],
  ["Panthéon (1)",    "Vaincre la Ligue 1 fois"],
  ["Panthéon (2)",    "Vaincre la Ligue 40 fois"],
  ["Panthéon (3)",    "Vaincre la Ligue 100 fois"],
  ["Panthéon (4)",    "Vaincre la Ligue 200 fois"],
  ["Combat Link (1)", "Gagner 1 combat en Link"],
  ["Combat Link (2)", "Gagner 20 combats en Link"],
  ["Combat Link (3)", "Gagner 50 combats en Link"],
  ["Combat Link (4)", "Gagner 100 combats en Link"],
]

const CARD_LEVELS = [
  ['1', 'Carte Normale', 'Aucune', '—'],
  ['2', 'Carte Bronze',  "Vaincre le Maître — entrer au Panthéon", '⭐'],
  ['3', 'Carte Cuivre',  "Compléter le Pokédex de Kanto", '⭐⭐'],
  ['4', 'Carte Argent',  "Compléter le Pokédex National", '⭐⭐⭐'],
  ['5', 'Carte Or',      "200 sauts + 200 baies aux jeux en ligne de l'Île 2", '⭐⭐⭐⭐'],
]

// ── Composant principal ────────────────────────────────────

export default function GuideWidget() {
  return (
    <div className="gw-root">

      <Section title="Herboriste d'Azuria" icon="🌿">
        <p className="gw-p">
          L'Herboriste se trouve dans une maison d'Azuria. Répondez <strong>« Oui »</strong> à sa question pour recevoir le <strong>Pot Poudre</strong>, qui permet de recueillir la poudre de Baies obtenue via le Broyeur de Baies dans les Centres Pokémon (mode multijoueur).
        </p>
        <p className="gw-p">Au fond de sa maison, une pancarte affiche les records de vitesse de mixage.</p>
        <p className="gw-subtitle">Échanges poudre → objet</p>
        <GwTable headers={['Quantité de poudre', 'Objet façonné']} rows={BERRYPOWDER_ITEMS} />
      </Section>

      <Section title="Diplômes Pokédex" icon="🎓">
        <div className="gw-card">
          <p className="gw-card-title">🗺️ Diplôme Pokédex Kanto</p>
          <p className="gw-p">Obtenez les 150 Pokémon du Pokédex Régional (Mew non requis). Rendez-vous au <strong>3ème étage du Manoir Céladon</strong> à Céladopole et parlez au développeur.</p>
        </div>
        <div className="gw-card">
          <p className="gw-card-title">🌍 Diplôme Pokédex National</p>
          <p className="gw-p">Obtenez les Pokémon du Pokédex National (Mew, Ho-Oh, Lugia, Celebi, Jirachi et Deoxys non requis). Retournez au même endroit.</p>
        </div>
      </Section>

      <Section title="Cherche VS" icon="⚔️">
        <p className="gw-p">
          Le <strong>Cherche VS</strong> permet de retrouver des dresseurs déjà battus qui souhaitent une revanche. Il est remis par une <strong>Topdresseuse dans le Centre Pokémon de Carmin-sur-Mer</strong>.
        </p>
        <ul className="gw-list">
          <li>Non utilisable dans les grottes et forêts</li>
          <li>La batterie se recharge en marchant (<strong>100 pas</strong> entre chaque utilisation)</li>
          <li><strong>✕</strong> au-dessus du dresseur → pas encore prêt</li>
          <li><strong>!!</strong> au-dessus du dresseur → revanche disponible</li>
        </ul>
      </Section>

      <Section title="MemoryDex" icon="📱">
        <p className="gw-p">
          Le <strong>MemoryDex</strong> stocke des informations sur les personnages importants (Champions d'arène, Conseil 4…). Il est remis par votre <strong>Rival à Azuria</strong> après l'avoir battu.
        </p>
        <p className="gw-p">
          À chaque fois que vous apprenez des infos via un PNJ, le Journal Pokémon, des panneaux ou des photos, le MemoryDex les enregistre avec leur source et leur emplacement.
        </p>
        <p className="gw-subtitle">Catégories d'informations par personnage</p>
        <ul className="gw-list">
          <li>Que fait cette personne ?</li>
          <li>Pokémon favori ?</li>
          <li>Comment est cette personne ?</li>
          <li>Il y a une rumeur…</li>
          <li>Famille et amis ?</li>
        </ul>
        <p className="gw-p">Chaque personnage a <strong>6 informations</strong> à réunir. La 7ème (message du personnage) se déverrouille uniquement quand les 6 sont réunies.</p>
        <GwNote>Cet objet n'influe pas sur le déroulement de l'histoire principale.</GwNote>
      </Section>

      <Section title="Carte Dresseur & Imprimante" icon="🖨️">
        <p className="gw-p">
          L'<strong>Imprimante Pokémon</strong> se trouve au Casino Rocket de Céladopole (à droite de l'entrée). Elle permet de personnaliser le verso de votre Carte Dresseur avec vos Pokémon actuels.
        </p>
        <ul className="gw-list">
          <li>Coût : <strong>50 Pokédollars</strong> par utilisation</li>
          <li>4 fonds : Icônes normales / Ombres noires / Icônes roses / Icônes sépia</li>
          <li>La carte ne se met à jour qu'en repassant à l'imprimante</li>
        </ul>

        <p className="gw-subtitle">Autocollants (Île 4)</p>
        <p className="gw-p">Un PNJ dans la maison à droite de la Boutique Pokémon de l'Île 4 offre des autocollants pour vos exploits — ils s'ajoutent sur la bande supérieure du verso de votre carte.</p>
        <GwTable headers={['Autocollant', 'Condition']} rows={STICKERS} />

        <p className="gw-subtitle">Niveaux de la Carte Dresseur</p>
        <p className="gw-p">La carte change de couleur selon les exploits accomplis (dans n'importe quel ordre). L'objectif final est la <strong>Carte Or</strong>.</p>
        <GwTable headers={['Niveau', 'Couleur', 'Condition', 'Étoiles']} rows={CARD_LEVELS} />
        <ul className="gw-list" style={{ marginTop: '0.5rem' }}>
          <li>Mew n'est pas requis pour le Pokédex Kanto</li>
          <li>Mew, Ho-Oh, Lugia, Celebi, Jirachi et Deoxys ne sont pas requis pour le National</li>
        </ul>
      </Section>

      <Section title="Chasse aux Chromatiques" icon="✨">
        <div className="gw-card">
          <p className="gw-card-title">🎲 Rencontres aléatoires</p>
          <p className="gw-p">Tout Pokémon sauvage peut être chromatique. Probabilité : <strong>1/8 192</strong> en Gen 3. Aucune méthode ne permet d'augmenter ce taux dans FireRed/Vert Feuille.</p>
        </div>
        <div className="gw-card">
          <p className="gw-card-title">🔄 Soft Reset (SR)</p>
          <p className="gw-p">Pour les Pokémon statiques, sauvegardez juste avant la rencontre, puis appuyez sur <strong>L + R + Start + Select</strong> (ou éteignez/rallumez) pour relancer. Répétez jusqu'au chromatique.</p>
        </div>
        <div className="gw-card">
          <p className="gw-card-title">🥚 Élevage</p>
          <p className="gw-p">La probabilité reste <strong>1/8 192</strong> en Gen 3. La <strong>Méthode Matsuda</strong> (parents de deux langues différentes) n'a été introduite qu'en Gen 4 — elle n'est pas disponible dans FireRed.</p>
        </div>

        <p className="gw-subtitle">Pokémon SR-ables (aucun shiny lock en Gen 3)</p>
        <div className="gw-table-wrap">
          <table className="gw-table">
            <thead><tr><th>Pokémon</th><th>Localisation</th><th>Note</th></tr></thead>
            <tbody>
              {SHINY_RESETS.map((p, i) => (
                <tr key={i}>
                  <td><strong>{p.name}</strong></td>
                  <td>{p.loc}</td>
                  <td className="gw-muted">{p.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <GwNote>Tous les Pokémon sauvages (herbes, grottes, surf, pêche) peuvent aussi être chromatiques via rencontre normale.</GwNote>
      </Section>

      <Section title="Le Bonheur" icon="💛">
        <p className="gw-p">Le bonheur est une valeur cachée entre 0 et 255. Certains Pokémon évoluent quand ils montent de niveau avec un bonheur ≥ 220.</p>

        <p className="gw-subtitle">Actions et effets sur le bonheur</p>
        <GwTable headers={['Action', '0–99', '100–199', '200–255']} rows={HAPPINESS_ACTIONS} />

        <p className="gw-subtitle">Bonus supplémentaires</p>
        <GwTable headers={['Condition', 'Bonus']} rows={HAPPINESS_BONUSES} />

        <p className="gw-subtitle">Évaluation par Nina</p>
        <p className="gw-p">Parlez à Nina dans la maison de votre Rival à <strong>Bourg Palette</strong> (après l'avoir bichonné) pour connaître le bonheur approximatif de votre Pokémon de tête.</p>
        <GwTable headers={['Bonheur', 'Phrase de Nina']} rows={HAPPINESS_PHRASES} />

        <p className="gw-subtitle">Pokémon évoluant par bonheur</p>
        <div className="gw-table-wrap">
          <table className="gw-table">
            <thead><tr><th>Pokémon</th><th>Évolution</th><th>Condition</th></tr></thead>
            <tbody>
              {HAPPINESS_POKEMON.map((p, i) => (
                <tr key={i}>
                  <td><strong>{p.name}</strong></td>
                  <td>{p.evo}</td>
                  <td className="gw-muted">{p.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

    </div>
  )
}
