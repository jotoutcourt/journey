// Lien rouvert depuis un mini-navigateur (Instagram…) vers Chrome : le # avait été passé en ?_h=…, on le remet en place
if (typeof window !== 'undefined') {
  try {
    const u = new URL(window.location.href)
    const h = u.searchParams.get('_h')
    if (h) {
      u.searchParams.delete('_h')
      window.history.replaceState(null, '', u.pathname + u.search + '#' + h)
    }
  } catch { /* rien */ }
}
