import { Link, useParams, useSearchParams } from 'react-router-dom'
import { useAsync, useTitre } from '../lib/hooks'
import { lireFormulaires, lireGroupes, lireParametres, lirePostes } from '../lib/api'
import { TYPES } from '../lib/format'
import { Apparition, Chargeur, Erreur } from '../components/Ui'
import { Icone } from '../components/Icons'
import FormWizard from '../components/wizard/FormWizard'

export default function Candidater() {
  const { type } = useParams()
  const [params] = useSearchParams()
  const { data, loading, error, recharger } = useAsync(async () => {
    const [formulaires, postes, groupes, parametres] = await Promise.all([lireFormulaires(), lirePostes(), lireGroupes(), lireParametres()])
    return { formulaires, postes, groupes, parametres }
  }, [])
  useTitre(type && TYPES[type] ? `Candidature ${TYPES[type].label}` : 'Candidater')

  if (loading) return <Chargeur />
  if (error) return <div className="page"><Erreur erreur={error} onRetry={recharger} /></div>

  const ferme = data.parametres.recrutement_ouvert === false

  /* ───── Choix du parcours ───── */
  if (!type || !TYPES[type]) {
    return (
      <div className="page">
        <div className="entete-page"><p className="sous-titre">Candidater</p><h1>Quel parcours ?</h1><p>Choisis le type de candidature que tu souhaites déposer.</p></div>
        {ferme && <div className="annonce annonce-ferme"><Icone nom="cadenas" taille={20} />Le recrutement est actuellement fermé.</div>}
        <div className="grille grille-2">
          {Object.entries(TYPES).map(([t, info], i) => {
            const f = data.formulaires.find((x) => x.type === t)
            const ouvert = !ferme && f?.ouvert
            const dispo = t === 'staff' || t === 'hr' ? data.postes.filter((p) => p.categorie === t && p.statut === 'ouvert').length : null
            return (
              <Apparition key={t} delai={i * 70}>
                <Link to={ouvert ? `/candidater/${t}` : '#'} onClick={(e) => !ouvert && e.preventDefault()} className={`carte cliquable parcours${ouvert ? '' : ' estompee'}`}>
                  <span className="sceau-clan"><Icone nom={info.icone} taille={20} /></span>
                  <div>
                    <h3>{f?.titre || info.label}</h3>
                    <p className="discret">{f?.description}</p>
                    {!ouvert ? <span className="badge" data-statut="indispo">Fermé</span>
                      : dispo != null ? <span className="badge pastille" data-statut={dispo ? 'ouvert' : 'indispo'}>{dispo} poste{dispo > 1 ? 's' : ''} ouvert{dispo > 1 ? 's' : ''}</span> : null}
                  </div>
                </Link>
              </Apparition>
            )
          })}
        </div>
      </div>
    )
  }

  /* ───── Formulaire ───── */
  const formulaire = data.formulaires.find((f) => f.type === type)
  if (!formulaire) return <div className="page"><div className="vide">Ce formulaire n'existe pas.</div></div>
  if (ferme || !formulaire.ouvert) {
    return (
      <div className="page page-etroite">
        <div className="entete-page"><p className="sous-titre">{formulaire.titre}</p><h1>Candidatures fermées</h1><p>Ce formulaire n'accepte pas de candidature pour le moment.</p></div>
        <p className="centre"><Link to="/postes" className="bouton">Voir les postes</Link></p>
      </div>
    )
  }

  const postes = data.postes.filter((p) => p.categorie === type && p.statut === 'ouvert')
  const posteInitial = postes.find((p) => p.id === Number(params.get('poste')))

  return (
    <div className="page page-wizard">
      <FormWizard key={type} formulaire={formulaire} postes={postes} groupes={data.groupes} params={data.parametres} posteInitial={posteInitial} />
    </div>
  )
}
