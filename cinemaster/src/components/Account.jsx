import { useCallback, useEffect, useMemo, useState } from 'react'
import { account, trades, useAccount } from '../lib/cloud.js'
import { CARDS, CARDS_BY_ID } from '../data/cards.js'
import { RARITIES } from '../lib/rarity.js'

const cardName = id => {
  const c = CARDS_BY_ID[id]
  return c ? `${c.first} ${c.last} (${RARITIES[c.rarity].symbol})` : id
}

// Messages d'erreur du serveur, en français
function fr(e) {
  const m = e?.message || ''
  if (/fetch|network|load failed/i.test(m)) return 'Connexion impossible. Vérifie ta connexion internet.'
  if (/invalid login credentials/i.test(m)) return 'E-mail ou mot de passe incorrect.'
  if (/email not confirmed/i.test(m)) return 'Confirme d’abord ton adresse : clique sur le lien reçu par e-mail, puis reviens te connecter.'
  if (/already registered|already exists/i.test(m)) return 'Un compte existe déjà avec cet e-mail : connecte-toi, ou utilise « Mot de passe oublié ».'
  if (/password.*(at least|characters)|weak/i.test(m)) return 'Mot de passe trop court : 6 caractères minimum.'
  if (/same.*password|different from the old/i.test(m)) return 'Choisis un mot de passe différent de l’ancien.'
  if (/expired|invalid.*(otp|token)|token.*invalid/i.test(m)) return 'Code incorrect ou expiré. Redemande un code.'
  if (/rate limit|too many|security purposes/i.test(m)) return 'Trop de demandes : réessaie dans quelques minutes.'
  if (/invalid.*email|email.*invalid/i.test(m)) return 'Adresse e-mail invalide.'
  return m || 'Une erreur est survenue.'
}

function useAction() {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const run = async fn => {
    setBusy(true); setError(''); setInfo('')
    try { const msg = await fn(); if (typeof msg === 'string') setInfo(msg) } catch (e) { setError(fr(e)) }
    setBusy(false)
  }
  return { busy, error, info, run, setError, setInfo }
}

// Connexion : e-mail + mot de passe (marche aussi dans l'appli installée),
// création de compte, mot de passe oublié, ou lien de connexion par e-mail.
function SignIn() {
  const [mode, setMode] = useState('login')   // login | signup | forgot | link
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { busy, error, info, run, setError, setInfo } = useAction()
  const go = m => { setMode(m); setError(''); setInfo('') }
  const mail = email.trim()

  const submit = e => {
    e.preventDefault()
    if (mode === 'login') run(() => account.signIn(mail, password))
    if (mode === 'signup') run(async () => {
      const confirm = await account.signUp(mail, password)
      if (confirm) {
        go('login')
        return `Compte créé ! Clique sur le lien reçu à ${mail} pour confirmer ton adresse (tu peux l’ouvrir n’importe où), puis reviens ici te connecter.`
      }
    })
    if (mode === 'forgot') run(async () => {
      await account.resetPassword(mail)
      return 'E-mail envoyé. Clique sur le lien : une page s’ouvre pour choisir un nouveau mot de passe. Ensuite, reviens ici te connecter avec.'
    })
    if (mode === 'link') run(async () => {
      await account.sendCode(mail)
      return 'E-mail envoyé. Ouvre-le sur cet appareil et clique sur le lien : tu seras connecté(e) dans ce navigateur.'
    })
  }

  const titles = { login: 'Connexion', signup: 'Créer un compte', forgot: 'Mot de passe oublié', link: 'Connexion par lien' }
  const buttons = { login: 'Se connecter', signup: 'Créer mon compte', forgot: 'Recevoir le lien', link: 'Recevoir le lien' }

  return (
    <div className="panel stat-block account">
      <h3>{titles[mode]}</h3>
      {mode === 'login' && (
        <p className="muted small">Ton compte sauvegarde ta collection en ligne : tu la retrouves sur tous tes appareils et tu peux échanger avec tes amis.</p>
      )}
      <form className="account-form" onSubmit={submit}>
        <input type="email" required placeholder="ton@email.fr" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" />
        {(mode === 'login' || mode === 'signup') && (
          <input type="password" required minLength={6} placeholder={mode === 'signup' ? 'Choisis un mot de passe (6 caractères min.)' : 'Mot de passe'}
            value={password} onChange={e => setPassword(e.target.value)} autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} />
        )}
        <button className="pill-btn primary" disabled={busy}>{busy ? 'Un instant…' : buttons[mode]}</button>
      </form>
      {info && <p className="account-info">{info}</p>}
      {error && <p className="error">{error}</p>}
      <div className="account-links">
        {mode !== 'login' && <button className="link-btn" onClick={() => go('login')}>J’ai déjà un compte</button>}
        {mode !== 'signup' && <button className="link-btn" onClick={() => go('signup')}>Créer un compte</button>}
        {mode !== 'forgot' && <button className="link-btn" onClick={() => go('forgot')}>Mot de passe oublié ?</button>}
        {mode === 'login' && <button className="link-btn" onClick={() => go('link')}>Recevoir un lien de connexion</button>}
      </div>
    </div>
  )
}

