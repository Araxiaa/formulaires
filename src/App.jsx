import { lazy, Suspense, useEffect } from 'react'
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { ThemeProvider } from './lib/theme'
import { AuthProvider } from './lib/auth'
import { ToastProvider } from './lib/toast'
import SiteHeader from './components/SiteHeader'
import SiteFooter from './components/SiteFooter'
import RequireStaff from './components/RequireStaff'
import { Chargeur } from './components/Ui'
import Accueil from './pages/Accueil'

const Postes = lazy(() => import('./pages/Postes'))
const Candidater = lazy(() => import('./pages/Candidater'))
const Suivi = lazy(() => import('./pages/Suivi'))
const Rangs = lazy(() => import('./pages/Rangs'))
const Faq = lazy(() => import('./pages/Faq'))
const Equipe = lazy(() => import('./pages/Equipe'))
const EquipeStaff = lazy(() => import('./pages/staff/EquipeStaff'))
const StaffLayout = lazy(() => import('./pages/staff/StaffLayout'))
const VueEnsemble = lazy(() => import('./pages/staff/VueEnsemble'))
const Candidatures = lazy(() => import('./pages/staff/Candidatures'))
const CandidatureDetail = lazy(() => import('./pages/staff/CandidatureDetail'))
const PostesStaff = lazy(() => import('./pages/staff/PostesStaff'))
const Formulaires = lazy(() => import('./pages/staff/Formulaires'))
const Attente = lazy(() => import('./pages/staff/Attente'))
const Modeles = lazy(() => import('./pages/staff/Modeles'))
const FaqStaff = lazy(() => import('./pages/staff/FaqStaff'))
const Parametres = lazy(() => import('./pages/staff/Parametres'))

// Remonte en haut à chaque changement de page
function RemonterEnHaut() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo({ top: 0 }) }, [pathname])
  return null
}

export default function App() {
  return (
    <HashRouter>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <RemonterEnHaut />
            <SiteHeader />
            <div className="contenu">
              <Suspense fallback={<Chargeur />}>
                <Routes>
                  <Route path="/" element={<Accueil />} />
                  <Route path="/postes" element={<Postes />} />
                  <Route path="/candidater" element={<Candidater />} />
                  <Route path="/candidater/:type" element={<Candidater />} />
                  <Route path="/suivi" element={<Suivi />} />
                  <Route path="/suivi/:code" element={<Suivi />} />
                  <Route path="/rangs" element={<Rangs />} />
                  <Route path="/faq" element={<Faq />} />
                  <Route path="/equipe" element={<Equipe />} />

                  <Route path="/staff" element={<RequireStaff><StaffLayout /></RequireStaff>}>
                    <Route index element={<VueEnsemble />} />
                    <Route path="candidatures" element={<Candidatures />} />
                    <Route path="candidatures/:id" element={<CandidatureDetail />} />
                    <Route path="postes" element={<PostesStaff />} />
                    <Route path="attente" element={<Attente />} />
                    <Route path="equipe" element={<EquipeStaff />} />
                    <Route path="modeles" element={<Modeles />} />
                    <Route path="faq" element={<FaqStaff />} />
                    <Route path="formulaires" element={<RequireStaff adminOnly><Formulaires /></RequireStaff>} />
                    <Route path="parametres" element={<RequireStaff adminOnly><Parametres /></RequireStaff>} />
                  </Route>
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Suspense>
            </div>
            <SiteFooter />
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </HashRouter>
  )
}
