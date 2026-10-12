import { createClient } from '@supabase/supabase-js'

// Même projet Supabase que le site Généalogie : la session Discord est partagée
// (même origine GitHub Pages, même clé de stockage).
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  { db: { schema: 'recrutement' } },
)

// Erreurs métier renvoyées par les fonctions SQL (raise exception '…')
const MESSAGES = {
  recrutement_ferme: 'Le recrutement est actuellement fermé.',
  formulaire_ferme: 'Ce formulaire est fermé pour le moment.',
  pseudo_invalide: 'Le pseudo Discord est invalide.',
  poste_indisponible: "Ce poste n'est plus disponible.",
  doublon: 'Tu as déjà une candidature de ce type en cours.',
  trop_de_candidatures: 'Trop de candidatures en peu de temps. Réessaie demain.',
  reponses_trop_longues: 'Tes réponses sont trop longues.',
  message_requis: 'Un message d’au moins 20 caractères est requis pour une décision.',
  non_autorise: 'Action non autorisée.',
  poste_ouvert: 'Ce poste est ouvert : tu peux candidater directement.',
}

export function messageErreur(err) {
  const brut = err?.message || ''
  for (const [cle, texte] of Object.entries(MESSAGES)) if (brut.includes(cle)) return texte
  return 'Une erreur est survenue. Réessaie dans un instant.'
}
