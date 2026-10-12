import { useState } from 'react'
import { useAsync } from '../../lib/hooks'
import { listerAttente, retirerAttente, sauverIdDiscord } from '../../lib/api'
import { useStaffData } from '../../lib/staffData'
import { useToast } from '../../lib/toast'
import { messageErreur } from '../../lib/supabase'
import { Chargeur, Erreur } from '../../components/Ui'
import { Icone } from '../../components/Icons'
import { dateCourte } from '../../lib/format'

export default function Attente() {
  const { postes, groupes } = useStaffData()
  const notifier = useToast()
  const { data, loading, error, recharger } = useAsync(listerAttente, [])
  const [ids, setIds] = useState({})

  if (loading) return <Chargeur />
  if (error) return <Erreur erreur={error} onRetry={recharger} />

  const nomPoste = (id) => {
    const p = postes.find((x) => x.id === id)
    return p ? (p.categorie === 'hr' ? `${p.nom} — ${groupes.find((g) => g.id === p.groupe)?.nom}` : p.nom) : `#${id}`
  }

  async function enregistrer(w) {
    const v = (ids[w.id] ?? w.discord_id ?? '').trim()
    if (!/^\d{17,20}$/.test(v)) return notifier('ID Discord invalide (17 à 20 chiffres).', 'erreur')
    try { await sauverIdDiscord(w.id, w.pseudo_discord, v); notifier('ID enregistré et mémorisé pour ce pseudo.', 'succes'); recharger() }
    catch (err) { notifier(messageErreur(err), 'erreur') }
  }
  async function retirer(w) {
    try { await retirerAttente(w.id); notifier('Retiré de la liste.', 'succes'); recharger() } catch (err) { notifier(messageErreur(err), 'erreur') }
  }

  return (
    <div>
      <header className="staff-entete"><div><p className="sous-titre">Dashboard</p><h1>Listes d'attente</h1></div></header>
      <p className="discret">Quand un poste passe à « Ouvert », les personnes inscrites sont mentionnées automatiquement sur Discord. Renseigne leur ID pour une mention fiable.</p>
      <div className="tableau-boite">
        <table className="tableau">
          <thead><tr><th>Pseudo</th><th>ID Discord</th><th>Poste</th><th>Inscrit·e</th><th /></tr></thead>
          <tbody>
            {data.map((w) => (
              <tr key={w.id}>
                <td><strong>{w.pseudo_discord}</strong> {w.notifie && <span className="badge" data-statut="acceptee">Notifié·e</span>}</td>
                <td><input type="text" inputMode="numeric" placeholder="18 chiffres" value={ids[w.id] ?? w.discord_id ?? ''} onChange={(e) => setIds((s) => ({ ...s, [w.id]: e.target.value }))} aria-label="ID Discord" /></td>
                <td>{nomPoste(w.poste_id)}</td><td className="discret">{dateCourte(w.created_at)}</td>
                <td className="actions-ligne"><button className="bouton petit" onClick={() => enregistrer(w)}>Enregistrer</button>
                  <button className="bouton-icone" aria-label="Retirer" onClick={() => retirer(w)}><Icone nom="poubelle" taille={16} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
        {!data.length && <p className="vide" style={{ border: 0 }}>Personne n'est en liste d'attente.</p>}
      </div>
    </div>
  )
}
