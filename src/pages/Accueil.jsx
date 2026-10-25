import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAsync, useTitre } from '../lib/hooks'
import { lireEquipe, lireFormulaires, lireGroupes, lireParametres, lirePostes, statsPubliques } from '../lib/api'
import { Croissant, Icone } from '../components/Icons'
import { Apparition } from '../components/Ui'
import { CartePoste, ModaleAttente, SceauGroupe } from '../components/PostesUi'
import { CATEGORIES_EQUIPE, TYPES, membresDe } from '../lib/format'

const ETAPES = [
  { icone: 'boussole', titre: 'Choisis', texte: 'Parcours les postes ouverts et trouve celui qui te ressemble.' },
  { icone: 'crayon', titre: 'Candidate', texte: 'Un formulaire guidé, avec sauvegarde automatique de ton brouillon.' },
  { icone: 'recherche', titre: 'Suis', texte: 'Ton code de suivi (ou ta connexion Discord) te montre où en est ton dossier.' },
  { icone: 'enveloppe', titre: 'Reçois', texte: "La réponse détaillée du staff t'attend sur ta page de suivi." },
]

// Positions pseudo-aléatoires mais stables : pas de scintillement au re-rendu
const ETOILES = Array.from({ length: 46 }, (_, i) => ({
  x: (Math.sin(i * 91.7) * 0.5 + 0.5) * 100, y: (Math.sin(i * 47.3 + 2) * 0.5 + 0.5) * 70,
  t: 1 + ((i * 7) % 3), d: (i * 0.37) % 4,
}))

function Etoiles() {
  return (
    <div className="etoiles" aria-hidden="true">
      {ETOILES.map((e, i) => <span key={i} style={{ left: `${e.x}%`, top: `${e.y}%`, width: e.t, height: e.t, animationDelay: `${e.d}s` }} />)}
    </div>
  )
}

// Lisière de sapins : deux plans, générés une seule fois
function Foret() {
  const plan = (n, graine, hmin, hmax) => {
    let d = 'M0 120'
    for (let i = 0; i <= n; i++) {
      const x = (i / n) * 1200, a = Math.sin(i * graine) * 0.5 + 0.5
      const h = hmin + a * (hmax - hmin), w = 30 + a * 22
      d += ` L${x - w} 120 L${x - w * 0.55} ${120 - h * 0.45} L${x - w * 0.8} ${120 - h * 0.45} L${x - w * 0.35} ${120 - h * 0.75} L${x - w * 0.55} ${120 - h * 0.75} L${x} ${120 - h} L${x + w * 0.55} ${120 - h * 0.75} L${x + w * 0.35} ${120 - h * 0.75} L${x + w * 0.8} ${120 - h * 0.45} L${x + w * 0.55} ${120 - h * 0.45} L${x + w} 120`
    }
    return `${d} L1200 120 Z`
  }
  const lointain = useMemo(() => plan(26, 3.1, 50, 95), [])
  const proche = useMemo(() => plan(15, 1.7, 40, 80), [])
  return (
    <svg className="foret" viewBox="0 0 1200 120" preserveAspectRatio="none" aria-hidden="true">
      <path d={lointain} className="foret-loin" />
      <path d={proche} className="foret-proche" />
    </svg>
  )
}

