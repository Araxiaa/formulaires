import { Icone } from './Icons'
import { CATEGORIES_EQUIPE } from '../lib/format'

export const categorieDe = (id) => CATEGORIES_EQUIPE.find((c) => c.id === id)

export default function Membre({ membre }) {
  const cat = categorieDe(membre.categorie)
  const initiale = (membre.pseudo.replace(/^[^\p{L}\p{N}]+/u, '')[0] || '?').toUpperCase()
  return (
    <article className="membre" style={{ '--couleur-camp': cat?.couleur }}>
      <span className="membre-avatar" aria-hidden="true">{initiale}</span>
      <div>
        <strong>{membre.pseudo}</strong>
        {membre.titre && <p className="discret">{membre.titre}</p>}
        {membre.specialites?.length > 0 && (
          <p className="membre-specialites">{membre.specialites.map((s) => <span key={s} className="badge"><Icone nom="etoiles" taille={11} />{s}</span>)}</p>
        )}
      </div>
    </article>
  )
}
