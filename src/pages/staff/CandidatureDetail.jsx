import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAsync } from '../../lib/hooks'
import { useAuth } from '../../lib/auth'
import { useStaffData } from '../../lib/staffData'
import { useToast } from '../../lib/toast'
import { ajouterNote, assigner, candidatureComplete, changerStatut, retirerVote, supprimerNote, voter } from '../../lib/api'
import { messageErreur } from '../../lib/supabase'
import { Bouton, Chargeur, Erreur } from '../../components/Ui'
import { Icone } from '../../components/Icons'
import ModaleDecision from '../../components/staff/ModaleDecision'
import { STATUTS, TYPES, dateCourte, dateHeure, ilYa } from '../../lib/format'

export default function CandidatureDetail() {
  const { id } = useParams()
  const { session, pseudo } = useAuth()
  const { candidatures, postes, recharger: rechargerListe } = useStaffData()
  const notifier = useToast()
  const { data, loading, error, recharger } = useAsync(() => candidatureComplete(id), [id])
  const [decision, setDecision] = useState(null)
  const [note, setNote] = useState('')
  const [commVote, setCommVote] = useState('')
  const [occupe, setOccupe] = useState('')
  const staffNom = pseudo || session?.user?.email || 'staff'
  const monId = session?.user?.id

  if (loading && !data) return <Chargeur />
  if (error || !data) return <Erreur erreur={error} onRetry={recharger} />
  const { candidature: c, evenements, notes, votes } = data
  const poste = postes.find((p) => p.id === c.poste_id)
  const autres = candidatures.filter((x) => x.pseudo_discord.toLowerCase() === c.pseudo_discord.toLowerCase() && x.id !== c.id)
  const monVote = votes.find((v) => v.staff_id === monId)
  const sections = c.reponses?.sections || []

  async function agir(nom, fn, ok) {
    setOccupe(nom)
    try { await fn(); if (ok) notifier(ok, 'succes'); await recharger(); rechargerListe() }
    catch (err) { notifier(messageErreur(err), 'erreur') } finally { setOccupe('') }
  }

  const tally = (v) => votes.filter((x) => x.vote === v).length

  return (
    <div className="detail">
      <Link to="/staff/candidatures" className="lien-retour"><Icone nom="retour" taille={14} /> Candidatures</Link>

      <div className="detail-grille">
        <div className="zone-impression">
          <header className="carte detail-entete">
            <div>
              <p className="sous-titre">{TYPES[c.type]?.label}</p>
              <h1>{c.pseudo_discord}</h1>
              <p className="discret" style={{ margin: 0 }}>{c.resume}</p>
              <p className="mono discret" style={{ margin: '6px 0 0', fontSize: '0.78rem' }}>
                {c.code_suivi} · déposée le {dateCourte(c.created_at)}{c.discord_id && <> · Discord ID {c.discord_id}</>}{c.user_id && ' · compte lié'}
              </p>
            </div>
            <span className="badge pastille grand" data-statut={c.statut}>{STATUTS[c.statut]?.label}</span>
          </header>

          {c.message_public && (
            <div className="carte message-envoye"><p className="sous-titre">Message envoyé au candidat · {dateCourte(c.decide_le)}</p><p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{c.message_public}</p></div>
          )}

          {sections.map((s) => (
            <section key={s.titre} className="carte reponses">
              <h2>{s.titre}</h2>
              <dl className="qa">{s.items.map((it) => <div key={it.id}><dt>{it.q}</dt><dd>{it.r}</dd></div>)}</dl>
            </section>
          ))}
          {!sections.length && <p className="vide">Aucune réponse enregistrée.</p>}
        </div>

        <aside className="detail-lateral">
          <section className="carte">
            <h2 className="titre-carte">Statut</h2>
            <div className="boutons-statut">
              <button className="bouton petit fantome" disabled={c.statut === 'recue' || !!occupe} onClick={() => agir('recue', () => changerStatut(c.id, 'recue', null), 'Remise en « reçue ».')}>Reçue</button>
              <button className="bouton petit fantome" disabled={c.statut === 'examen' || !!occupe} onClick={() => agir('examen', () => changerStatut(c.id, 'examen', null), 'Passée en examen.')}>En examen</button>
              <button className="bouton petit succes" disabled={c.statut === 'acceptee'} onClick={() => setDecision('acceptee')}><Icone nom="check" taille={15} /> Accepter</button>
              <button className="bouton petit danger" disabled={c.statut === 'refusee'} onClick={() => setDecision('refusee')}><Icone nom="croix" taille={15} /> Refuser</button>
            </div>
            <div className="assignation">
              <input type="text" defaultValue={c.assigne_a || ''} placeholder="Assigné à…" aria-label="Assigné à" key={c.assigne_a}
                     onBlur={(e) => e.target.value !== (c.assigne_a || '') && agir('assign', () => assigner(c.id, e.target.value.trim()), 'Assignation enregistrée.')} />
              <button className="bouton petit fantome" onClick={() => agir('assign', () => assigner(c.id, staffNom), 'Dossier assigné à toi.')}>Me l'assigner</button>
            </div>
          </section>

          <section className="carte">
            <h2 className="titre-carte">Avis de l'équipe</h2>
            <div className="votes-resume">
              <span className="vote-compte pour"><Icone nom="pouce" taille={16} />{tally('pour')}</span>
              <span className="vote-compte neutre">{tally('neutre')} neutre</span>
              <span className="vote-compte contre"><Icone nom="pouce_bas" taille={16} />{tally('contre')}</span>
            </div>
            <div className="boutons-statut">
              {[['pour', 'Pour'], ['neutre', 'Neutre'], ['contre', 'Contre']].map(([v, l]) => (
                <button key={v} className={`bouton petit ${monVote?.vote === v ? '' : 'fantome'}`} disabled={!!occupe}
                        onClick={() => agir('vote', () => voter(c.id, monId, staffNom, v, commVote || monVote?.commentaire), 'Avis enregistré.')}>{l}</button>
              ))}
              {monVote && <button className="bouton-icone" title="Retirer mon avis" onClick={() => agir('vote', () => retirerVote(c.id, monId))}><Icone nom="croix" taille={16} /></button>}
            </div>
            <input type="text" value={commVote} placeholder={monVote?.commentaire || 'Commentaire (facultatif)'} onChange={(e) => setCommVote(e.target.value)} aria-label="Commentaire d'avis" />
            <ul className="liste-votes">
              {votes.map((v) => <li key={v.staff_id}><strong>{v.staff_nom}</strong> <span className={`vote-etiquette ${v.vote}`}>{v.vote}</span>{v.commentaire && <span className="discret"> — {v.commentaire}</span>}</li>)}
            </ul>
          </section>

          <section className="carte">
            <h2 className="titre-carte">Notes internes</h2>
            {notes.map((n) => (
              <div key={n.id} className="note-interne">
                <p>{n.contenu}</p>
                <small className="discret mono">{n.auteur} · {ilYa(n.created_at)}
                  {n.auteur === staffNom && <button className="lien-discret" onClick={() => agir('note', () => supprimerNote(n.id))}>supprimer</button>}</small>
              </div>
            ))}
            <textarea rows={3} value={note} placeholder="Ajouter une note (visible du staff uniquement)…" onChange={(e) => setNote(e.target.value)} aria-label="Nouvelle note" />
            <Bouton className="bouton petit" chargement={occupe === 'ajout'} disabled={note.trim().length < 2}
                    onClick={() => agir('ajout', async () => { await ajouterNote(c.id, staffNom, note.trim()); setNote('') }, 'Note ajoutée.')}>Ajouter</Bouton>
          </section>

          <section className="carte">
            <h2 className="titre-carte">Historique</h2>
            <ul className="liste-historique">
              {evenements.map((e) => <li key={e.id}><strong>{STATUTS[e.type]?.label || 'Message'}</strong> <span className="discret mono">{dateHeure(e.created_at)} · {e.auteur}</span>{e.message && <p>{e.message}</p>}</li>)}
            </ul>
            {autres.length > 0 && (<>
              <h3 className="titre-section" style={{ marginTop: 14 }}>Autres candidatures</h3>
              {autres.map((x) => <Link key={x.id} className="ligne-alerte" to={`/staff/candidatures/${x.id}`}><span className="mono">{x.code_suivi}</span><span className="badge">{TYPES[x.type]?.label}</span><span className="badge pastille" data-statut={x.statut}>{STATUTS[x.statut]?.label}</span></Link>)}
            </>)}
            <button className="bouton fantome plein" style={{ marginTop: 14 }} onClick={() => window.print()}><Icone nom="telecharger" taille={16} /> Exporter en PDF</button>
          </section>
        </aside>
      </div>

      {decision && <ModaleDecision candidature={c} statut={decision} poste={poste} onFermer={() => setDecision(null)} onFait={() => { recharger(); rechargerListe() }} />}
    </div>
  )
}
