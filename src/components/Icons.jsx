// Jeu d'icônes maison : trait fin, bouts arrondis, héritent de currentColor.
// Grille 24×24. Chaque icône remplace un ancien émoji ou un symbole générique.
const base = {
  width: 18,
  height: 18,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
}

const COEUR = 'M12 20s-7.500-4.600-7.500-10A4.300 4.300 0 0 1 12 7.400 4.300 4.300 0 0 1 19.500 10c0 5.400-7.500 10-7.500 10Z'

const chemins = {
  // --- Navigation ---
  recherche: <><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4.500 4.500" /></>,
  familles: <><circle cx="9" cy="8" r="3" /><path d="M3.500 19c.4-3.200 2.600-5 5.500-5s5.100 1.800 5.500 5" /><circle cx="17" cy="9" r="2.300" /><path d="M16.500 14.200c2.400.1 3.800 1.500 4.200 4" /></>,
  lien: <><path d="M10 14a4 4 0 0 0 5.700 0l3-3a4 4 0 0 0-5.700-5.700l-1 1" /><path d="M14 10a4 4 0 0 0-5.700 0l-3 3A4 4 0 0 0 11 18.700l1-1" /></>,
  chronologie: <><path d="M4 12h16" /><circle cx="7" cy="12" r="1.800" /><circle cx="14" cy="12" r="1.800" /><path d="M7 10.200V6M14 13.800V18" /></>,
  pantheon: <><path d="M7 4h10v5a5 5 0 0 1-10 0V4Z" /><path d="M7 6H4.500a2.500 2.500 0 0 0 2.600 3.600M17 6h2.500a2.500 2.500 0 0 1-2.600 3.600M12 14v4M8.500 20h7" /></>,
  informations: <path d="M5 20V10M12 20V4M19 20v-7" />,
  cloche: <><path d="M6 17V11a6 6 0 0 1 12 0v6l1.500 2h-15L6 17Z" /><path d="M10 21h4" /></>,
  cle: <><circle cx="8" cy="15" r="4" /><path d="m11 12 8.500-8.500M16 6.500l2.500 2.500M14 8.500l2 2" /></>,
  maison: <><path d="m4 11 8-7 8 7" /><path d="M6 10v10h12V10" /></>,
  soleil: <><circle cx="12" cy="12" r="4" /><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.600 5.600 7 7M17 17l1.400 1.400M5.600 18.400 7 17M17 7l1.400-1.400" /></>,
  lune: <path d="M20 14.500A8 8 0 0 1 9.500 4a8 8 0 1 0 10.500 10.500Z" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  fermer: <path d="m6 6 12 12M18 6 6 18" />,

  // --- Lore et personnages ---
  parchemin: <><path d="M8 4h9a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H7.500" /><path d="M8 4a2 2 0 0 0-2 2v11" /><path d="M6 17a3 3 0 0 0 3 3 3 3 0 0 1-1.500-2.600V6" /><path d="M11 9h5M11 13h5" /></>,
  livre: <><path d="M4 5.500C6 4.500 9 4.500 12 6c3-1.500 6-1.500 8-.5V19c-2-1-5-1-8 .5-3-1.500-6-1.500-8-.5V5.500Z" /><path d="M12 6v13.500" /></>,
  'fleur-fanee': <><path d="M7 21c0-8 3-12 9-12" /><path d="M13.500 8c-.5 4 1 7 2.500 8.500 1.500-1.500 3-4.500 2.500-8.500-1.500-.8-3.500-.8-5 0Z" /><path d="M7 16c-2 0-3.500-1-4-2.500" /></>,
  couronne: <path d="m4 8 4 4 4-6 4 6 4-4-1.500 10h-13L4 8Z" />,
  griffes: <><path d="M6 4c3 5 4 11 3 16" /><path d="M11 3c3 5 4 12 3 18" /><path d="M16 4c3 5 4 11 3 16" /></>,
  feuille: <><path d="M5 19c0-8 5-14 14-14 0 9-6 14-14 14Z" /><path d="M5 19 13 11" /></>,
  pousse: <><path d="M12 21v-9" /><path d="M12 12c0-4-3-6-7-6 0 4 3 6 7 6Z" /><path d="M12 14c0-3 2-5 6-5 0 3-2 5-6 5Z" /></>,
  arbre: <><path d="M12 21v-7M12 14l3-3" /><path d="M12 3c4 0 7 3 6 6.500 2 1 2.500 4.500-.500 5.500h-11c-3-1-2.500-4.500-.500-5.500C5 6 8 3 12 3Z" /></>,
  adn: <><path d="M8 3c0 5 8 5 8 9s-8 4-8 9" /><path d="M16 3c0 5-8 5-8 9s8 4 8 9" /><path d="M9 7h6M9 17h6" /></>,
  patte: <><path d="M12 13.500c-3 0-5 2.200-5 4.200 0 1.600 1.400 2.300 3 2.300 1 0 1.400-.4 2-.4s1 .4 2 .4c1.600 0 3-.7 3-2.300 0-2-2-4.200-5-4.200Z" /><circle cx="6.500" cy="10" r="1.500" /><circle cx="10" cy="6.200" r="1.600" /><circle cx="14" cy="6.200" r="1.600" /><circle cx="17.500" cy="10" r="1.500" /></>,
  crane: <><path d="M12 3a8 8 0 0 0-8 8c0 2.600 1.300 4.200 3 5.300V20h10v-3.700c1.700-1.100 3-2.700 3-5.300a8 8 0 0 0-8-8Z" /><circle cx="9" cy="11.500" r="1.500" /><circle cx="15" cy="11.500" r="1.500" /><path d="M10.500 20v-2.500M13.500 20v-2.500" /></>,
  goutte: <path d="M12 3.500c4 4.500 6 7.500 6 10.500a6 6 0 0 1-12 0c0-3 2-6 6-10.500Z" />,
  oeuf: <><path d="M12 3c3.500 0 6 5.500 6 10a6 6 0 0 1-12 0c0-4.500 2.500-10 6-10Z" /><path d="m7 14 2.500-2 2.500 2 2.500-2 2.500 2" /></>,
  flambeau: <path d="M12 3c1 3 5 5 5 9.500a5 5 0 0 1-10 0c0-2 1-3.500 2.300-5 .2 1.500.8 2.200 1.700 2.500C11 8 11 5.500 12 3Z" />,
  etoiles: <><path d="m10 4 1.800 5.200L17 11l-5.200 1.800L10 18l-1.800-5.200L3 11l5.200-1.800L10 4Z" /><path d="M18 3v4M16 5h4M18 15v3M16.500 16.500h3" /></>,
  'lune-noire': <><circle cx="12" cy="12" r="8" /><path d="M12 4a8 8 0 0 0 0 16 5 8 0 0 1 0-16Z" fill="currentColor" fillOpacity=".3" /></>,
  brume: <><path d="M4 8h11a2.500 2.500 0 1 0-2.500-2.500" /><path d="M3 13h15a2.500 2.500 0 1 1-2.500 2.500" /><path d="M6 18h7" /></>,
  'arc-en-ciel': <><path d="M3 18a9 9 0 0 1 18 0" /><path d="M7 18a5 5 0 0 1 10 0" /></>,
  eclair: <path d="M13 3 5 13h6l-1 8 8-10h-6l1-8Z" />,
  boussole: <><circle cx="12" cy="12" r="9" /><path d="m15.500 8.500-2 5-5 2 2-5 5-2Z" /></>,
  calendrier: <><rect x="4" y="6" width="16" height="14" rx="2" /><path d="M4 10.500h16M8 4v4M16 4v4" /></>,
  manette: <><path d="M7 8h10a4 4 0 0 1 4 4.500l-.500 3.500a2.500 2.500 0 0 1-4.500.800L15 15H9l-1 1.800a2.500 2.500 0 0 1-4.500-.800L3 12.500A4 4 0 0 1 7 8Z" /><path d="M8 10.500v3M6.500 12h3M15.500 11.500v.1M17.500 13v.1" /></>,
  foyer: <><path d="m4 11 8-7 8 7" /><path d="M6 10v10h12V10" /><path d="M12 17s-3-1.800-3-3.800a1.600 1.600 0 0 1 3-.8 1.600 1.600 0 0 1 3 .8c0 2-3 3.800-3 3.800Z" /></>,
  drapeau: <><path d="M6 21V4" /><path d="M6 5h11l-2 3.500 2 3.500H6" /></>,
  mars: <><circle cx="10" cy="14" r="5" /><path d="m14 10 6-6M15 4h5v5" /></>,
  venus: <><circle cx="12" cy="9" r="5" /><path d="M12 14v7M9 18h6" /></>,
  neutre: <><circle cx="12" cy="12" r="5" /><path d="M12 3v4M12 17v4" /></>,

  agrandir: <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />,
  reduire: <path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" />,
  filtre: <><path d="M4 7h10M18 7h2M4 17h2M10 17h10" /><circle cx="16" cy="7" r="2" /><circle cx="8" cy="17" r="2" /></>,
  chevron: <path d="m6 9 6 6 6-6" />,
  grille: <><rect x="4" y="4" width="7" height="7" rx="1.500" /><rect x="13" y="4" width="7" height="7" rx="1.500" /><rect x="4" y="13" width="7" height="7" rx="1.500" /><rect x="13" y="13" width="7" height="7" rx="1.500" /></>,
  rafraichir: <><path d="M20 12a8 8 0 1 1-2.500-5.800" /><path d="M20 4v5h-5" /></>,
  etoile: <path d="m12 3.500 2.600 5.400 5.900.8-4.300 4.100 1 5.800-5.200-2.800-5.200 2.800 1-5.800L3.500 9.700l5.900-.8L12 3.500Z" />,
  retour: <path d="M19 12H5M11 6l-6 6 6 6" />,

  // --- Emblèmes de clans ---
  vague: <><path d="M3 9c2-2 4-2 6 0s4 2 6 0 4-2 6 0" /><path d="M3 15c2-2 4-2 6 0s4 2 6 0 4-2 6 0" /></>,
  montagne: <><path d="m3 19 6-11 4 6 2-3 6 8Z" /><path d="m9 8 2 3.500" /></>,
  pin: <path d="m12 3-5 7h3l-4 6h4.500v5h3v-5H18l-4-6h3l-5-7Z" />,
  plume: <><path d="M20 4C11 4 6 9 6 16l-2 4" /><path d="M6 16c6 0 11-4 14-12" /><path d="m10 14 5-1" /></>,
  croc: <path d="M7 4h10c0 8-3 13-5 16-2-3-5-8-5-16Z" />,
  ronce: <><path d="M4 20c4-1 6-4 8-9s5-6 8-7" /><path d="m9 14-3-1M12 9l-1-3M15 7l3 1M10 17l-2 2" /></>,
  poisson: <><path d="M3 12c3-5 8-6 13-3l5-3v12l-5-3c-5 3-10 2-13-3Z" /><path d="M7 11.500v.1" /></>,
  rocher: <><path d="m4 19 2-7 5-4 6 2 3 9Z" /><path d="m11 8 1 11M6 12l6 2 7-4" /></>,

  // --- Recrutement ---
  check: <path d="m5 12.500 4.500 4.500L19 7.500" />,
  croix: <path d="m6 6 12 12M18 6 6 18" />,
  crayon: <><path d="m4 20 1-4L16.500 4.500a2 2 0 0 1 3 3L8 19l-4 1Z" /><path d="m14.500 6.500 3 3" /></>,
  poubelle: <><path d="M4 7h16M10 11v6M14 11v6" /><path d="M6 7l1 13h10l1-13M9 7V4h6v3" /></>,
  copie: <><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" /></>,
  enveloppe: <><rect x="3.500" y="5.500" width="17" height="13" rx="2" /><path d="m4 7 8 6 8-6" /></>,
  oeil: <><path d="M2.500 12S6 5.500 12 5.500 21.500 12 21.500 12 18 18.500 12 18.500 2.500 12 2.500 12Z" /><circle cx="12" cy="12" r="2.800" /></>,
  externe: <><path d="M14 4h6v6" /><path d="m20 4-9 9" /><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" /></>,
  utilisateur: <><circle cx="12" cy="8" r="4" /><path d="M4.500 20c.6-3.800 3.500-6 7.500-6s6.900 2.200 7.500 6" /></>,
  discord: <><path d="M8 7.500c2.500-1 5.500-1 8 0 2 3 2.800 6 2.500 9-1.200.9-2.400 1.400-3.600 1.700l-.8-1.300c.5-.2 1-.4 1.400-.7-3.200 1.300-6.800 1.300-10 0 .4.300.9.500 1.400.7l-.8 1.300c-1.200-.3-2.400-.8-3.600-1.700-.3-3 .5-6 2.500-9Z" /><circle cx="9.500" cy="12.500" r="1" /><circle cx="14.500" cy="12.500" r="1" /></>,
  fleche: <path d="M5 12h14M13 6l6 6-6 6" />,
  deplacer: <path d="M12 4v16M4 12h16M9 7l3-3 3 3M9 17l3 3 3-3M7 9l-3 3 3 3M17 9l3 3-3 3" />,
  haut: <path d="m6 15 6-6 6 6" />,
  bas: <path d="m6 9 6 6 6-6" />,
  sceau: <><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="4.500" /><path d="m12 9.500.8 1.700 1.800.2-1.300 1.200.4 1.800-1.700-.9-1.700.9.4-1.800L9.400 11.400l1.800-.2.8-1.700Z" /></>,
  pouce: <path d="M7 11v9H4v-9h3Zm0 0 4-7a2 2 0 0 1 2 2v3h5.500a1.500 1.500 0 0 1 1.500 1.800l-1.200 6.500A2 2 0 0 1 16.800 19H7" />,
  pouce_bas: <path d="M7 13V4H4v9h3Zm0 0 4 7a2 2 0 0 0 2-2v-3h5.500a1.500 1.500 0 0 0 1.500-1.800l-1.200-6.500A2 2 0 0 0 16.800 5H7" />,
  tableau: <><rect x="3.500" y="4.500" width="5" height="15" rx="1.500" /><rect x="10" y="4.500" width="5" height="9" rx="1.500" /><rect x="16.500" y="4.500" width="4" height="12" rx="1.500" /></>,
  reglages: <><circle cx="12" cy="12" r="3" /><path d="M12 3v2.500M12 18.500V21M3 12h2.500M18.500 12H21M5.600 5.600l1.800 1.800M16.600 16.600l1.800 1.800M5.600 18.400l1.800-1.800M16.600 7.400l1.800-1.800" /></>,
  question: <><circle cx="12" cy="12" r="9" /><path d="M9.500 9.500a2.500 2.500 0 1 1 3.500 2.300c-.7.300-1 .9-1 1.700M12 16.800v.1" /></>,
  sauvegarde: <><path d="M5 4h11l3 3v13H5V4Z" /><path d="M8 4v5h7V4M8 20v-6h8v6" /></>,

  // --- Sentiments et unions ---
  coeur: <path d={COEUR} />,
  'coeur-brise': <><path d={COEUR} /><path d="m12 7.500-1.800 3.500 3 2-1.200 4" /></>,
  coeurs: <><path d="M10 20s-6.500-4-6.500-8.700A3.800 3.800 0 0 1 10 9a3.800 3.800 0 0 1 6.500 2.300C16.500 16 10 20 10 20Z" /><path d="M18.500 8.500s-2.800-1.700-2.800-3.700a1.700 1.700 0 0 1 2.800-1.200 1.700 1.700 0 0 1 2.800 1.200c0 2-2.800 3.700-2.800 3.700Z" /></>,
  alerte: <><path d="M12 4 3 19.500h18L12 4Z" /><path d="M12 10v4.500M12 17.200v.1" /></>,
  telecharger: <><path d="M12 4v11" /><path d="m7.500 11 4.500 4.500 4.500-4.500" /><path d="M5 20h14" /></>,
  archive: <><path d="M3.500 6.500h17v4h-17Z" /><path d="M5 10.500V19h14v-8.500" /><path d="M12 13v4.500" /><path d="m10 15.500 2 2 2-2" /></>,
  cadenas: <><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3M12 15v2" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  moins: <path d="M5 12h14" />,
  liste: <><path d="M8 4h8v3H8Z" /><path d="M6 5.500H5v15h14v-15h-1" /><path d="M9 12h6M9 16h4" /></>,
  carte: <><path d="m3 6.500 6-2.500 6 2.500 6-2.500v13.500l-6 2.500-6-2.500-6 2.500V6.500Z" /><path d="M9 4v13.500M15 6.500V20" /></>,
  echange: <><path d="M4 7h4c4 0 5 10 9 10h3" /><path d="m17.500 14 3 3-3 3" /><path d="M4 17h4c1.500 0 2.500-1 3.400-2.300M14 9.500C14.800 8.400 15.800 7 17 7h3" /><path d="m17.500 4 3 3-3 3" /></>,
  horloge: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  bouclier: <><path d="M12 3 5 6v5.500c0 4.500 3 7.800 7 9.500 4-1.700 7-5 7-9.500V6l-7-3Z" /><path d="m9 12 2.200 2.200L15.500 10" /></>,
}


