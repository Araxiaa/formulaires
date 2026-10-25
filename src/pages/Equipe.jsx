import { Link } from 'react-router-dom'
import { useAsync, useTitre } from '../lib/hooks'
import { lireEquipe } from '../lib/api'
import { Squelettes, Erreur, Apparition } from '../components/Ui'
import { Icone } from '../components/Icons'
import Membre from '../components/Membre'
import { CATEGORIES_EQUIPE, plur } from '../lib/format'

export default function Equipe() {
  useTitre("L'équipe")
  const { data, loading, error, recharger } = useAsync(lireEquipe, [])
  return (
    <div className="page">
      <div className="entete-page">
        <p className="sous-titre">Qui fait vivre le serveur</p>
        <h1>L'équipe</h1>
        <p>Fondateurs, modérateurs, staffs et apprentis : toutes les personnes qui veillent sur la forêt.</p>
      </div>
      {loading && <Squelettes n={4} hauteur={80} />}
      {error && <Erreur erreur={error} onRetry={recharger} />}
      {data && CATEGORIES_EQUIPE.map((cat) => {
        const membres = data.filter((m) => m.categorie === cat.id)
        return (
          <section key={cat.id} className="section-groupe">
            <Apparition className="entete-groupe">
              <span className="sceau-clan" style={{ '--couleur-camp': cat.couleur }}><Icone nom={cat.icone} taille={20} /></span>
              <div><h2 style={{ color: cat.couleur }}>{cat.label}</h2><p className="discret mono" style={{ fontSize: '0.8rem', margin: 0 }}>{plur(membres.length, 'membre')}</p></div>
            </Apparition>
            {membres.length ? (
              <div className="grille grille-membres">{membres.map((m) => <Apparition key={m.id}><Membre membre={m} /></Apparition>)}</div>
            ) : <p className="vide" style={{ padding: 18 }}>Aucun·e pour le moment — <Link to="/postes" style={{ color: 'var(--couleur-accent)' }}>peut-être toi ?</Link></p>}
          </section>
        )
      })}
    </div>
  )
}
