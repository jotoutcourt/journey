import { useEffect, useState } from 'react'

// Bouton en deux temps : un premier appui arme, le second confirme (3 s pour se décider).
export default function ConfirmButton({ onConfirm, children, confirmLabel = 'Confirmer ?', className = '', ...rest }) {
  const [armed, setArmed] = useState(false)
  useEffect(() => {
    if (!armed) return
    const id = setTimeout(() => setArmed(false), 3000)
    return () => clearTimeout(id)
  }, [armed])
  return (
    <button {...rest} className={`${className} ${armed ? 'armed' : ''}`} onClick={() => (armed ? onConfirm() : setArmed(true))}>
      {armed ? confirmLabel : children}
    </button>
  )
}
