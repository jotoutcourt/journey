const P = { fill: 'none', stroke: 'currentColor', strokeWidth: 2.4, strokeLinecap: 'round', strokeLinejoin: 'round' }

export const Flame = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
    <path fill="currentColor" d="M12 2c.6 3.2 4.9 5.4 5.9 9.6A6.1 6.1 0 0 1 12 22a6 6 0 0 1-6-6.3c.1-2.6 1.6-4.2 2.6-5 .2 1.7 1 2.9 2 3.3-.6-3.9.4-8.3 1.4-12Z" />
    <path fill="#fff" opacity=".55" d="M12 13.5c.3 1.6 2.6 2.4 2.6 4.6A2.6 2.6 0 0 1 12 20.6a2.5 2.5 0 0 1-2.6-2.5c0-1.4 1-2.2 1.6-2.6.1.7.4 1.2.8 1.4-.2-1.2 0-2.3.2-3.4Z" />
  </svg>
)
export const Heart = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
    <path fill="currentColor" d="M12 21s-8.5-5.2-8.5-11.3A4.7 4.7 0 0 1 8.2 5c1.6 0 2.9.8 3.8 2 .9-1.2 2.2-2 3.8-2a4.7 4.7 0 0 1 4.7 4.7C20.5 15.8 12 21 12 21Z" />
    <ellipse cx="8" cy="9" rx="1.8" ry="1.2" fill="#fff" opacity=".5" transform="rotate(-30 8 9)" />
  </svg>
)
export const Bolt = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
    <path fill="currentColor" d="M13.5 2 4.5 13.5h6L9.5 22l9-11.5h-6L13.5 2Z" />
  </svg>
)
export const Star = ({ size = 18, filled = true }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
    <path fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={filled ? 0 : 2} strokeLinejoin="round" d="m12 2.8 2.8 5.8 6.3.9-4.6 4.4 1.1 6.3L12 17.2l-5.6 3 1.1-6.3-4.6-4.4 6.3-.9L12 2.8Z" />
  </svg>
)
export const Close = ({ size = 24 }) => <svg width={size} height={size} viewBox="0 0 24 24" {...P}><path d="M6 6l12 12M18 6 6 18" /></svg>
export const Check = ({ size = 24 }) => <svg width={size} height={size} viewBox="0 0 24 24" {...P} strokeWidth={3}><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>
export const Lock = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
    <rect x="5" y="10.5" width="14" height="10" rx="2.5" fill="currentColor" />
    <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" fill="none" stroke="currentColor" strokeWidth="2.6" />
  </svg>
)
export const Path = ({ size = 26 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...P}><path d="M4 11.5 12 4l8 7.5V20a1 1 0 0 1-1 1h-4.5v-6h-5v6H5a1 1 0 0 1-1-1v-8.5Z" /></svg>
)
export const Target = ({ size = 26 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...P}><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="4.5" /><circle cx="12" cy="12" r=".8" fill="currentColor" /></svg>
)
export const User = ({ size = 26 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...P}><circle cx="12" cy="8.5" r="4" /><path d="M4.5 20.5c1.2-3.8 4-5.5 7.5-5.5s6.3 1.7 7.5 5.5" /></svg>
)
export const ShareIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...P}><path d="M12 15V3.5M7.5 8 12 3.5 16.5 8" /><path d="M5 12.5V19a1.5 1.5 0 0 0 1.5 1.5h11A1.5 1.5 0 0 0 19 19v-6.5" /></svg>
)
export const Sparkle = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
    <path fill="currentColor" d="M12 2c.7 5 2.9 7.3 8 8-5.1.7-7.3 3-8 8-.7-5-2.9-7.3-8-8 5.1-.7 7.3-3 8-8Z" />
    <path fill="currentColor" d="M19 15c.3 2 1.1 2.8 3 3-1.9.3-2.7 1-3 3-.3-2-1.1-2.7-3-3 1.9-.2 2.7-1 3-3Z" opacity=".7" />
  </svg>
)
export const Gear = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...P} strokeWidth={2}><circle cx="12" cy="12" r="3.2" /><path d="M12 2.8v2.4M12 18.8v2.4M21.2 12h-2.4M5.2 12H2.8M18.5 5.5l-1.7 1.7M7.2 16.8l-1.7 1.7M18.5 18.5l-1.7-1.7M7.2 7.2 5.5 5.5" /></svg>
)
