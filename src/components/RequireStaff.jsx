import { useAuth } from '../lib/auth'
import { Icone } from './Icons'
import { Chargeur } from './Ui'

export default function RequireStaff({ children, adminOnly = false }) {
  const { session, estStaff, estAdmin, loading, connexionDiscord } = useAuth()

  if (loading) return <Chargeur texte="Vérification de ton accès…" />

  if (!session) {
    return (
      <div className="page page-etroite">
        <div className="entete-page"><p className="sous-titre">Espace staff</p><h1>Connexion</h1>
          <p>Connecte-toi avec ton compte Discord pour accéder au dashboard.</p></div>
        <div className="centre"><button className="bouton grand" onClick={connexionDiscord}><Icone nom="discord" /> Se connecter avec Discord</button></div>
      </div>
    )
  }
  if (!estStaff) {
    return (
      <div className="page page-etroite"><div className="entete-page"><p className="sous-titre">Accès refusé</p><h1>Réservé au staff</h1>
        <p>Ton compte Discord est connecté, mais tu n'as pas encore les droits staff. Demande à un administrateur de t'ajouter.</p></div></div>
    )
  }
  if (adminOnly && !estAdmin) {
    return (
      <div className="page page-etroite"><div className="entete-page"><p className="sous-titre">Accès refusé</p><h1>Réservé aux administrateurs</h1>
        <p>Cette section nécessite le rôle administrateur.</p></div></div>
    )
  }
  return children
}
