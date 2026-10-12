import { createContext, useCallback, useContext, useState } from 'react'
import { Icone } from '../components/Icons'

const ToastContext = createContext(() => {})
let compteur = 0

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const notifier = useCallback((message, type = 'info') => {
    const id = ++compteur
    setToasts((t) => [...t, { id, message, type }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4500)
  }, [])

  const icones = { succes: 'check', erreur: 'alerte', info: 'cloche' }
  return (
    <ToastContext.Provider value={notifier}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            <Icone nom={icones[t.type] || 'cloche'} taille={18} />
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)
