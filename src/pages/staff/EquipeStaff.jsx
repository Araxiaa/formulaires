import { useMemo, useState } from 'react'
import { useAsync } from '../../lib/hooks'
import { lireEquipe, lirePostes, invalider, sauverMembre, supprimerMembre } from '../../lib/api'
import { useToast } from '../../lib/toast'
import { messageErreur } from '../../lib/supabase'
import { Bouton, Chargeur, Erreur, Modale } from '../../components/Ui'
import { Icone } from '../../components/Icons'
import Membre from '../../components/Membre'
import { CATEGORIES_EQUIPE, membresDe } from '../../lib/format'

export default function EquipeStaff() {
  const notifier = useToast()
  const { data, loading, error, recharger } = useAsync(async () => {
    invalider('equipe', 'postes')
    const [membres, postes] = await Promise.all([lireEquipe(), lirePostes()])
    return { membres, specialites: [...new Set(postes.flatMap((p) => (p.options || []).map((o) => o.nom)))] }
  }, [])
  const [edition, setEdition] = useState(null)
  const [filtre, setFiltre] = useState('tous')
  const [recherche, setRecherche] = useState('')

  const liste = useMemo(() => {
    const q = recherche.trim().toLowerCase()
    return (data?.membres || []).filter((m) => (filtre === 'tous' || m.categories.includes(filtre)) && (!q || m.pseudo.toLowerCase().includes(q)))
  }, [data, filtre, recherche])

  if (loading) return <Chargeur />
  if (error) return <Erreur erreur={error} onRetry={recharger} />

  return (
    <div>
      <header className="staff-entete"><div><p className="sous-titre">Dashboard</p><h1>Équipe</h1></div>
        <button className="bouton" onClick={() => setEdition({ categories: ['guide'], pseudo: '', titre: '', specialites: [], ordre: 50 })}><Icone nom="plus" taille={16} /> Ajouter un membre</button></header>
      <p className="discret">Un membre peut appartenir à plusieurs équipes (par exemple Guide <em>et</em> Narration) : il apparaît alors dans chacune. Clique sur une carte pour la modifier.</p>

      <div className="barre-outils">
        <div className="filtres">
          <button className={`pastille-filtre${filtre === 'tous' ? ' actif' : ''}`} onClick={() => setFiltre('tous')}>Tous · {data.membres.length}</button>
          {CATEGORIES_EQUIPE.map((c) => (
            <button key={c.id} className={`pastille-filtre${filtre === c.id ? ' actif' : ''}`} onClick={() => setFiltre(c.id)}>{c.court} · {membresDe(data.membres, c.id).length}</button>
          ))}
        </div>
        <input type="search" placeholder="Chercher…" value={recherche} onChange={(e) => setRecherche(e.target.value)} aria-label="Chercher un membre" style={{ maxWidth: 220 }} />
      </div>

      <div className="grille-membres">
        {liste.map((m) => (
          <button key={m.id} className="membre-bouton" onClick={() => setEdition(m)} aria-label={`Modifier ${m.pseudo}`}><Membre membre={m} contexte={filtre} /></button>
        ))}
      </div>
      {!liste.length && <p className="vide">Aucun membre ne correspond.</p>}

      {edition && <ModaleMembre membre={edition} specialites={data.specialites} onFermer={() => setEdition(null)} onFait={recharger} notifier={notifier} />}
    </div>
  )
}

function ModaleMembre({ membre, specialites, onFermer, onFait, notifier }) {
  const [m, setM] = useState({ ...membre, titre: membre.titre || '' })
  const [envoi, setEnvoi] = useState(false)
  const basculer = (cle, valeur) => setM((x) => ({ ...x, [cle]: x[cle].includes(valeur) ? x[cle].filter((y) => y !== valeur) : [...x[cle], valeur] }))

  async function sauver(e) {
    e.preventDefault()
    if (!m.categories.length) return notifier('Choisis au moins une équipe.', 'erreur')
    setEnvoi(true)
    try {
      const ordre = CATEGORIES_EQUIPE.filter((c) => m.categories.includes(c.id))
      await sauverMembre({ ...m, categories: ordre.map((c) => c.id), pseudo: m.pseudo.trim(), titre: m.titre.trim() || null })
      notifier('Membre enregistré.', 'succes'); onFait(); onFermer()
    } catch (err) { notifier(messageErreur(err), 'erreur') } finally { setEnvoi(false) }
  }
  async function supprimer() {
    if (!window.confirm(`Retirer ${m.pseudo} de l'annuaire ?`)) return
    try { await supprimerMembre(m.id); notifier('Membre retiré.', 'succes'); onFait(); onFermer() } catch (err) { notifier(messageErreur(err), 'erreur') }
  }

  return (
    <Modale onFermer={onFermer} titre="Membre de l'équipe">
      <form onSubmit={sauver}>
        <h2>{m.id ? 'Modifier' : 'Ajouter'} un membre</h2>
        <div className="apercu-membre"><Membre membre={m} /></div>
        <div className="champ"><label className="etiquette">Pseudo</label><input type="text" value={m.pseudo} onChange={(e) => setM({ ...m, pseudo: e.target.value })} required autoFocus /></div>
        <div className="champ"><label className="etiquette">Équipes <span className="facultatif">plusieurs choix possibles</span></label>
          <div className="choix">{CATEGORIES_EQUIPE.map((c) => {
            const actif = m.categories.includes(c.id)
            return (
              <button type="button" key={c.id} role="checkbox" aria-checked={actif} className={`choix-carte${actif ? ' actif' : ''}`} style={{ '--couleur-camp': c.couleur }} onClick={() => basculer('categories', c.id)}>
                <span className="choix-pastille carre">{actif && <Icone nom="check" taille={12} />}</span>{c.singulier}</button>
            )
          })}</div></div>
        <div className="champ"><label className="etiquette">Titre <span className="facultatif">facultatif</span></label><input type="text" value={m.titre} onChange={(e) => setM({ ...m, titre: e.target.value })} placeholder="ex : Développeuse principale" /></div>
        {specialites.length > 0 && (
          <div className="champ"><label className="etiquette">Spécialités <span className="facultatif">comptées dans l'effectif des spécialités</span></label>
            <div className="choix">{specialites.map((s) => (
              <button type="button" key={s} role="checkbox" aria-checked={m.specialites.includes(s)} className={`choix-carte${m.specialites.includes(s) ? ' actif' : ''}`} onClick={() => basculer('specialites', s)}>
                <span className="choix-pastille carre">{m.specialites.includes(s) && <Icone nom="check" taille={12} />}</span>{s}</button>))}</div></div>
        )}
        <div className="champ"><label className="etiquette">Ordre d'affichage</label><input type="number" value={m.ordre} onChange={(e) => setM({ ...m, ordre: Number(e.target.value) })} style={{ maxWidth: 120 }} /></div>
        <div className="modale-actions">
          {m.id && <button type="button" className="bouton danger" style={{ marginRight: 'auto' }} onClick={supprimer}>Retirer</button>}
          <button type="button" className="bouton fantome" onClick={onFermer}>Annuler</button><Bouton className="bouton" chargement={envoi}>Enregistrer</Bouton>
        </div>
      </form>
    </Modale>
  )
}
