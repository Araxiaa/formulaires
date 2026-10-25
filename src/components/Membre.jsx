import { Icone } from './Icons'
import { categorieDe } from '../lib/format'

export const initialeDe = (pseudo = '') => (pseudo.replace(/^[^\p{L}\p{N}]+/u, '')[0] || '?').toUpperCase()

// Carte de membre. Un membre multi-équipes a un anneau dégradé et une puce par équipe.
// `contexte` : l'équipe affichée (sa puce est atténuée) ; `grand` : mise en avant (fondateurs).
export default function Membre({ membre, contexte, grand = false }) {
  const cats = (membre.categories || []).map(categorieDe).filter(Boolean)
  const c1 = cats[0]?.couleur || 'var(--couleur-accent)'
  const c2 = cats[1]?.couleur || c1
  const polyvalent = cats.length > 1

  return (
    <article className={`membre${grand ? ' grand' : ''}`} style={{ '--c1': c1, '--c2': c2 }}>
      <span className="membre-anneau"><span className="membre-avatar" aria-hidden="true">{initialeDe(membre.pseudo)}</span></span>
      <div className="membre-corps">
        <strong className="membre-nom">{membre.pseudo}</strong>
        {membre.titre && <p className="membre-titre">{membre.titre}</p>}
        <div className="membre-roles">
          {cats.map((c) => (
            <span key={c.id} className={`role-puce${c.id === contexte ? ' courant' : ''}`} style={{ '--couleur-camp': c.couleur }}>
              <Icone nom={c.icone} taille={12} />{c.court}
            </span>
          ))}
        </div>
        {membre.specialites?.length > 0 && (
          <div className="membre-specialites">{membre.specialites.map((s) => <span key={s} className="specialite"><Icone nom="etoiles" taille={11} />{s}</span>)}</div>
        )}
      </div>
      {polyvalent && <span className="membre-polyvalent" title="Membre de plusieurs équipes"><Icone nom="echange" taille={14} /></span>}
    </article>
  )
}
