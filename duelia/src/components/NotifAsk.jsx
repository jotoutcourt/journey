// Demande d'activer les notifications, dès le début quand Kraken est installé en mode appli
import Mascot from './Mascot.jsx'

export default function NotifAsk({ busy, onYes, onLater }) {
  return (
    <div className="sheet-backdrop">
      <div className="sheet notif-ask" role="dialog" aria-labelledby="notif-title">
        <Mascot pose="notification" size={120} />
        <h2 id="notif-title">Ne rate aucun défi !</h2>
        <ul className="na-list">
          <li><span aria-hidden="true">⚡</span><p>Sois prévenu dès qu'un ami te lance un <b>défi en direct</b>.</p></li>
          <li><span aria-hidden="true">📨</span><p>Découvre quand on a <b>répondu à ton défi</b>, et qui a gagné.</p></li>
          <li><span aria-hidden="true">🎁</span><p>Un petit rappel pour ton <b>bonus de lingots</b> du jour.</p></li>
        </ul>
        <button className="kh-play na-yes" disabled={busy} onClick={onYes}>{busy ? 'Un instant…' : '🔔 Activer les notifications'}</button>
        <button className="link-btn na-later" onClick={onLater}>Plus tard</button>
      </div>
    </div>
  )
}
