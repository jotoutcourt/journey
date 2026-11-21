// La pieuvre de Kraken (illustrations dans public/mascotte)
const SRC = {
  neutre: '/mascotte/neutre.webp',
  victoire: '/mascotte/victoire.webp',
  defaite: '/mascotte/defaite.webp',
  tete: '/mascotte/tete.webp',
  logo: '/mascotte/logo.webp',
}

export default function Mascot({ pose = 'neutre', size = 140, className = '', alt = '' }) {
  return <img src={SRC[pose] || SRC.neutre} alt={alt} width={size} height={size} draggable="false"
    className={`mascot mascot-${pose} ${className}`} style={{ width: size, height: size }} />
}
