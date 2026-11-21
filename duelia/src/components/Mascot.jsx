// La pieuvre de Kraken (illustrations dans public/mascotte)
const SRC = {
  neutre: '/mascotte/neutre.webp',
  victoire: '/mascotte/victoire.webp',
  defaite: '/mascotte/defaite.webp',
  tete: '/mascotte/tete.webp',
  logo: '/mascotte/logo.webp',
  anim: '/mascotte/neutre-anim.webp',
  egalite: '/mascotte/egalite.webp',
  combat: '/mascotte/combat.webp',
  'combat-anim': '/mascotte/combat-anim.webp',
  'hors-ligne': '/mascotte/hors-ligne.webp',
  notification: '/mascotte/notification.webp',
}

export default function Mascot({ pose = 'neutre', size = 140, className = '', alt = '' }) {
  return <img src={SRC[pose] || SRC.neutre} alt={alt} width={size} height={size} draggable="false"
    className={`mascot mascot-${pose} ${className}`} style={{ width: size, height: size }} />
}
