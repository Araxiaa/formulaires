// Graphiques SVG maison : aucune dépendance, couleurs héritées du thème.

export function Barres({ donnees, hauteur = 150 }) {
  const max = Math.max(1, ...donnees.map((d) => d.valeur))
  const l = 100 / donnees.length
  return (
    <svg viewBox={`0 0 100 ${hauteur / 2}`} preserveAspectRatio="none" className="graphique-barres" style={{ height: hauteur }} role="img" aria-label="Candidatures par mois">
      {donnees.map((d, i) => {
        const h = (d.valeur / max) * (hauteur / 2 - 6)
        return <rect key={d.label} x={i * l + l * 0.18} y={hauteur / 2 - h} width={l * 0.64} height={Math.max(h, d.valeur ? 1 : 0.4)} rx="1.2" fill="var(--couleur-accent)" opacity={d.valeur ? 1 : 0.25}><title>{`${d.label} : ${d.valeur}`}</title></rect>
      })}
    </svg>
  )
}

export function LegendeBarres({ donnees }) {
  return (
    <div className="legende-barres">
      {donnees.map((d) => <div key={d.label}><strong>{d.valeur}</strong><span>{d.label}</span></div>)}
    </div>
  )
}

export function Donut({ parts, taille = 140 }) {
  const total = parts.reduce((a, p) => a + p.valeur, 0)
  const r = 15.9155
  let cumul = 0
  return (
    <div className="donut-boite">
      <svg viewBox="0 0 42 42" width={taille} height={taille} role="img" aria-label="Répartition par type">
        <circle cx="21" cy="21" r={r} fill="none" stroke="var(--couleur-bordure)" strokeWidth="5" />
        {total > 0 && parts.map((p) => {
          const pct = (p.valeur / total) * 100
          const el = <circle key={p.label} cx="21" cy="21" r={r} fill="none" stroke={p.couleur} strokeWidth="5"
            strokeDasharray={`${pct} ${100 - pct}`} strokeDashoffset={25 - cumul} />
          cumul += pct
          return el
        })}
        <text x="21" y="22.5" textAnchor="middle" fontSize="7" fontFamily="var(--police-titre)" fill="var(--couleur-texte)">{total}</text>
      </svg>
      <ul className="legende">
        {parts.map((p) => <li key={p.label}><span style={{ background: p.couleur }} />{p.label}<strong>{p.valeur}</strong></li>)}
      </ul>
    </div>
  )
}

export function Entonnoir({ etapes }) {
  const max = Math.max(1, ...etapes.map((e) => e.valeur))
  return (
    <div className="entonnoir">
      {etapes.map((e) => (
        <div key={e.label} className="entonnoir-ligne">
          <span>{e.label}</span>
          <div className="entonnoir-barre"><div style={{ width: `${(e.valeur / max) * 100}%`, background: e.couleur }} /></div>
          <strong>{e.valeur}</strong>
        </div>
      ))}
    </div>
  )
}
