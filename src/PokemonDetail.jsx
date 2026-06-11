import { useState, useEffect } from 'react'
import { useT } from './i18n/index.jsx'
import { ZONES, CHAPTERS } from './data/firered.js'

// ─── CACHES DE TRADUCTION (persistent pendant la session) ─────────────────────

const MOVE_FR    = new Map()
const AREA_FR    = new Map()
const ABILITY_FR = new Map()
const SPECIES_FR = new Map() // id -> nom FR

async function loadMoveNames(names) {
  const needed = names.filter(n => !MOVE_FR.has(n))
  await Promise.all(needed.map(async name => {
    try {
      const d = await fetch(`https://pokeapi.co/api/v2/move/${name}/`).then(r => r.json())
      MOVE_FR.set(name, d.names.find(n => n.language.name === 'fr')?.name || slugToTitle(name))
    } catch { MOVE_FR.set(name, slugToTitle(name)) }
  }))
}

async function loadAreaNames(names) {
  const needed = names.filter(n => !AREA_FR.has(n))
  await Promise.all(needed.map(async name => {
    try {
      const d = await fetch(`https://pokeapi.co/api/v2/location-area/${name}/`).then(r => r.json())
      AREA_FR.set(name, d.names.find(n => n.language.name === 'fr')?.name || slugToTitle(name))
    } catch { AREA_FR.set(name, slugToTitle(name)) }
  }))
}

async function loadAbilityNames(names) {
  const needed = names.filter(n => !ABILITY_FR.has(n))
  await Promise.all(needed.map(async name => {
    try {
      const d = await fetch(`https://pokeapi.co/api/v2/ability/${name}/`).then(r => r.json())
      ABILITY_FR.set(name, d.names.find(n => n.language.name === 'fr')?.name || slugToTitle(name))
    } catch { ABILITY_FR.set(name, slugToTitle(name)) }
  }))
}

