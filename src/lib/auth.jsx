import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react'
import { supabase } from './supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [role, setRole] = useState(null) // 'admin' | 'staff' | null
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let actif = true
    async function appliquer(s) {
      setSession(s)
      if (s) {
        const { data } = await supabase.rpc('mon_role')
        if (actif) setRole(data || null)
      } else setRole(null)
      if (actif) setLoading(false)
    }
    supabase.auth.getSession().then(({ data }) => appliquer(data.session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => appliquer(s))
    return () => { actif = false; subscription.unsubscribe() }
  }, [])

  // Retour à la page d'origine après la redirection Discord
  useEffect(() => {
    if (!session) return
    try {
      const retour = sessionStorage.getItem('retour_apres_login')
      if (retour) {
        sessionStorage.removeItem('retour_apres_login')
        if (retour !== window.location.hash) window.location.hash = retour
      }
    } catch { /* stockage indisponible */ }
  }, [session])

  const connexionDiscord = useCallback(async () => {
    try { sessionStorage.setItem('retour_apres_login', window.location.hash || '#/') } catch { /* ignore */ }
    await supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: { redirectTo: window.location.origin + import.meta.env.BASE_URL },
    })
  }, [])

  const deconnexion = useCallback(() => supabase.auth.signOut(), [])

  const value = useMemo(() => {
    const meta = session?.user?.user_metadata || {}
    return {
      session, loading, role,
      estStaff: !!role,
      estAdmin: role === 'admin',
      discordId: meta.provider_id || null,
      pseudo: meta.custom_claims?.global_name || meta.full_name || meta.name || null,
      avatar: meta.avatar_url || null,
      connexionDiscord, deconnexion,
    }
  }, [session, role, loading, connexionDiscord, deconnexion])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
