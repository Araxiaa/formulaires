import { Icone } from '../Icons'
import { SceauGroupe } from '../PostesUi'

// Sélection visuelle des postes ouverts (1 ou plusieurs selon `max`)
export default function ChoixPoste({ postes, groupes, choisis, max, onToggle, erreur }) {
  const ids = new Set(choisis.map((p) => p.id))
  const sections = groupes.map((g) => ({ g, items: postes.filter((p) => p.groupe === g.id) })).filter((s) => s.items.length)

  if (!postes.length) {
    return <div className="vide"><Icone nom="cadenas" taille={28} /><p style={{ margin: '8px 0 0' }}>Aucun poste n'est ouvert pour le moment. Consulte les listes d'attente sur la page Postes.</p></div>
  }

  return (
    <div data-champ="__poste">
      {max > 1 && <p className="aide">Tu peux choisir jusqu'à {max} postes. Le premier est ton choix principal.</p>}
      {sections.map(({ g, items }) => (
        <div key={g.id} className="groupe-choix">
          <p className="groupe-choix-titre" style={{ color: g.couleur }}><SceauGroupe groupe={g} petit />{g.nom}</p>
          <div className="grille-choix">
            {items.map((p) => {
              const actif = ids.has(p.id)
              const rang = actif ? choisis.findIndex((c) => c.id === p.id) + 1 : 0
              const desactive = !actif && max > 1 && choisis.length >= max
              return (
                <button type="button" key={p.id} className={`poste-choix${actif ? ' actif' : ''}`} style={{ '--couleur-camp': g.couleur }}
                        disabled={desactive} aria-pressed={actif} onClick={() => onToggle(p)}>
                  <span className="poste-choix-coche">{actif ? (max > 1 ? rang : <Icone nom="check" taille={14} />) : ''}</span>
                  <span className="poste-choix-corps">
                    <strong>{p.nom}</strong>
                    <small>{p.categorie === 'hr' ? (p.titulaire ? `Actuellement : ${p.titulaire}` : 'Poste vacant') : p.description}</small>
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      ))}
      {erreur && <p className="erreur-champ" role="alert">{erreur}</p>}
    </div>
  )
}
