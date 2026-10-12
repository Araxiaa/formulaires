import { useId } from 'react'
import { Anneau } from '../Ui'
import { Icone } from '../Icons'
import { longueur, lignes } from './validation'

function Compteur({ valeur, min }) {
  const n = longueur(valeur)
  if (!min) return n ? <span className="compteur discret">{n} caractères</span> : null
  const ok = n >= min
  return (
    <span className={`compteur${ok ? ' compteur-ok' : ''}`}>
      <Anneau valeur={n} max={min} />
      {ok ? `${n} caractères` : `${n} / ${min} minimum`}
    </span>
  )
}

export default function Champ({ champ, valeur, onChange, erreur, indice }) {
  const id = useId()
  const { type, label, hint, placeholder, options = [] } = champ
  const requis = champ.required !== false

  return (
    <div className={`champ${erreur ? ' invalide' : ''}`} data-champ={champ.cle}>
      <label className="etiquette" htmlFor={id}>
        {indice != null && <span className="indice-q">{indice}</span>}
        {label}{requis && <span className="obligatoire" aria-hidden="true">*</span>}
        {!requis && <span className="facultatif">facultatif</span>}
      </label>
      {hint && <p className="aide">{hint}</p>}

      {type === 'text' && (
        <input id={id} type="text" value={valeur || ''} placeholder={placeholder} maxLength={200}
               onChange={(e) => onChange(e.target.value)} aria-invalid={!!erreur} />
      )}

      {(type === 'textarea' || type === 'url_list') && (
        <>
          <textarea id={id} value={valeur || ''} maxLength={3000} rows={type === 'url_list' ? 4 : 6}
                    placeholder={type === 'url_list' ? 'https://…\nhttps://…' : placeholder}
                    onChange={(e) => onChange(e.target.value)} aria-invalid={!!erreur} />
          <div className="pied-champ">
            {type === 'url_list'
              ? <span className="compteur discret">{lignes(valeur).length} lien{lignes(valeur).length > 1 ? 's' : ''}</span>
              : <Compteur valeur={valeur} min={champ.min} />}
          </div>
        </>
      )}

      {type === 'choice' && (
        <div className="choix" role="radiogroup" aria-labelledby={id}>
          {options.map((o) => (
            <button type="button" key={o} role="radio" aria-checked={valeur === o} className={`choix-carte${valeur === o ? ' actif' : ''}`} onClick={() => onChange(o)}>
              <span className="choix-pastille">{valeur === o && <Icone nom="check" taille={12} />}</span>{o}
            </button>
          ))}
        </div>
      )}

      {type === 'multi' && (
        <div className="choix">
          {options.map((o) => {
            const actif = (valeur || []).includes(o)
            return (
              <button type="button" key={o} role="checkbox" aria-checked={actif} className={`choix-carte${actif ? ' actif' : ''}`}
                      onClick={() => onChange(actif ? valeur.filter((x) => x !== o) : [...(valeur || []), o])}>
                <span className="choix-pastille carre">{actif && <Icone nom="check" taille={12} />}</span>{o}
              </button>
            )
          })}
        </div>
      )}

      {erreur && <p className="erreur-champ" role="alert">{erreur}</p>}
    </div>
  )
}
