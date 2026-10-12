import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAsync, useTitre } from '../lib/hooks'
import { lireGroupes, lirePostes } from '../lib/api'
import { Squelettes, Erreur, Vide, Apparition } from '../components/Ui'
import { CartePoste, SceauGroupe, TiroirPoste, ModaleAttente } from '../components/PostesUi'

export default function Postes() {
  useTitre('Postes')
  const [params, setParams] = useSearchParams()
  const vue = params.get('vue') === 'hr' ? 'hr' : 'staff'
  const [seulementOuverts, setSeulementOuverts] = useState(false)
  const [detail, setDetail] = useState(null)
  const [attente, setAttente] = useState(null)

  const { data, loading, error, recharger } = useAsync(async () => {
    const [groupes, postes] = await Promise.all([lireGroupes(), lirePostes()])
    return { groupes, postes }
  }, [])

  const sections = useMemo(() => {
    if (!data) return []
    const categorie = vue === 'hr' ? 'clan' : 'pole'
    return data.groupes.filter((g) => g.categorie === categorie).map((g) => ({
      groupe: g,
      postes: data.postes.filter((p) => p.groupe === g.id && p.categorie === vue && (!seulementOuverts || p.statut === 'ouvert')),
    })).filter((s) => s.postes.length)
  }, [data, vue, seulementOuverts])

  const tous = data?.postes.filter((p) => p.categorie === vue) || []
  const ouverts = tous.filter((p) => p.statut === 'ouvert')
  const places = ouverts.reduce((a, p) => a + (vue === 'staff' ? p.places_dispo : 1), 0)

  return (
    <div className="page">
      <div className="entete-page">
        <p className="sous-titre">Recrutement</p>
        <h1>Les postes</h1>
        <p>Staff et Hauts Rangs : découvre ce qu'on attend de chaque rôle avant de te lancer.</p>
      </div>

      <div className="barre-outils">
        <div className="onglets" role="tablist">
          <button role="tab" aria-selected={vue === 'staff'} className={vue === 'staff' ? 'actif' : ''} onClick={() => setParams({})}>Staff</button>
          <button role="tab" aria-selected={vue === 'hr'} className={vue === 'hr' ? 'actif' : ''} onClick={() => setParams({ vue: 'hr' })}>Hauts Rangs</button>
        </div>
        <label className="interrupteur">
          <input type="checkbox" checked={seulementOuverts} onChange={(e) => setSeulementOuverts(e.target.checked)} />
          <span className="piste" /> Postes ouverts uniquement
        </label>
      </div>

      {data && (
        <div className="bandeau-stats">
          <div className="stat-item"><span className="stat-valeur">{ouverts.length}</span><span className="stat-label">Ouverts</span></div>
          <div className="stat-item"><span className="stat-valeur">{places}</span><span className="stat-label">{vue === 'staff' ? 'Places' : 'Rangs vacants'}</span></div>
          <div className="stat-item"><span className="stat-valeur">{tous.length}</span><span className="stat-label">Au total</span></div>
        </div>
      )}

      {loading && <Squelettes />}
      {error && <Erreur erreur={error} onRetry={recharger} />}
      {data && !sections.length && <Vide>Aucun poste ouvert pour le moment. Inscris-toi sur une liste d'attente pour être prévenu·e !</Vide>}

      {sections.map(({ groupe, postes }) => (
        <section key={groupe.id} className="section-groupe">
          <Apparition className="entete-groupe">
            <SceauGroupe groupe={groupe} />
            <div>
              <h2 style={{ color: groupe.couleur }}>{groupe.nom}</h2>
              {groupe.description && <p className="discret">{groupe.description}</p>}
            </div>
          </Apparition>
          <div className="grille">
            {postes.map((p, i) => (
              <CartePoste key={p.id} poste={p} groupe={groupe} delai={i * 60} onDetails={setDetail} onAttente={setAttente} />
            ))}
          </div>
        </section>
      ))}

      {detail && <TiroirPoste poste={detail} groupe={data.groupes.find((g) => g.id === detail.groupe)} onFermer={() => setDetail(null)} />}
      {attente && <ModaleAttente poste={attente} groupe={data.groupes.find((g) => g.id === attente.groupe)} onFermer={() => setAttente(null)} />}
    </div>
  )
}
