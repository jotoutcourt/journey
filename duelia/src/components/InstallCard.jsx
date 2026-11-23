import { useEffect, useState } from 'react'
import { INTRO_KEY, IN_APP_KEY, externalUrl, inAppBrowser } from '../lib/installIntro.js'

// Proposition d'installer Kraken sur l'écran d'accueil (invisible si l'appli est déjà installée)
let deferred = null
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferred = e })
}

const standalone = () => window.matchMedia?.('(display-mode: standalone)').matches || navigator.standalone === true
const isIos = () => /iphone|ipad|ipod/i.test(navigator.userAgent)
const isAndroid = () => /android/i.test(navigator.userAgent)
// Mini-navigateurs intégrés aux applis (Instagram, Snapchat, Messenger…) : ils ne savent pas installer d'appli
// Safari lui-même sur iPhone (pas Chrome, Firefox… ni le navigateur intégré d'une appli)
const iosSafari = () => isIos() && /safari/i.test(navigator.userAgent) && !/crios|fxios|edgios|opios|gsa\//i.test(navigator.userAgent) && !inAppBrowser()

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

/* ---------- Premier lancement dans le navigateur : expliquer l'installation avant tout ---------- */
const ShareIcon = () => (
  <svg className="ii-glyph" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12M7.5 7.5 12 3l4.5 4.5" /><path d="M8 11H6.5A1.5 1.5 0 0 0 5 12.5v7A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5v-7a1.5 1.5 0 0 0-1.5-1.5H16" /></svg>
)
const MenuIcon = () => (
  <svg className="ii-glyph" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 7h14M5 12h14M5 17h9" /></svg>
)
const PlusBox = () => (
  <svg className="ii-glyph" viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="4" /><path d="M12 8.5v7M8.5 12h7" /></svg>
)