// Icônes proposées au staff pour personnaliser un clan ou un groupe.
export const ICONES_CLAN = [
  'patte', 'griffes', 'croc', 'plume', 'feuille', 'pousse', 'arbre', 'pin', 'ronce', 'montagne', 'rocher',
  'vague', 'poisson', 'goutte', 'brume', 'eclair', 'flambeau', 'soleil', 'lune', 'lune-noire', 'etoiles',
  'etoile', 'couronne', 'bouclier', 'drapeau', 'crane', 'coeur', 'oeuf',
]

export function Icone({ nom, taille = 18, ...rest }) {
  return (
    <svg {...base} width={taille} height={taille} {...rest}>
      {chemins[nom]}
    </svg>
  )
}

// Pastille de rang (Chef, Lieutenant, Guérisseur) : icône + infobulle.
export function BadgeRang({ nom, titre, taille = 15, attenue = false }) {
  return (
    <span className={`badge-rang badge-rang-${nom}${attenue ? ' badge-rang-ancien' : ''}`} title={titre}>
      <Icone nom={nom} taille={taille} />
    </span>
  )
}

// Médaille de podium : disque doré / argenté / bronze portant le rang.
export function Medaille({ rang }) {
  const classes = ['or', 'argent', 'bronze']
  return <span className={`medaille medaille-${classes[rang] || 'bronze'}`}>{rang + 1}</span>
}

// Croissant de lune : emblème du site.
export function Croissant({ taille = 28, ...rest }) {
  return (
    <svg width={taille} height={taille} viewBox="0 0 32 32" aria-hidden="true" {...rest}>
      <path d="M22.500 4.200A12.500 12.500 0 1 0 27.800 22 10 10 0 0 1 22.500 4.200Z" fill="currentColor" />
      <circle cx="25.500" cy="9" r="1.100" fill="currentColor" />
      <circle cx="29" cy="14.500" r=".7" fill="currentColor" />
    </svg>
  )
}