function slugToTitle(s) {
  return s.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

const ITEM_FR = {
  'fire-stone':'Pierre Feu','water-stone':'Pierre Eau','thunder-stone':'Pierre Foudre',
  'leaf-stone':'Pierre Plante','moon-stone':'Pierre Lune','sun-stone':'Pierre Soleil',
  'shiny-stone':'Pierre Éclat','dusk-stone':'Pierre Nuit','dawn-stone':'Pierre Aube',
  'ice-stone':'Pierre Glace','oval-stone':'Pierre Ovale','kings-rock':'Roc. du Roi',
  'metal-coat':'Tenue Métal','dragon-scale':'Écaille Draco','up-grade':'Mé.Amorce',
  'deep-sea-tooth':'Dent Profonde','deep-sea-scale':'Écaille Abyssal',
  'prism-scale':'Écaille Prisme','electirizer':'Électhérapie','magmarizer':'Pyrogèle',
  'protector':'Protecteur','dubious-disc':'Disque Douteux','razor-fang':'Croc Rasoir',
  'razor-claw':'Griffe Rasoir','reaper-cloth':'Tissu Faucheur',
  'sachet':'Sachet Parfumé','whipped-dream':'Nuage Sucré',
}

// ─── CONSTANTES ───────────────────────────────────────────────────────────────

const VG = {
  firered:      ['firered-leafgreen'],
  gold:         ['gold-silver', 'crystal'],
  sapphire:     ['ruby-sapphire', 'emerald'],
  omegaruby:    ['omega-ruby-alpha-sapphire'],
  alphasapphire:['omega-ruby-alpha-sapphire'],
}

const VERS = {
  firered:      ['firered', 'leafgreen'],
  gold:         ['gold', 'silver', 'crystal'],
  sapphire:     ['sapphire', 'ruby', 'emerald'],
  omegaruby:    ['omega-ruby', 'alpha-sapphire'],
  alphasapphire:['omega-ruby', 'alpha-sapphire'],
}

export const TYPE_FR = {
  normal:'Normal', fire:'Feu', water:'Eau', electric:'Électk', grass:'Plante',
  ice:'Glace', fighting:'Combat', poison:'Poison', ground:'Sol', flying:'Vol',
  psychic:'Psy', bug:'Insecte', rock:'Roche', ghost:'Spectre', dragon:'Dragon',
  dark:'Ténèbres', steel:'Acier', fairy:'Fée',
}

export const TYPE_COLORS = {
  normal:'#9099A1', fire:'#FF6C35', water:'#4D90D5', electric:'#F4D23C',
  grass:'#63BB5B', ice:'#74CEC0', fighting:'#CE4265', poison:'#AB6AC8',
  ground:'#D97845', flying:'#8FA9DE', psychic:'#F97176', bug:'#90C12C',
  rock:'#C9BB8A', ghost:'#5269AD', dragon:'#0B6DC3', dark:'#5A5366',
  steel:'#5A8EA2', fairy:'#EC8FE6',
}

const STAT_LABELS = {
  hp:'PV', attack:'Atq', defense:'Déf',
  'special-attack':'Atq.Sp', 'special-defense':'Déf.Sp', speed:'Vitesse',
}

const NATURES = {
  hardy:null, bashful:null, docile:null, quirky:null, serious:null,
  lonely:['attack','defense'], brave:['attack','speed'],
  adamant:['attack','special-attack'], naughty:['attack','special-defense'],
  bold:['defense','attack'], relaxed:['defense','speed'],
  impish:['defense','special-attack'], lax:['defense','special-defense'],
  timid:['speed','attack'], hasty:['speed','defense'],
  jolly:['speed','special-attack'], naive:['speed','special-defense'],
  modest:['special-attack','attack'], mild:['special-attack','defense'],
  quiet:['special-attack','speed'], rash:['special-attack','special-defense'],
  calm:['special-defense','attack'], gentle:['special-defense','defense'],
  sassy:['special-defense','speed'], careful:['special-defense','special-attack'],
}

const NATURE_FR = {
  hardy:'Hardi', bashful:'Pudique', docile:'Docile', quirky:'Bizarre', serious:'Sérieux',
  lonely:'Solitaire', brave:'Brave', adamant:'Ferme', naughty:'Mauvais',
  bold:'Assuré', relaxed:'Relax', impish:'Malin', lax:'Lâche',
  timid:'Timide', hasty:'Pressé', jolly:'Jovial', naive:'Naïf',
  modest:'Modeste', mild:'Doux', quiet:'Discret', rash:'Foufou',
  calm:'Calme', gentle:'Gentil', sassy:'Culot', careful:'Prudent',
}

const GROWTH_RATE_FR = {
  slow:'Lente', medium:'Moyenne', fast:'Rapide',
  'medium-slow':'Mi-lente', 'slow-then-very-fast':'Fluctuante',
  'fast-then-very-slow':'Capricieuse',
}

const COLOR_FR = {
  black:'Noir', blue:'Bleu', brown:'Marron', gray:'Gris',
  green:'Vert', pink:'Rose', purple:'Violet', red:'Rouge',
  white:'Blanc', yellow:'Jaune',
}

const EGG_GROUP_FR = {
  monster:'Monstre', water1:'Eau 1', water2:'Eau 2', water3:'Eau 3',
  bug:'Insecte', flying:'Vol', field:'Terrestre', fairy:'Fée',
  plant:'Végétal', humanshape:'Humanoïde', mineral:'Minéral',
  indeterminate:'Indéfini', ditto:'Métamorph', dragon:'Dragon',
  'no-eggs':'Sans œufs',
}

const POKEBALLS = [
  { id:'poke',   name:'Poké Ball',   rate:1 },
  { id:'great',  name:'Super Ball',  rate:1.5 },
  { id:'ultra',  name:'Hyper Ball',  rate:2 },
  { id:'master', name:'Master Ball', rate:255 },
  { id:'safari', name:'Safari Ball', rate:1.5 },
  { id:'net',    name:'Filet Ball',  rate:3 },
  { id:'dive',   name:'Plong. Ball', rate:3.5 },
  { id:'repeat', name:'Bis Ball',    rate:3 },
  { id:'luxury', name:'Luxe Ball',   rate:1 },
]

const STATUS_MODS = [
  { id:'none',  name:'Aucun',                        mod:1 },
  { id:'burn',  name:'Paralysie / Brûlure / Poison', mod:1.5 },
  { id:'sleep', name:'Sommeil / Glace',              mod:2 },
]

// ─── UTILITAIRES ──────────────────────────────────────────────────────────────

function calcStat(base, iv, ev, level, natureName, statName) {
  const evContrib = Math.floor(ev / 4)
  if (statName === 'hp') {
    return Math.floor(((2 * base + iv + evContrib) * level / 100) + level + 10)
  }
  const raw = Math.floor(((2 * base + iv + evContrib) * level / 100) + 5)
  const n = NATURES[natureName]
  const mod = n ? (n[0] === statName ? 1.1 : n[1] === statName ? 0.9 : 1) : 1
  return Math.floor(raw * mod)
}

function calcCaptureProb(captureRate, hp, maxHP, ballRate, statusMod) {
  const a = Math.min(255, Math.floor(((3 * maxHP - 2 * hp) / (3 * maxHP)) * captureRate * ballRate * statusMod))
  if (a >= 255) return 100
  const b = Math.floor(65536 / Math.pow(255 / a, 3 / 8))
  return Math.min(100, Math.pow(b / 65536, 4) * 100)
}

async function loadSpeciesNames(ids) {
  const needed = ids.filter(id => !SPECIES_FR.has(id))
  await Promise.all(needed.map(async id => {
    try {
      const d = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${id}/`).then(r => r.json())
      SPECIES_FR.set(String(id), d.names.find(n => n.language.name === 'fr')?.name || d.name)
    } catch { SPECIES_FR.set(String(id), String(id)) }
  }))
}

function flattenChain(chain) {
  if (!chain) return []
  const out = []
  function walk(node) {
    const id = node.species.url.split('/').filter(Boolean).pop()
    out.push({ id, name: node.species.name, details: node.evolution_details[0] || null })
    for (const child of node.evolves_to) walk(child)
  }
  walk(chain)
  return out
}

function computeDefense(typeDataList) {
  const ALL = Object.keys(TYPE_FR)
  return ALL.reduce((chart, atkType) => {
    let mult = 1
    for (const td of typeDataList) {
      const dr = td.damage_relations
      if (dr.double_damage_from.some(t => t.name === atkType)) mult *= 2
      if (dr.half_damage_from.some(t  => t.name === atkType)) mult *= 0.5
      if (dr.no_damage_from.some(t    => t.name === atkType)) mult *= 0
    }
    chart[atkType] = mult
    return chart
  }, {})
}

// ─── COMPOSANTS DE BASE (Apple redesign) ─────────────────────────────────────

function Row({ label, value }) {
  return (
    <div className="pdd-row">
      <span className="pdd-row-label">{label}</span>
      <span className="pdd-row-value">{value ?? '—'}</span>
    </div>
  )
}

function TypeBadge({ type }) {
  return (
    <span className="pdx-badge" style={{ '--tc': TYPE_COLORS[type] || '#888' }}>
      {TYPE_FR[type] || type}
    </span>
  )
}

function StatBar({ name, value, index }) {
  const color = value > 80 ? '#34c759' : value > 49 ? '#ff9f0a' : '#ff3b30'
  return (
    <div className="pdd-stat">
      <span className="pdd-stat-name">{STAT_LABELS[name] || name}</span>
      <span className="pdd-stat-val" style={{ color }}>{value}</span>
      <div className="pdd-stat-track">
        <div
          className="pdd-stat-fill"
          style={{
            width: `${(value / 255) * 100}%`,
            background: color,
            animationDelay: `${(index || 0) * 90}ms`,
          }}
        />
      </div>
    </div>
  )
}

function Section({ title, game, children, style }) {
  return (
    <div className="pdd-section" style={style}>
      {title && (
        <h3 className="pdd-section-title" style={{ color: game.color }}>
          {title}
        </h3>
      )}
      {children}
    </div>
  )
}

// ─── STYLE INPUTS LIGHT ───────────────────────────────────────────────────────

const inputStyle = {
  width: '100%',
  background: '#f5f5f7',
  border: '1.5px solid #e5e5ea',
  borderRadius: '8px',
  color: '#1d1d1f',
  padding: '5px 8px',
  fontSize: '0.8rem',
  fontFamily: 'system-ui, -apple-system, sans-serif',
  outline: 'none',
}

// ─── ONGLET INFO ──────────────────────────────────────────────────────────────

function StatRadar({ pokemon }) {
  const LABELS = ['PV', 'ATK', 'DEF', 'SP.A', 'SP.D', 'VIT']
  const KEYS   = ['hp', 'attack', 'defense', 'special-attack', 'special-defense', 'speed']
  const MAX    = 150
  const cx = 110, cy = 110, r = 70, n = 6

  const vals = KEYS.map(k => pokemon.stats.find(s => s.stat.name === k)?.base_stat || 0)
  const tc   = TYPE_COLORS[pokemon.types[0]?.type.name] || '#888'

  const pt = (i, ratio) => {
    const a = (Math.PI * 2 * i) / n - Math.PI / 2
    return [cx + r * ratio * Math.cos(a), cy + r * ratio * Math.sin(a)]
  }

  const dataPolygon = vals.map((v, i) => pt(i, Math.min(v, MAX) / MAX).join(',')).join(' ')

  return (
    <svg viewBox="0 0 220 220" width="100%" style={{ maxWidth: 220, display:'block', margin:'0 auto' }}>
      {[0.25, 0.5, 0.75, 1].map(ratio => (
        <polygon
          key={ratio}
          points={KEYS.map((_, i) => pt(i, ratio).join(',')).join(' ')}
          fill={ratio === 1 ? `color-mix(in srgb, ${tc} 8%, transparent)` : 'none'}
          stroke={ratio === 1 ? `${tc}44` : 'rgba(0,0,0,0.07)'}
          strokeWidth="0.8"
        />
      ))}
      {KEYS.map((_, i) => {
        const [x, y] = pt(i, 1)
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="rgba(0,0,0,0.07)" strokeWidth="0.8" />
      })}
      <polygon points={dataPolygon} fill={`${tc}2e`} stroke={tc} strokeWidth="1.8" strokeLinejoin="round" />
      {LABELS.map((label, i) => {
        const [x, y] = pt(i, 1.34)
        return (
          <g key={i}>
            <text x={x} y={y - 2}  textAnchor="middle" fontSize="8"   fontWeight="700" fill="#888" fontFamily="system-ui,-apple-system,sans-serif">{label}</text>
            <text x={x} y={y + 8.5} textAnchor="middle" fontSize="7.5" fill="#aaa"     fontFamily="system-ui,-apple-system,sans-serif">{vals[i]}</text>
          </g>
        )
      })}
    </svg>
  )
}

function InfoTab({ pokemon, species, game }) {
  const [hp,     setHp]     = useState(50)
  const [maxHP,  setMaxHP]  = useState(100)
  const [ball,   setBall]   = useState('poke')
  const [status, setStatus] = useState('none')
  const [shiny,  setShiny]  = useState(false)
  const [zoom,   setZoom]   = useState(false)

  useEffect(() => {
    if (!zoom) return
    const onKey = e => { if (e.key === 'Escape') setZoom(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [zoom])

  const captureRate = species.capture_rate
  const ballRate    = POKEBALLS.find(b => b.id === ball)?.rate || 1
  const statusMod   = STATUS_MODS.find(s => s.id === status)?.mod || 1
  const prob        = calcCaptureProb(captureRate, hp, maxHP, ballRate, statusMod)

  const heightM  = pokemon.height / 10
  const weightKg = pokemon.weight / 10
  const genus    = species.genera.find(g => g.language.name === 'fr')?.genus || ''

  const flavorText = (
    species.flavor_text_entries.find(f => f.language.name === 'fr' && VERS[game.id]?.includes(f.version.name)) ||
    species.flavor_text_entries.find(f => f.language.name === 'fr')
  )?.flavor_text?.replace(/\n|\f/g, ' ') || ''

  const HUMAN_H    = 1.70
  const containerH = 160
  const maxH       = Math.max(heightM, HUMAN_H)
  const scale      = containerH / maxH
  const humanPx    = HUMAN_H * scale
  const pokePx     = heightM * scale

  const evYield = pokemon.stats.filter(s => s.effort > 0)
    .map(s => `+${s.effort} ${STAT_LABELS[s.stat.name]}`).join(', ')

  const primaryType  = pokemon.types[0]?.type.name
  const tc           = TYPE_COLORS[primaryType] || '#888'
  const normalSprite = pokemon.sprites.other['official-artwork'].front_default || pokemon.sprites.front_default
  const shinySprite  = normalSprite?.replace('/official-artwork/', '/official-artwork/shiny/')

  return (
    <div className="pdd-tab-content">

      {/* Description Pokédex */}
      {flavorText && (
        <div className="pdd-flavor" style={{ borderLeftColor: game.color }}>
          {flavorText}
        </div>
      )}

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.85rem' }}>

        {/* Carte sprite avec toggle shiny + zoom */}
        <div
          className={`pdx-card pdd-info-sprite-card${shiny ? ' pdx-card-shiny' : ''}`}
          style={{ '--tc': tc }}
          onClick={() => setShiny(s => !s)}
        >
          {/* Bouton zoom — coin haut-gauche */}
          <button
            className="pdd-zoom-btn"
            onClick={e => { e.stopPropagation(); setZoom(true) }}
            title="Voir en grand"
          >
            ⤢
          </button>

          {/* Bouton shiny — coin haut-droite */}
          <button
            className={`pdx-shiny-btn${shiny ? ' pdx-shiny-active' : ''}`}
            onClick={e => { e.stopPropagation(); setShiny(s => !s) }}
            title="Forme chromatique"
          >
            ✦
          </button>

          <div className="pdx-card-top pdd-info-sprite-top">
            <img
              src={shiny ? shinySprite : normalSprite}
              alt=""
              className={`pdx-sprite${shiny ? ' pdx-sprite-shiny' : ''}`}
              style={{ width:'140px', height:'140px' }}
              onError={e => { e.currentTarget.src = normalSprite; setShiny(false) }}
            />
          </div>

          <div className="pdx-card-bot">
            <div className="pdx-types" style={{ marginBottom:'0.4rem' }}>
              {pokemon.types.map(t => (
                <span key={t.type.name} className="pdx-badge" style={{ '--tc': TYPE_COLORS[t.type.name] || '#888' }}>
                  {TYPE_FR[t.type.name] || t.type.name}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Overlay plein écran */}
        {zoom && (
          <div className="pdd-zoom-overlay" onClick={() => setZoom(false)}>
            <div className="pdd-zoom-inner" onClick={e => e.stopPropagation()}>

              <button className="pdd-zoom-close" onClick={() => setZoom(false)}>✕</button>

              <img
                src={shiny ? shinySprite : normalSprite}
                alt=""
                className={`pdd-zoom-sprite${shiny ? ' pdx-sprite-shiny' : ''}`}
                onError={e => { e.currentTarget.src = normalSprite; setShiny(false) }}
              />

              <button
                className={`pdd-zoom-shiny-btn${shiny ? ' active' : ''}`}
                onClick={() => setShiny(s => !s)}
              >
                ✦ {shiny ? 'Chromatique' : 'Normal'}
              </button>

              <p className="pdd-zoom-esc">Échap ou clic pour fermer</p>
            </div>
          </div>
        )}

        {/* Infos physiques */}
        <Section title="Infos physiques" game={game}>
          <Row label="Taille"             value={`${heightM.toFixed(1)} m`} />
          <Row label="Poids"              value={`${weightKg.toFixed(1)} kg`} />
          <Row label="Catégorie"          value={genus} />
          <Row label="Couleur"            value={COLOR_FR[species.color?.name] || species.color?.name} />
          <Row label="Bonheur de base"    value={species.base_happiness} />
          <Row label="Taux de croissance" value={GROWTH_RATE_FR[species.growth_rate?.name] || species.growth_rate?.name} />
          <Row label="Exp. de base"       value={pokemon.base_experience} />
          <Row label="Gain EV"            value={evYield || '—'} />
        </Section>
      </div>

      {/* Radar stats */}
      <Section title="Statistiques de base" game={game}>
        <StatRadar pokemon={pokemon} />
      </Section>

      {/* Calculateur de capture */}
      <Section title="Taux de capture" game={game}>
        <div style={{ display:'flex', gap:'0.5rem', alignItems:'center', marginBottom:'0.85rem', flexWrap:'wrap' }}>
          <span style={{ fontSize:'0.78rem', color:'#555' }}>Taux de base :</span>
          <strong style={{ color: game.color }}>{captureRate}/255</strong>
          <span style={{ fontSize:'0.72rem', color:'#999' }}>
            ({Math.round(captureRate / 2.55)}% à pleine santé avec Poké Ball)
          </span>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'0.5rem', marginBottom:'0.85rem' }}>
          {[
            { label:'PV actuels', el: <input type="number" min="1" max={maxHP} value={hp} onChange={e => setHp(Math.max(1,Math.min(maxHP,+e.target.value)))} /> },
            { label:'PV max',     el: <input type="number" min="1" max="999"  value={maxHP} onChange={e => setMaxHP(Math.max(hp,+e.target.value))} /> },
            { label:'Poké Ball',  el: <select value={ball}   onChange={e => setBall(e.target.value)}>{POKEBALLS.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select> },
            { label:'Statut',     el: <select value={status} onChange={e => setStatus(e.target.value)}>{STATUS_MODS.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select> },
          ].map(({ label, el }) => (
            <div key={label}>
              <label style={{ fontSize:'0.62rem', color:'#999', display:'block', marginBottom:'3px' }}>{label}</label>
              {el.type === 'input'
                ? <input {...el.props} style={{ ...inputStyle }} />
                : <select {...el.props} style={{ ...inputStyle }}>{el.props.children}</select>}
            </div>
          ))}
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:'1rem' }}>
          <div className="pdd-capture-track">
            <div style={{
              width:`${prob}%`, height:'100%', borderRadius:'999px', transition:'width 0.3s',
              background:`linear-gradient(90deg, #ff6b6b, ${game.color})`,
            }} />
          </div>
          <span style={{ fontSize:'1rem', fontWeight:'700', color: game.color, minWidth:'50px', textAlign:'right' }}>
            {prob.toFixed(1)}%
          </span>
        </div>
      </Section>

      {/* Chasse au chromatique */}
      <Section title="Chasse au Chromatique" game={game}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.6rem' }}>
          {[
            { label:'Gen 2–5 (standard)',     rate:'1/8 192', pct:'0,012%', color:'#9b59b6' },
            { label:'Gen 6+ (standard)',       rate:'1/4 096', pct:'0,024%', color:'#e74c3c' },
            { label:'Charme Chroma (Gen 6+)',  rate:'3/4 096', pct:'0,073%', color:'#e67e22' },
            { label:'Méthode Masuda (Gen 4+)', rate:'6/8 192', pct:'0,073%', color:'#27ae60' },
          ].map(({ label, rate, pct, color }) => (
            <div key={label} className="pdd-shiny-card" style={{ borderLeftColor: color }}>
              <p style={{ fontSize:'0.62rem', color:'#999', marginBottom:'2px' }}>{label}</p>
              <p style={{ fontSize:'0.9rem', fontWeight:'700', color }}>{rate}</p>
              <p style={{ fontSize:'0.65rem', color:'#bbb' }}>≈ {pct}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Comparaison taille — déplacée en bas */}
      <Section title="Taille comparée" game={game} style={{ display:'flex', flexDirection:'column' }}>
        <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'center', gap:'2.5rem', paddingBottom:'0.25rem' }}>
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'4px' }}>
            <svg width="26" height={humanPx} viewBox="0 0 26 100" preserveAspectRatio="xMidYMax meet" style={{ overflow:'visible' }}>
              <circle cx="13" cy="8"  r="7"  fill="#c8cad8" />
              <rect x="7"  y="17" width="12" height="30" rx="4"   fill="#c8cad8" />
              <rect x="2"  y="19" width="5"  height="20" rx="2.5" fill="#c8cad8" />
              <rect x="19" y="19" width="5"  height="20" rx="2.5" fill="#c8cad8" />
              <rect x="7"  y="45" width="5"  height="26" rx="2.5" fill="#c8cad8" />
              <rect x="14" y="45" width="5"  height="26" rx="2.5" fill="#c8cad8" />
            </svg>
            <span style={{ fontSize:'0.6rem', color:'#999' }}>1,70 m</span>
          </div>
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'4px' }}>
            <img
              src={normalSprite}
              alt=""
              style={{ height:`${pokePx}px`, maxWidth:'80px', objectFit:'contain' }}
            />
            <span style={{ fontSize:'0.6rem', color: game.color }}>{heightM.toFixed(1)} m</span>
          </div>
        </div>
      </Section>
    </div>
  )
}

