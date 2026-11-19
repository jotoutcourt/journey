import { seeded, pick } from '../lib/rng.js'

// Petites créatures générées à partir d'une graine : chaque joueur a la sienne.
const SKINS = [
  ['#ffb648', '#e08a1e'], ['#2ee6c5', '#14a78d'], ['#ff6f91', '#d6456a'], ['#8f7bff', '#5f49e0'],
  ['#5fd35f', '#33a33a'], ['#4cc3ff', '#1f8fd1'], ['#ffd84d', '#d9a91a'], ['#ff8a5c', '#d65a2c'],
  ['#c77dff', '#9446d1'], ['#a3e635', '#6ea51f'],
]
const BG = ['#26284a', '#2c2245', '#1f3340', '#3a2633', '#22303a', '#30283f']

const BODIES = {
  round: <circle cx="50" cy="56" r="30" />,
  squircle: <rect x="20" y="26" width="60" height="60" rx="22" />,
  ghost: <path d="M20 86V54a30 30 0 0 1 60 0v32l-10-7-10 7-10-7-10 7-10-7z" />,
  pear: <path d="M50 22c12 0 18 10 18 20 10 6 14 16 14 26 0 14-14 20-32 20S18 82 18 68c0-10 4-20 14-26 0-10 6-20 18-20z" />,
  bean: <path d="M30 30c10-10 34-10 42 4 6 10 2 18 6 28 4 12-6 26-28 26S18 76 20 62c2-10 0-22 10-32z" />,
}

function Eyes({ kind }) {
  switch (kind) {
    case 'cyclops':
      return <g><circle cx="50" cy="52" r="12" fill="#fff" /><circle cx="52" cy="54" r="6" fill="#16172e" /><circle cx="54" cy="51" r="2" fill="#fff" /></g>
    case 'sleepy':
      return <g stroke="#16172e" strokeWidth="4" strokeLinecap="round" fill="none"><path d="M33 52q6 5 12 0" /><path d="M55 52q6 5 12 0" /></g>
    case 'big':
      return <g><circle cx="39" cy="50" r="9" fill="#fff" /><circle cx="61" cy="50" r="9" fill="#fff" /><circle cx="40" cy="52" r="4.5" fill="#16172e" /><circle cx="62" cy="52" r="4.5" fill="#16172e" /></g>
    case 'shades':
      return <g><rect x="28" y="44" width="44" height="12" rx="6" fill="#16172e" /><rect x="33" y="46" width="10" height="3" rx="1.5" fill="#ffffff55" /></g>
    default:
      return <g fill="#16172e"><circle cx="40" cy="52" r="4.5" /><circle cx="60" cy="52" r="4.5" /></g>
  }
}

function Mouth({ kind }) {
  switch (kind) {
    case 'o': return <ellipse cx="50" cy="70" rx="5" ry="6" fill="#16172e" />
    case 'teeth': return <g><path d="M38 66h24q-2 12-12 12t-12-12z" fill="#16172e" /><rect x="45" y="66" width="10" height="5" fill="#fff" /></g>
    case 'flat': return <path d="M42 70h16" stroke="#16172e" strokeWidth="4" strokeLinecap="round" />
    case 'tongue': return <g><path d="M40 66q10 10 20 0" stroke="#16172e" strokeWidth="4" fill="none" strokeLinecap="round" /><path d="M48 70q2 7 6 0" fill="#ff5d73" /></g>
    default: return <path d="M40 67q10 9 20 0" stroke="#16172e" strokeWidth="4" fill="none" strokeLinecap="round" />
  }
}

function Extra({ kind, color }) {
  switch (kind) {
    case 'antennae':
      return <g stroke={color} strokeWidth="4" strokeLinecap="round" fill={color}><path d="M40 30L32 14" /><path d="M60 30l8-16" /><circle cx="32" cy="14" r="4" /><circle cx="68" cy="14" r="4" /></g>
    case 'horns':
      return <g fill="#f5efe0"><path d="M30 34l-6-18 16 12z" /><path d="M70 34l6-18-16 12z" /></g>
    case 'ears':
      return <g fill={color}><circle cx="26" cy="30" r="10" /><circle cx="74" cy="30" r="10" /></g>
    case 'sprout':
      return <g><path d="M50 28V16" stroke="#3ddc84" strokeWidth="4" strokeLinecap="round" /><path d="M50 18q-10-8-16 0 8 6 16 0zM50 16q8-10 16-2-8 6-16 2z" fill="#3ddc84" /></g>
    default: return null
  }
}

function avatarParts(seed) {
  const r = seeded('av:' + seed)
  return {
    skin: pick(SKINS, r), bg: pick(BG, r),
    body: pick(Object.keys(BODIES), r),
    eyes: pick(['dots', 'big', 'cyclops', 'sleepy', 'shades', 'dots', 'big'], r),
    mouth: pick(['smile', 'o', 'teeth', 'flat', 'tongue', 'smile'], r),
    extra: pick(['none', 'antennae', 'horns', 'ears', 'sprout', 'none'], r),
    cheeks: r() > 0.5,
  }
}

export default function Avatar({ seed = 'x', size = 56, ring, className = '' }) {
  const p = avatarParts(seed)
  return (
    <span className={`avatar ${className}`} style={{ width: size, height: size, '--ring': ring || 'transparent' }}>
      <svg viewBox="0 0 100 100" width="100%" height="100%" aria-hidden="true">
        <circle cx="50" cy="50" r="50" fill={p.bg} />
        <Extra kind={p.extra} color={p.skin[1]} />
        <g fill={p.skin[0]}>{BODIES[p.body]}</g>
        <path d="M30 80q20 10 40 0" stroke={p.skin[1]} strokeWidth="5" fill="none" opacity="0.5" strokeLinecap="round" />
        {p.cheeks && <g fill="#ff8fa3" opacity="0.6"><circle cx="31" cy="64" r="4" /><circle cx="69" cy="64" r="4" /></g>}
        <Eyes kind={p.eyes} />
        <Mouth kind={p.mouth} />
      </svg>
    </span>
  )
}
