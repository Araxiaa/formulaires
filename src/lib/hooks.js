import { useCallback, useEffect, useRef, useState } from 'react'

// Charge des données async avec états loading / erreur et rechargement manuel.
export function useAsync(fn, deps = []) {
  const [etat, setEtat] = useState({ data: null, loading: true, error: null })
  const compteur = useRef(0)

  const charger = useCallback(async () => {
    const id = ++compteur.current
    setEtat((e) => ({ ...e, loading: true, error: null }))
    try {
      const data = await fn()
      if (id === compteur.current) setEtat({ data, loading: false, error: null })
    } catch (error) {
      if (id === compteur.current) setEtat({ data: null, loading: false, error })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useEffect(() => { charger() }, [charger])
  return { ...etat, recharger: charger, setData: (data) => setEtat((e) => ({ ...e, data })) }
}

export function useTitre(titre) {
  useEffect(() => {
    document.title = titre ? `${titre} — Le Prix de la Trêve` : 'Le Prix de la Trêve — Recrutement'
  }, [titre])
}

// Valeur persistée en localStorage (sans jamais planter si le stockage est bloqué).
export function useStockage(cle, initial) {
  const [val, setVal] = useState(() => {
    try { const v = localStorage.getItem(cle); return v == null ? initial : JSON.parse(v) } catch { return initial }
  })
  const definir = useCallback((v) => {
    setVal(v)
    try { localStorage.setItem(cle, JSON.stringify(v)) } catch { /* ignore */ }
  }, [cle])
  return [val, definir]
}
