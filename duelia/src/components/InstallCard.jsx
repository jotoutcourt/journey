import { useEffect, useState } from 'react'

// Proposition d'installer Duelia sur l'écran d'accueil (invisible si l'appli est déjà installée)
let deferred = null
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferred = e })
}

const standalone = () => window.matchMedia?.('(display-mode: standalone)').matches || navigator.standalone === true
const isIos = () => /iphone|ipad|ipod/i.test(navigator.userAgent)

export default function InstallCard() {
  const [installed, setInstalled] = useState(standalone)
  const [canPrompt, setCanPrompt] = useState(() => !!deferred)
  useEffect(() => {
    const onPrompt = () => setCanPrompt(true)
    const onInstalled = () => setInstalled(true)
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => { window.removeEventListener('beforeinstallprompt', onPrompt); window.removeEventListener('appinstalled', onInstalled) }
  }, [])
  if (installed) return null
  async function install() {
    if (!deferred) return
    deferred.prompt()
    const { outcome } = await deferred.userChoice
    deferred = null
    setCanPrompt(false)
    if (outcome === 'accepted') setInstalled(true)
  }
  return (
    <section className="install-card">
      <h3>📲 Installer Duelia</h3>
      {canPrompt ? (
        <>
          <p>Ajoute Duelia à ton écran d'accueil : il s'ouvre en plein écran, comme une vraie appli, et marche même sans réseau contre l'IA.</p>
          <button className="btn btn-primary wide" onClick={install}>Installer</button>
        </>
      ) : isIos() ? (
        <ol className="sheet-steps">
          <li>Ouvre Duelia dans <b>Safari</b> (duelia.vercel.app).</li>
          <li>Appuie sur le bouton <b>Partager</b> (le carré avec une flèche vers le haut).</li>
          <li>Choisis <b>Sur l'écran d'accueil</b>, puis <b>Ajouter</b>.</li>
        </ol>
      ) : (
        <p>Dans le menu de ton navigateur, choisis <b>Installer l'application</b> ou <b>Ajouter à l'écran d'accueil</b>.</p>
      )}
    </section>
  )
}
