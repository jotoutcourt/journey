import { useEffect, useState } from 'react'

// Proposition d'installer Kraken sur l'écran d'accueil (invisible si l'appli est déjà installée)
let deferred = null
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferred = e })
}

const standalone = () => window.matchMedia?.('(display-mode: standalone)').matches || navigator.standalone === true
const isIos = () => /iphone|ipad|ipod/i.test(navigator.userAgent)
const isAndroid = () => /android/i.test(navigator.userAgent)
// Mini-navigateurs intégrés aux applis (Instagram, Snapchat, Messenger…) : ils ne savent pas installer d'appli
const inAppBrowser = () => /Instagram|FBAN|FBAV|FB_IAB|Snapchat|TikTok|musical_ly|Line\/|Twitter|LinkedInApp|Pinterest/i.test(navigator.userAgent)

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
      <h3>📲 Installer Kraken</h3>
      {canPrompt ? (
        <>
          <p>Ajoute Kraken à ton écran d'accueil : il s'ouvre en plein écran, comme une vraie appli, et marche même sans réseau contre l'IA.</p>
          <button className="btn btn-primary wide" onClick={install}>Installer</button>
        </>
      ) : isIos() ? (
        <ol className="sheet-steps">
          <li>Ouvre Kraken dans <b>Safari</b> (duelia.vercel.app).</li>
          <li>Appuie sur le bouton <b>Partager</b> (le carré avec une flèche vers le haut).</li>
          <li>Choisis <b>Sur l'écran d'accueil</b>, puis <b>Ajouter</b>.</li>
        </ol>
      ) : (
        <p>Ouvre Kraken dans <b>Chrome</b>, appuie sur <b>⋮</b> puis <b>Installer l'application</b>. Si Chrome propose « Ajouter à l'écran d'accueil », choisis <b>Installer</b> et non « Créer un raccourci ».</p>
      )}
    </section>
  )
}

/* ---------- Bandeau d'accueil : installer en un appui (Android), ou sortir du mini-navigateur d'une appli ---------- */
export function InstallBanner() {
  const [installed, setInstalled] = useState(standalone)
  const [canPrompt, setCanPrompt] = useState(() => !!deferred)
  const [hidden, setHidden] = useState(() => { try { return sessionStorage.getItem('kraken:install-hidden') === '1' } catch { return false } })
  useEffect(() => {
    const onPrompt = () => setCanPrompt(true)
    const onInstalled = () => setInstalled(true)
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => { window.removeEventListener('beforeinstallprompt', onPrompt); window.removeEventListener('appinstalled', onInstalled) }
  }, [])
  if (installed || hidden) return null
  const hide = () => { setHidden(true); try { sessionStorage.setItem('kraken:install-hidden', '1') } catch { /* rien */ } }
  if (inAppBrowser()) {
    const here = location.host + location.pathname
    return (
      <section className="install-banner warn">
        <p>📲 Pour installer Kraken, ouvre-le dans {isIos() ? <b>Safari</b> : <b>Chrome</b>} : ce navigateur intégré ne permet pas l'installation.</p>
        {isAndroid() && <a className="btn btn-small btn-gold" href={`intent://${here}#Intent;scheme=https;package=com.android.chrome;end`}>Ouvrir dans Chrome</a>}
        {isIos() && <small>Appuie sur ⋯ ou sur la boussole, puis « Ouvrir dans Safari ».</small>}
      </section>
    )
  }
  if (!canPrompt) return null
  async function install() {
    if (!deferred) return
    deferred.prompt()
    const { outcome } = await deferred.userChoice
    deferred = null
    setCanPrompt(false)
    if (outcome === 'accepted') setInstalled(true)
  }
  return (
    <section className="install-banner">
      <p>📲 Installe Kraken : il s'ouvrira en plein écran, comme une vraie appli.</p>
      <div>
        <button className="btn btn-small btn-gold" onClick={install}>Installer</button>
        <button className="btn btn-small btn-ghost" onClick={hide}>Plus tard</button>
      </div>
    </section>
  )
}
