// La pieuvre de Kraken (illustrations dans public/mascotte)

export default function Mascot({ pose = 'neutre', size = 140, className = '', alt = '' }) {
  return <img src={`/mascotte/${pose}.webp`} alt={alt} width={size} height={size} draggable="false"
    className={`mascot mascot-${pose} ${className}`} style={{ width: size, height: size }} />
}
