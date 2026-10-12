import { useEffect, useState } from 'react'
import { Modale, Bouton, SceauCire } from '../Ui'
import { Icone } from '../Icons'
import { changerStatut, listerModeles } from '../../lib/api'
import { messageErreur } from '../../lib/supabase'
import { useToast } from '../../lib/toast'
import { Anneau } from '../Ui'

// Décision (acceptée / refusée) : message obligatoire, visible par le candidat.
export default function ModaleDecision({ candidature, statut: statutInitial, poste, onFermer, onFait }) {
  const notifier = useToast()
  const [statut, setStatut] = useState(statutInitial)
  const [message, setMessage] = useState('')
  const [modeles, setModeles] = useState([])
  const [cloturer, setCloturer] = useState(true)
  const [envoi, setEnvoi] = useState(false)
  const ok = statut === 'acceptee'
  const n = message.trim().length

  useEffect(() => { listerModeles().then(setModeles).catch(() => {}) }, [])

  async function valider() {
    setEnvoi(true)
    try {
      await changerStatut(candidature.id, statut, message.trim(), cloturer && ok && !!poste)
      notifier(ok ? 'Candidature acceptée.' : 'Candidature refusée.', 'succes')
      onFait?.(); onFermer()
    } catch (err) { notifier(messageErreur(err), 'erreur') } finally { setEnvoi(false) }
  }

  return (
    <Modale onFermer={onFermer} large titre="Décision">
      <p className="sous-titre">Décision</p>
      <h2>{candidature.pseudo_discord} <span className="discret mono" style={{ fontSize: '0.9rem' }}>{candidature.code_suivi}</span></h2>

      <div className="onglets" style={{ margin: '4px 0 18px' }}>
        <button className={ok ? 'actif' : ''} onClick={() => setStatut('acceptee')}><Icone nom="check" taille={16} /> Accepter</button>
        <button className={!ok ? 'actif' : ''} onClick={() => setStatut('refusee')}><Icone nom="croix" taille={16} /> Refuser</button>
      </div>

      <div className="decision-grille">
        <div>
          <p className="etiquette">Message pour le candidat</p>
          <p className="aide">Il le lira sur sa page de suivi et sera mentionné sur Discord. Sois bienveillant·e et précis·e.</p>
          <div className="modeles-rapides">
            {modeles.filter((m) => m.kind === statut).map((m) => (
              <button key={m.id} type="button" className="pastille-filtre" onClick={() => setMessage(m.contenu)}>{m.titre}</button>
            ))}
          </div>
          <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={8} maxLength={1500} placeholder="Ton message…" autoFocus />
          <div className="pied-champ"><span className={`compteur${n >= 20 ? ' compteur-ok' : ''}`}><Anneau valeur={n} max={20} />{n >= 20 ? `${n} caractères` : `${n} / 20 minimum`}</span></div>
          {ok && poste && (
            <label className="case" style={{ marginTop: 8 }}>
              <input type="checkbox" checked={cloturer} onChange={(e) => setCloturer(e.target.checked)} />
              {poste.categorie === 'hr' ? 'Marquer ce rang comme pourvu' : 'Décompter une place sur ce poste (le marquer complet à 0)'}
            </label>
          )}
        </div>
        <div className="apercu-lettre">
          <p className="etiquette">Aperçu côté candidat</p>
          <div className={`lettre mini ${ok ? 'lettre-ok' : 'lettre-ko'}`}>
            <SceauCire taille={44} variante={ok ? 'ok' : 'ko'} icone={ok ? 'check' : 'croix'} />
            <h3>{ok ? 'Ta candidature est acceptée' : "Ta candidature n'a pas été retenue"}</h3>
            <blockquote>{message || '…'}</blockquote>
          </div>
        </div>
      </div>

      <div className="modale-actions">
        <button className="bouton fantome" onClick={onFermer}>Annuler</button>
        <Bouton className={`bouton ${ok ? 'succes' : 'danger'}`} chargement={envoi} disabled={n < 20} onClick={valider}>
          {ok ? 'Accepter et notifier' : 'Refuser et notifier'}
        </Bouton>
      </div>
    </Modale>
  )
}