// ─── ONGLET STATS ─────────────────────────────────────────────────────────────

function StatsTab({ pokemon, game }) {
  const [level,  setLevel]  = useState(50)
  const [nature, setNature] = useState('hardy')
  const [ivs, setIvs] = useState(Object.fromEntries(pokemon.stats.map(s => [s.stat.name, 31])))
  const [evs, setEvs] = useState(Object.fromEntries(pokemon.stats.map(s => [s.stat.name, 0])))

  const total  = pokemon.stats.reduce((s, st) => s + st.base_stat, 0)
  const natArr = NATURES[nature]

  return (
    <div className="pdd-tab-content">
      <Section title="Statistiques de base" game={game}>
        <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:'0.65rem' }}>
          <span style={{ fontSize:'0.72rem', color:'#999' }}>
            Total : <strong style={{ color:'#1d1d1f' }}>{total}</strong>
          </span>
        </div>
        {pokemon.stats.map((s, i) => (
          <StatBar key={s.stat.name} name={s.stat.name} value={s.base_stat} index={i} />
        ))}
      </Section>

      <Section title="Calculateur de stats" game={game}>
        <div style={{ display:'grid', gridTemplateColumns:'80px 1fr', gap:'0.75rem', alignItems:'center', marginBottom:'1rem' }}>
          <div>
            <label style={{ fontSize:'0.62rem', color:'#999', display:'block', marginBottom:'3px' }}>Niveau</label>
            <input type="range" min="1" max="100" value={level} onChange={e => setLevel(+e.target.value)}
              style={{ width:'100%', accentColor: game.color }} />
            <span style={{ fontSize:'0.85rem', fontWeight:'700', color: game.color }}>{level}</span>
          </div>
          <div>
            <label style={{ fontSize:'0.62rem', color:'#999', display:'block', marginBottom:'3px' }}>Nature</label>
            <select value={nature} onChange={e => setNature(e.target.value)} style={{ ...inputStyle }}>
              {Object.entries(NATURE_FR).map(([id, fr]) => (
                <option key={id} value={id}>{fr}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ overflowX:'auto' }}>
          <table className="pdd-calc-table">
            <thead>
              <tr>
                {['Stat','Base','IV (0–31)','EV (0–252)','= Total'].map(h => (
                  <th key={h} style={{ textAlign: h === 'Stat' ? 'left' : 'center' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pokemon.stats.map(s => {
                const sn       = s.stat.name
                const boost    = natArr && natArr[0] === sn
                const drop     = natArr && natArr[1] === sn
                const natColor = boost ? '#34c759' : drop ? '#ff3b30' : undefined
                const computed = calcStat(s.base_stat, ivs[sn] ?? 31, evs[sn] ?? 0, level, nature, sn)
                return (
                  <tr key={sn}>
                    <td style={{ color: natColor || '#555', fontWeight:'600' }}>{STAT_LABELS[sn]}</td>
                    <td style={{ textAlign:'center', color:'#1d1d1f', fontWeight:'600' }}>{s.base_stat}</td>
                    <td style={{ textAlign:'center' }}>
                      <input type="number" min="0" max="31" value={ivs[sn] ?? 31}
                        onChange={e => setIvs(p => ({ ...p, [sn]: Math.max(0, Math.min(31, +e.target.value)) }))}
                        style={{ ...inputStyle, width:'52px', textAlign:'center' }} />
                    </td>
                    <td style={{ textAlign:'center' }}>
                      <input type="number" min="0" max="252" step="4" value={evs[sn] ?? 0}
                        onChange={e => setEvs(p => ({ ...p, [sn]: Math.max(0, Math.min(252, +e.target.value)) }))}
                        style={{ ...inputStyle, width:'52px', textAlign:'center' }} />
                    </td>
                    <td style={{ textAlign:'center', fontWeight:'700', color: natColor || game.color }}>{computed}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <p style={{ fontSize:'0.62rem', color:'#bbb', marginTop:'0.5rem' }}>
          Vert = boostée par la nature · Rouge = réduite
        </p>
      </Section>
    </div>
  )
}

// ─── ONGLET TYPES ─────────────────────────────────────────────────────────────

function TypesTab({ types, typeDataList, game }) {
  const defChart = computeDefense(typeDataList)

  const ROWS = [
    { mult:4,    label:'×4', color:'#ff3b30', bg:'#fff0ef' },
    { mult:2,    label:'×2', color:'#ff9f0a', bg:'#fff8ee' },
    { mult:0.5,  label:'×½', color:'#34c759', bg:'#f0faf3' },
    { mult:0.25, label:'×¼', color:'#007aff', bg:'#f0f5ff' },
    { mult:0,    label:'×0', color:'#8e8e93', bg:'#f5f5f7' },
    { mult:1,    label:'×1', color:'#c7c7cc', bg:'#f5f5f7' },
  ]

  const grouped = {}
  for (const [type, mult] of Object.entries(defChart)) {
    grouped[mult] = grouped[mult] || []
    grouped[mult].push(type)
  }

  function offChart(td) {
    const dr = td.damage_relations
    return {
      double: dr.double_damage_to.map(t => t.name),
      half:   dr.half_damage_to.map(t => t.name),
      none:   dr.no_damage_to.map(t => t.name),
    }
  }

  return (
    <div className="pdd-tab-content">

      <div style={{ display:'flex', gap:'0.4rem', justifyContent:'center' }}>
        {types.map(t => <TypeBadge key={t} type={t} />)}
      </div>

      <Section title="Efficacité défensive — reçoit X× les dégâts" game={game}>
        {ROWS.map(({ mult, label, color, bg }) =>
          grouped[mult]?.length ? (
            <div key={mult} style={{ marginBottom:'0.65rem' }}>
              <span style={{
                display:'inline-block', background: bg, color, border:`1px solid ${color}55`,
                borderRadius:'6px', padding:'1px 9px', fontSize:'0.7rem', fontWeight:'700',
                marginBottom:'0.35rem',
              }}>{label}</span>
              <div style={{ display:'flex', flexWrap:'wrap', gap:'4px' }}>
                {grouped[mult].map(t => <TypeBadge key={t} type={t} />)}
              </div>
            </div>
          ) : null
        )}
      </Section>

      {typeDataList.map((td, i) => {
        const off      = offChart(td)
        const typeName = types[i]
        return (
          <Section key={typeName} title={`Attaques ${TYPE_FR[typeName]} — inflige X×`} game={game}>
            {off.double.length > 0 && (
              <div style={{ marginBottom:'0.65rem' }}>
                <span style={{ fontSize:'0.7rem', color:'#ff9f0a', fontWeight:'700', marginRight:'0.5rem' }}>×2</span>
                <div style={{ display:'inline-flex', flexWrap:'wrap', gap:'4px' }}>
                  {off.double.map(t => <TypeBadge key={t} type={t} />)}
                </div>
              </div>
            )}
            {off.half.length > 0 && (
              <div style={{ marginBottom:'0.65rem' }}>
                <span style={{ fontSize:'0.7rem', color:'#34c759', fontWeight:'700', marginRight:'0.5rem' }}>×½</span>
                <div style={{ display:'inline-flex', flexWrap:'wrap', gap:'4px' }}>
                  {off.half.map(t => <TypeBadge key={t} type={t} />)}
                </div>
              </div>
            )}
            {off.none.length > 0 && (
              <div>
                <span style={{ fontSize:'0.7rem', color:'#8e8e93', fontWeight:'700', marginRight:'0.5rem' }}>×0</span>
                <div style={{ display:'inline-flex', flexWrap:'wrap', gap:'4px' }}>
                  {off.none.map(t => <TypeBadge key={t} type={t} />)}
                </div>
              </div>
            )}
          </Section>
        )
      })}
    </div>
  )
}

// ─── ONGLET ÉVOLUTIONS ────────────────────────────────────────────────────────

function triggerLabel(details) {
  if (!details) return null
  const t = details.trigger?.name
  if (t === 'level-up') {
    if (details.min_level)     return `Niv. ${details.min_level}`
    if (details.min_happiness) return `Bonheur ≥${details.min_happiness}`
    return 'Niveau'
  }
  if (t === 'use-item') {
    const itemName = details.item?.name || ''
    return ITEM_FR[itemName] || slugToTitle(itemName)
  }
  if (t === 'trade') return 'Échange'
  if (t === 'shed')  return 'Mue'
  return slugToTitle(t || '?')
}

function EvolutionTab({ chain, pokemonId, game }) {
  const entries = flattenChain(chain)
  const BANNED  = ['-mega','-gmax','-alola','-galar','-hisui','-paldea','-totem','-primal']
  const valid   = entries.filter(e => !BANNED.some(s => e.name.includes(s)))
  const [namesReady, setNamesReady] = useState(false)

  useEffect(() => {
    const ids = valid.map(e => e.id)
    loadSpeciesNames(ids).then(() => setNamesReady(true))
  }, [chain])

  return (
    <div className="pdd-tab-content">
      <Section title="Chaîne d'évolution" game={game}>
        <div style={{ display:'flex', alignItems:'center', flexWrap:'wrap', gap:'0.5rem', justifyContent:'center' }}>
          {valid.map((entry, i) => {
            const isCurrent = String(entry.id) === String(pokemonId)
            const label     = triggerLabel(entry.details)
            return (
              <div key={entry.id} style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
                {i > 0 && label && (
                  <div style={{ textAlign:'center', fontSize:'0.7rem', color:'#999' }}>
                    <div>→</div>
                    <div style={{ maxWidth:'60px' }}>{label}</div>
                  </div>
                )}
                <div className={`pdd-evo-node${isCurrent ? ' pdd-evo-current' : ''}`}
                  style={isCurrent ? { borderColor: game.color, background: `${game.color}12` } : {}}>
                  <img
                    src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${entry.id}.png`}
                    alt={entry.name}
                    style={{ width:'60px', height:'60px', objectFit:'contain' }}
                  />
                  <p style={{ fontSize:'0.65rem', color: isCurrent ? game.color : '#999', textTransform:'capitalize', marginTop:'3px' }}>
                    {SPECIES_FR.get(String(entry.id)) || slugToTitle(entry.name)}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </Section>
    </div>
  )
}

// ─── ONGLET CAPACITÉS ─────────────────────────────────────────────────────────

function MovesTab({ pokemon, game }) {
  const [method,     setMethod]     = useState('level-up')
  const [namesReady, setNamesReady] = useState(false)
  const vgs = VG[game.id] || []

  useEffect(() => {
    const allNames = pokemon.moves.map(m => m.move.name)
    loadMoveNames(allNames).then(() => setNamesReady(true))
  }, [pokemon.id])

  const METHODS = [
    { key:'level-up', label:'📈 Niveau' },
    { key:'machine',  label:'💿 CT / CS' },
    { key:'egg',      label:'🥚 Œuf' },
    { key:'tutor',    label:'🎓 Tuteur' },
  ]

  const moves = pokemon.moves
    .flatMap(m => {
      const match = m.version_group_details.find(
        v => vgs.includes(v.version_group.name) && v.move_learn_method.name === method
      )
      if (!match) return []
      return [{ name: m.move.name, level: match.level_learned_at }]
    })
    .sort((a, b) => (a.level || 0) - (b.level || 0))

  return (
    <div className="pdd-tab-content">
      <div style={{ display:'flex', gap:'0.35rem', marginBottom:'1rem', flexWrap:'wrap' }}>
        {METHODS.map(m => (
          <button key={m.key} onClick={() => setMethod(m.key)} className={`pdd-method-btn${method === m.key ? ' active' : ''}`}
            style={method === m.key ? { background: game.color, borderColor: game.color, color:'#fff' } : {}}>
            {m.label}
          </button>
        ))}
        {!namesReady && (
          <span style={{ fontSize:'0.65rem', color:'#bbb', alignSelf:'center', marginLeft:'4px' }}>
            Traduction en cours…
          </span>
        )}
      </div>

      {moves.length === 0 ? (
        <p style={{ textAlign:'center', color:'#bbb', padding:'2rem', fontSize:'0.85rem' }}>
          Aucune capacité de ce type pour {game.name}.
        </p>
      ) : (
        <div style={{ display:'grid', gap:'4px' }}>
          {moves.map(m => (
            <div key={m.name} className="pdd-move-row">
              {method === 'level-up' && (
                <span className="pdd-move-level" style={{ color: game.color }}>
                  {m.level === 0 ? '—' : m.level}
                </span>
              )}
              <span className="pdd-move-name">
                {MOVE_FR.get(m.name) || slugToTitle(m.name)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── ONGLET ÉLEVAGE ───────────────────────────────────────────────────────────

function BreedingTab({ species, game }) {
  const gr        = species.gender_rate
  const femalePct = gr === -1 ? null : (gr / 8) * 100
  const malePct   = femalePct === null ? null : 100 - femalePct
  const steps     = (species.hatch_counter + 1) * 255

  return (
    <div className="pdd-tab-content">
      <Section title="Reproduction" game={game}>
        <Row label="Groupes d'œufs"    value={species.egg_groups.map(e => EGG_GROUP_FR[e.name] || e.name).join(', ')} />
        <Row label="Pas d'éclosion"    value={`${steps.toLocaleString()} pas`} />
        <Row label="Cycles d'éclosion" value={`${species.hatch_counter} cycles`} />

        {gr === -1 ? (
          <Row label="Sexe" value="Asexué" />
        ) : (
          <div style={{ paddingTop:'8px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'5px' }}>
              <span style={{ fontSize:'0.72rem', color:'#999' }}>Ratio de genre</span>
              <span style={{ fontSize:'0.72rem', color:'#555' }}>♂ {malePct}% / ♀ {femalePct}%</span>
            </div>
            <div style={{ display:'flex', borderRadius:'999px', overflow:'hidden', height:'8px' }}>
              <div style={{ width:`${malePct}%`, background:'#4D90D5' }} />
              <div style={{ width:`${femalePct}%`, background:'#F97176' }} />
            </div>
          </div>
        )}
      </Section>
    </div>
  )
}

// ─── ONGLET LOCALISATIONS ─────────────────────────────────────────────────────

// ─── INDEX FIRERED (zones → pokémon) ─────────────────────────────────────────

const FR_ENC_METHOD = {
  grass:       'Herbes hautes',
  surf:        'Surf',
  fish:        'Pêche',
  cave:        'Grotte',
  'cave-rdc':  'Grotte (RdC)',
  'cave-b1':   'Grotte (B1)',
  'cave-b2':   'Grotte (B2)',
  'cave-b3':   'Grotte (B3)',
  'eclate-roc':'Éclate-Roc',
}

const FR_LOCATION_LOOKUP = (() => {
  const zoneToChapter = new Map()
  for (const ch of CHAPTERS) {
    for (const zid of ch.zoneIds) zoneToChapter.set(zid, ch.label)
  }
  const map = new Map()
  for (const zone of ZONES) {
    for (const enc of (zone.encounters || [])) {
      for (const poke of (enc.pokemon || [])) {
        if (!map.has(poke.id)) map.set(poke.id, [])
        map.get(poke.id).push({
          zoneName:     zone.name,
          zoneIcon:     zone.icon || '📍',
          method:       enc.method,
          rate:         poke.rate,
          chapterLabel: zoneToChapter.get(zone.id) || '',
        })
      }
    }
  }
  return map
})()

// ─── ONGLET LOCALISATIONS ─────────────────────────────────────────────────────

const SPECIAL_METHOD = {
  'gift':      { label:'Cadeau',      icon:'🎁' },
  'gift-egg':  { label:'Œuf cadeau',  icon:'🥚' },
  'only-one':  { label:'Unique',      icon:'⭐' },
  'npc-trade': { label:'Échange PNJ', icon:'🔄' },
}

const WILD_METHOD_FR = {
  walk:'Herbes hautes', surf:'Surf', 'old-rod':'Vieille Canne',
  'good-rod':'Super Canne', 'super-rod':'Hyper Canne', 'rock-smash':'Brise-roc',
  headbutt:'Coup de boule', 'dark-grass':'Herbes folles', seaweed:'Algues',
  pokeflute:'Flûte Poké', 'squirt-bottle':'Flacon',
  roaming:'Errant', 'roaming-grass':'Errant', 'roaming-water':'Errant (Eau)',
}

function LocationTab({ encounters, game, pokemonId }) {
  const [namesReady, setNamesReady] = useState(false)
  const versions = VERS[game.id] || []
  const frLocations = game.id === 'firered'
    ? (FR_LOCATION_LOOKUP.get(Number(pokemonId)) || [])
    : []

  const relevant = encounters.filter(e =>
    e.version_details.some(v => versions.includes(v.version.name))
  )

  useEffect(() => {
    const areaNames = relevant.map(e => e.location_area.name)
    loadAreaNames(areaNames).then(() => setNamesReady(true))
  }, [encounters, game.id])

  const entries = []
  for (const e of relevant) {
    const vd = e.version_details.find(v => versions.includes(v.version.name))
    if (!vd) continue
    const seen = new Set()
    for (const ed of vd.encounter_details) {
      const key = `${e.location_area.name}|${ed.method.name}`
      if (seen.has(key)) continue
      seen.add(key)
      entries.push({ areaName: e.location_area.name, method: ed.method.name, chance: ed.chance })
    }
  }

  const special = entries.filter(e => SPECIAL_METHOD[e.method])
  const wild    = entries.filter(e => !SPECIAL_METHOD[e.method])

  const areaLabel = (name) =>
    namesReady ? (AREA_FR.get(name) || slugToTitle(name)) : slugToTitle(name)

  if (entries.length === 0 && frLocations.length === 0) {
    return (
      <div className="pdd-tab-content">
        <Section title={`Obtention dans ${game.name}`} game={game}>
          <p style={{ textAlign:'center', color:'#bbb', padding:'1rem', fontSize:'0.85rem' }}>
            Non disponible dans ce jeu.
          </p>
        </Section>
      </div>
    )
  }

  return (
    <div className="pdd-tab-content">

      {/* Guide FireRed curated */}
      {frLocations.length > 0 && (
        <Section title="Guide Rouge Feu" game={game}>
          <div style={{ display:'grid', gap:'5px' }}>
            {frLocations.map((loc, i) => (
              <div key={i} className="pdd-loc-wild">
                <div>
                  <span style={{ fontSize:'0.75rem', color:'#1d1d1f', display:'block', fontWeight:'500' }}>
                    {loc.zoneIcon} {loc.zoneName}
                  </span>
                  <span style={{ fontSize:'0.62rem', color:'#bbb' }}>
                    {FR_ENC_METHOD[loc.method] || loc.method}
                    {loc.chapterLabel ? ` · ${loc.chapterLabel.split('—')[0].trim()}` : ''}
                  </span>
                </div>
                {loc.rate > 0 && (
                  <span style={{ fontSize:'0.72rem', color: game.color, flexShrink:0, fontWeight:'600' }}>
                    {loc.rate}%
                  </span>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {special.length > 0 && (
        <Section title="Obtention spéciale" game={game}>
          <div style={{ display:'grid', gap:'5px' }}>
            {special.map((e, i) => {
              const meta = SPECIAL_METHOD[e.method]
              return (
                <div key={i} className="pdd-loc-special" style={{ borderLeftColor: game.color }}>
                  <span style={{ fontSize:'1rem', flexShrink:0 }}>{meta.icon}</span>
                  <div>
                    <span style={{ fontSize:'0.72rem', fontWeight:'700', color: game.color, display:'block' }}>
                      {meta.label}
                    </span>
                    <span style={{ fontSize:'0.72rem', color:'#555' }}>{areaLabel(e.areaName)}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </Section>
      )}

      {wild.length > 0 && (
        <Section title="Rencontres sauvages" game={game}>
          <div style={{ display:'grid', gap:'5px' }}>
            {wild.map((e, i) => (
              <div key={i} className="pdd-loc-wild">
                <div>
                  <span style={{ fontSize:'0.75rem', color:'#555', display:'block' }}>
                    {areaLabel(e.areaName)}
                  </span>
                  <span style={{ fontSize:'0.62rem', color:'#bbb' }}>
                    {WILD_METHOD_FR[e.method] || slugToTitle(e.method)}
                  </span>
                </div>
                {e.chance > 0 && (
                  <span style={{ fontSize:'0.72rem', color: game.color, flexShrink:0, fontWeight:'600' }}>
                    {e.chance}%
                  </span>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  )
}

// ─── ONGLET DIVERS ────────────────────────────────────────────────────────────

function MiscTab({ pokemon, species, game }) {
  const [namesReady, setNamesReady] = useState(false)

  useEffect(() => {
    const abilityNames = pokemon.abilities.map(a => a.ability.name)
    loadAbilityNames(abilityNames).then(() => setNamesReady(true))
  }, [pokemon.id])

  const PAL_PARK_AREA_FR = {
    field:'Terrain', forest:'Forêt', mountain:'Montagne',
    pond:'Étang', sea:'Mer', cave:'Grotte',
  }

  return (
    <div className="pdd-tab-content">

      <Section title="Talents" game={game}>
        {pokemon.abilities.map(a => (
          <div key={a.ability.name} className="pdd-ability-row">
            <span style={{ fontSize:'0.82rem', color: a.is_hidden ? '#bbb' : '#1d1d1f' }}>
              {namesReady
                ? (ABILITY_FR.get(a.ability.name) || slugToTitle(a.ability.name))
                : slugToTitle(a.ability.name)}
            </span>
            {a.is_hidden && (
              <span className="pdd-hidden-tag">Caché</span>
            )}
          </div>
        ))}
      </Section>

      {pokemon.held_items.length > 0 && (
        <Section title="Objets tenus (sauvage)" game={game}>
          {pokemon.held_items.map(hi => {
            const vd = hi.version_details.find(v => VERS[game.id]?.includes(v.version.name))
              || hi.version_details[0]
            return (
              <div key={hi.item.name} className="pdd-row">
                <span className="pdd-row-value" style={{ color:'#1d1d1f' }}>{slugToTitle(hi.item.name)}</span>
                <span style={{ fontSize:'0.72rem', color: game.color, fontWeight:'600' }}>{vd?.rarity}%</span>
              </div>
            )
          })}
        </Section>
      )}

      {species.pal_park_encounters?.length > 0 && (
        <Section title="Parc des Amis" game={game}>
          {species.pal_park_encounters.map(pp => (
            <div key={pp.area.name} style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'0.5rem' }}>
              <Row label="Zone"       value={PAL_PARK_AREA_FR[pp.area.name] || slugToTitle(pp.area.name)} />
              <Row label="Score base" value={pp.base_score} />
              <Row label="Taux"       value={pp.rate} />
            </div>
          ))}
        </Section>
      )}
    </div>
  )
}

// ─── COMPOSANT PRINCIPAL ──────────────────────────────────────────────────────

const TABS = [
  { key:'info',       label:'📋 Info' },
  { key:'stats',      label:'📊 Stats' },
  { key:'evolutions', label:'🔄 Évolutions' },
  { key:'types',      label:'⚡ Types' },
  { key:'moves',      label:'⚔️ Capacités' },
  { key:'breeding',   label:'🥚 Élevage' },
  { key:'locations',  label:'📍 Lieux' },
  { key:'misc',       label:'🔍 Divers' },
]

export default function PokemonDetail({ pokemonId, game, onBack, onOpenBugReport }) {
  const t = useT()
  const [tab,   setTab]   = useState('info')
  const [data,  setData]  = useState(null)
  const [shiny, setShiny] = useState(false)

  useEffect(() => {
    setData(null)
    setTab('info')
    setShiny(false)

    async function load() {
      try {
        const [pokeRes, speciesRes, encountersRes] = await Promise.all([
          fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonId}/`),
          fetch(`https://pokeapi.co/api/v2/pokemon-species/${pokemonId}/`),
          fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonId}/encounters`),
        ])
        const [pokemon, species, encounters] = await Promise.all([
          pokeRes.json(), speciesRes.json(), encountersRes.json(),
        ])
        const chain = species.evolution_chain
          ? await fetch(species.evolution_chain.url).then(r => r.json()).then(d => d.chain)
          : null
        const typeDataList = await Promise.all(
          pokemon.types.map(t => fetch(`https://pokeapi.co/api/v2/type/${t.type.name}/`).then(r => r.json()))
        )
        setData({ pokemon, species, encounters, chain, typeDataList })
      } catch (err) {
        console.error('PokemonDetail load error:', err)
        setData('error')
      }
    }

    load()
  }, [pokemonId])

  const primaryType = data?.pokemon.types[0]?.type.name
  const tc = TYPE_COLORS[primaryType] || '#888'

  if (!data || data === 'error') {
    return (
      <div className="pdd-wrapper" style={{ '--tc': tc, '--game-color': game.color }}>
        <div className="pdd-hero">
          <div className="pdd-back-row">
            <button className="pdd-back" onClick={onBack}>{t('pdx.back')}</button>
            {onOpenBugReport && (
              <button className="pdd-back pdd-bug-btn" onClick={onOpenBugReport} title={t('header.bug')} aria-label={t('header.bug')}>🐛</button>
            )}
          </div>
        </div>
        <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <p style={{ color:'#bbb', fontSize:'0.9rem', fontFamily:'system-ui,-apple-system,sans-serif' }}>
            {data === 'error' ? 'Impossible de charger ce Pokémon.' : 'Chargement…'}
          </p>
        </div>
      </div>
    )
  }

  const { pokemon, species, encounters, chain, typeDataList } = data
  const nameFr  = species.names.find(n => n.language.name === 'fr')?.name || pokemon.name
  const types   = pokemon.types.map(t => t.type.name)

  const normalSprite = pokemon.sprites.other['official-artwork'].front_default || pokemon.sprites.front_default
  const shinySprite  = normalSprite?.replace('/official-artwork/', '/official-artwork/shiny/')

  return (
    <div className="pdd-wrapper" style={{ '--tc': tc, '--game-color': game.color }}>

      {/* ── Hero ── */}
      <div className="pdd-hero">
        {normalSprite && (
          <img className="pdd-hero-bg" src={normalSprite} alt="" aria-hidden="true" />
        )}
        <span className="pdd-hero-watermark" aria-hidden="true">
          #{String(pokemonId).padStart(3, '0')}
        </span>

        <div className="pdd-back-row">
          <button className="pdd-back" onClick={onBack}>← Retour</button>
          {onOpenBugReport && (
            <button className="pdd-back pdd-bug-btn" onClick={onOpenBugReport} title="Signaler un bug" aria-label="Signaler un bug">🐛</button>
          )}
        </div>

        <div className="pdd-hero-meta">
          <p className="pdd-hero-num">#{String(pokemonId).padStart(3, '0')}</p>
          <h1 className="pdd-hero-name">{nameFr}</h1>
          <div className="pdd-hero-types">
            {types.map(t => <TypeBadge key={t} type={t} />)}
          </div>
        </div>
      </div>

      {/* ── Tab bar ── */}
      <div className="pdd-tabbar">
        <div className="pdd-tabbar-inner">
          {TABS.map(t => (
            <button
              key={t.key}
              className={`pdd-tab${tab === t.key ? ' active' : ''}`}
              style={tab === t.key ? { background: game.color, color:'#fff' } : {}}
              onClick={() => setTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Contenu ── */}
      <div className="pdd-content">
        <div style={{ maxWidth:'920px', margin:'0 auto' }}>
          {tab === 'info'       && <InfoTab pokemon={pokemon} species={species} game={game} />}
          {tab === 'stats'      && <StatsTab pokemon={pokemon} game={game} />}
          {tab === 'evolutions' && <EvolutionTab chain={chain} pokemonId={pokemonId} game={game} />}
          {tab === 'types'      && <TypesTab types={types} typeDataList={typeDataList} game={game} />}
          {tab === 'moves'      && <MovesTab pokemon={pokemon} game={game} />}
          {tab === 'breeding'   && <BreedingTab species={species} game={game} />}
          {tab === 'locations'  && <LocationTab encounters={encounters} game={game} pokemonId={pokemonId} />}
          {tab === 'misc'       && <MiscTab pokemon={pokemon} species={species} game={game} />}
        </div>
      </div>
    </div>
  )
}
