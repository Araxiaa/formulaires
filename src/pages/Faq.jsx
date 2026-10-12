import { useMemo, useState } from 'react'
import { useAsync, useTitre } from '../lib/hooks'
import { lireFaq } from '../lib/api'
import { Squelettes, Erreur, Apparition } from '../components/Ui'
import { Icone } from '../components/Icons'

export default function Faq() {
  useTitre('FAQ')
  const { data, loading, error, recharger } = useAsync(lireFaq, [])
  const [ouverte, setOuverte] = useState(null)
  const [recherche, setRecherche] = useState('')

  const sections = useMemo(() => {
    const q = recherche.trim().toLowerCase()
    const filtre = (data || []).filter((f) => !q || (f.question + f.reponse).toLowerCase().includes(q))
    const map = new Map()
    filtre.forEach((f) => map.set(f.section, [...(map.get(f.section) || []), f]))
    return [...map.entries()]
  }, [data, recherche])

  return (
    <div className="page page-etroite">
      <div className="entete-page">
        <p className="sous-titre">Besoin d'aide ?</p>
        <h1>Questions fréquentes</h1>
        <p>Tout ce qu'il faut savoir avant de candidater.</p>
      </div>
      <input type="search" placeholder="Rechercher une question…" value={recherche} onChange={(e) => setRecherche(e.target.value)} aria-label="Rechercher dans la FAQ" style={{ marginBottom: 8 }} />
      {loading && <Squelettes n={4} hauteur={60} />}
      {error && <Erreur erreur={error} onRetry={recharger} />}
      {data && !sections.length && <p className="vide">Aucune question ne correspond.</p>}
      {sections.map(([titre, items]) => (
        <section key={titre}>
          <h2 className="titre-section">{titre}</h2>
          {items.map((f) => (
            <Apparition key={f.id} className={`faq-item${ouverte === f.id ? ' ouverte' : ''}`}>
              <button className="faq-question" aria-expanded={ouverte === f.id} onClick={() => setOuverte(ouverte === f.id ? null : f.id)}>
                {f.question}<Icone nom="chevron" taille={18} />
              </button>
              <div className="faq-reponse"><div><p>{f.reponse}</p></div></div>
            </Apparition>
          ))}
        </section>
      ))}
    </div>
  )
}
