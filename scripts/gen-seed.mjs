import { writeFileSync } from 'node:fs'
import * as d from './seed-data.mjs'

const j = (v) => `$j$${JSON.stringify(v)}$j$::jsonb`
const s = (v) => (v == null ? 'null' : `$s$${v}$s$`)
const arr = (a) => `array[${a.map(s).join(',')}]::text[]`
const out = ['-- GÉNÉRÉ par scripts/gen-seed.mjs — ne pas éditer à la main.', 'begin;']

for (const g of d.groupes)
  out.push(`insert into recrutement.groupes (id,categorie,nom,description,description_longue,couleur,icone,ordre) values (${s(g.id)},${s(g.categorie)},${s(g.nom)},${s(g.description)},${s(g.description_longue)},${s(g.couleur)},${s(g.icone)},${g.ordre}) on conflict (id) do nothing;`)

let ordre = 0
for (const p of d.postesStaff)
  out.push(`insert into recrutement.postes (categorie,groupe,nom,description,missions,anciennete,disponibilite,note_candidat,statut,places_total,places_dispo,questions,options,ouvert_le,ordre) values ('staff',${s(p.groupe)},${s(p.nom)},${s(p.description)},${arr(p.missions)},${s(p.anciennete)},${s(p.disponibilite)},${s(p.note_candidat)},'ouvert',${p.places},${p.places},${j(p.questions)},${j(p.options || [])},now(),${++ordre});`)
ordre = 0
for (const p of d.postesHr)
  out.push(`insert into recrutement.postes (categorie,groupe,nom,type_rang,titulaire,note,statut,places_total,places_dispo,questions,ouvert_le,ordre) values ('hr',${s(p.groupe)},${s(p.nom)},${s(p.type_rang)},${s(p.titulaire)},${s(p.note)},${s(p.statut)},1,${p.statut === 'ouvert' ? 1 : 0},${j(p.questions)},${p.statut === 'ouvert' ? 'now()' : 'null'},${++ordre});`)

for (const f of d.formulaires)
  out.push(`insert into recrutement.formulaires (type,titre,description,ouvert,etapes) values (${s(f.type)},${s(f.titre)},${s(f.description)},${f.ouvert},${j(f.etapes)}) on conflict (type) do nothing;`)

d.faq.forEach(([section, question, reponse], i) =>
  out.push(`insert into recrutement.faq (section,question,reponse,ordre) values (${s(section)},${s(question)},${s(reponse)},${i});`))
d.modeles.forEach(([kind, titre, contenu], i) =>
  out.push(`insert into recrutement.modeles (kind,titre,contenu,ordre) values (${s(kind)},${s(titre)},${s(contenu)},${i});`))
for (const [k, v] of Object.entries(d.parametres))
  out.push(`insert into recrutement.parametres (cle,valeur) values (${s(k)},${j(v)}) on conflict (cle) do nothing;`)

out.push('commit;')
writeFileSync(new URL('../supabase/migrations/002_seed.sql', import.meta.url), out.join('\n') + '\n')
console.log('002_seed.sql généré :', out.length, 'lignes')

// Migration « delta » pour une base déjà initialisée avec l'ancienne liste de rôles
const delta = ['-- GÉNÉRÉ — Refonte des équipes staff : Staff Guide / Staff Narration + options, fin du pôle Bâtisseur.',
  "alter table recrutement.postes add column if not exists options jsonb not null default '[]';",
  "delete from recrutement.postes where categorie = 'staff';",
  "delete from recrutement.groupes where id = 'batisseur';"]
d.postesStaff.forEach((p, i) =>
  delta.push(`insert into recrutement.postes (categorie,groupe,nom,description,missions,anciennete,disponibilite,note_candidat,statut,places_total,places_dispo,questions,options,ordre) values ('staff',${s(p.groupe)},${s(p.nom)},${s(p.description)},${arr(p.missions)},${s(p.anciennete)},${s(p.disponibilite)},${s(p.note_candidat)},'ouvert',${p.places},${p.places},${j(p.questions)},${j(p.options || [])},${i + 1});`))
delta.push(`update recrutement.formulaires set etapes = jsonb_set(etapes, '{1,description}', to_jsonb(${s('Choisis ton équipe, puis les options qui t’intéressent.')}::text)) where type = 'staff';`)
delta.push(`insert into recrutement.faq (section,question,reponse,ordre) values (${s('Candidatures Staff')},${s('Que sont les options ?')},${s(d.faq.find((f) => f[1] === 'Que sont les options ?')[2])},6);`)
writeFileSync(new URL('../supabase/migrations/004_equipes_staff.sql', import.meta.url), delta.join('\n') + '\n')
