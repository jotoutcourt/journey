import { useState } from 'react'
import Avatar from './Avatar.jsx'
import TopicIcon from './TopicIcon.jsx'

// Copie dans le presse-papier (dans le geste du joueur), sinon sélection du texte pour une copie manuelle.
async function copyText(text, fallbackEl) {
  try { await navigator.clipboard.writeText(text); return true } catch {
    fallbackEl?.select?.()
    return false
  }
}

/* ---------- Le défi est prêt : on l'envoie ---------- */
export function LinkReady({ url, shortening, score, topic, onHome, onTopic }) {
  const [copied, setCopied] = useState(null)
  const [area, setArea] = useState(null)
  const text = `Je te défie sur « ${topic.name} » dans Duelia ! 7 questions, tu peux me battre ?`
  const canShare = typeof navigator.share === 'function'

  async function share() {
    try { await navigator.share({ title: 'Duelia', text, url }); return } catch { /* refusé : on copie */ }
    setCopied(await copyText(`${text} ${url}`, area))
  }

  return (
    <div className="screen link-screen">
      <div className="link-card">
        <TopicIcon topic={topic} size={72} />
        <h1>Ton défi est prêt</h1>
        <p>Tu as marqué <b>{score} points</b>. Ton score reste caché : ton ami le découvrira à la fin de sa partie.</p>
      </div>
      <button className="btn btn-primary wide" onClick={share} disabled={shortening}>{shortening ? 'Préparation du lien…' : canShare ? '📤 Envoyer le défi' : '📋 Copier le lien du défi'}</button>
      {canShare && <button className="btn btn-ghost wide" disabled={shortening} onClick={async () => setCopied(await copyText(`${text} ${url}`, area))}>📋 Copier le lien</button>}
      {copied === true && <p className="link-ok" role="status">Lien copié. Colle-le dans un message à ton ami.</p>}
      {copied === false && <p className="link-ok" role="status">Copie automatique impossible : le lien est sélectionné ci-dessous, copie-le à la main.</p>}
      <label className="link-field">
        <small>Le lien du défi</small>
        <textarea id="link-url" ref={setArea} readOnly value={url} rows={url.length > 80 ? 3 : 1} onFocus={e => e.target.select()} />
      </label>
      <ol className="sheet-steps">
        <li>Ton ami ouvre le lien et joue les mêmes 7 questions.</li>
        <li>Tes réponses s'affichent au fil de sa partie ; il découvre le résultat à la fin.</li>
        <li>Il peut te renvoyer son résultat par un lien : ouvre-le pour voir qui a gagné.</li>
      </ol>
      <div className="results-actions">
        <button className="btn btn-ghost" onClick={onTopic}>Retour au thème</button>
        <button className="btn btn-ghost" onClick={onHome}>Accueil</button>
      </div>
    </div>
  )
}

/* ---------- L'ami ouvre le lien ---------- */
export function LinkIntro({ challenge, onAccept, onLater }) {
  const { from, topic, questions, expiresAt } = challenge
  // calculé une fois à l'ouverture de l'écran
  const [expired] = useState(() => !!expiresAt && Date.now() > expiresAt)
  return (
    <div className="screen link-screen">
      <div className="link-card">
        <Avatar seed={from.avatar} size={96} ring="var(--opp)" />
        <h1>{from.flag} {from.name} te défie !</h1>
        <div className="sheet-topic"><TopicIcon topic={topic} size={28} /> {topic.name}</div>
        <p>{questions.length} questions. {from.name} a déjà joué : ses réponses apparaîtront au fil des tiennes, et son score reste caché jusqu'à la fin.</p>
      </div>
      {expired && <p className="link-fail" role="alert">Ce défi a expiré (il était valable 7 jours). Demande à {from.name} de t'en envoyer un nouveau.</p>}
      {!expired && <button className="btn btn-primary wide" onClick={onAccept}>Relever le défi</button>}
      <button className="btn btn-ghost wide" onClick={onLater}>{expired ? 'Accueil' : 'Plus tard'}</button>
    </div>
  )
}

/* ---------- Le challenger ouvre la réponse de son ami ---------- */
export function LinkReplyIntro({ reply, known, onSee, onHome }) {
  return (
    <div className="screen link-screen">
      <div className="link-card">
        <Avatar seed={reply.from.avatar} size={96} ring="var(--opp)" />
        <h1>{reply.from.flag} {reply.from.name} a relevé ton défi</h1>
        <p>{known ? 'Le résultat de votre duel t\'attend.' : 'Ce défi n\'a pas été lancé depuis cet appareil : tu verras seulement le score de ton ami.'}</p>
      </div>
      <button className="btn btn-primary wide" onClick={onSee}>Voir le résultat</button>
      <button className="btn btn-ghost wide" onClick={onHome}>Accueil</button>
    </div>
  )
}
