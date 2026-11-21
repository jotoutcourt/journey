// Énoncé d'une question. Si l'énoncé se termine par un drapeau (émoji), on l'affiche en grand dessous.
const FLAG = /\s*([\u{1F1E6}-\u{1F1FF}]{2})\s*$/u

export default function QuestionText({ text = '' }) {
  const m = text.match(FLAG)
  if (!m) return text
  return <>{text.slice(0, m.index)}<span className="q-flag" role="img" aria-label="drapeau">{m[1]}</span></>
}
