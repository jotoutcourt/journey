// Petit badge « IA » à côté du nom des adversaires simulés
export default function AiTag({ on = true }) {
  if (!on) return null
  return <span className="ai-tag" title="Adversaire simulé par l'appli (pas un vrai joueur)">IA</span>
}