// Choisir / changer son mot de passe (compte créé par lien, ou après
// « mot de passe oublié »)
function PasswordForm({ onDone, submitLabel = 'Enregistrer' }) {
  const [password, setPassword] = useState('')
  const { busy, error, info, run } = useAction()
  return (
    <>
      <form className="account-form" onSubmit={e => { e.preventDefault(); run(async () => { await account.setPassword(password); setPassword(''); onDone?.(); return 'Mot de passe enregistré. Tu peux maintenant te connecter partout avec ton e-mail et ce mot de passe.' }) }}>
        <input type="password" required minLength={6} placeholder="Nouveau mot de passe (6 caractères min.)" value={password} onChange={e => setPassword(e.target.value)} autoComplete="new-password" />
        <button className="pill-btn primary" disabled={busy}>{busy ? 'Un instant…' : submitLabel}</button>
      </form>
      {info && <p className="account-info">{info}</p>}
      {error && <p className="error">{error}</p>}
    </>
  )
}

// Arrivée par le lien « mot de passe oublié » : on propose tout de suite
// de choisir le nouveau mot de passe, quel que soit l'écran affiché.
export function RecoveryPrompt() {
  const { recovery, session } = useAccount()
  if (!recovery || !session) return null
  return (
    <div className="share-sheet">
      <div className="share-body conflict">
        <h3>Choisis ton nouveau mot de passe</h3>
        <p className="muted small">Pour le compte {session.user.email}.</p>
        <PasswordForm submitLabel="Valider" />
        <button className="link-btn" onClick={() => account.dismissRecovery()}>Fermer</button>
      </div>
    </div>
  )
}

function ChoosePseudo() {
  const [pseudo, setPseudo] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const submit = async e => {
    e.preventDefault()
    setBusy(true); setError('')
    try { await account.setPseudo(pseudo.trim()) } catch (err) {
      setError(/duplicate|unique/i.test(err?.message) ? 'Ce pseudo est déjà pris.' : 'Pseudo invalide : 2 à 20 lettres, chiffres, . _ ou -')
    }
    setBusy(false)
  }
  return (
    <div className="panel stat-block account">
      <h3>Choisis ton pseudo</h3>
      <p className="muted small">C’est avec lui que tes amis te trouveront pour échanger.</p>
      <form className="account-form" onSubmit={submit}>
        <input required maxLength={20} placeholder="Pseudo" value={pseudo} onChange={e => setPseudo(e.target.value)} />
        <button className="pill-btn primary" disabled={busy}>Valider</button>
      </form>
      {error && <p className="error">{error}</p>}
    </div>
  )
}

