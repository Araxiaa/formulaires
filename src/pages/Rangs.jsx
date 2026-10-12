import { useAsync, useTitre } from '../lib/hooks'
import { lireGroupes, lirePostes } from '../lib/api'
import { Squelettes, Erreur, Apparition } from '../components/Ui'
import { SceauGroupe } from '../components/PostesUi'
import { Icone } from '../components/Icons'

const ICONE_RANG = { meneur: 'couronne', lieutenant: 'etoile', guerisseur: 'feuille', apprenti: 'pousse' }

export default function Rangs() {
  useTitre('Hauts Rangs')
  const { data, loading, error, recharger } = useAsync(async () => {
    const [groupes, postes] = await Promise.all([lireGroupes(), lirePostes()])
    return { clans: groupes.filter((g) => g.categorie === 'clan'), postes: postes.filter((p) => p.categorie === 'hr') }
  }, [])

  return (
    <div className="page">
      <div className="entete-page">
        <p className="sous-titre">Composition actuelle</p>
        <h1>Les Hauts Rangs</h1>
        <p>Qui dirige, seconde et soigne chaque clan aujourd'hui.</p>
      </div>
      {loading && <Squelettes n={4} hauteur={110} />}
      {error && <Erreur erreur={error} onRetry={recharger} />}
      {data?.clans.map((clan) => (
        <section key={clan.id} className="section-groupe">
          <Apparition className="entete-groupe">
            <SceauGroupe groupe={clan} />
            <h2 style={{ color: clan.couleur }}>{clan.nom}</h2>
          </Apparition>
          <div className="grille grille-rangs">
            {data.postes.filter((p) => p.groupe === clan.id).map((p, i) => (
              <Apparition key={p.id} delai={i * 60} className="carte carte-rang" style={{ '--couleur-camp': clan.couleur }}>
                <Icone nom={ICONE_RANG[p.type_rang] || 'etoile'} taille={22} />
                <div>
                  <p className="mono discret" style={{ fontSize: '0.72rem', margin: 0, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{p.nom}</p>
                  <p className="nom-titulaire">{p.titulaire || <span className="badge" data-statut={p.statut === 'ouvert' ? 'ouvert' : 'indispo'}>{p.statut === 'ouvert' ? 'Vacant — à pourvoir' : 'Vacant'}</span>}</p>
                  {p.note && <p className="discret" style={{ fontSize: '0.82rem', margin: 0 }}>{p.note}</p>}
                </div>
              </Apparition>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
