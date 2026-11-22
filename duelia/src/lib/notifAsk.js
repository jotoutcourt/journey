// Quand proposer d'activer les notifications : appli installée, permission jamais donnée,
// et au plus 3 fois (la dernière « Plus tard » remonte à plus de 3 jours).
const KEY = 'kraken:notif-ask'
const standalone = () => window.matchMedia?.('(display-mode: standalone)').matches || navigator.standalone === true
export function shouldAskNotif(push) {
  if (push !== 'off' || !standalone() || !('Notification' in window) || Notification.permission !== 'default') return false
  try {
    const s = JSON.parse(localStorage.getItem(KEY) || 'null')
    return !s || (s.n < 3 && Date.now() - s.at > 3 * 86400000)
  } catch { return true }
}
export function notifAskLater() {
  try { const s = JSON.parse(localStorage.getItem(KEY) || 'null'); localStorage.setItem(KEY, JSON.stringify({ n: (s?.n || 0) + 1, at: Date.now() })) } catch { /* rien */ }
}
