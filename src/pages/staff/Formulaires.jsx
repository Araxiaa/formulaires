import { useState } from 'react'
import { useAsync } from '../../lib/hooks'
import { lireFormulaires, sauverFormulaire, invalider } from '../../lib/api'
import { useToast } from '../../lib/toast'
import { messageErreur } from '../../lib/supabase'
import { Bouton, Chargeur, Erreur } from '../../components/Ui'
import { Icone } from '../../components/Icons'
import EditeurChamps, { slug } from '../../components/staff/EditeurChamps'
import { TYPES } from '../../lib/format'

const KINDS = [['', 'Champs libres'], ['poste', 'Choix du poste'], ['questions_poste', 'Questions du poste']]

export default function Formulaires() {
  const notifier = useToast()
  const { data, loading, error, recharger } = useAsync(async () => { invalider('formulaires'); return lireFormulaires() }, [])
  const [type, setType] = useState('staff')
  const [brouillons, setBrouillons] = useState({})
  const [envoi, setEnvoi] = useState(false)

  if (loading) return <Chargeur />
  if (error) return <Erreur erreur={error} onRetry={recharger} />
  const f = brouillons[type] || data.find((x) => x.type === type)
  const modifie = !!brouillons[type]
  const maj = (patch) => setBrouillons((b) => ({ ...b, [type]: { ...f, ...patch } }))
  const majEtape = (i, patch) => maj({ etapes: f.etapes.map((e, k) => (k === i ? { ...e, ...patch } : e)) })
  const deplacer = (i, d) => {
    const j = i + d; if (j < 0 || j >= f.etapes.length) return
    const copie = [...f.etapes]; [copie[i], copie[j]] = [copie[j], copie[i]]; maj({ etapes: copie })
  }

  async function enregistrer() {
    setEnvoi(true)
    try {
      await sauverFormulaire({ type: f.type, titre: f.titre, description: f.description, ouvert: f.ouvert, etapes: f.etapes })
      notifier('Formulaire enregistré : les candidats voient déjà la nouvelle version.', 'succes')
      setBrouillons((b) => { const { [type]: _, ...reste } = b; void _; return reste }); recharger()
    } catch (err) { notifier(messageErreur(err), 'erreur') } finally { setEnvoi(false) }
  }

  return (
    <div>
      <header className="staff-entete"><div><p className="sous-titre">Administration</p><h1>Formulaires</h1></div>
        <Bouton className="bouton" chargement={envoi} disabled={!modifie} onClick={enregistrer}><Icone nom="sauvegarde" taille={16} /> Enregistrer</Bouton></header>
      <p className="discret">Modifie les questions sans toucher au code. Les candidatures déjà envoyées gardent leurs réponses telles qu'elles ont été données.</p>

      <div className="onglets" style={{ margin: '12px 0 20px' }}>
        {Object.entries(TYPES).map(([t, i]) => <button key={t} className={type === t ? 'actif' : ''} onClick={() => setType(t)}>{i.label}</button>)}
      </div>

      <div className="carte">
        <div className="formulaire-grille">
          <div className="champ"><label className="etiquette">Titre</label><input type="text" value={f.titre} onChange={(e) => maj({ titre: e.target.value })} /></div>
          <label className="case" style={{ alignSelf: 'center' }}><input type="checkbox" checked={f.ouvert} onChange={(e) => maj({ ouvert: e.target.checked })} /> Formulaire ouvert aux candidatures</label>
        </div>
        <div className="champ"><label className="etiquette">Description</label><input type="text" value={f.description} onChange={(e) => maj({ description: e.target.value })} /></div>
      </div>

      {f.etapes.map((e, i) => (
        <section key={e.id + i} className="carte etape-editeur">
          <header className="editeur-champ-haut">
            <h2 className="titre-carte" style={{ margin: 0 }}>Étape {i + 1}</h2>
            <div className="editeur-actions">
              <button className="bouton-icone" onClick={() => deplacer(i, -1)} disabled={i === 0} aria-label="Monter"><Icone nom="haut" taille={16} /></button>
              <button className="bouton-icone" onClick={() => deplacer(i, 1)} disabled={i === f.etapes.length - 1} aria-label="Descendre"><Icone nom="bas" taille={16} /></button>
              <button className="bouton-icone" onClick={() => window.confirm('Supprimer cette étape ?') && maj({ etapes: f.etapes.filter((_, k) => k !== i) })} aria-label="Supprimer"><Icone nom="poubelle" taille={16} /></button>
            </div>
          </header>
          <div className="formulaire-grille">
            <div className="champ"><label className="etiquette">Titre de l'étape</label><input type="text" value={e.titre} onChange={(ev) => majEtape(i, { titre: ev.target.value })} /></div>
            <div className="champ"><label className="etiquette">Contenu</label>
              <select value={e.kind || ''} onChange={(ev) => { const kind = ev.target.value || undefined; majEtape(i, { kind, champs: kind ? undefined : (e.champs || []), max: kind === 'poste' ? (e.max || 1) : undefined }) }}>
                {KINDS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
          </div>
          <div className="champ"><label className="etiquette">Sous-titre</label><input type="text" value={e.description || ''} onChange={(ev) => majEtape(i, { description: ev.target.value })} /></div>
          {e.kind === 'poste' && <div className="champ"><label className="etiquette">Nombre maximum de postes choisis</label><input type="number" min="1" max="4" value={e.max || 1} onChange={(ev) => majEtape(i, { max: Number(ev.target.value) })} style={{ maxWidth: 120 }} /></div>}
          {e.kind === 'questions_poste' && <p className="aide">Les questions viennent de chaque poste choisi (à modifier dans « Postes »).</p>}
          {!e.kind && <EditeurChamps champs={e.champs || []} onChange={(champs) => majEtape(i, { champs: champs.map((c) => ({ ...c, id: c.id.startsWith('champ') && c.label ? slug(c.label) : c.id })) })} />}
        </section>
      ))}
      <button className="bouton fantome" onClick={() => maj({ etapes: [...f.etapes, { id: `etape${f.etapes.length + 1}`, titre: 'Nouvelle étape', description: '', champs: [] }] })}><Icone nom="plus" taille={16} /> Ajouter une étape</button>
    </div>
  )
}
