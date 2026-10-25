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

// Une option facultative d'un poste est identifiée par « idPoste:idOption »
export const cleOption = (posteId, optionId) => `${posteId}:${optionId}`

// Questions d'un poste choisi + celles de ses options cochées
export function questionsPoste(p, options = []) {
  const base = (p.questions || []).map((q) => ({ ...q, cle: cleQuestion(p.id, q.id), poste: p }))
  const extra = (p.options || []).filter((o) => options.includes(cleOption(p.id, o.id))).flatMap((o) =>
    (o.questions || []).map((q) => ({ ...q, cle: cleQuestion(p.id, `${o.id}.${q.id}`), poste: p, option: o })))
  return [...base, ...extra]
}

// Champs « à plat » d'une étape, avec leur clé de stockage
export function champsEtape(etape, ctx) {
  if (etape.kind === 'questions_poste') {
    return ctx.postesChoisis.flatMap((p) => questionsPoste(p, ctx.options))
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
      const items = [{ id: 'postes', q: etape.max === 1 ? 'Poste visé' : 'Poste(s) visé(s)', r: ctx.postesChoisis.map((p) => p.nom).join(' + ') }]
      const opts = optionsChoisies(ctx)
      if (opts.length) items.push({ id: 'options', q: 'Options choisies', r: opts.map((o) => o.nom).join(', ') })
      sections.push({ titre: etape.titre, items })
    } else if (etape.kind === 'questions_poste') {
      for (const p of ctx.postesChoisis) {
        const groupes = [{ titre: `${etape.titre} — ${p.nom}`, qs: questionsPoste(p, []) }]
        for (const o of (p.options || []).filter((x) => (ctx.options || []).includes(cleOption(p.id, x.id)))) {
          groupes.push({ titre: `${etape.titre} — ${p.nom} · option ${o.nom}`, qs: questionsPoste({ ...p, questions: [], options: [o] }, [cleOption(p.id, o.id)]) })
        }
        for (const g of groupes) {
          const items = g.qs.map((q) => ({ id: q.cle, q: q.label, r: affiche(q, ctx.valeurs[q.cle]) })).filter((i) => i.r)
          if (items.length) sections.push({ titre: g.titre, items })
        }
      }
    } else {
      const items = (etape.champs || []).map((c) => ({ id: c.id, q: c.label, r: affiche(c, ctx.valeurs[c.id]) })).filter((i) => i.r)
      if (items.length) sections.push({ titre: etape.titre, items })
    }
  }
  return {
    sections,
    meta: {
      postes: ctx.postesChoisis.map((p) => ({ id: p.id, nom: p.nom })),
      options: optionsChoisies(ctx).map((o) => o.nom),
      version: 2,
    },
  }
}

// Objets « option » cochés, dans l'ordre des postes choisis
export function optionsChoisies(ctx) {
  return ctx.postesChoisis.flatMap((p) => (p.options || []).filter((o) => (ctx.options || []).includes(cleOption(p.id, o.id))))
}
