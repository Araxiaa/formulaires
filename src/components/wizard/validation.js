const RE_URL = /^https?:\/\/[^\s]+\.[^\s]+$/i

export const lignes = (v) => String(v || '').split('\n').map((l) => l.trim()).filter(Boolean)
export const longueur = (v) => String(v || '').trim().length

// Retourne un message d'erreur ou '' si le champ est valide.
export function erreurChamp(champ, valeur) {
  const vide = champ.type === 'multi' ? !valeur?.length : longueur(valeur) === 0
  if (vide) return champ.required === false ? '' : 'Ce champ est obligatoire.'
  if (champ.type === 'multi') {
    if (champ.min && valeur.length < champ.min) return `Choisis au moins ${champ.min} option${champ.min > 1 ? 's' : ''}.`
    return ''
  }
  if (champ.type === 'url_list') {
    const l = lignes(valeur)
    if (l.some((u) => !RE_URL.test(u))) return 'Un lien par ligne, commençant par https://'
    if (champ.min && l.length < champ.min) return `Ajoute au moins ${champ.min} lien${champ.min > 1 ? 's' : ''}.`
    return ''
  }
  if (champ.min && longueur(valeur) < champ.min) return `Encore ${champ.min - longueur(valeur)} caractère${champ.min - longueur(valeur) > 1 ? 's' : ''} minimum.`
  return ''
}

// Clé de stockage d'une question liée à un poste
export const cleQuestion = (posteId, qid) => `q:${posteId}:${qid}`

// Champs « à plat » d'une étape, avec leur clé de stockage
export function champsEtape(etape, ctx) {
  if (etape.kind === 'questions_poste') {
    return ctx.postesChoisis.flatMap((p) =>
      (p.questions || []).map((q) => ({ ...q, cle: cleQuestion(p.id, q.id), poste: p })))
  }
  if (etape.kind === 'poste') return []
  return (etape.champs || []).map((c) => ({ ...c, cle: c.id }))
}

export function erreursEtape(etape, ctx) {
  const erreurs = {}
  if (etape.kind === 'poste') {
    const n = ctx.postesChoisis.length
    if (n < 1) erreurs.__poste = 'Choisis au moins un poste.'
    else if (etape.max && n > etape.max) erreurs.__poste = `Tu peux choisir ${etape.max} poste${etape.max > 1 ? 's' : ''} maximum.`
    return erreurs
  }
  for (const c of champsEtape(etape, ctx)) {
    const e = erreurChamp(c, ctx.valeurs[c.cle])
    if (e) erreurs[c.cle] = e
  }
  return erreurs
}

const affiche = (champ, v) => (champ.type === 'multi' ? (v || []).join(', ') : champ.type === 'url_list' ? lignes(v).join('\n') : String(v ?? '').trim())

// Construit le payload stocké en base : sections lisibles (dashboard, Discord, PDF…)
export function construireReponses(etapes, ctx) {
  const sections = []
  for (const etape of etapes) {
    if (etape.kind === 'poste') {
      sections.push({ titre: etape.titre, items: [{ id: 'postes', q: etape.max === 1 ? 'Poste visé' : 'Poste(s) visé(s)', r: ctx.postesChoisis.map((p) => p.nom).join(' + ') }] })
    } else if (etape.kind === 'questions_poste') {
      for (const p of ctx.postesChoisis) {
        sections.push({
          titre: `${etape.titre} — ${p.nom}`,
          items: (p.questions || []).map((q) => ({ id: cleQuestion(p.id, q.id), q: q.label, r: affiche(q, ctx.valeurs[cleQuestion(p.id, q.id)]) })).filter((i) => i.r),
        })
      }
    } else {
      const items = (etape.champs || []).map((c) => ({ id: c.id, q: c.label, r: affiche(c, ctx.valeurs[c.id]) })).filter((i) => i.r)
      if (items.length) sections.push({ titre: etape.titre, items })
    }
  }
  return {
    sections,
    meta: { postes: ctx.postesChoisis.map((p) => ({ id: p.id, nom: p.nom })), version: 2 },
  }
}
