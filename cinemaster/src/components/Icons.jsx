// Pictogrammes de l'interface (traits arrondis, taille 1em, couleur du texte).
const PATHS = {
  home: <><path d="M4 11.5 12 5l8 6.5V19a1.5 1.5 0 0 1-1.5 1.5H15v-5h-6v5H5.5A1.5 1.5 0 0 1 4 19z" /></>,
  cards: <><rect x="7" y="4" width="11" height="15" rx="2" /><path d="M4.5 7.5v10A2.5 2.5 0 0 0 7 20h8" /></>,
  star: <><path d="m12 4 2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 16.4l-4.8 2.5.9-5.4-3.9-3.8 5.4-.8z" /></>,
  image: <><rect x="4" y="5" width="16" height="14" rx="2.5" /><circle cx="9" cy="10" r="1.6" /><path d="m5 17 4.5-4.5 3 3 2.5-2.5L20 17" /></>,
  pack: <><path d="M7 3.5h10l-.6 2 .6 2v12.5a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V7.5l.6-2z" /><path d="M9.5 12.5h5" /></>,
  clock: <><circle cx="12" cy="12" r="8" /><path d="M12 8v4.5l3 1.8" /></>,
  film: <><rect x="4" y="5" width="16" height="14" rx="2" /><path d="M8 5v14M16 5v14M4 9.5h4M4 14.5h4M16 9.5h4M16 14.5h4" /></>,
  back: <><path d="M9 7 4.5 11.5 9 16" /><path d="M5 11.5h9.5a4.5 4.5 0 0 1 0 9H12" /></>,
  chevron: <><path d="m9.5 6 6 6-6 6" /></>,
  lock: <><rect x="5" y="10.5" width="14" height="10" rx="2.5" /><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" /><path d="M12 14.5v2.5" /></>,
}

export function Icon({ name }) {
  return (
    <svg className={`icon icon-${name}`} viewBox="0 0 24 24" aria-hidden="true"
      fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      {PATHS[name]}
    </svg>
  )
}
