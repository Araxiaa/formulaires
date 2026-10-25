import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAsync, useTitre } from '../lib/hooks'
import { lireEquipe } from '../lib/api'
import { Squelettes, Erreur, Apparition } from '../components/Ui'
import { Icone } from '../components/Icons'
import Membre from '../components/Membre'
import { CATEGORIES_EQUIPE, membresDe, plur } from '../lib/format'

export default function Equipe() {
  useTitre("L'équipe")
  const { data, loading, error, recharger } = useAsync(lireEquipe, [])
  const [filtre, setFiltre] = useState('tous')
  const [recherche, setRecherche] = useState('')

  const equipe = useMemo(() => {
    const q = recherche.trim().toLowerCase()
    return (data || []).filter((m) => !q || m.pseudo.toLowerCase().includes(q) || (m.titre || '').toLowerCase().includes(q))
  }, [data, recherche])

  const polyvalents = (data || []).filter((m) => m.categories.length > 1).length
  const visibles = CATEGORIES_EQUIPE.filter((c) => filtre === 'tous' || filtre === c.id)

  return (
    <div className="page">
      <div className="entete-page">
        <p className="sous-titre">Qui fait vivre le serveur</p>
        <h1>L'équipe</h1>
        <p>Fondateurs, modérateurs, staffs et apprentis : toutes les personnes qui veillent sur la forêt.</p>
      </div>

      {data && (
        <div className="equipe-synthese">
          <div className="synthese-total"><span className="stat-valeur">{data.length}</span><span className="stat-label">Membres</span>
            {polyvalents > 0 && <span className="discret" style={{ fontSize: '0.78rem' }}>dont {polyvalents} polyvalent{polyvalents > 1 ? 's' : ''}</span>}</div>
          <div className="synthese-barres">
            {CATEGORIES_EQUIPE.map((c) => {
              const n = membresDe(data, c.id).length
              return (
                <button key={c.id} className={`synthese-barre${filtre === c.id ? ' actif' : ''}`} style={{ '--couleur-camp': c.couleur }} onClick={() => setFiltre(filtre === c.id ? 'tous' : c.id)} aria-pressed={filtre === c.id}>
                  <Icone nom={c.icone} taille={16} /><span className="synthese-label">{c.label}</span><strong>{n}</strong>
                </button>
              )
            })}
          </div>
        </div>
      )}

      <div className="barre-outils">
        <div className="filtres" role="tablist" aria-label="Filtrer par équipe">
          <button role="tab" aria-selected={filtre === 'tous'} className={`pastille-filtre${filtre === 'tous' ? ' actif' : ''}`} onClick={() => setFiltre('tous')}>Tous</button>
          {CATEGORIES_EQUIPE.map((c) => (
            <button key={c.id} role="tab" aria-selected={filtre === c.id} className={`pastille-filtre${filtre === c.id ? ' actif' : ''}`} onClick={() => setFiltre(c.id)}>{c.court}</button>
          ))}
        </div>
        <input type="search" placeholder="Chercher un membre…" value={recherche} onChange={(e) => setRecherche(e.target.value)} aria-label="Chercher un membre" style={{ maxWidth: 240 }} />
      </div>

      {loading && <Squelettes n={4} hauteur={96} />}
      {error && <Erreur erreur={error} onRetry={recharger} />}

      {data && visibles.map((cat) => {
        const membres = membresDe(equipe, cat.id)
        if (!membres.length && (recherche || filtre === 'tous') && recherche) return null
        const fondateurs = cat.id === 'fondateur'
        return (
          <section key={cat.id} className="equipe-section" style={{ '--couleur-camp': cat.couleur }}>
            <Apparition className="equipe-titre">
              <span className="sceau-clan"><Icone nom={cat.icone} taille={20} /></span>
              <div><h2>{cat.label}</h2><p className="discret">{cat.description}</p></div>
              <span className="equipe-compte">{plur(membres.length, 'membre')}</span>
            </Apparition>
            {membres.length ? (
              <div className={`grille-membres${fondateurs ? ' grille-fondateurs' : ''}`}>
                {membres.map((m, i) => <Apparition key={m.id} delai={i * 50}><Membre membre={m} contexte={cat.id} grand={fondateurs} /></Apparition>)}
              </div>
            ) : <p className="equipe-vide">Aucun·e pour le moment. <Link to="/postes">Peut-être toi ?</Link></p>}
          </section>
        )
      })}
    </div>
  )
}
