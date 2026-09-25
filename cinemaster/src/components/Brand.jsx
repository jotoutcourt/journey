// Emblème CinéMaster : une bobine de projection vue de face.
export function Emblem({ className = '' }) {
  return (
    <svg className={`emblem ${className}`} viewBox="0 0 48 48" aria-hidden="true">
      <circle cx="24" cy="24" r="21" fill="none" stroke="currentColor" strokeWidth="3" />
      <circle cx="24" cy="24" r="4" fill="currentColor" />
      {[0, 60, 120, 180, 240, 300].map(a => (
        <circle
          key={a}
          cx={24 + Math.cos((a - 90) * Math.PI / 180) * 11.5}
          cy={24 + Math.sin((a - 90) * Math.PI / 180) * 11.5}
          r="4.6"
          fill="currentColor"
        />
      ))}
    </svg>
  )
}

export function Wordmark({ className = '' }) {
  return (
    <span className={`wordmark ${className}`}>
      <Emblem />
      <span className="wordmark-text">Ciné<b>Master</b></span>
    </span>
  )
}
