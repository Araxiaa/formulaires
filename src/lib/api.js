import { supabase } from './supabase'

function unwrap({ data, error }) {
  if (error) throw error
  return data
}

// Cache mémoire court : évite de re-télécharger le contenu éditorial à chaque navigation.
const cache = new Map()
function mem(cle, fn, ttl = 45000) {
  const hit = cache.get(cle)
  if (hit && Date.now() - hit.t < ttl) return hit.p
  const p = fn().catch((e) => { cache.delete(cle); throw e })
  cache.set(cle, { t: Date.now(), p })
  return p
}
export const invalider = (...cles) => (cles.length ? cles.forEach((c) => cache.delete(c)) : cache.clear())

/* ───────── Contenu public ───────── */
export const lireGroupes = () => mem('groupes', async () => unwrap(await supabase.from('groupes').select('*').order('ordre')))
export const lirePostes = () => mem('postes', async () => unwrap(await supabase.from('postes').select('*').order('ordre')), 20000)
export const lireFormulaires = () => mem('formulaires', async () => unwrap(await supabase.from('formulaires').select('*')))
export const lireFaq = () => mem('faq', async () => unwrap(await supabase.from('faq').select('*').eq('publie', true).order('ordre')))
export const lireParametres = () => mem('parametres', async () => {
  const rows = unwrap(await supabase.from('parametres').select('*'))
  return Object.fromEntries(rows.map((r) => [r.cle, r.valeur]))
})
export const statsPubliques = () => mem('stats', async () => unwrap(await supabase.rpc('stats_publiques')), 30000)

/* ───────── Candidats ───────── */
export const soumettre = async ({ type, posteId, secondaires, pseudo, discordId, reponses, resume }) =>
  unwrap(await supabase.rpc('soumettre', {
    p_type: type, p_poste_id: posteId ?? null, p_secondaires: secondaires ?? [], p_pseudo: pseudo,
    p_discord_id: discordId ?? null, p_reponses: reponses, p_resume: resume ?? null,
  }))
export const suiviCode = async (code) => unwrap(await supabase.rpc('suivi_code', { p_code: code }))
export const suiviPseudo = async (pseudo) => unwrap(await supabase.rpc('suivi_pseudo', { p_pseudo: pseudo }))
export const mesCandidatures = async () => unwrap(await supabase.rpc('mes_candidatures'))
export const retirer = async (code) => unwrap(await supabase.rpc('retirer', { p_code: code }))
export const rejoindreAttente = async (posteId, pseudo) => unwrap(await supabase.rpc('rejoindre_attente', { p_poste_id: posteId, p_pseudo: pseudo }))

/* ───────── Staff ───────── */
const COLONNES_LISTE = 'id,code_suivi,type,poste_id,postes_secondaires,resume,pseudo_discord,discord_id,statut,assigne_a,message_public,decide_le,created_at,updated_at'
export const listerCandidatures = async () =>
  unwrap(await supabase.from('candidatures').select(COLONNES_LISTE).order('created_at', { ascending: false }))

export async function candidatureComplete(id) {
  const [c, evenements, notes, votes] = await Promise.all([
    supabase.from('candidatures').select('*').eq('id', id).single(),
    supabase.from('evenements').select('*').eq('candidature_id', id).order('created_at'),
    supabase.from('notes').select('*').eq('candidature_id', id).order('created_at'),
    supabase.from('votes').select('*').eq('candidature_id', id),
  ])
  return { candidature: unwrap(c), evenements: unwrap(evenements), notes: unwrap(notes), votes: unwrap(votes) }
}

export const changerStatut = async (id, statut, message, cloturer = false) =>
  unwrap(await supabase.rpc('changer_statut', { p_id: id, p_statut: statut, p_message: message ?? null, p_cloturer: cloturer }))
export const assigner = async (id, nom) =>
  unwrap(await supabase.from('candidatures').update({ assigne_a: nom || null }).eq('id', id))
export const ajouterNote = async (id, auteur, contenu) =>
  unwrap(await supabase.from('notes').insert({ candidature_id: id, auteur, contenu }))
export const supprimerNote = async (noteId) => unwrap(await supabase.from('notes').delete().eq('id', noteId))
export const voter = async (id, staffId, staffNom, vote, commentaire) =>
  unwrap(await supabase.from('votes').upsert(
    { candidature_id: id, staff_id: staffId, staff_nom: staffNom, vote, commentaire: commentaire || null, updated_at: new Date().toISOString() },
    { onConflict: 'candidature_id,staff_id' }))
export const retirerVote = async (id, staffId) =>
  unwrap(await supabase.from('votes').delete().eq('candidature_id', id).eq('staff_id', staffId))

// Contenu éditable
export const sauverPoste = async (poste) => {
  invalider('postes', 'stats')
  const { id, ...reste } = poste
  return id ? unwrap(await supabase.from('postes').update(reste).eq('id', id).select().single())
            : unwrap(await supabase.from('postes').insert(reste).select().single())
}
export const supprimerPoste = async (id) => { invalider('postes', 'stats'); return unwrap(await supabase.from('postes').delete().eq('id', id)) }
export const sauverGroupe = async (g) => { invalider('groupes'); return unwrap(await supabase.from('groupes').upsert(g)) }
export const sauverFormulaire = async (f) => { invalider('formulaires'); return unwrap(await supabase.from('formulaires').update(f).eq('type', f.type)) }
export const sauverParametre = async (cle, valeur) => { invalider('parametres'); return unwrap(await supabase.from('parametres').upsert({ cle, valeur })) }

export const listerFaqStaff = async () => unwrap(await supabase.from('faq').select('*').order('ordre'))
export const sauverFaq = async (f) => { invalider('faq'); return unwrap(await supabase.from('faq').upsert(f)) }
export const supprimerFaq = async (id) => { invalider('faq'); return unwrap(await supabase.from('faq').delete().eq('id', id)) }

export const listerModeles = async () => unwrap(await supabase.from('modeles').select('*').order('ordre'))
export const sauverModele = async (m) => unwrap(await supabase.from('modeles').upsert(m))
export const supprimerModele = async (id) => unwrap(await supabase.from('modeles').delete().eq('id', id))

export const listerAttente = async () => unwrap(await supabase.from('liste_attente').select('*').order('created_at'))
export const sauverIdDiscord = async (attenteId, pseudo, discordId) => {
  unwrap(await supabase.from('membres_discord').upsert({ pseudo_discord: pseudo, discord_id: discordId, updated_at: new Date().toISOString() }))
  return unwrap(await supabase.from('liste_attente').update({ discord_id: discordId }).eq('pseudo_discord', pseudo))
}
export const retirerAttente = async (id) => unwrap(await supabase.from('liste_attente').delete().eq('id', id))

export const lireSecrets = async () => {
  const rows = unwrap(await supabase.from('secrets').select('*'))
  return Object.fromEntries(rows.map((r) => [r.cle, r.valeur]))
}
export const sauverSecret = async (cle, valeur) =>
  valeur ? unwrap(await supabase.from('secrets').upsert({ cle, valeur })) : unwrap(await supabase.from('secrets').delete().eq('cle', cle))
export const testerWebhook = async (canal) => unwrap(await supabase.rpc('tester_webhook', { p_canal: canal }))
