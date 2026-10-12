import { useState } from 'react'
import { useAsync } from '../../lib/hooks'
import { listerFaqStaff, sauverFaq, supprimerFaq } from '../../lib/api'
import { useToast } from '../../lib/toast'
import { messageErreur } from '../../lib/supabase'
import { Chargeur, Erreur, Modale, Bouton } from '../../components/Ui'
import { Icone } from '../../components/Icons'

export default function FaqStaff() {
  const notifier = useToast()
  const { data, loading, error, recharger } = useAsync(listerFaqStaff, [])
  const [edition, setEdition] = useState(null)

  if (loading) return <Chargeur />
  if (error) return <Erreur erreur={error} onRetry={recharger} />
  const sections = [...new Set(data.map((f) => f.section))]

  async function echanger(a, b) {
    try { await Promise.all([sauverFaq({ ...a, ordre: b.ordre }), sauverFaq({ ...b, ordre: a.ordre })]); recharger() } catch (err) { notifier(messageErreur(err), 'erreur') }
  }

  return (
    <div>
      <header className="staff-entete"><div><p className="sous-titre">Dashboard</p><h1>FAQ</h1></div>
        <button className="bouton" onClick={() => setEdition({ section: sections[0] || 'Général', question: '', reponse: '', ordre: data.length, publie: true })}><Icone nom="plus" taille={16} /> Nouvelle question</button></header>
      {sections.map((s) => {
        const items = data.filter((f) => f.section === s)
        return (
          <section key={s}>
            <h2 className="titre-section">{s}</h2>
            {items.map((f, i) => (
              <article key={f.id} className="carte ligne-faq">
                <div className="grow"><strong>{f.question}</strong>{!f.publie && <span className="badge" data-statut="indispo" style={{ marginLeft: 8 }}>masquée</span>}
                  <p className="discret" style={{ margin: '4px 0 0', fontSize: '0.88rem' }}>{f.reponse}</p></div>
                <div className="editeur-actions">
                  <button className="bouton-icone" disabled={i === 0} onClick={() => echanger(f, items[i - 1])} aria-label="Monter"><Icone nom="haut" taille={16} /></button>
                  <button className="bouton-icone" disabled={i === items.length - 1} onClick={() => echanger(f, items[i + 1])} aria-label="Descendre"><Icone nom="bas" taille={16} /></button>
                  <button className="bouton-icone" onClick={() => setEdition(f)} aria-label="Modifier"><Icone nom="crayon" taille={16} /></button>
                </div>
              </article>
            ))}
          </section>
        )
      })}
      {edition && <ModaleFaq faq={edition} sections={sections} onFermer={() => setEdition(null)} onFait={recharger} notifier={notifier} />}
    </div>
  )
}

function ModaleFaq({ faq, sections, onFermer, onFait, notifier }) {
  const [f, setF] = useState(faq)
  const [envoi, setEnvoi] = useState(false)
  async function sauver(e) {
    e.preventDefault(); setEnvoi(true)
    try { await sauverFaq(f); notifier('Question enregistrée.', 'succes'); onFait(); onFermer() } catch (err) { notifier(messageErreur(err), 'erreur') } finally { setEnvoi(false) }
  }
  async function supprimer() {
    if (!window.confirm('Supprimer cette question ?')) return
    try { await supprimerFaq(f.id); onFait(); onFermer() } catch (err) { notifier(messageErreur(err), 'erreur') }
  }
  return (
    <Modale onFermer={onFermer} titre="Question">
      <form onSubmit={sauver}>
        <h2>{f.id ? 'Modifier' : 'Nouvelle'} question</h2>
        <div className="champ"><label className="etiquette">Section</label>
          <input type="text" list="sections-faq" value={f.section} onChange={(e) => setF({ ...f, section: e.target.value })} required />
          <datalist id="sections-faq">{sections.map((s) => <option key={s} value={s} />)}</datalist></div>
        <div className="champ"><label className="etiquette">Question</label><input type="text" value={f.question} onChange={(e) => setF({ ...f, question: e.target.value })} required /></div>
        <div className="champ"><label className="etiquette">Réponse</label><textarea rows={5} value={f.reponse} onChange={(e) => setF({ ...f, reponse: e.target.value })} required /></div>
        <label className="case"><input type="checkbox" checked={f.publie} onChange={(e) => setF({ ...f, publie: e.target.checked })} /> Visible publiquement</label>
        <div className="modale-actions">
          {f.id && <button type="button" className="bouton danger" style={{ marginRight: 'auto' }} onClick={supprimer}>Supprimer</button>}
          <button type="button" className="bouton fantome" onClick={onFermer}>Annuler</button><Bouton className="bouton" chargement={envoi}>Enregistrer</Bouton>
        </div>
      </form>
    </Modale>
  )
}
