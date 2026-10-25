import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { useTheme } from '../lib/theme'
import { useAuth } from '../lib/auth'
import { Croissant, Icone } from './Icons'

const LIENS = [
  { to: '/postes', label: 'Postes', icone: 'grille' },
  { to: '/candidater', label: 'Candidater', icone: 'crayon' },
  { to: '/suivi', label: 'Mon suivi', icone: 'recherche' },
  { to: '/rangs', label: 'Hauts Rangs', icone: 'couronne' },
  { to: '/equipe', label: 'Équipe', icone: 'familles' },
  { to: '/faq', label: 'FAQ', icone: 'question' },
]

export default function SiteHeader() {
  const { theme, basculerTheme } = useTheme()
  const { session, estStaff, avatar, pseudo, connexionDiscord, deconnexion } = useAuth()
  const { pathname } = useLocation()
  const [menu, setMenu] = useState(false)
  const dansStaff = pathname.startsWith('/staff')

  useEffect(() => setMenu(false), [pathname])

  return (
    <header className="site-header">
      <div className="site-header-interieur">
        <Link to="/" className="marque" aria-label="Le Prix de la Trêve — accueil">
          <Croissant taille={26} className="marque-lune" />
          <span className="marque-texte">Le Prix de la Trêve<small>Recrutement</small></span>
        </Link>

        <nav className={`nav-principale${menu ? ' ouverte' : ''}`} aria-label="Navigation principale">
          {LIENS.map((l) => (
            <NavLink key={l.to} to={l.to} className="nav-lien"><Icone nom={l.icone} taille={16} />{l.label}</NavLink>
          ))}
        </nav>

        <div className="actions-header">
          {estStaff && (
            <Link to={dansStaff ? '/' : '/staff'} className="bouton-icone" title={dansStaff ? 'Retour au site' : 'Dashboard staff'} aria-label="Dashboard staff">
              <Icone nom={dansStaff ? 'maison' : 'tableau'} />
            </Link>
          )}
          <button type="button" className="bouton-icone" onClick={basculerTheme} aria-label="Changer de thème" title={theme === 'sombre' ? 'Mode clair' : 'Mode sombre'}>
            <Icone nom={theme === 'sombre' ? 'soleil' : 'lune'} />
          </button>
          {session ? (
            <button type="button" className="bouton-icone" onClick={deconnexion} title={`${pseudo || 'Connecté·e'} — se déconnecter`} aria-label="Se déconnecter">
              {avatar ? <img src={avatar} alt="" className="avatar-mini" referrerPolicy="no-referrer" /> : <Icone nom="utilisateur" />}
            </button>
          ) : (
            <button type="button" className="bouton-icone" onClick={connexionDiscord} title="Se connecter avec Discord" aria-label="Se connecter avec Discord">
              <Icone nom="discord" />
            </button>
          )}
          <button type="button" className="bouton-icone bouton-menu" onClick={() => setMenu((o) => !o)} aria-expanded={menu} aria-label="Menu">
            <Icone nom={menu ? 'fermer' : 'menu'} />
          </button>
        </div>
      </div>
    </header>
  )
}