// Échanges : proposer, puis accepter / refuser / annuler
function Trades({ owned, changeOwned, onDelivered }) {
  const [list, setList] = useState([])
  const [error, setError] = useState('')
  const [friend, setFriend] = useState('')
  const [target, setTarget] = useState(null)       // { id, pseudo, dups }
  const [give, setGive] = useState('')
  const [want, setWant] = useState('')
  const [busy, setBusy] = useState(false)

  const reload = useCallback(async () => {
    try { setList(await trades.list()); setError('') } catch { setError('Échanges indisponibles pour le moment.') }
  }, [])
  useEffect(() => {
    // premier chargement, puis à chaque proposition reçue en direct
    const first = setTimeout(reload, 0)
    const stop = trades.watch(() => { reload(); onDelivered() })
    return () => { clearTimeout(first); stop() }
  }, [reload, onDelivered])

  const myDups = useMemo(() => CARDS.filter(c => owned[c.id] > 1), [owned])

  const act = async fn => {
    setBusy(true); setError('')
    try { await fn(); await reload() } catch (e) { setError(fr(e)) }
    setBusy(false)
  }

  const findFriend = () => act(async () => {
    const p = await trades.findPlayer(friend)
    if (!p) throw new Error('Aucun joueur avec ce pseudo.')
    const dups = await trades.duplicatesOf(p.id)
    setTarget({ ...p, dups: dups.filter(id => CARDS_BY_ID[id]) })
    setGive(''); setWant('')
  })

  const propose = () => act(async () => {
    if (!(owned[give] > 1)) throw new Error('Choisis une carte que tu as en double.')
    changeOwned(give, -1)                 // la carte part tout de suite
    try { await trades.propose(target.id, give, want) } catch (e) { changeOwned(give, +1); throw e }
    setTarget(null); setFriend('')
  })

  const accept = t => act(async () => {
    if (t.want_card && !(owned[t.want_card] > 1)) throw new Error('Tu n’as plus cette carte en double.')
    await trades.accept(t.id)
    changeOwned(t.give_card, +1)
    if (t.want_card) changeOwned(t.want_card, -1)
  })
  const decline = t => act(() => trades.decline(t.id))
  const cancel = t => act(async () => { await trades.cancel(t.id); changeOwned(t.give_card, +1) })

  const received = list.filter(t => !t.mine && t.status === 'pending')
  const sent = list.filter(t => t.mine && t.status === 'pending')
  const past = list.filter(t => t.status !== 'pending').slice(0, 6)
  const STATUS = { accepted: 'accepté', declined: 'refusé', cancelled: 'annulé' }

  return (
    <div className="panel stat-block trades">
      <h3>Échanges</h3>

      {received.length > 0 && (
        <ul className="trade-list">
          {received.map(t => (
            <li key={t.id} className="trade is-received">
              <p><b>{t.other}</b> te propose <b>{cardName(t.give_card)}</b>
                {t.want_card ? <> contre ton <b>{cardName(t.want_card)}</b></> : ' en cadeau'}</p>
              <div className="trade-actions">
                <button className="pill-btn primary" disabled={busy} onClick={() => accept(t)}>Accepter</button>
                <button className="pill-btn soft" disabled={busy} onClick={() => decline(t)}>Refuser</button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {!target
        ? (
          <form className="account-form" onSubmit={e => { e.preventDefault(); findFriend() }}>
            <input placeholder="Pseudo d’un ami" value={friend} onChange={e => setFriend(e.target.value)} />
            <button className="pill-btn primary" disabled={busy || !friend.trim()}>Proposer un échange</button>
          </form>
        )
        : (
          <div className="trade-new">
            <p className="small">Échange avec <b>{target.pseudo}</b></p>
            <label>
              <span>Je donne (un de mes doublons)</span>
              <select value={give} onChange={e => setGive(e.target.value)}>
                <option value="">Choisir…</option>
                {myDups.map(c => <option key={c.id} value={c.id}>{cardName(c.id)} ×{owned[c.id]}</option>)}
              </select>
            </label>
            <label>
              <span>Je demande en retour (facultatif)</span>
              <select value={want} onChange={e => setWant(e.target.value)}>
                <option value="">Rien, c’est un cadeau</option>
                {target.dups.map(id => <option key={id} value={id}>{cardName(id)}</option>)}
              </select>
            </label>
            {myDups.length === 0 && <p className="muted small">Tu n’as pas encore de doublon à échanger.</p>}
            <div className="trade-actions">
              <button className="pill-btn primary" disabled={busy || !give} onClick={propose}>Envoyer</button>
              <button className="pill-btn soft" onClick={() => setTarget(null)}>Annuler</button>
            </div>
          </div>
        )}

      {sent.length > 0 && (
        <ul className="trade-list">
          {sent.map(t => (
            <li key={t.id} className="trade">
              <p>En attente : <b>{cardName(t.give_card)}</b> pour <b>{t.other}</b>
                {t.want_card && <> contre <b>{cardName(t.want_card)}</b></>}</p>
              <button className="link-btn" disabled={busy} onClick={() => cancel(t)}>Annuler</button>
            </li>
          ))}
        </ul>
      )}

      {past.length > 0 && (
        <ul className="trade-list past">
          {past.map(t => (
            <li key={t.id} className="trade">
              <p>{t.mine ? `Vers ${t.other}` : `De ${t.other}`} · {cardName(t.give_card)}
                {t.want_card && <> ⇄ {cardName(t.want_card)}</>} · <em>{STATUS[t.status]}</em></p>
            </li>
          ))}
        </ul>
      )}
      {error && <p className="error">{error}</p>}
    </div>
  )
}

const STATUS_LABEL = { idle: '', syncing: 'Synchronisation…', ok: 'Collection sauvegardée en ligne', error: 'Hors ligne : la sauvegarde reprendra plus tard' }

// Bloc « compte » du profil
export default function Account({ sync, owned, changeOwned }) {
  const { ready, session, profile } = useAccount()
  if (!account.available) {
    return (
      <div className="panel stat-block account">
        <h3>Compte</h3>
        <p className="muted small">Les comptes et les échanges fonctionnent dans l’appli installée (le site PopCard), pas dans cet aperçu.</p>
      </div>
    )
  }
  if (!ready) return null
  if (!session) return <SignIn />
  if (profile === undefined) return null
  if (profile === null) return <ChoosePseudo />

  return (
    <>
      <div className="panel stat-block account">
        <div className="account-head">
          <div>
            <p className="eyebrow">Connecté</p>
            <h3>{profile.pseudo}</h3>
            <p className="muted small">{session.user.email}</p>
          </div>
          <button className="pill-btn soft" onClick={() => account.signOut()}>Se déconnecter</button>
        </div>
        {STATUS_LABEL[sync.status] && <p className={`sync-status is-${sync.status}`}>{STATUS_LABEL[sync.status]}</p>}
        <details className="account-password">
          <summary>Mot de passe</summary>
          <p className="muted small">Avec un mot de passe, tu peux te connecter directement dans l’appli installée sur ton téléphone (e-mail + mot de passe).</p>
          <PasswordForm />
        </details>
      </div>
      <Trades owned={owned} changeOwned={changeOwned} onDelivered={sync.deliver} />
    </>
  )
}

// Choix de la collection à garder quand l'appareil et le compte diffèrent
export function SyncConflict({ conflict, resolve, local }) {
  if (!conflict) return null
  const server = conflict.server.data
  const count = s => Object.keys(s.owned || {}).length
  return (
    <div className="share-sheet">
      <div className="share-body conflict">
        <h3>Quelle collection garder ?</h3>
        <p className="muted small">Ton compte a déjà une collection, différente de celle de cet appareil.</p>
        <div className="conflict-choices">
          <button className="panel" onClick={() => resolve('server')}>
            <b>Celle du compte</b>
            <span>{count(server)} cartes · {server.opened || 0} boosters ouverts</span>
          </button>
          <button className="panel" onClick={() => resolve('local')}>
            <b>Celle de cet appareil</b>
            <span>{count(local)} cartes · {local.opened} boosters ouverts</span>
          </button>
        </div>
      </div>
    </div>
  )
}
