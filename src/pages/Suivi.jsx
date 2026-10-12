import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAsync, useTitre } from '../lib/hooks'
import { mesCandidatures, retirer, suiviCode, suiviPseudo } from '../lib/api'
import { messageErreur } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { useToast } from '../lib/toast'
import { Apparition, Bouton, Chargeur, Modale, SceauCire } from '../components/Ui'
import { Icone } from '../components/Icons'
import { STATUTS, TYPES, dateCourte, dateHeure, joursDepuis } from '../lib/format'

const LIBELLES_FRISE = {
  recue: 'Candidature reçue', examen: "Dossier en cours d'examen", acceptee: 'Candidature acceptée',
  refusee: 'Candidature refusée', retiree: 'Candidature retirée', message: 'Message du staff',
}
const ICONES_FRISE = { recue: 'enveloppe', examen: 'oeil', acceptee: 'check', refusee: 'croix', retiree: 'poubelle', message: 'cloche' }

export default function Suivi() {
  const { code } = useParams()
  useTitre('Mon suivi')
  return code ? <Dossier code={code.toUpperCase()} /> : <Accueil />
}

/* ───────── Recherche + liste Discord ───────── */
function Accueil() {
  const navigate = useNavigate()
  const { session, connexionDiscord, loading: authLoading } = useAuth()
  const notifier = useToast()
  const [saisie, setSaisie] = useState('')
  const [pseudo, setPseudo] = useState('')
  const [mode, setMode] = useState('code')
  const [trouvees, setTrouvees] = useState(null)
  const [chargement, setChargement] = useState(false)

  const mes = useAsync(() => (session ? mesCandidatures() : Promise.resolve(null)), [session?.user?.id])

  function chercherCode(e) {
    e.preventDefault()
    const c = saisie.trim().toUpperCase()
    if (!/^TRV-[A-Z0-9]{6}$/.test(c)) return notifier('Le code ressemble à TRV-AB12CD.', 'erreur')
    navigate(`/suivi/${c}`)
  }

  async function chercherPseudo(e) {
    e.preventDefault()
    setChargement(true)
    try { setTrouvees(await suiviPseudo(pseudo)) } catch (err) { notifier(messageErreur(err), 'erreur') } finally { setChargement(false) }
  }

  return (
    <div className="page page-etroite">
      <div className="entete-page">
        <p className="sous-titre">Mon suivi</p>
        <h1>Où en est ma candidature ?</h1>
        <p>Entre ton code de suivi, ou connecte-toi avec Discord pour retrouver toutes tes candidatures et lire les réponses du staff.</p>
      </div>

      {!authLoading && !session && (
        <div className="carte carte-discord grande">
          <Icone nom="discord" taille={28} />
          <div><h3>Connexion Discord</h3><p className="discret" style={{ margin: 0 }}>Retrouve toutes tes candidatures d'un clic, sans code.</p></div>
          <button className="bouton" onClick={connexionDiscord}>Se connecter</button>
        </div>
      )}

      {session && (
        <section>
          <h2 className="titre-section">Mes candidatures</h2>
          {mes.loading ? <Chargeur /> : mes.data?.length ? mes.data.map((c) => <LigneCandidature key={c.code} c={c} />)
            : <p className="vide">Aucune candidature liée à ton compte Discord pour l'instant. <Link to="/candidater" style={{ color: 'var(--couleur-accent)' }}>Candidater</Link></p>}
        </section>
      )}

      <h2 className="titre-section">Avec un code ou un pseudo</h2>
      <div className="onglets" style={{ marginBottom: 16 }}>
        <button className={mode === 'code' ? 'actif' : ''} onClick={() => setMode('code')}>Par code</button>
        <button className={mode === 'pseudo' ? 'actif' : ''} onClick={() => setMode('pseudo')}>Par pseudo</button>
      </div>

      {mode === 'code' ? (
        <form className="ligne-recherche" onSubmit={chercherCode}>
          <input type="text" className="champ-code" placeholder="TRV-XXXXXX" value={saisie} maxLength={10} autoComplete="off" spellCheck={false}
                 onChange={(e) => setSaisie(e.target.value.toUpperCase())} aria-label="Code de suivi" />
          <button className="bouton"><Icone nom="recherche" taille={16} /> Vérifier</button>
        </form>
      ) : (
        <>
          <form className="ligne-recherche" onSubmit={chercherPseudo}>
            <input type="text" placeholder="Ton pseudo Discord" value={pseudo} onChange={(e) => setPseudo(e.target.value)} aria-label="Pseudo Discord" />
            <Bouton className="bouton" chargement={chargement} disabled={pseudo.trim().length < 2}><Icone nom="recherche" taille={16} /> Rechercher</Bouton>
          </form>
          <p className="aide" style={{ marginTop: 8 }}>On t'affiche uniquement le code, le type et le statut — jamais le contenu de tes réponses.</p>
          {trouvees && (trouvees.length
            ? trouvees.map((c) => <LigneCandidature key={c.code} c={c} />)
            : <p className="vide">Aucune candidature pour ce pseudo.</p>)}
        </>
      )}
    </div>
  )
}

function LigneCandidature({ c }) {
  const t = TYPES[c.type]
  return (
    <Link to={`/suivi/${c.code}`} className="ligne-candidature">
      <span className="sceau-clan petit"><Icone nom={t?.icone || 'patte'} taille={15} /></span>
      <div className="grow"><strong>{c.resume || t?.label}</strong><span className="mono discret"> {c.code}</span></div>
      <span className="badge pastille" data-statut={c.statut}>{STATUTS[c.statut]?.label}</span>
      <span className="discret mono" style={{ fontSize: '0.75rem' }}>{dateCourte(c.cree_le)}</span>
    </Link>
  )
}

/* ───────── Dossier détaillé ───────── */
function Dossier({ code }) {
  const notifier = useToast()
  const { data: c, loading, error, recharger } = useAsync(() => suiviCode(code), [code])
  const [confirmeRetrait, setConfirmeRetrait] = useState(false)
  const [retrait, setRetrait] = useState(false)

  useEffect(() => { document.title = `${code} — Mon suivi` }, [code])

  if (loading) return <Chargeur />
  if (error) return <div className="page page-etroite"><div className="vide">Impossible de charger ce dossier. <button className="bouton petit fantome" onClick={recharger}>Réessayer</button></div></div>
  if (!c) {
    return (
      <div className="page page-etroite">
        <div className="entete-page"><p className="sous-titre">Introuvable</p><h1>Code inconnu</h1><p>Aucune candidature ne correspond à <span className="mono">{code}</span>. Vérifie ton code.</p></div>
        <p className="centre"><Link to="/suivi" className="bouton">Retour</Link></p>
      </div>
    )
  }

  const decide = c.statut === 'acceptee' || c.statut === 'refusee'
  const enCours = c.statut === 'recue' || c.statut === 'examen'
  const lien = `${window.location.origin}${import.meta.env.BASE_URL}#/suivi/${c.code}`

  async function retirerDossier() {
    setRetrait(true)
    try { await retirer(c.code); notifier('Candidature retirée.', 'succes'); setConfirmeRetrait(false); recharger() }
    catch (err) { notifier(messageErreur(err), 'erreur') } finally { setRetrait(false) }
  }

  return (
    <div className="page page-etroite">
      <Link to="/suivi" className="lien-retour"><Icone nom="retour" taille={14} /> Mon suivi</Link>

      <Apparition className="carte dossier-entete">
        <div>
          <p className="sous-titre">{TYPES[c.type]?.label}</p>
          <h1>{c.resume || TYPES[c.type]?.label}</h1>
          <p className="discret mono" style={{ margin: 0 }}>{c.code} · {c.pseudo} · déposée le {dateCourte(c.cree_le)}</p>
        </div>
        <span className="badge pastille grand" data-statut={c.statut}>{STATUTS[c.statut]?.label}</span>
      </Apparition>

      {decide && c.message && <Lettre c={c} />}

      {enCours && (
        <Apparition className="carte message-attente">
          <Icone nom={c.statut === 'examen' ? 'oeil' : 'enveloppe'} taille={26} />
          <div>
            <h3>{c.statut === 'examen' ? "Ton dossier est entre de bonnes mains" : 'Ta candidature est bien arrivée'}</h3>
            <p className="discret" style={{ margin: 0 }}>
              {c.statut === 'examen' ? "L'équipe est en train de lire ton dossier." : "Un·e membre du staff va bientôt s'en occuper."}{' '}
              Ouverte depuis {joursDepuis(c.cree_le) <= 0 ? "aujourd'hui" : `${joursDepuis(c.cree_le)} jour${joursDepuis(c.cree_le) > 1 ? 's' : ''}`}.
              Reviens ici : la réponse s'affichera sur cette page{c.message ? '.' : ' et tu seras mentionné·e sur Discord.'}
            </p>
          </div>
        </Apparition>
      )}

      {c.statut === 'retiree' && <div className="carte message-attente"><Icone nom="poubelle" taille={26} /><p style={{ margin: 0 }}>Cette candidature a été retirée.</p></div>}

      <h2 className="titre-section">Historique</h2>
      <ol className="frise">
        {c.frise.map((e, i) => (
          <Apparition as="li" key={i} delai={i * 60} className={`frise-item frise-${e.type}`}>
            <span className="frise-point"><Icone nom={ICONES_FRISE[e.type] || 'cloche'} taille={14} /></span>
            <div><strong>{LIBELLES_FRISE[e.type]}</strong><span className="discret mono"> · {dateHeure(e.date)}</span>
              {e.message && e.type !== 'recue' && <p className="discret" style={{ margin: '4px 0 0' }}>{e.message}</p>}</div>
          </Apparition>
        ))}
      </ol>

      <div className="dossier-actions">
        <button className="bouton fantome" onClick={async () => { try { await navigator.clipboard.writeText(lien); notifier('Lien copié.', 'succes') } catch { notifier(lien, 'info') } }}><Icone nom="lien" taille={16} /> Copier le lien</button>
        {enCours && <button className="bouton fantome danger-texte" onClick={() => setConfirmeRetrait(true)}><Icone nom="poubelle" taille={16} /> Retirer ma candidature</button>}
      </div>

      {confirmeRetrait && (
        <Modale onFermer={() => setConfirmeRetrait(false)} titre="Retirer la candidature">
          <h2>Retirer ta candidature ?</h2>
          <p className="discret">Cette action est définitive. Tu pourras en déposer une nouvelle ensuite.</p>
          <div className="modale-actions">
            <button className="bouton fantome" onClick={() => setConfirmeRetrait(false)}>Annuler</button>
            <Bouton className="bouton danger" chargement={retrait} onClick={retirerDossier}>Retirer</Bouton>
          </div>
        </Modale>
      )}
    </div>
  )
}

/* La réponse du staff, présentée comme une lettre scellée */
function Lettre({ c }) {
  const ok = c.statut === 'acceptee'
  return (
    <Apparition className={`lettre ${ok ? 'lettre-ok' : 'lettre-ko'}`}>
      <div className="lettre-sceau"><SceauCire taille={74} variante={ok ? 'ok' : 'ko'} icone={ok ? 'check' : 'croix'} /></div>
      <p className="sous-titre">{ok ? 'Bonne nouvelle' : 'Réponse du staff'}</p>
      <h2>{ok ? 'Ta candidature est acceptée' : "Ta candidature n'a pas été retenue"}</h2>
      <blockquote>{c.message}</blockquote>
      <p className="lettre-signature">— L'équipe du Prix de la Trêve<br /><small>{dateCourte(c.decide_le)}</small></p>
    </Apparition>
  )
}
