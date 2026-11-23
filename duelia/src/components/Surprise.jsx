// Barre « La surprise arrive bientôt » : progression vers le sticker du thème, sans dévoiler lequel.
// Avec `fromXp`, la barre se remplit depuis l'XP d'avant la partie (écran de fin de duel).
import { useEffect, useState } from 'react'
import { levelInfo } from '../lib/levels.js'
import { stickerFor, STICKER_LEVEL, STICKER_XP } from '../lib/stickers.js'

const pct = (xp) => Math.min(100, Math.max(0, (xp / STICKER_XP) * 100))

export default function SurpriseBar({ topicId, xp = 0, fromXp, onOpen, delay = 1800 }) {
  const s = stickerFor(topicId)
  const animated = fromXp != null && fromXp < xp
  const [w, setW] = useState(pct(animated ? fromXp : xp))
  useEffect(() => {
    if (!animated) return
    const t = setTimeout(() => setW(pct(xp)), delay)
    return () => clearTimeout(t)
  }, [animated, xp, delay])
  if (!s) return null

  if (xp >= STICKER_XP) {
    return (
      <button className="surprise done" onClick={onOpen}>
        <img src={s.img} alt="" />
        <span><b>Surprise débloquée : {s.name} !</b><small>Il t'attend dans ton livre de stickers 📖</small></span>
      </button>
    )
  }
  const lvl = levelInfo(xp).level
  const left = STICKER_XP - xp
  const close = left <= STICKER_XP * 0.15
  return (
    <div className={`surprise ${close ? 'close' : ''}`}>
      <div className="surprise-head">
        <span className="surprise-gift" aria-hidden="true">🎁</span>
        <b>{close ? 'La surprise est toute proche…' : 'Une surprise arrive bientôt…'}</b>
        <small>Niv. {lvl} / {STICKER_LEVEL}</small>
      </div>
      <div className="surprise-track"><i style={{ width: `${w}%` }} /></div>
      <small className="surprise-sub">{animated ? `+${xp - fromXp} XP · ` : ''}encore {left.toLocaleString('fr-FR')} XP sur ce thème</small>
    </div>
  )
}
