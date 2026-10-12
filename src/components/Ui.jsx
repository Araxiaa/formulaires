import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Icone } from './Icons'

/* Modale accessible : Échap ferme, clic sur le fond ferme, focus rendu à la fermeture */
export function Modale({ onFermer, children, large = false, tiroir = false, titre }) {
  const ref = useRef(null)

  useEffect(() => {
    const precedent = document.activeElement
    const surTouche = (e) => { if (e.key === 'Escape') onFermer() }
    document.addEventListener('keydown', surTouche)
    document.body.style.overflow = 'hidden'
    ref.current?.focus()
    return () => {
      document.removeEventListener('keydown', surTouche)
      document.body.style.overflow = ''
      precedent?.focus?.()
    }
  }, [onFermer])

  return createPortal(
    <div className={`modale-fond${tiroir ? ' tiroir-fond' : ''}`} onMouseDown={(e) => e.target === e.currentTarget && onFermer()}>
      <div ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-label={titre}
           className={`modale${large ? ' large' : ''}${tiroir ? ' tiroir' : ''}`}>
        <button type="button" className="bouton-icone fermer-modale" onClick={onFermer} aria-label="Fermer"><Icone nom="fermer" /></button>
        {children}
      </div>
    </div>,
    document.body,
  )
}

export function Chargeur({ texte = 'Chargement…' }) {
  return <div className="chargeur"><span className="spinner" style={{ width: 26, height: 26, marginBottom: 10 }} />{texte}</div>
}

export function Squelettes({ n = 6, hauteur = 150 }) {
  return (
    <div className="grille">
      {Array.from({ length: n }, (_, i) => <div key={i} className="squelette" style={{ height: hauteur }} />)}
    </div>
  )
}

export function Vide({ icone = 'parchemin', children }) {
  return <div className="vide"><Icone nom={icone} taille={28} /><p style={{ margin: '8px 0 0' }}>{children}</p></div>
}

export function Erreur({ erreur, onRetry }) {
  return (
    <div className="vide">
      <Icone nom="alerte" taille={28} />
      <p style={{ margin: '8px 0 12px' }}>{erreur?.message?.includes('schema') ? "La base n'est pas encore prête (schéma « recrutement » non exposé ?)." : "Impossible de charger les données."}</p>
      {onRetry && <button className="bouton fantome petit" onClick={onRetry}>Réessayer</button>}
    </div>
  )
}

export function Bouton({ chargement, children, ...rest }) {
  return (
    <button {...rest} disabled={rest.disabled || chargement}>
      {chargement && <span className="spinner" />}
      {children}
    </button>
  )
}

/* Apparition douce au défilement */
export function Apparition({ children, delai = 0, className = '', as: Tag = 'div', ...rest }) {
  const ref = useRef(null)
  const [vu, setVu] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el || !('IntersectionObserver' in window)) { setVu(true); return }
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVu(true); obs.disconnect() } }, { threshold: 0.1 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return <Tag ref={ref} className={`reveal${vu ? ' visible' : ''} ${className}`} style={{ transitionDelay: `${delai}ms` }} {...rest}>{children}</Tag>
}

/* Sceau de cire : décision, confirmation d'envoi */
export function SceauCire({ taille = 84, variante = 'accent', icone = 'sceau' }) {
  const couleurs = { accent: ['#b0402b', '#7a2a1c'], ok: ['#3f8a5c', '#25563a'], ko: ['#8a3a3a', '#5a2222'] }[variante]
  return (
    <svg width={taille} height={taille} viewBox="0 0 100 100" aria-hidden="true" className="sceau-cire">
      <defs>
        <radialGradient id={`cire-${variante}`} cx="35%" cy="30%" r="80%">
          <stop offset="0" stopColor={couleurs[0]} /><stop offset="1" stopColor={couleurs[1]} />
        </radialGradient>
      </defs>
      <path d="M50 4c8 0 11 6 18 8s14-2 19 4 2 13 6 20 10 10 8 18-9 9-12 16-3 15-10 18-12-2-19 0-13 8-20 6-10-9-16-13-14-5-17-12 1-13-1-20-9-12-7-19 9-9 13-15 3-14 10-17 13 3 20 2 10-5 16-5Z" fill={`url(#cire-${variante})`} />
      <circle cx="50" cy="50" r="30" fill="none" stroke="rgba(255,235,210,.35)" strokeWidth="1.6" />
      <g transform="translate(26 26) scale(2)" stroke="rgba(255,235,210,.85)" fill="none" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
        <SceauIcone nom={icone} />
      </g>
    </svg>
  )
}

function SceauIcone({ nom }) {
  if (nom === 'croix') return <path d="m7 7 10 10M17 7 7 17" />
  if (nom === 'check') return <path d="m5.500 12.500 4.500 4.500L19 8" />
  return <><path d="M12 4c1 3 5 5 5 8.500a5 5 0 0 1-10 0c0-2 1-3.500 2.300-5 .2 1.500.8 2.200 1.700 2.500C11 8 11 5.500 12 4Z" /></>
}

/* Anneau de progression (compteur de caractères) */
export function Anneau({ valeur, max, taille = 22 }) {
  const r = (taille - 4) / 2, c = 2 * Math.PI * r
  const ratio = max ? Math.min(valeur / max, 1) : 1
  return (
    <svg width={taille} height={taille} viewBox={`0 0 ${taille} ${taille}`} aria-hidden="true">
      <circle cx={taille / 2} cy={taille / 2} r={r} fill="none" stroke="var(--couleur-bordure)" strokeWidth="2.5" />
      <circle cx={taille / 2} cy={taille / 2} r={r} fill="none" strokeWidth="2.5" strokeLinecap="round"
        stroke={ratio >= 1 ? 'var(--statut-ok)' : 'var(--couleur-accent)'}
        strokeDasharray={c} strokeDashoffset={c * (1 - ratio)} transform={`rotate(-90 ${taille / 2} ${taille / 2})`}
        style={{ transition: 'stroke-dashoffset .3s var(--ease)' }} />
    </svg>
  )
}
