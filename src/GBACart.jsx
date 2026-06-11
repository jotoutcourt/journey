export function GBACart({ id, name, label, color, gradient, accent, available, inserting }) {
  // Sanitize name for use in SVG IDs (no spaces or special chars allowed)
  const uid  = name.replace(/\s+/g, '-').toLowerCase()
  const gTop = color
  const gBot = darken(color, 0.45)

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 350 580"
      style={{ overflow: 'visible' }}
      className={[
        'gba-cart-svg',
        available  ? 'gba-cart-available'  : 'gba-cart-locked',
        inserting  ? 'gba-cart-inserting'  : '',
      ].filter(Boolean).join(' ')}
      role="img"
      aria-label={`Cartouche Pokémon ${uid}`}
    >
      <defs>
        <filter id={`shadow-${uid}`} x="-15%" y="-5%" width="130%" height="145%">
          <feDropShadow dx="0" dy="12" stdDeviation="16" floodColor="#000" floodOpacity="0.15"/>
        </filter>

        <linearGradient id={`body-${uid}`} x1="0" y1="0" x2="0.8" y2="1">
          <stop offset="0%"   stopColor="#404040"/>
          <stop offset="60%"  stopColor="#2a2a2a"/>
          <stop offset="100%" stopColor="#1c1c1c"/>
        </linearGradient>

        <linearGradient id={`lbl-${uid}`} x1="0.1" y1="0" x2="0.9" y2="1">
          <stop offset="0%"   stopColor={gTop}/>
          <stop offset="100%" stopColor={gBot}/>
        </linearGradient>

        <linearGradient id={`sheen-${uid}`} x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0%"   stopColor="#fff" stopOpacity="0.14"/>
          <stop offset="50%"  stopColor="#fff" stopOpacity="0.04"/>
          <stop offset="100%" stopColor="#fff" stopOpacity="0"/>
        </linearGradient>

        <linearGradient id={`pins-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#d4a840"/>
          <stop offset="50%"  stopColor="#f0cc58"/>
          <stop offset="100%" stopColor="#9a7428"/>
        </linearGradient>

        <linearGradient id={`top-hl-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#fff" stopOpacity="0.09"/>
          <stop offset="100%" stopColor="#fff" stopOpacity="0"/>
        </linearGradient>

        <clipPath id={`clip-${uid}`}>
          <path d="M22,0 Q0,0 0,22 L0,490 L108,490 L108,510 Q108,522 120,522 L136,522 L136,490 L214,490 L214,522 L230,522 Q242,522 242,510 L242,490 L350,490 L350,22 Q350,0 328,0 Z"/>
        </clipPath>
        <clipPath id={`label-clip-${uid}`}>
          <rect x="27" y="52" width="296" height="355" rx="9"/>
        </clipPath>
      </defs>

      <g filter={`url(#shadow-${uid})`}>
      {/* ── Body ── */}
      <g id="body">
        <path
          d="M22,0 Q0,0 0,22 L0,490 L108,490 L108,510 Q108,522 120,522 L136,522 L136,490 L214,490 L214,522 L230,522 Q242,522 242,510 L242,490 L350,490 L350,22 Q350,0 328,0 Z"
          fill={`url(#body-${uid})`}
        />
        {/* Top highlight */}
        <rect x="0" y="0" width="350" height="40" fill={`url(#top-hl-${uid})`} clipPath={`url(#clip-${uid})`}/>
        {/* Left edge shadow */}
        <rect x="0" y="0" width="8" height="490" fill="rgba(0,0,0,0.22)" clipPath={`url(#clip-${uid})`}/>
        {/* Bottom edge shadow */}
        <rect x="0" y="455" width="350" height="55" fill="rgba(0,0,0,0.20)" clipPath={`url(#clip-${uid})`}/>
      </g>

      {/* ── Label ── */}
      <g id="label">
        {/* Inset shadow */}
        <rect x="25" y="54" width="300" height="358" rx="10" fill="#000" opacity="0.35"/>
        {/* Label face — gradient fallback */}
        <rect x="27" y="52" width="296" height="355" rx="9" fill={`url(#lbl-${uid})`}/>
        {/* PNG artwork — covers the gradient when loaded */}
        {id && (
          <image
            href={`/labels/${id}.png`}
            x="27" y="52"
            width="296" height="355"
            preserveAspectRatio="xMidYMid slice"
            clipPath={`url(#label-clip-${uid})`}
          />
        )}
        {/* Sheen — always on top for glass effect */}
        <rect x="27" y="52" width="296" height="355" rx="9" fill={`url(#sheen-${uid})`}/>
        {/* Border */}
        <rect x="27" y="52" width="296" height="355" rx="9" fill="none" stroke="rgba(255,255,255,0.09)" strokeWidth="1"/>
      </g>

      {/* ── Lock overlay ── */}
      {!available && (
        <text x="175" y="242" fontSize="36" textAnchor="middle" opacity="0.35">🔒</text>
      )}

      {/* ── Front-face details ── */}
      <g id="highlights">
        {/* Release hole */}
        <circle cx="175" cy="432" r="5.5" fill="#1a1a1a" stroke="#383838" strokeWidth="1"/>
        <circle cx="175" cy="432" r="3"   fill="#111"/>
        {/* Top-left highlight streak */}
        <path d="M22,2 Q2,2 2,22 L2,55"
              fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="2" strokeLinecap="round"/>
      </g>

      {/* ── Connector ── */}
      <g id="connector">
        <rect x="8"   y="490" width="334" height="22" rx="2" fill="#181818"/>
        {/* Pins */}
        {[22,40,58,76,94,112, 143,161,179,197,215,233,251,269,287,305].map((x, i) => (
          <rect key={i} x={x} y="493" width="12" height="16" rx="1" fill={`url(#pins-${uid})`}/>
        ))}
        {/* Anti-insertion tab */}
        <rect x="109" y="485" width="25" height="8" rx="2" fill="#1e1e1e"/>
        {/* Notch cutout backdrop */}
        <rect x="108" y="490" width="134" height="32" fill="#0e0e0e"/>
        <rect x="136" y="490" width="78"  height="32" fill="#080808"/>
      </g>
      </g>{/* end shadow group */}
    </svg>
  )
}

function darken(hex, amount) {
  const n = parseInt(hex.replace('#',''), 16)
  const r = Math.max(0, (n >> 16) - Math.round(255 * amount))
  const g = Math.max(0, ((n >> 8) & 0xff) - Math.round(255 * amount))
  const b = Math.max(0, (n & 0xff) - Math.round(255 * amount))
  return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`
}
