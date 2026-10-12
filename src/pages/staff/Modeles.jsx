import { useState } from 'react'
import { useAsync } from '../../lib/hooks'
import { listerModeles, sauverModele, supprimerModele } from '../../lib/api'
import { useToast } from '../../lib/toast'
import { messageErreur } from '../../lib/supabase'
import { Chargeur, Erreur, Modale, Bouton } from '../../components/Ui'
import { Icone } from '../../components/Icons'

const KINDS = { acceptee: 'Acceptation', refusee: 'Refus', examen: "Mise en examen" }

export default function Modeles() {
  const notifier = useToast()
  const { data, loading, error, recharger } = useAsync(listerModeles, [])
  const [edition, setEdition] = useState(null)

  if (loading) return <Chargeur />
  if (error) return <Erreur erreur={error} onRetry={recharger} />

  return (
    <div>
      <header className="staff-entete"><div><p className="sous-titre">Dashboard</p><h1>Réponses types</h1></div>
        <button className="bouton" onClick={() => setEdition({ kind: 'acceptee', titre: '', contenu: '', ordre: data.length })}><Icone nom="plus" taille={16} /> Nouveau modèle</button></header>
      <p className="discret">Ces textes pré-remplissent le message de décision. Le candidat les lit tels quels : reste bienveillant·e.</p>
      {Object.entries(KINDS).map(([kind, titre]) => (
        <section key={kind}>
          <h2 className="titre-section">{titre}</h2>
          <div className="grille grille-2">
            {data.filter((m) => m.kind === kind).map((m) => (
              <article key={m.id} className="carte">
                <h3>{m.titre}</h3><p className="discret" style={{ whiteSpace: 'pre-wrap' }}>{m.contenu}</p>
                <button className="bouton petit fantome" onClick={() => setEdition(m)}><Icone nom="crayon" taille={14} /> Modifier</button>
              </article>
            ))}
          </div>
        </section>
      ))}
      {edition && <ModaleModele modele={edition} onFermer={() => setEdition(null)} onFait={recharger} notifier={notifier} />}
    </div>
  )
}

function ModaleModele({ modele, onFermer, onFait, notifier }) {
  const [m, setM] = useState(modele)
  const [envoi, setEnvoi] = useState(false)
  async function sauver(e) {
    e.preventDefault(); setEnvoi(true)
    try { await sauverModele(m); notifier('Modèle enregistré.', 'succes'); onFait(); onFermer() } catch (err) { notifier(messageErreur(err), 'erreur') } finally { setEnvoi(false) }
  }
  async function supprimer() {
    if (!window.confirm('Supprimer ce modèle ?')) return
    try { await supprimerModele(m.id); onFait(); onFermer() } catch (err) { notifier(messageErreur(err), 'erreur') }
  }
  return (
    <Modale onFermer={onFermer} titre="Modèle">
      <form onSubmit={sauver}>
        <h2>{m.id ? 'Modifier' : 'Nouveau'} modèle</h2>
        <div className="champ"><label className="etiquette">Type</label><select value={m.kind} onChange={(e) => setM({ ...m, kind: e.target.value })}>{Object.entries(KINDS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></div>
        <div className="champ"><label className="etiquette">Titre</label><input type="text" value={m.titre} onChange={(e) => setM({ ...m, titre: e.target.value })} required /></div>
        <div className="champ"><label className="etiquette">Message</label><textarea rows={6} value={m.contenu} onChange={(e) => setM({ ...m, contenu: e.target.value })} required /></div>
        <div className="modale-actions">
          {m.id && <button type="button" className="bouton danger" style={{ marginRight: 'auto' }} onClick={supprimer}>Supprimer</button>}
          <button type="button" className="bouton fantome" onClick={onFermer}>Annuler</button><Bouton className="bouton" chargement={envoi}>Enregistrer</Bouton>
        </div>
      </form>
    </Modale>
  )
}
