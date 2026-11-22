// Écran « Installe Kraken » du tout premier lancement dans le navigateur
export const INTRO_KEY = 'kraken:install-intro'
const standalone = () => window.matchMedia?.('(display-mode: standalone)').matches || navigator.standalone === true
// À montrer si l'appli n'est pas installée et que l'écran n'a pas encore été passé
export const needsInstallIntro = () => {
  if (typeof window === 'undefined' || standalone()) return false
  try { return localStorage.getItem(INTRO_KEY) !== '1' } catch { return true }
}
