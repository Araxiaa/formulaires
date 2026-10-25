import { useState } from 'react'
import { useAsync } from '../../lib/hooks'
import { lireEquipe, lirePostes, invalider, sauverMembre, supprimerMembre } from '../../lib/api'
import { useToast } from '../../lib/toast'
import { messageErreur } from '../../lib/supabase'
import { Bouton, Chargeur, Erreur, Modale } from '../../components/Ui'
import { Icone } from '../../components/Icons'
import Membre from '../../components/Membre'
import { CATEGORIES_EQUIPE } from '../../lib/format'

export default function EquipeStaff() {
  const notifier = useToast()
  const { data, loading, error, recharger } = useAsync(async () => {
    invalider('equipe', 'postes')
    const [membres, postes] = await Promise.all([lireEquipe(), lirePostes()])
    return { membres, specialites: [...new Set(postes.flatMap((p) => (p.options || []).map((o) => o.nom)))] }
  }, [])
  const [edition, setEdition] = useState(null)

  if (loading) return <Chargeur />
  if (error) return <Erreur erreur={error} onRetry={recharger} />

  return (
    <div>
      <header className="staff-entete"><div><p className="sous-titre">Dashboard</p><h1>Équipe</h1></div>
        <button className="bouton" onClick={() => setEdition({ categorie: 'guide', pseudo: '', titre: '', specialites: [], ordre: 50 })}><Icone nom="plus" taille={16} /> Ajouter un membre</button></header>
      <p className="discret">Cet annuaire est affiché publiquement sur la page « L'équipe » et résumé sur l'accueil. Clique sur un membre pour le modifier.</p>
      {CATEGORIES_EQUIPE.map((cat) => {
        const membres = data.membres.filter((m) => m.categorie === cat.id)
        return (
          <section key={cat.id}>
            <h2 className="titre-section" style={{ color: cat.couleur }}>{cat.label} · {membres.length}</h2>
            <div className="grille grille-membres">
              {membres.map((m) => (
                <button key={m.id} className="membre-bouton" onClick={() => setEdition(m)} aria-label={`Modifier ${m.pseudo}`}><Membre membre={m} /></button>
              ))}
              {!membres.length && <p className="discret" style={{ margin: 0 }}>Personne dans cette catégorie.</p>}
            </div>
          </section>
        )
      })}
      {edition && <ModaleMembre membre={edition} specialites={data.specialites} onFermer={() => setEdition(null)} onFait={recharger} notifier={notifier} />}
    </div>
  )
}

function ModaleMembre({ membre, specialites, onFermer, onFait, notifier }) {
  const [m, setM] = useState({ ...membre, titre: membre.titre || '' })
  const [envoi, setEnvoi] = useState(false)
  const bascule = (s) => setM((x) => ({ ...x, specialites: x.specialites.includes(s) ? x.specialites.filter((y) => y !== s) : [...x.specialites, s] }))

  async function sauver(e) {
    e.preventDefault(); setEnvoi(true)
    try { await sauverMembre({ ...m, pseudo: m.pseudo.trim(), titre: m.titre.trim() || null }); notifier('Membre enregistré.', 'succes'); onFait(); onFermer() }
    catch (err) { notifier(messageErreur(err), 'erreur') } finally { setEnvoi(false) }
  }
  async function supprimer() {
    if (!window.confirm(`Retirer ${m.pseudo} de l'annuaire ?`)) return
    try { await supprimerMembre(m.id); notifier('Membre retiré.', 'succes'); onFait(); onFermer() } catch (err) { notifier(messageErreur(err), 'erreur') }
  }

  return (
    <Modale onFermer={onFermer} titre="Membre de l'équipe">
      <form onSubmit={sauver}>
        <h2>{m.id ? 'Modifier' : 'Ajouter'} un membre</h2>
        <div className="champ"><label className="etiquette">Pseudo</label><input type="text" value={m.pseudo} onChange={(e) => setM({ ...m, pseudo: e.target.value })} required autoFocus /></div>
        <div className="champ"><label className="etiquette">Catégorie</label>
          <select value={m.categorie} onChange={(e) => setM({ ...m, categorie: e.target.value })}>{CATEGORIES_EQUIPE.map((c) => <option key={c.id} value={c.id}>{c.singulier}</option>)}</select></div>
        <div className="champ"><label className="etiquette">Titre <span className="facultatif">facultatif</span></label><input type="text" value={m.titre} onChange={(e) => setM({ ...m, titre: e.target.value })} placeholder="ex : Développeuse principale" /></div>
        {specialites.length > 0 && (
          <div className="champ"><label className="etiquette">Spécialités</label>
            <div className="choix">{specialites.map((s) => (
              <button type="button" key={s} role="checkbox" aria-checked={m.specialites.includes(s)} className={`choix-carte${m.specialites.includes(s) ? ' actif' : ''}`} onClick={() => bascule(s)}>
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
