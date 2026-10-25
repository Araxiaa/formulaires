export const TYPES = {
  staff: { label: 'Staff', icone: 'bouclier', court: 'Staff' },
  hr: { label: 'Haut Rang', icone: 'couronne', court: 'Haut Rang' },
  oc3: { label: '3ème OC', icone: 'patte', court: '3ème OC' },
  oc4: { label: '4ème OC', icone: 'griffes', court: '4ème OC' },
}

export const STATUTS = {
  recue: { label: 'Reçue', couleur: 'var(--statut-recue)' },
  examen: { label: "En cours d'examen", couleur: 'var(--statut-examen)' },
  acceptee: { label: 'Acceptée', couleur: 'var(--statut-ok)' },
  refusee: { label: 'Refusée', couleur: 'var(--statut-ko)' },
  retiree: { label: 'Retirée', couleur: 'var(--statut-neutre)' },
}

export const STATUTS_POSTE = {
  ouvert: 'Ouvert', complet: 'Complet', indispo: 'Non disponible',
}

const rtf = new Intl.RelativeTimeFormat('fr', { numeric: 'auto' })
export function ilYa(date) {
  const diff = (new Date(date).getTime() - Date.now()) / 1000
  const abs = Math.abs(diff)
  if (abs < 60) return "à l'instant"
  if (abs < 3600) return rtf.format(Math.round(diff / 60), 'minute')
  if (abs < 86400) return rtf.format(Math.round(diff / 3600), 'hour')
  if (abs < 86400 * 30) return rtf.format(Math.round(diff / 86400), 'day')
  return rtf.format(Math.round(diff / (86400 * 30)), 'month')
}

export const joursDepuis = (date) => Math.floor((Date.now() - new Date(date).getTime()) / 86400000)

export const dateCourte = (d) => (d ? new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '—')
export const dateHeure = (d) => (d ? new Date(d).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—')

export function ouvertDepuis(date) {
  if (!date) return ''
  const j = joursDepuis(date)
  return j <= 0 ? "Ouvert depuis aujourd'hui" : `Ouvert depuis ${j} jour${j > 1 ? 's' : ''}`
}

// Initiale pour les sceaux
export const initiale = (nom = '') => (nom.replace(/^(Clan (du|de l'|de la)|Pôle)\s*/i, '').trim()[0] || '?').toUpperCase()

export const plur = (n, s, p = `${s}s`) => `${n} ${n > 1 ? p : s}`

// Catégories de l'annuaire de l'équipe (ordre d'affichage)
export const CATEGORIES_EQUIPE = [
  { id: 'fondateur', label: 'Fondateurs', singulier: 'Fondateur·rice', court: 'Fondateur', icone: 'couronne', couleur: '#e2b866', description: 'Ils ont fondé le serveur et en tiennent la barre.' },
  { id: 'moderateur', label: 'Modérateurs', singulier: 'Modérateur·rice', court: 'Modération', icone: 'bouclier', couleur: '#7fb0dc', description: "Garants du cadre et de la bonne ambiance." },
  { id: 'guide', label: 'Staffs Guide', singulier: 'Staff Guide', court: 'Guide', icone: 'boussole', couleur: '#5A9A70', description: 'Accompagnent les membres, animent et gèrent les tickets.' },
  { id: 'narration', label: 'Staffs Narration', singulier: 'Staff Narration', court: 'Narration', icone: 'plume', couleur: '#8A9A42', description: 'Font vivre le roleplay, les intrigues et les événements.' },
  { id: 'apprenti_guide', label: 'Apprentis Staff Guide', singulier: 'Apprenti·e Guide', court: 'Apprenti Guide', icone: 'pousse', couleur: '#7cc29a', description: 'En formation auprès des Staffs Guide.' },
  { id: 'apprenti_narration', label: 'Apprentis Staff Narration', singulier: 'Apprenti·e Narration', court: 'Apprenti Narration', icone: 'pousse', couleur: '#b6c46a', description: 'En formation auprès des Staffs Narration.' },
]
export const categorieDe = (id) => CATEGORIES_EQUIPE.find((c) => c.id === id)

// Un membre peut appartenir à plusieurs équipes (ex : Guide et Narration)
export const membresDe = (equipe, catId) => (equipe || []).filter((m) => m.categories?.includes(catId))
export const membresAvecSpecialite = (equipe, nom) => (equipe || []).filter((m) => m.specialites?.includes(nom))
