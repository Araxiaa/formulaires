import { Link } from 'react-router-dom'
import { useState } from 'react'
import { SceauCire } from '../Ui'
import { Icone } from '../Icons'

export default function Succes({ code, delai, connecte }) {
  const [copie, setCopie] = useState(false)
  const url = `${window.location.origin}${import.meta.env.BASE_URL}#/suivi/${code}`

  async function copier(texte) {
    try { await navigator.clipboard.writeText(texte); setCopie(true); setTimeout(() => setCopie(false), 2000) } catch { /* ignore */ }
  }

  return (
    <div className="succes">
      <div className="succes-sceau"><SceauCire taille={110} variante="ok" icone="check" /></div>
      <p className="sous-titre">Candidature scellée</p>
      <h1>C'est envoyé !</h1>
      <p className="discret">Le staff a bien reçu ta candidature{delai ? ` et y répond généralement sous ${delai}` : ''}. Conserve ce code : il te permet de suivre ton dossier et de lire la réponse.</p>
      <button className="code-suivi" onClick={() => copier(code)} aria-label="Copier le code de suivi">
        <span>{code}</span><Icone nom={copie ? 'check' : 'copie'} taille={20} />
      </button>
      <p className="aide">{copie ? 'Code copié !' : 'Clique pour copier'}</p>
      {connecte && <p className="discret"><Icone nom="discord" taille={16} /> Connecté·e avec Discord : retrouve aussi cette candidature dans « Mon suivi », sans code.</p>}
      <div className="succes-actions">
        <Link to={`/suivi/${code}`} className="bouton grand">Suivre ma candidature</Link>
        <button className="bouton grand fantome" onClick={() => copier(url)}><Icone nom="lien" taille={18} /> Copier le lien de suivi</button>
      </div>
    </div>
  )
}
