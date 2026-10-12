import { createContext, useContext, useEffect, useMemo, useRef } from 'react'
import { supabase } from './supabase'
import { listerCandidatures, lirePostes, lireGroupes } from './api'
import { useAsync } from './hooks'
import { useToast } from './toast'

const StaffContext = createContext(null)

// Charge une fois la liste des candidatures et la tient à jour en temps réel
// (nécessite `alter publication supabase_realtime add table recrutement.candidatures`).
export function StaffProvider({ children }) {
  const notifier = useToast()
  const cand = useAsync(listerCandidatures, [])
  const ref = useAsync(async () => {
    const [postes, groupes] = await Promise.all([lirePostes(), lireGroupes()])
    return { postes, groupes }
  }, [])
  const recharger = useRef(cand.recharger)
  recharger.current = cand.recharger

  useEffect(() => {
    const canal = supabase
      .channel('recrutement-live')
      .on('postgres_changes', { event: 'INSERT', schema: 'recrutement', table: 'candidatures' }, (p) => {
        notifier(`Nouvelle candidature de ${p.new.pseudo_discord}`, 'info')
        recharger.current()
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'recrutement', table: 'candidatures' }, () => recharger.current())
      .subscribe()
    return () => { supabase.removeChannel(canal) }
  }, [notifier])

  const value = useMemo(() => ({
    candidatures: cand.data || [], chargement: cand.loading, erreur: cand.error, recharger: cand.recharger,
    postes: ref.data?.postes || [], groupes: ref.data?.groupes || [], rechargerRef: ref.recharger,
  }), [cand.data, cand.loading, cand.error, cand.recharger, ref.data, ref.recharger])

  return <StaffContext.Provider value={value}>{children}</StaffContext.Provider>
}

export const useStaffData = () => useContext(StaffContext)
