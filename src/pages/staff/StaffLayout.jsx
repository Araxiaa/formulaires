import { NavLink, Outlet } from 'react-router-dom'
import { StaffProvider, useStaffData } from '../../lib/staffData'
import { useAuth } from '../../lib/auth'
import { useTitre } from '../../lib/hooks'
import { Icone } from '../../components/Icons'

function Menu() {
  const { estAdmin, pseudo } = useAuth()
  const { candidatures } = useStaffData()
  const aTraiter = candidatures.filter((c) => c.statut === 'recue').length

  const liens = [
    { to: '/staff', fin: true, icone: 'tableau', label: "Vue d'ensemble" },
    { to: '/staff/candidatures', icone: 'liste', label: 'Candidatures', badge: aTraiter },
    { to: '/staff/postes', icone: 'grille', label: 'Postes' },
    { to: '/staff/attente', icone: 'horloge', label: "Listes d'attente" },
    { to: '/staff/equipe', icone: 'familles', label: 'Équipe' },
    { to: '/staff/modeles', icone: 'enveloppe', label: 'Réponses types' },
    { to: '/staff/faq', icone: 'question', label: 'FAQ' },
    ...(estAdmin ? [
      { to: '/staff/formulaires', icone: 'crayon', label: 'Formulaires' },
      { to: '/staff/parametres', icone: 'reglages', label: 'Paramètres' },
    ] : []),
  ]
  return (
    <aside className="staff-menu">
      <p className="sous-titre">Espace staff</p>
      <p className="staff-qui">{pseudo || 'Connecté·e'} <span className="badge">{estAdmin ? 'admin' : 'staff'}</span></p>
      <nav>
        {liens.map((l) => (
          <NavLink key={l.to} to={l.to} end={l.fin} className="staff-lien">
            <Icone nom={l.icone} taille={18} /><span>{l.label}</span>
            {l.badge > 0 && <span className="staff-badge">{l.badge}</span>}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}

export default function StaffLayout() {
  useTitre('Dashboard')
  return (
    <StaffProvider>
      <div className="staff-coque">
        <Menu />
        <div className="staff-contenu"><Outlet /></div>
      </div>
    </StaffProvider>
  )
}
