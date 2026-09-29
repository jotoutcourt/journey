import { useState } from 'react'
import Card from './Card.jsx'
import { CARDS, UNIVERSES, fileKeys } from '../data/cards.js'
import Pack from './Pack.jsx'
import { importFiles, publishLocalImages, useLocalOnlyCount, useStorageMode, packFileName, packFullFileName, packFullKey, packImageKey, removeImage, setImage, useCardImage, useImageCount } from '../lib/images.js'
import { PACK_COVERS } from '../lib/packs.js'

function Item({ card, onSelect }) {
  const custom = useCardImage(card.id)
  return (
    <div className="grid-item">
      <Card card={card} onClick={() => onSelect(card)} />
      <span className={`img-badge ${custom ? 'has' : ''}`}>{custom ? 'Ton image' : 'Sans image'}</span>
      <code className="file-key">{fileKeys(card)[1] ?? card.id}</code>
    </div>
  )
}

// Un booster : illustration seule (le jeu garde bandeau, logo et titre) ou
// booster complet (ton image remplace tout le visuel, de haut en bas).
function PackImageButton({ id, label, fileName }) {
  const custom = useCardImage(id)
  const inputId = `pack-image-${id}`
  return (
    <div className="pack-option">
      <label htmlFor={inputId} className={`btn small ${custom ? 'primary' : ''}`}>{label}</label>
      <input
        id={inputId}
        type="file"
        accept="image/*"
        hidden
        onChange={e => {
          const file = e.target.files?.[0]
          e.target.value = ''
          if (file) setImage(id, file)
        }}
      />
      <code className="file-key">{fileName}</code>
      {custom && <button className="link-btn" onClick={() => removeImage(id)}>Retirer</button>}
    </div>
  )
}

function PackItem({ cover }) {
  return (
    <div className="grid-item pack-item">
      <div className="pack-pick"><Pack cover={cover} /></div>
      <PackImageButton id={packImageKey(cover.u)} label="Illustration" fileName={packFileName(cover.u)} />
      <PackImageButton id={packFullKey(cover.u)} label="Booster complet" fileName={packFullFileName(cover.u)} />
    </div>
  )
}

// Toutes les cartes de la série, possédées ou non, pour y mettre ses propres images.
export default function Atelier({ onSelect }) {
  const count = useImageCount()
  const mode = useStorageMode()
  const localOnly = useLocalOnlyCount()
  const [publishing, setPublishing] = useState(null)

  const publishLocal = async () => {
    setPublishing({ done: 0, total: localOnly })
    await publishLocalImages((done, total) => setPublishing({ done, total }))
    setPublishing(null)
  }
  const [progress, setProgress] = useState(null)
  const [report, setReport] = useState(null)

  const onFiles = async e => {
    // copie avant de vider le champ : e.target.files est une liste vivante
    const files = [...(e.target.files || [])]
    e.target.value = ''
    if (!files.length) return
    setReport(null)
    setProgress({ done: 0, total: files.length })
    const result = await importFiles(files, (done, total) => setProgress({ done, total }))
    setProgress(null)
    setReport(result)
  }

  return (
    <section className="atelier">
      <div className={`mode-banner mode-${mode}`}>
        {mode === 'shared'
          ? <><b>Images partagées (page claude.ai).</b> Ce que tu déposes ici devient l’image par défaut sur cette page. Pour le site et l’appli installée, dépose-les depuis le site, connecté(e) avec ton compte admin.</>
          : mode === 'online'
            ? <><b>Images en ligne.</b> Ce que tu déposes ici devient l’image de tout le monde, sur tous les téléphones (site et appli installée).</>
            : <><b>Images locales.</b> Ce que tu déposes ici reste sur cet appareil. Pour que tout le monde les voie, connecte-toi avec ton compte admin (onglet Profil) sur le site.</>}
        <span className="mode-count">{count} image{count > 1 ? 's' : ''}</span>
      </div>
      {mode !== 'local' && localOnly > 0 && (
        <div className="panel publish-local">
          <p>{localOnly} image{localOnly > 1 ? 's' : ''} déposée{localOnly > 1 ? 's' : ''} avant le partage {localOnly > 1 ? 'sont' : 'est'} encore sur cet appareil seulement.</p>
          <button className="pill-btn primary" onClick={publishLocal} disabled={!!publishing}>
            {publishing ? `Partage… ${publishing.done}/${publishing.total}` : 'Les partager avec tout le monde'}
          </button>
        </div>
      )}

      <div className="import-box">
        <div className="import-text">
          <h3>Importer depuis ton ordinateur</h3>
          <p>
            Nomme chaque image comme la carte (le nom est affiché sous chaque carte),
            par exemple <code>rachel.jpg</code>, <code>rachel-full.jpg</code>, <code>rachel-gold.jpg</code>,
            puis choisis le dossier ou les fichiers. Les images sont rangées automatiquement.
          </p>
        </div>
        <div className="import-actions">
          <label className="btn primary" htmlFor="import-folder">Importer un dossier</label>
          <input id="import-folder" type="file" webkitdirectory="" multiple hidden onChange={onFiles} disabled={!!progress} />
          <label className="btn" htmlFor="import-files">Choisir des images</label>
          <input id="import-files" type="file" accept="image/*" multiple hidden onChange={onFiles} disabled={!!progress} />
        </div>
        {progress && <p className="import-status">Import en cours… {progress.done}/{progress.total}</p>}
        {report && (
          <div className="import-status">
            <p><strong>{report.imported.length}</strong> image{report.imported.length > 1 ? 's' : ''} importée{report.imported.length > 1 ? 's' : ''}.</p>
            {report.unknown.length > 0 && (
              <p className="error">
                Non reconnue{report.unknown.length > 1 ? 's' : ''} (renomme-les comme indiqué sous les cartes) :{' '}
                {report.unknown.join(', ')}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="atelier-group">
        <h3>Boosters</h3>
        <p className="pack-help">
          <b>Illustration</b> : format portrait 4:5 (800 × 1000 px), le jeu ajoute le bandeau, le logo et le titre.
          <br /><b>Booster complet</b> : ton image couvre tout le sachet, de haut en bas, format 58:100 (1160 × 2000 px).
          Le haut (5 %) sert de bande à déchirer.
        </p>
        <div className="card-grid pack-grid">
          {PACK_COVERS.map(c => <PackItem key={c.u} cover={c} />)}
        </div>
      </div>

      {Object.entries(UNIVERSES).map(([key, u]) => (
        <div key={key} className="atelier-group">
          <h3>{u.name}</h3>
          <div className="card-grid">
            {CARDS.filter(c => c.u === key).map(c => <Item key={c.id} card={c} onSelect={onSelect} />)}
          </div>
        </div>
      ))}
    </section>
  )
}
