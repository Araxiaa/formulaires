import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Icone } from './Icons'
import { Modale, Bouton, Apparition } from './Ui'
import { STATUTS_POSTE, ouvertDepuis } from '../lib/format'
import { rejoindreAttente } from '../lib/api'
import { messageErreur } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { useToast } from '../lib/toast'

export function SceauGroupe({ groupe, petit }) {
  return (
    <span className={`sceau-clan${petit ? ' petit' : ''}`} style={{ '--couleur-camp': groupe?.couleur }}>
      <Icone nom={groupe?.icone || 'patte'} taille={petit ? 16 : 20} />
    </span>
  )
}

export const effectifOption = (o) => {
  const total = o.places_total ?? 0
  const libres = Math.min(o.places_dispo ?? total, total)
  return { total, libres, pris: total - libres }
}

// Spécialité facultative (Régisseur·se, Généticien·ne, Gestion PNJ) : effectif + missions
export function CarteOption({ option, poste, groupe, delai = 0 }) {
  const { total, libres, pris } = effectifOption(option)
  return (
    <Apparition delai={delai} className="carte carte-option" style={{ '--couleur-camp': groupe?.couleur }}>
      <div className="carte-poste-haut">
        <span className="mono discret" style={{ fontSize: '0.72rem' }}>{poste.nom} · option</span>
        <span className="badge pastille" data-statut={libres > 0 ? 'ouvert' : 'complet'}>{libres > 0 ? `${libres} place${libres > 1 ? 's' : ''} libre${libres > 1 ? 's' : ''}` : 'Complet'}</span>
      </div>
      <h3>{option.nom}</h3>
      <div className="effectif">
        <div className="effectif-jauge" role="img" aria-label={`${pris} en poste sur ${total}`}>
          {Array.from({ length: total }, (_, i) => <span key={i} className={i < pris ? 'plein' : ''} />)}
        </div>
        <span className="mono">{pris} / {total} en poste</span>
      </div>
      {option.membres?.length > 0 && <p className="membres-option"><Icone nom="utilisateur" taille={14} />{option.membres.join(' · ')}</p>}
      {option.description && <p className="discret" style={{ fontSize: '0.9rem' }}>{option.description}</p>}
      {option.missions?.length > 0 && <ul className="liste-missions petit">{option.missions.map((m) => <li key={m}><Icone nom="check" taille={14} />{m}</li>)}</ul>}
    </Apparition>
  )
}

