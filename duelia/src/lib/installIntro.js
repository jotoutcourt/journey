// Écran « Installe Kraken » du tout premier lancement dans le navigateur
export const INTRO_KEY = 'kraken:install-intro'
const standalone = () => window.matchMedia?.('(display-mode: standalone)').matches || navigator.standalone === true
// À montrer si l'appli n'est pas installée et que l'écran n'a pas encore été passé
export const needsInstallIntro = () => {
  if (typeof window === 'undefined' || standalone()) return false
  try { return localStorage.getItem(INTRO_KEY) !== '1' } catch { return true }
}

// Mini-navigateurs intégrés aux applis (Instagram, Snapchat, TikTok, X…) : impossible d'y installer Kraken
export const inAppBrowser = () => typeof navigator !== 'undefined'
  && /Instagram|FBAN|FBAV|FB_IAB|Snapchat|TikTok|musical_ly|Bytedance|Line\/|Twitter|LinkedInApp|Pinterest|; wv\)/i.test(navigator.userAgent)
export const IN_APP_KEY = 'kraken:in-app-continue'
export const needsInAppGate = () => {
  if (!inAppBrowser() || standalone()) return false
  try { return sessionStorage.getItem(IN_APP_KEY) !== '1' } catch { return true }
}
// Lien qui demande au téléphone d'ouvrir la page dans le vrai navigateur
export function externalUrl(href = location.href) {
  const ua = navigator.userAgent
  if (/android/i.test(ua)) {
    // le « # » de nos liens (#ami=…, #d=…) casserait l'intent : on le passe en paramètre ?_h=…, remis en place au chargement
    const u = new URL(href)
    if (u.hash.length > 1) u.searchParams.set('_h', u.hash.slice(1))
    u.hash = ''
    return `intent://${u.host}${u.pathname}${u.search}#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=${encodeURIComponent(href)};end`
  }
  return href.replace(/^https:\/\//, 'x-safari-https://')
}