export default function Accueil() {
  useTitre('')
  const [attente, setAttente] = useState(null)
  const { data } = useAsync(async () => {
    const [stats, params, postes, groupes, formulaires, equipe] = await Promise.all([
      statsPubliques().catch(() => null), lireParametres().catch(() => ({})), lirePostes().catch(() => []),
      lireGroupes().catch(() => []), lireFormulaires().catch(() => []), lireEquipe().catch(() => []),
    ])
    return { stats, params, postes, groupes, formulaires, equipe }
  }, [])

  const ferme = data?.params?.recrutement_ouvert === false
  const ouverts = (data?.postes || []).filter((p) => p.statut === 'ouvert').slice(0, 6)
  const clans = (data?.groupes || []).filter((g) => g.categorie === 'clan')

  return (
    <>
      <section className="hero2">
        <div className="ciel">
          <Etoiles />
          <div className="lune-grande"><Croissant taille={96} /></div>
        </div>
        <div className="hero2-contenu">
          <p className="sous-titre">Le Prix de la Trêve · Recrutement</p>
          <h1>Écris ta place dans <em>la forêt</em></h1>
          <p className="hero-texte">Staff, Hauts Rangs, nouveaux personnages : dépose ta candidature, suis son avancement et lis la réponse de l'équipe, en toute transparence.</p>
          <div className="hero-actions">
            <Link to="/candidater" className="bouton grand">Candidater <Icone nom="fleche" taille={18} /></Link>
            <Link to="/postes" className="bouton grand fantome">Voir les postes</Link>
          </div>
        </div>
        <Foret />
      </section>

      <div className="page page-accueil">
        {data?.params?.annonce && <div className="annonce"><Icone nom="cloche" taille={20} />{data.params.annonce}</div>}
        {ferme && <div className="annonce annonce-ferme"><Icone nom="cadenas" taille={20} />Le recrutement est actuellement fermé. Reviens bientôt !</div>}

        {data?.stats && (
          <Apparition className="verre stats-verre">
            <div className="stat-item"><span className="stat-valeur">{data.stats.postes_ouverts}</span><span className="stat-label">Postes ouverts</span></div>
            <div className="stat-item"><span className="stat-valeur">{data.stats.places}</span><span className="stat-label">Places à pourvoir</span></div>
            <div className="stat-item"><span className="stat-valeur">{data.stats.delai_jours != null ? `${data.stats.delai_jours} j` : '—'}</span><span className="stat-label">Délai médian de réponse</span></div>
            <div className="stat-item"><span className="stat-valeur">{data.stats.acceptees}</span><span className="stat-label">Candidatures acceptées</span></div>
          </Apparition>
        )}

        <h2 className="titre-section">Comment ça marche</h2>
        <ol className="chrono">
          {ETAPES.map((e, i) => (
            <Apparition as="li" key={e.titre} delai={i * 90} className="chrono-etape">
              <span className="chrono-pastille"><Icone nom={e.icone} taille={22} /></span>
              <span className="chrono-num">0{i + 1}</span>
              <h3>{e.titre}</h3>
              <p className="discret">{e.texte}</p>
            </Apparition>
          ))}
        </ol>

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
                  <Icone nom="fleche" taille={18} className="parcours-fleche" />
                </Link>
              </Apparition>
            )
          })}
        </div>

        {data?.equipe?.length > 0 && (<>
          <h2 className="titre-section">L'équipe</h2>
          <div className="equipe-apercu">
            {CATEGORIES_EQUIPE.map((cat, i) => {
              const membres = membresDe(data.equipe, cat.id)
              return (
                <Apparition key={cat.id} delai={i * 60}>
                  <Link to="/equipe" className="equipe-tuile" style={{ '--couleur-camp': cat.couleur }}>
                    <Icone nom={cat.icone} taille={22} />
                    <span className="equipe-nombre">{membres.length}</span>
                    <span className="equipe-label">{cat.label}</span>
                    <span className="equipe-pile">{membres.slice(0, 4).map((m) => <i key={m.id} title={m.pseudo}>{(m.pseudo.replace(/^[^\p{L}\p{N}]+/u, '')[0] || '?').toUpperCase()}</i>)}</span>
                  </Link>
                </Apparition>
              )
            })}
          </div>
          <p className="centre" style={{ marginTop: 18 }}><Link to="/equipe" className="bouton secondaire">Rencontrer l'équipe</Link></p>
        </>)}

        {clans.length > 0 && (
          <Apparition className="bandeau-clans">
            <p className="sous-titre">Trois clans, une communauté</p>
            <div className="clans-ligne">
              {clans.map((c) => (
                <Link key={c.id} to="/rangs" className="clan-pastille" style={{ '--couleur-camp': c.couleur }}>
                  <SceauGroupe groupe={c} /><span>{c.nom}</span>
                </Link>
              ))}
            </div>
          </Apparition>
        )}

        <Apparition className="appel">
          <Croissant taille={40} className="marque-lune" />
          <h2>Prêt·e à écrire ta légende ?</h2>
          <p className="discret">Déjà candidaté ? Retrouve ton dossier et lis la réponse du staff sur ta page de suivi.</p>
          <div className="hero-actions">
            <Link to="/candidater" className="bouton grand">Déposer ma candidature</Link>
            <Link to="/suivi" className="bouton grand fantome">Mon suivi</Link>
          </div>
        </Apparition>
      </div>
      {attente && <ModaleAttente poste={attente} groupe={data.groupes.find((g) => g.id === attente.groupe)} onFermer={() => setAttente(null)} />}
    </>
  )
}