export function InstallIntro({ onDone }) {
  const [os, setOs] = useState(null) // 'ios' | 'android'
  const [canPrompt, setCanPrompt] = useState(() => !!deferred)
  useEffect(() => {
    const onPrompt = () => setCanPrompt(true)
    const onInstalled = () => finish()
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => { window.removeEventListener('beforeinstallprompt', onPrompt); window.removeEventListener('appinstalled', onInstalled) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  function finish() { try { localStorage.setItem(INTRO_KEY, '1') } catch { /* rien */ } onDone() }
  async function install() {
    if (!deferred) return
    deferred.prompt()
    const { outcome } = await deferred.userChoice
    deferred = null
    setCanPrompt(false)
    if (outcome === 'accepted') finish()
  }
  const guess = isIos() ? 'ios' : isAndroid() ? 'android' : null
  const embedded = inAppBrowser()
  const inSafari = iosSafari()

  if (!os) {
    return (
      <div className="screen install-intro">
        <img className="ii-mascot" src="/mascotte/pirate-anim.webp" alt="" aria-hidden="true" />
        <h1>Installe Kraken<br />sur ton téléphone</h1>
        <p className="ii-sub">Avant de plonger, ajoute le jeu à ton écran d'accueil : il s'ouvrira en plein écran, comme une vraie appli, et tu recevras les défis de tes amis.</p>
        <div className="ii-choices">
          <button className={`ii-os ${guess === 'ios' ? 'guess' : ''}`} onClick={() => setOs('ios')}>
            <span aria-hidden="true">📱</span><b>J'ai un iPhone</b>
          </button>
          <button className={`ii-os ${guess === 'android' ? 'guess' : ''}`} onClick={() => setOs('android')}>
            <span aria-hidden="true">🤖</span><b>J'ai un Android</b>
          </button>
        </div>
        <button className="link-btn ii-skip" onClick={finish}>Continuer sans installer</button>
      </div>
    )
  }

  const ios = os === 'ios'
  return (
    <div className={`screen install-intro steps ${ios && inSafari ? 'safari' : ''}`}>
      <button className="back ii-back" onClick={() => setOs(null)} aria-label="Changer de téléphone">←</button>
      <h1>{ios ? 'Sur iPhone' : 'Sur Android'}</h1>
      {embedded && (
        <p className="ii-warn">⚠️ Tu es dans le navigateur d'une autre appli (Instagram, Snapchat…). Ouvre d'abord ce lien dans <b>{ios ? 'Safari' : 'Chrome'}</b>{ios ? ' : appuie sur ⋯ ou sur la boussole, puis « Ouvrir dans Safari ».' : '.'}</p>
      )}
      {!ios && canPrompt ? (
        <>
          <p className="ii-sub">Un seul appui suffit :</p>
          <button className="kh-play ii-install" onClick={install}>📲 Installer Kraken</button>
          <p className="ii-sub small">Ensuite, ouvre Kraken depuis ton écran d'accueil.</p>
        </>
      ) : (
        <ol className="ii-steps">
          {ios && inSafari ? <>
            <li><i>1</i><span>Appuie sur <MenuIcon />, à gauche de l'adresse, en bas de l'écran (la flèche te montre où).</span></li>
            <li><i>2</i><span>Choisis <b>Partager</b> <ShareIcon />.</span></li>
            <li><i>3</i><span>Fais défiler, choisis <b>Sur l'écran d'accueil</b> <PlusBox />, puis <b>Ajouter</b>.</span></li>
          </> : ios ? <>
            <li><i>1</i><span>Ouvre <b>duelia.vercel.app</b> dans <b>Safari</b>, l'appli boussole.</span></li>
            <li><i>2</i><span>Appuie sur <MenuIcon />, à gauche de l'adresse, en bas de l'écran.</span></li>
            <li><i>3</i><span>Choisis <b>Partager</b> <ShareIcon />.</span></li>
            <li><i>4</i><span>Fais défiler, choisis <b>Sur l'écran d'accueil</b> <PlusBox />, puis <b>Ajouter</b>.</span></li>
          </> : <>
            <li><i>1</i><span>Ouvre <b>duelia.vercel.app</b> dans <b>Chrome</b>.</span></li>
            <li><i>2</i><span>Appuie sur <b>⋮</b>, en haut à droite.</span></li>
            <li><i>3</i><span>Choisis <b>Installer l'application</b> (ou <b>Ajouter à l'écran d'accueil</b>, puis <b>Installer</b>, pas « Créer un raccourci »).</span></li>
            <li><i>4</i><span>Ouvre <b>Kraken</b> depuis ton écran d'accueil.</span></li>
          </>}
        </ol>
      )}
      {ios && inSafari && <p className="ii-sub small ii-old">Sur un iPhone plus ancien, le bouton <b>Partager</b> <ShareIcon /> est directement en bas de l'écran.</p>}
      {ios && inSafari && <span className="ii-arrow" aria-hidden="true">⬇</span>}
      <div className="ii-dock">
        <button className="btn btn-ghost wide" onClick={finish}>C'est fait, ou plus tard : continuer ici</button>
      </div>
    </div>
  )
}

// Ouvert depuis Instagram, Snapchat, TikTok… : on invite à passer dans Safari / Chrome pour pouvoir installer Kraken
export function InAppGate({ onContinue }) {
  const ios = isIos()
  const [copied, setCopied] = useState(false)
  const app = /Instagram/i.test(navigator.userAgent) ? 'Instagram' : /Snapchat/i.test(navigator.userAgent) ? 'Snapchat'
    : /TikTok|musical_ly|Bytedance/i.test(navigator.userAgent) ? 'TikTok' : /FBAN|FBAV|FB_IAB/i.test(navigator.userAgent) ? 'Facebook / Messenger'
      : /Twitter/i.test(navigator.userAgent) ? 'X (Twitter)' : null
  const browser = ios ? 'Safari' : 'Chrome'
  async function copy() {
    try { await navigator.clipboard.writeText(location.href); setCopied(true) } catch { window.prompt('Copie ce lien :', location.href) }
  }
  function continueHere() { try { sessionStorage.setItem(IN_APP_KEY, '1') } catch { /* rien */ } onContinue() }
  return (
    <div className="screen install-intro in-app">
      <img className="ii-mascot" src="/mascotte/pirate-anim.webp" alt="" aria-hidden="true" />
      <h1>Ouvre Kraken<br />dans {browser}</h1>
      <p className="ii-sub">Tu es dans le navigateur {app ? <>d'<b>{app}</b></> : 'd\'une autre appli'} : d'ici, impossible d'installer le jeu ni de recevoir les défis de tes amis.</p>
      <a className="kh-play ii-install" href={externalUrl()}>🧭 Ouvrir dans {browser}</a>
      <ol className="ii-steps">
        <li><i>1</i><span>Si rien ne se passe, appuie sur <b>⋯</b> (ou <b>⋮</b>) en haut à droite de l'écran.</span></li>
        <li><i>2</i><span>Choisis <b>Ouvrir dans le navigateur</b> (ou <b>Ouvrir dans {browser}</b>).</span></li>
        <li><i>3</i><span>Dans {browser}, Kraken t'explique comment l'ajouter à ton écran d'accueil.</span></li>
      </ol>
      <button className="btn btn-secondary wide" onClick={copy}>{copied ? '✓ Lien copié : colle-le dans ' + browser : '📋 Copier le lien'}</button>
      <div className="ii-dock">
        <button className="link-btn ii-skip" onClick={continueHere}>Continuer ici quand même</button>
      </div>
    </div>
  )
}
