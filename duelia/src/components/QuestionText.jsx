// Énoncé d'une question.
// - Si l'énoncé se termine par un drapeau (émoji), on l'affiche en grand dessous.
// - Si l'énoncé se termine par [photo:/animaux/xxx.webp], on affiche la photo (avec son crédit).
import { CREDITS } from '../data/extra/quel-animal.js'

const FLAG = /\s*([\u{1F1E6}-\u{1F1FF}]{2})\s*$/u
const PHOTO = /\s*\[photo:(\/animaux\/[a-z0-9-]+\.webp)\]\s*$/

export default function QuestionText({ text = '' }) {
  const p = text.match(PHOTO)
  if (p) {
    const credit = CREDITS[p[1]]
    return <>
      {text.slice(0, p.index)}
      <span className="q-photo">
        <img src={p[1]} alt="Photo de l'animal à deviner" draggable="false" />
        {credit && <small>📷 {credit}</small>}
      </span>
    </>
  }
  const m = text.match(FLAG)
  if (!m) return text
  return <>{text.slice(0, m.index)}<span className="q-flag" role="img" aria-label="drapeau">{m[1]}</span></>
}
