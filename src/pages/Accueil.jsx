import { Link } from 'react-router-dom'
import { useAsync, useTitre } from '../lib/hooks'
import { lireFormulaires, lireGroupes, lireParametres, lirePostes, statsPubliques } from '../lib/api'
import { Croissant, Icone } from '../components/Icons'
import { Apparition } from '../components/Ui'
import { CartePoste, ModaleAttente } from '../components/PostesUi'
import { TYPES } from '../lib/format'
import { useState } from 'react'

const ETAPES = [
  { icone: 'boussole', titre: 'Choisis', texte: 'Parcours les postes ouverts et trouve celui qui te ressemble.' },
  { icone: 'crayon', titre: 'Candidate', texte: 'Un formulaire guidé, avec sauvegarde automatique de ton brouillon.' },
  { icone: 'recherche', titre: 'Suis', texte: 'Ton code de suivi (ou ta connexion Discord) te montre où en est ton dossier.' },
  { icone: 'enveloppe', titre: 'Reçois', texte: "La réponse du staff, détaillée, t'attend sur ta page de suivi." },
]

export default function Accueil() {
  useTitre('')
  const [attente, setAttente] = useState(null)
  const { data } = useAsync(async () => {
    const [stats, params, postes, groupes, formulaires] = await Promise.all([
      statsPubliques().catch(() => null), lireParametres().catch(() => ({})), lirePostes().catch(() => []),
      lireGroupes().catch(() => []), lireFormulaires().catch(() => []),
    ])
    return { stats, params, postes, groupes, formulaires }
  }, [])

  const ferme = data?.params?.recrutement_ouvert === false
  const ouverts = (data?.postes || []).filter((p) => p.statut === 'ouvert').slice(0, 6)

  return (
    <>
      <section className="hero">
        <div className="hero-lune"><Croissant taille={64} /></div>
        <p className="sous-titre">Le Prix de la Trêve · Recrutement</p>
        <h1>Rejoins l'équipe qui <em>fait vivre la forêt</em></h1>
        <p className="hero-texte">Staff, Hauts Rangs, nouveaux personnages : dépose ta candidature, suis son avancement et lis la réponse de l'équipe, en toute transparence.</p>
        <div className="hero-actions">
          <Link to="/candidater" className="bouton grand">Candidater <Icone nom="fleche" taille={18} /></Link>
          <Link to="/postes" className="bouton grand fantome">Voir les postes</Link>
        </div>
      </section>

      <div className="page">
        {data?.params?.annonce && <div className="annonce"><Icone nom="cloche" taille={20} />{data.params.annonce}</div>}
        {ferme && <div className="annonce annonce-ferme"><Icone nom="cadenas" taille={20} />Le recrutement est actuellement fermé. Reviens bientôt !</div>}

        {data?.stats && (
          <Apparition className="bandeau-stats bandeau-accueil">
            <div className="stat-item"><span className="stat-valeur">{data.stats.postes_ouverts}</span><span className="stat-label">Postes ouverts</span></div>
            <div className="stat-item"><span className="stat-valeur">{data.stats.places}</span><span className="stat-label">Places à pourvoir</span></div>
            <div className="stat-item"><span className="stat-valeur">{data.stats.delai_jours != null ? `${data.stats.delai_jours} j` : '—'}</span><span className="stat-label">Délai médian de réponse</span></div>
            <div className="stat-item"><span className="stat-valeur">{data.stats.acceptees}</span><span className="stat-label">Candidatures acceptées</span></div>
          </Apparition>
        )}

        <h2 className="titre-section">Comment ça marche</h2>
        <div className="etapes-accueil">
          {ETAPES.map((e, i) => (
            <Apparition key={e.titre} delai={i * 80} className="etape-accueil">
              <span className="etape-num">{i + 1}</span>
              <Icone nom={e.icone} taille={26} />
              <h3>{e.titre}</h3>
              <p className="discret">{e.texte}</p>
            </Apparition>
          ))}
        </div>

        {ouverts.length > 0 && (<>
          <h2 className="titre-section">Postes à pourvoir</h2>
          <div className="grille">
            {ouverts.map((p, i) => (
              <CartePoste key={p.id} poste={p} delai={i * 60} groupe={data.groupes.find((g) => g.id === p.groupe)}
                onDetails={() => { window.location.hash = '#/postes' }} onAttente={setAttente} />
            ))}
          </div>
          <p className="centre" style={{ marginTop: 20 }}><Link to="/postes" className="bouton secondaire">Voir tous les postes</Link></p>
        </>)}

        <h2 className="titre-section">Choisis ton parcours</h2>
        <div className="grille grille-2">
          {Object.entries(TYPES).map(([type, t], i) => {
            const f = data?.formulaires?.find((x) => x.type === type)
            const ouvert = !ferme && (!data || !f || f.ouvert)
            return (
              <Apparition key={type} delai={i * 70}>
                <Link to={ouvert ? `/candidater/${type}` : '#'} className={`carte cliquable parcours${ouvert ? '' : ' estompee'}`} aria-disabled={!ouvert}>
                  <span className="sceau-clan"><Icone nom={t.icone} taille={20} /></span>
                  <div>
                    <h3>{f?.titre || `Candidature ${t.label}`}</h3>
                    <p className="discret">{f?.description}</p>
                    {!ouvert && <span className="badge" data-statut="indispo">Fermé</span>}
                  </div>
                </Link>
              </Apparition>
            )
          })}
        </div>

        <Apparition className="carte bloc-suivi">
          <Icone nom="enveloppe" taille={30} />
          <div>
            <h3>Déjà candidaté ?</h3>
            <p className="discret" style={{ margin: 0 }}>Retrouve l'avancement de ton dossier et lis la réponse du staff, avec ton code de suivi ou ta connexion Discord.</p>
          </div>
          <Link to="/suivi" className="bouton">Mon suivi</Link>
        </Apparition>
      </div>
      {attente && <ModaleAttente poste={attente} groupe={data.groupes.find((g) => g.id === attente.groupe)} onFermer={() => setAttente(null)} />}
    </>
  )
}
