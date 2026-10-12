import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useStaffData } from '../../lib/staffData'
import { useStockage } from '../../lib/hooks'
import { useAuth } from '../../lib/auth'
import { useToast } from '../../lib/toast'
import { changerStatut } from '../../lib/api'
import { messageErreur } from '../../lib/supabase'
import { Chargeur, Erreur } from '../../components/Ui'
import { Icone } from '../../components/Icons'
import ModaleDecision from '../../components/staff/ModaleDecision'
import { STATUTS, TYPES, dateCourte, joursDepuis } from '../../lib/format'

const COLONNES = ['recue', 'examen', 'acceptee', 'refusee']

export default function Candidatures() {
  const { candidatures, chargement, erreur, recharger, postes } = useStaffData()
  const { pseudo } = useAuth()
  const notifier = useToast()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const [vue, setVue] = useStockage('staff_vue_cand', 'kanban')
  const [recherche, setRecherche] = useState('')
  const [type, setType] = useState('')
  const [assigne, setAssigne] = useState('')
  const [retirees, setRetirees] = useState(false)
  const [decision, setDecision] = useState(null)
  const [survol, setSurvol] = useState(null)
  const statutFiltre = params.get('statut') || ''

  const liste = useMemo(() => {
    const q = recherche.trim().toLowerCase()
    return candidatures.filter((c) =>
      (!statutFiltre || c.statut === statutFiltre) && (!type || c.type === type)
      && (retirees || statutFiltre === 'retiree' || c.statut !== 'retiree')
      && (!assigne || (assigne === 'moi' ? c.assigne_a === pseudo : assigne === 'aucun' ? !c.assigne_a : true))
      && (!q || c.pseudo_discord.toLowerCase().includes(q) || c.code_suivi.toLowerCase().includes(q) || (c.resume || '').toLowerCase().includes(q)))
  }, [candidatures, statutFiltre, type, assigne, recherche, retirees, pseudo])

  async function deposer(id, statut) {
    const c = candidatures.find((x) => x.id === id)
    if (!c || c.statut === statut) return
    if (statut === 'acceptee' || statut === 'refusee') { setDecision({ c, statut }); return }
    try { await changerStatut(id, statut, null); notifier('Statut mis à jour.', 'succes'); recharger() }
    catch (err) { notifier(messageErreur(err), 'erreur') }
  }

  if (chargement && !candidatures.length) return <Chargeur />
  if (erreur) return <Erreur erreur={erreur} onRetry={recharger} />

  const posteDe = (c) => postes.find((p) => p.id === c.poste_id)

  return (
    <div>
      <header className="staff-entete"><div><p className="sous-titre">Dashboard</p><h1>Candidatures</h1></div>
        <div className="onglets">
          <button className={vue === 'kanban' ? 'actif' : ''} onClick={() => setVue('kanban')}><Icone nom="tableau" taille={16} /> Kanban</button>
          <button className={vue === 'table' ? 'actif' : ''} onClick={() => setVue('table')}><Icone nom="liste" taille={16} /> Tableau</button>
        </div></header>

      <div className="filtres filtres-staff">
        <input type="search" placeholder="Pseudo, code, poste…" value={recherche} onChange={(e) => setRecherche(e.target.value)} aria-label="Rechercher" style={{ maxWidth: 260 }} />
        <select value={type} onChange={(e) => setType(e.target.value)} aria-label="Type" style={{ width: 'auto' }}>
          <option value="">Tous les types</option>{Object.entries(TYPES).map(([t, i]) => <option key={t} value={t}>{i.label}</option>)}
        </select>
        {vue === 'table' && (
          <select value={statutFiltre} onChange={(e) => setParams(e.target.value ? { statut: e.target.value } : {})} aria-label="Statut" style={{ width: 'auto' }}>
            <option value="">Tous les statuts</option>{Object.entries(STATUTS).map(([s, i]) => <option key={s} value={s}>{i.label}</option>)}
          </select>
        )}
        <select value={assigne} onChange={(e) => setAssigne(e.target.value)} aria-label="Assignation" style={{ width: 'auto' }}>
          <option value="">Toutes assignations</option><option value="moi">Assignées à moi</option><option value="aucun">Non assignées</option>
        </select>
        <label className="case"><input type="checkbox" checked={retirees} onChange={(e) => setRetirees(e.target.checked)} /> Retirées</label>
        <span className="discret mono" style={{ marginLeft: 'auto' }}>{liste.length} résultat{liste.length > 1 ? 's' : ''}</span>
      </div>

      {vue === 'kanban' ? (
        <div className="kanban">
          {COLONNES.map((col) => {
            const items = liste.filter((c) => c.statut === col)
            return (
              <section key={col} className={`kanban-col${survol === col ? ' survol' : ''}`}
                       onDragOver={(e) => { e.preventDefault(); setSurvol(col) }} onDragLeave={() => setSurvol(null)}
                       onDrop={(e) => { e.preventDefault(); setSurvol(null); deposer(e.dataTransfer.getData('text/plain'), col) }}>
                <h2 data-statut={col}><span className="badge pastille" data-statut={col}>{STATUTS[col].label}</span><span className="discret mono">{items.length}</span></h2>
                <div className="kanban-liste">
                  {items.map((c) => {
                    const retard = (c.statut === 'recue' && joursDepuis(c.created_at) >= 2) || (c.statut === 'examen' && joursDepuis(c.updated_at) >= 7)
                    return (
                      <article key={c.id} className={`kanban-carte${retard ? ' retard' : ''}`} draggable
                               onDragStart={(e) => e.dataTransfer.setData('text/plain', c.id)} onClick={() => navigate(`/staff/candidatures/${c.id}`)}>
                        <div className="kanban-carte-haut"><strong>{c.pseudo_discord}</strong><span className="badge">{TYPES[c.type]?.label}</span></div>
                        <p className="discret">{c.resume || '—'}</p>
                        <div className="kanban-carte-bas">
                          <span className="mono discret">{joursDepuis(c.created_at) <= 0 ? "aujourd'hui" : `il y a ${joursDepuis(c.created_at)} j`}</span>
                          {retard && <Icone nom="alerte" taille={14} />}
                          {c.assigne_a && <span className="assigne"><Icone nom="utilisateur" taille={12} />{c.assigne_a}</span>}
                        </div>
                      </article>
                    )
                  })}
                  {!items.length && <p className="kanban-vide">Glisse une carte ici</p>}
                </div>
              </section>
            )
          })}
        </div>
      ) : (
        <div className="tableau-boite">
          <table className="tableau">
            <thead><tr><th>Code</th><th>Pseudo</th><th>Type</th><th>Poste</th><th>Date</th><th>Assigné</th><th>Statut</th></tr></thead>
            <tbody>
              {liste.map((c) => (
                <tr key={c.id} className={(c.statut === 'recue' && joursDepuis(c.created_at) >= 2) || (c.statut === 'examen' && joursDepuis(c.updated_at) >= 7) ? 'retard' : ''}>
                  <td className="mono"><Link to={`/staff/candidatures/${c.id}`}>{c.code_suivi}</Link></td>
                  <td><strong>{c.pseudo_discord}</strong></td><td>{TYPES[c.type]?.label}</td>
                  <td className="discret">{posteDe(c)?.nom || c.resume || '—'}</td><td className="discret">{dateCourte(c.created_at)}</td>
                  <td>{c.assigne_a || <span className="discret">—</span>}</td>
                  <td><span className="badge pastille" data-statut={c.statut}>{STATUTS[c.statut]?.label}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
          {!liste.length && <p className="vide" style={{ border: 0 }}>Aucune candidature.</p>}
        </div>
      )}

      {decision && <ModaleDecision candidature={decision.c} statut={decision.statut} poste={posteDe(decision.c)} onFermer={() => setDecision(null)} onFait={recharger} />}
    </div>
  )
}