export function CartePoste({ poste, groupe, onDetails, onAttente, delai = 0 }) {
  const ouvert = poste.statut === 'ouvert'
  const hr = poste.categorie === 'hr'
  return (
    <Apparition delai={delai} className={`carte carte-poste${ouvert ? '' : ' estompee'}`} style={{ '--couleur-camp': groupe?.couleur }}>
      <div className="carte-poste-haut">
        <span className="badge pastille" data-statut={poste.statut}>{STATUTS_POSTE[poste.statut]}</span>
        {!hr && <span className="discret mono" style={{ fontSize: '0.75rem' }}>{poste.places_dispo}/{poste.places_total} place{poste.places_total > 1 ? 's' : ''}</span>}
      </div>
      <h3>{poste.nom}</h3>
      {hr ? (
        <p className="discret" style={{ fontSize: '0.9rem' }}>
          {poste.titulaire ? <>Titulaire : <strong>{poste.titulaire}</strong></> : ouvert ? 'Poste vacant' : 'Aucun·e titulaire'}
          {poste.note && <><br /><Icone nom="cloche" taille={13} /> {poste.note}</>}
        </p>
      ) : (
        <p className="discret" style={{ fontSize: '0.9rem' }}>{poste.description}</p>
      )}
      {!hr && poste.options?.length > 0 && (
        <p className="options-carte"><Icone nom="etoiles" taille={14} />En option : {poste.options.map((o) => o.nom).join(' · ')}</p>
      )}
      {ouvert && poste.ouvert_le && <p className="mono discret" style={{ fontSize: '0.72rem', margin: 0 }}>{ouvertDepuis(poste.ouvert_le)}</p>}
      <div className="carte-poste-actions">
        {ouvert
          ? <Link className="bouton petit" to={`/candidater/${poste.categorie}?poste=${poste.id}`}>Candidater <Icone nom="fleche" taille={15} /></Link>
          : <button className="bouton petit secondaire" onClick={() => onAttente(poste)}><Icone nom="horloge" taille={15} /> Liste d'attente</button>}
        {!hr && <button className="bouton petit fantome" onClick={() => onDetails(poste)}>En savoir plus</button>}
      </div>
    </Apparition>
  )
}

export function TiroirPoste({ poste, groupe, onFermer }) {
  return (
    <Modale tiroir onFermer={onFermer} titre={poste.nom}>
      <p className="sous-titre">{groupe?.nom}</p>
      <h2>{poste.nom}</h2>
      {groupe?.description_longue && <p className="discret">{groupe.description_longue}</p>}
      {poste.missions?.length > 0 && (<>
        <h3 className="titre-section">Missions</h3>
        <ul className="liste-missions">{poste.missions.map((m) => <li key={m}><Icone nom="check" taille={16} />{m}</li>)}</ul>
      </>)}
      {poste.options?.length > 0 && (<>
        <h3 className="titre-section">En option <span className="facultatif">facultatif</span></h3>
        <div className="liste-options">
          {poste.options.map((o) => (
            <div key={o.id} className="option-apercu"><Icone nom="etoiles" taille={18} /><div><strong>{o.nom}</strong>
              <span className="mono discret" style={{ marginLeft: 8, fontSize: '0.75rem' }}>{effectifOption(o).pris} / {effectifOption(o).total} en poste</span>
              <p className="discret">{o.description}</p>
              {o.missions?.length > 0 && <ul className="liste-missions petit">{o.missions.map((m) => <li key={m}><Icone nom="check" taille={14} />{m}</li>)}</ul>}</div></div>
          ))}
        </div>
      </>)}
      <h3 className="titre-section">Prérequis</h3>
      <div className="prerequis">
        <div><Icone nom="calendrier" taille={18} /><span>Ancienneté</span><strong>{poste.anciennete || '—'}</strong></div>
        <div><Icone nom="horloge" taille={18} /><span>Disponibilités</span><strong>{poste.disponibilite || '—'}</strong></div>
      </div>
      {poste.note_candidat && <div className="note-importante"><Icone nom="alerte" taille={18} />{poste.note_candidat}</div>}
      <div className="modale-actions">
        {poste.statut === 'ouvert'
          ? <Link className="bouton" to={`/candidater/staff?poste=${poste.id}`}>Candidater à cette équipe <Icone nom="fleche" taille={16} /></Link>
          : <span className="badge" data-statut={poste.statut}>{STATUTS_POSTE[poste.statut]}</span>}
      </div>
    </Modale>
  )
}

export function ModaleAttente({ poste, groupe, onFermer }) {
  const { pseudo: pseudoDiscord } = useAuth()
  const notifier = useToast()
  const [pseudo, setPseudo] = useState(pseudoDiscord || '')
  const [chargement, setChargement] = useState(false)
  const nom = poste.categorie === 'hr' ? `${poste.nom} — ${groupe?.nom}` : poste.nom

  async function valider(e) {
    e.preventDefault()
    setChargement(true)
    try {
      await rejoindreAttente(poste.id, pseudo)
      notifier("C'est noté : tu seras mentionné·e à l'ouverture du poste.", 'succes')
      onFermer()
    } catch (err) { notifier(messageErreur(err), 'erreur') } finally { setChargement(false) }
  }

  return (
    <Modale onFermer={onFermer} titre="Liste d'attente">
      <h2>Liste d'attente</h2>
      <p className="discret">{nom}</p>
      <form onSubmit={valider}>
        <div className="champ">
          <label className="etiquette" htmlFor="attente-pseudo">Ton pseudo Discord</label>
          <p className="aide">Tu seras mentionné·e sur Discord dès que le poste ouvre. Connecte-toi avec Discord pour que ton identifiant soit enregistré automatiquement.</p>
          <input id="attente-pseudo" type="text" value={pseudo} onChange={(e) => setPseudo(e.target.value)} maxLength={60} required autoFocus />
        </div>
        <div className="modale-actions">
          <button type="button" className="bouton fantome" onClick={onFermer}>Annuler</button>
          <Bouton className="bouton" chargement={chargement} disabled={pseudo.trim().length < 2}>M'inscrire</Bouton>
        </div>
      </form>
    </Modale>
  )
}
