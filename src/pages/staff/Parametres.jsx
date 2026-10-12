import { useState } from 'react'
import { useAsync } from '../../lib/hooks'
import { invalider, lireParametres, lireSecrets, sauverParametre, sauverSecret, testerWebhook } from '../../lib/api'
import { useToast } from '../../lib/toast'
import { messageErreur } from '../../lib/supabase'
import { Bouton, Chargeur, Erreur } from '../../components/Ui'
import { Icone } from '../../components/Icons'

const CANAUX = [
  ['staff', 'Candidatures Staff', 'Nouvelle candidature Staff (avec lien vers le dashboard)'],
  ['hr', 'Candidatures Hauts Rangs', 'Nouvelle candidature Haut Rang'],
  ['oc', 'Candidatures OC', 'Nouvelles demandes de 3ème et 4ème OC'],
  ['candidats', 'Réponses aux candidats', 'Décisions (avec mention du candidat) et pings de liste d’attente'],
  ['admin', 'Notifications admin', 'Changements de statut, notes internes, rappels à 48 h'],
  ['ouvertures', 'Ouvertures de postes', 'Annonce publique quand un poste ouvre'],
]

export default function Parametres() {
  const notifier = useToast()
  const { data, loading, error, recharger } = useAsync(async () => {
    invalider('parametres')
    const [params, secrets] = await Promise.all([lireParametres(), lireSecrets()])
    return { params, secrets }
  }, [])
  const [params, setParams] = useState(null)
  const [urls, setUrls] = useState({})
  const [occupe, setOccupe] = useState('')

  if (loading) return <Chargeur />
  if (error) return <Erreur erreur={error} onRetry={recharger} />
  const p = params || data.params

  async function sauverParam(cle, valeur) {
    setOccupe(cle)
    try { await sauverParametre(cle, valeur); notifier('Paramètre enregistré.', 'succes'); setParams({ ...p, [cle]: valeur }) }
    catch (err) { notifier(messageErreur(err), 'erreur') } finally { setOccupe('') }
  }
  async function sauverUrl(canal) {
    setOccupe(canal)
    try { await sauverSecret(`webhook_${canal}`, (urls[canal] ?? '').trim()); notifier('Webhook enregistré.', 'succes'); setUrls((u) => { const { [canal]: _, ...r } = u; void _; return r }); recharger() }
    catch (err) { notifier(messageErreur(err), 'erreur') } finally { setOccupe('') }
  }
  async function tester(canal) {
    setOccupe(`t${canal}`)
    try { await testerWebhook(canal); notifier('Message de test envoyé (vérifie le salon Discord).', 'succes') } catch (err) { notifier(messageErreur(err), 'erreur') } finally { setOccupe('') }
  }

  return (
    <div>
      <header className="staff-entete"><div><p className="sous-titre">Administration</p><h1>Paramètres</h1></div></header>

      <section className="carte">
        <h2 className="titre-carte">Recrutement</h2>
        <label className="interrupteur gros">
          <input type="checkbox" checked={p.recrutement_ouvert !== false} onChange={(e) => sauverParam('recrutement_ouvert', e.target.checked)} />
          <span className="piste" /> Recrutement ouvert (désactive tous les formulaires d'un coup)
        </label>
        <div className="champ" style={{ marginTop: 18 }}><label className="etiquette">Annonce affichée sur l'accueil <span className="facultatif">laisser vide pour masquer</span></label>
          <div className="ligne-recherche"><input type="text" defaultValue={p.annonce || ''} id="annonce" /><Bouton className="bouton" chargement={occupe === 'annonce'} onClick={() => sauverParam('annonce', document.getElementById('annonce').value.trim())}>Enregistrer</Bouton></div></div>
        <div className="champ"><label className="etiquette">Délai de réponse annoncé</label>
          <div className="ligne-recherche"><input type="text" defaultValue={p.delai_reponse || ''} id="delai" /><Bouton className="bouton" chargement={occupe === 'delai_reponse'} onClick={() => sauverParam('delai_reponse', document.getElementById('delai').value.trim())}>Enregistrer</Bouton></div></div>
        <div className="champ"><label className="etiquette">Lien d'invitation Discord</label>
          <div className="ligne-recherche"><input type="text" defaultValue={p.discord_invite || ''} id="invite" /><Bouton className="bouton" chargement={occupe === 'discord_invite'} onClick={() => sauverParam('discord_invite', document.getElementById('invite').value.trim())}>Enregistrer</Bouton></div></div>
        <div className="champ"><label className="etiquette">URL du site <span className="facultatif">utilisée dans les liens Discord</span></label>
          <div className="ligne-recherche"><input type="text" defaultValue={p.site_url || ''} id="siteurl" /><Bouton className="bouton" chargement={occupe === 'site_url'} onClick={() => sauverParam('site_url', document.getElementById('siteurl').value.trim())}>Enregistrer</Bouton></div></div>
      </section>

      <section className="carte" style={{ marginTop: 14 }}>
        <h2 className="titre-carte"><Icone nom="discord" taille={18} /> Webhooks Discord</h2>
        <p className="aide">Les notifications partent du serveur : ces URL ne sont jamais visibles du public. Colle l'URL du webhook du salon voulu (Paramètres du salon → Intégrations → Webhooks).</p>
        {CANAUX.map(([canal, titre, aide]) => {
          const actuel = data.secrets[`webhook_${canal}`]
          return (
            <div key={canal} className="champ">
              <label className="etiquette">{titre} {actuel ? <span className="badge" data-statut="acceptee">configuré</span> : <span className="badge" data-statut="indispo">non configuré</span>}</label>
              <p className="aide">{aide}</p>
              <div className="ligne-recherche">
                <input type="password" autoComplete="off" placeholder={actuel ? '•••••••••• (laisser vide pour conserver)' : 'https://discord.com/api/webhooks/…'}
                       value={urls[canal] ?? ''} onChange={(e) => setUrls((u) => ({ ...u, [canal]: e.target.value }))} />
                <Bouton className="bouton" chargement={occupe === canal} disabled={urls[canal] === undefined || (!urls[canal] && !actuel)} onClick={() => sauverUrl(canal)}>{urls[canal] === '' ? 'Supprimer' : 'Enregistrer'}</Bouton>
                <Bouton className="bouton fantome" chargement={occupe === `t${canal}`} disabled={!actuel} onClick={() => tester(canal)}>Tester</Bouton>
              </div>
            </div>
          )
        })}
      </section>
    </div>
  )
}
