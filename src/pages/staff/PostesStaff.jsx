import { useState } from 'react'
import { useStaffData } from '../../lib/staffData'
import { useToast } from '../../lib/toast'
import { sauverGroupe, sauverPoste, supprimerPoste } from '../../lib/api'
import { messageErreur } from '../../lib/supabase'
import { Bouton, Chargeur, Modale } from '../../components/Ui'
import { Icone } from '../../components/Icons'
import EditeurChamps from '../../components/staff/EditeurChamps'
import { STATUTS_POSTE, ouvertDepuis } from '../../lib/format'

const VIDE_STAFF = { categorie: 'staff', groupe: 'guide', nom: '', description: '', missions: [], anciennete: '1 à 2 mois sur le serveur', disponibilite: '5h / semaine minimum', note_candidat: '', statut: 'indispo', places_total: 1, places_dispo: 1, questions: [], options: [], ordre: 99 }
const VIDE_HR = { categorie: 'hr', groupe: 'tonnerre', nom: '', type_rang: 'meneur', titulaire: '', note: '', statut: 'indispo', places_total: 1, places_dispo: 0, questions: [], ordre: 99 }

export default function PostesStaff() {
  const { postes, groupes, rechargerRef } = useStaffData()
  const notifier = useToast()
  const [vue, setVue] = useState('staff')
  const [edition, setEdition] = useState(null)
  const [groupesOuverts, setGroupesOuverts] = useState(false)

  if (!postes.length && !groupes.length) return <Chargeur />
  const liste = postes.filter((p) => p.categorie === vue)
  const cats = groupes.filter((g) => g.categorie === (vue === 'hr' ? 'clan' : 'pole'))

  async function rapide(p, patch, ok = 'Poste mis à jour.') {
    try { await sauverPoste({ id: p.id, ...patch }); notifier(ok, 'succes'); rechargerRef() }
    catch (err) { notifier(messageErreur(err), 'erreur') }
  }

  return (
    <div>
      <header className="staff-entete"><div><p className="sous-titre">Dashboard</p><h1>Postes</h1></div>
        <div className="entete-actions">
          <button className="bouton fantome" onClick={() => setGroupesOuverts(true)}><Icone nom="reglages" taille={16} /> Pôles &amp; clans</button>
          <button className="bouton" onClick={() => setEdition(vue === 'hr' ? VIDE_HR : VIDE_STAFF)}><Icone nom="plus" taille={16} /> Nouveau {vue === 'hr' ? 'rang' : 'poste'}</button>
        </div></header>

      <div className="onglets" style={{ marginBottom: 18 }}>
        <button className={vue === 'staff' ? 'actif' : ''} onClick={() => setVue('staff')}>Staff</button>
        <button className={vue === 'hr' ? 'actif' : ''} onClick={() => setVue('hr')}>Hauts Rangs</button>
      </div>

      {cats.map((g) => (
        <section key={g.id} style={{ marginBottom: 24 }}>
          <h2 className="titre-section" style={{ color: g.couleur }}>{g.nom}</h2>
          <div className="tableau-boite">
            <table className="tableau">
              <thead><tr><th>{vue === 'hr' ? 'Rang' : 'Rôle'}</th>{vue === 'hr' ? <th>Titulaire</th> : <th>Places</th>}<th>Statut</th><th /></tr></thead>
              <tbody>
                {liste.filter((p) => p.groupe === g.id).map((p) => (
                  <tr key={p.id}>
                    <td><strong>{p.nom}</strong>{p.statut === 'ouvert' && p.ouvert_le && <div className="discret mono" style={{ fontSize: '0.7rem' }}>{ouvertDepuis(p.ouvert_le)}</div>}</td>
                    {vue === 'hr'
                      ? <td><input type="text" defaultValue={p.titulaire || ''} placeholder="Vacant" aria-label="Titulaire" onBlur={(e) => e.target.value !== (p.titulaire || '') && rapide(p, { titulaire: e.target.value.trim() || null })} /></td>
                      : <td><div className="stepper">
                          <button className="bouton-icone" aria-label="Moins" disabled={p.places_dispo <= 0} onClick={() => rapide(p, { places_dispo: p.places_dispo - 1 })}><Icone nom="moins" taille={14} /></button>
                          <span className="mono">{p.places_dispo}/{p.places_total}</span>
                          <button className="bouton-icone" aria-label="Plus" disabled={p.places_dispo >= p.places_total} onClick={() => rapide(p, { places_dispo: p.places_dispo + 1 })}><Icone nom="plus" taille={14} /></button>
                        </div></td>}
                    <td>
                      <select value={p.statut} aria-label="Statut" onChange={(e) => rapide(p, { statut: e.target.value }, e.target.value === 'ouvert' ? 'Poste ouvert : annonce Discord envoyée.' : 'Statut mis à jour.')}>
                        {Object.entries(STATUTS_POSTE).filter(([s]) => vue === 'staff' || s !== 'complet').map(([s, l]) => <option key={s} value={s}>{l}</option>)}
                      </select>
                    </td>
                    <td className="actions-ligne"><button className="bouton petit fantome" onClick={() => setEdition(p)}><Icone nom="crayon" taille={14} /> Modifier</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}

      {edition && <ModalePoste poste={edition} groupes={groupes} onFermer={() => setEdition(null)} onFait={rechargerRef} />}
      {groupesOuverts && <ModaleGroupes groupes={groupes} onFermer={() => setGroupesOuverts(false)} onFait={rechargerRef} />}
    </div>
  )
}

function ModalePoste({ poste, groupes, onFermer, onFait }) {
  const notifier = useToast()
  const [p, setP] = useState({ ...poste, titulaire: poste.titulaire || '', note: poste.note || '', description: poste.description || '', note_candidat: poste.note_candidat || '' })
  const [envoi, setEnvoi] = useState(false)
  const hr = p.categorie === 'hr'
  const maj = (patch) => setP((x) => ({ ...x, ...patch }))
  const cats = groupes.filter((g) => g.categorie === (hr ? 'clan' : 'pole'))

  async function enregistrer(e) {
    e.preventDefault()
    setEnvoi(true)
    try {
      const { updated_at, ouvert_le, ...donnees } = p // gérés par la base
      void updated_at; void ouvert_le
      await sauverPoste({
        ...donnees,
        titulaire: donnees.titulaire.trim() || null, note: donnees.note.trim() || null,
        note_candidat: donnees.note_candidat.trim() || null, description: donnees.description.trim() || null,
        places_dispo: Math.min(Number(donnees.places_dispo), Number(donnees.places_total)),
        questions: donnees.questions.filter((q) => q.label.trim()),
        options: (donnees.options || []).filter((o) => o.nom.trim()).map((o, i) => ({ ...o, id: o.id.startsWith('option') ? (o.nom.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '') || `option${i + 1}`) : o.id, questions: (o.questions || []).filter((q) => q.label.trim()) })),
      })
      notifier('Poste enregistré.', 'succes'); onFait(); onFermer()
    } catch (err) { notifier(messageErreur(err), 'erreur') } finally { setEnvoi(false) }
  }

  async function supprimer() {
    if (!window.confirm(`Supprimer « ${p.nom} » ? Les listes d'attente liées seront supprimées.`)) return
    try { await supprimerPoste(p.id); notifier('Poste supprimé.', 'succes'); onFait(); onFermer() } catch (err) { notifier(messageErreur(err), 'erreur') }
  }

  return (
    <Modale large onFermer={onFermer} titre="Modifier le poste">
      <form onSubmit={enregistrer}>
        <h2>{p.id ? 'Modifier' : 'Nouveau'} {hr ? 'rang' : 'poste'}</h2>
        <div className="formulaire-grille">
          <div className="champ"><label className="etiquette">Nom</label><input type="text" value={p.nom} onChange={(e) => maj({ nom: e.target.value })} required /></div>
          <div className="champ"><label className="etiquette">{hr ? 'Clan' : 'Pôle'}</label>
            <select value={p.groupe} onChange={(e) => maj({ groupe: e.target.value })}>{cats.map((g) => <option key={g.id} value={g.id}>{g.nom}</option>)}</select></div>
          <div className="champ"><label className="etiquette">Statut</label>
            <select value={p.statut} onChange={(e) => maj({ statut: e.target.value })}>{Object.entries(STATUTS_POSTE).map(([s, l]) => <option key={s} value={s}>{l}</option>)}</select></div>
          {hr ? (<>
            <div className="champ"><label className="etiquette">Type de rang</label>
              <select value={p.type_rang || ''} onChange={(e) => maj({ type_rang: e.target.value })}>
                {[['meneur', 'Meneur·se'], ['lieutenant', 'Lieutenant·e'], ['guerisseur', 'Guérisseur·se'], ['apprenti', 'Apprenti·e']].map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
            <div className="champ"><label className="etiquette">Titulaire actuel</label><input type="text" value={p.titulaire} onChange={(e) => maj({ titulaire: e.target.value })} /></div>
            <div className="champ"><label className="etiquette">Note affichée</label><input type="text" value={p.note} onChange={(e) => maj({ note: e.target.value })} placeholder="ex : Prochainement Petit Lys" /></div>
          </>) : (<>
            <div className="champ"><label className="etiquette">Places totales</label><input type="number" min="0" value={p.places_total} onChange={(e) => maj({ places_total: Number(e.target.value) })} /></div>
            <div className="champ"><label className="etiquette">Places disponibles</label><input type="number" min="0" value={p.places_dispo} onChange={(e) => maj({ places_dispo: Number(e.target.value) })} /></div>
            <div className="champ"><label className="etiquette">Ancienneté requise</label><input type="text" value={p.anciennete || ''} onChange={(e) => maj({ anciennete: e.target.value })} /></div>
            <div className="champ"><label className="etiquette">Disponibilités requises</label><input type="text" value={p.disponibilite || ''} onChange={(e) => maj({ disponibilite: e.target.value })} /></div>
          </>)}
        </div>
        {!hr && (<>
          <div className="champ"><label className="etiquette">Description courte</label><input type="text" value={p.description} onChange={(e) => maj({ description: e.target.value })} /></div>
          <div className="champ"><label className="etiquette">Missions <span className="facultatif">une par ligne</span></label>
            <textarea rows={4} value={(p.missions || []).join('\n')} onChange={(e) => maj({ missions: e.target.value.split('\n').filter((l) => l.trim()) })} /></div>
          <div className="champ"><label className="etiquette">Note importante pour les candidats</label><input type="text" value={p.note_candidat} onChange={(e) => maj({ note_candidat: e.target.value })} /></div>
        </>)}
        <h3 className="titre-section">Questions de mise en situation</h3>
        <EditeurChamps questions champs={p.questions || []} types={['textarea', 'text']} onChange={(questions) => maj({ questions })} libelleAjout="Ajouter une question" />
        {!hr && (<>
          <h3 className="titre-section">Options facultatives</h3>
          <p className="aide">Spécialités que le candidat peut cocher en plus du rôle (ex : Régisseur·se de fiche). Chaque option ajoute ses propres questions.</p>
          {(p.options || []).map((o, oi) => (
            <div key={o.id + oi} className="editeur-champ">
              <div className="editeur-champ-haut"><span className="mono discret">{o.id}</span>
                <button type="button" className="bouton-icone" aria-label="Supprimer l'option" onClick={() => maj({ options: p.options.filter((_, k) => k !== oi) })}><Icone nom="poubelle" taille={16} /></button></div>
              <input type="text" value={o.nom} placeholder="Nom de l'option" aria-label="Nom de l'option"
                     onChange={(e) => maj({ options: p.options.map((x, k) => (k === oi ? { ...x, nom: e.target.value } : x)) })} />
              <input type="text" value={o.description || ''} placeholder="Description courte" aria-label="Description de l'option"
                     onChange={(e) => maj({ options: p.options.map((x, k) => (k === oi ? { ...x, description: e.target.value } : x)) })} />
              <EditeurChamps questions champs={o.questions || []} types={['textarea', 'text']} libelleAjout="Ajouter une question à l'option"
                             onChange={(questions) => maj({ options: p.options.map((x, k) => (k === oi ? { ...x, questions } : x)) })} />
            </div>
          ))}
          <button type="button" className="bouton fantome petit" onClick={() => maj({ options: [...(p.options || []), { id: `option${(p.options || []).length + 1}`, nom: '', description: '', questions: [] }] })}>
            <Icone nom="plus" taille={15} /> Ajouter une option</button>
        </>)}
        <div className="modale-actions">
          {p.id && <button type="button" className="bouton danger" style={{ marginRight: 'auto' }} onClick={supprimer}><Icone nom="poubelle" taille={15} /> Supprimer</button>}
          <button type="button" className="bouton fantome" onClick={onFermer}>Annuler</button>
          <Bouton className="bouton" chargement={envoi}>Enregistrer</Bouton>
        </div>
      </form>
    </Modale>
  )
}

function ModaleGroupes({ groupes, onFermer, onFait }) {
  const notifier = useToast()
  const [liste, setListe] = useState(groupes)
  const maj = (id, patch) => setListe((l) => l.map((g) => (g.id === id ? { ...g, ...patch } : g)))
  async function sauver(g) {
    try { await sauverGroupe(g); notifier(`${g.nom} enregistré.`, 'succes'); onFait() } catch (err) { notifier(messageErreur(err), 'erreur') }
  }
  return (
    <Modale large onFermer={onFermer} titre="Pôles et clans">
      <h2>Pôles &amp; clans</h2>
      {liste.map((g) => (
        <div key={g.id} className="editeur-champ">
          <div className="editeur-ligne"><input type="text" value={g.nom} onChange={(e) => maj(g.id, { nom: e.target.value })} aria-label="Nom" />
            <input type="color" value={g.couleur} onChange={(e) => maj(g.id, { couleur: e.target.value })} aria-label="Couleur" style={{ width: 54, padding: 2 }} /></div>
          <input type="text" value={g.description} onChange={(e) => maj(g.id, { description: e.target.value })} placeholder="Description courte" aria-label="Description" />
          {g.categorie === 'pole' && <textarea rows={3} value={g.description_longue} onChange={(e) => maj(g.id, { description_longue: e.target.value })} placeholder="Description longue (fenêtre « En savoir plus »)" aria-label="Description longue" />}
          <div><button className="bouton petit" onClick={() => sauver(g)}>Enregistrer</button></div>
        </div>
      ))}
    </Modale>
  )
}
