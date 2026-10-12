import { Icone } from '../Icons'

const TYPES_CHAMP = [
  ['text', 'Texte court'], ['textarea', 'Texte long'], ['choice', 'Choix unique'], ['multi', 'Choix multiples'], ['url_list', 'Liste de liens'],
]

export const slug = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 24) || 'champ'

function deplacer(liste, i, d) {
  const j = i + d
  if (j < 0 || j >= liste.length) return liste
  const copie = [...liste]
  ;[copie[i], copie[j]] = [copie[j], copie[i]]
  return copie
}

// Éditeur d'une liste de champs / questions. `types` restreint les types proposés.
export default function EditeurChamps({ champs, onChange, types = TYPES_CHAMP.map((t) => t[0]), libelleAjout = 'Ajouter un champ', questions = false }) {
  const maj = (i, patch) => onChange(champs.map((c, k) => (k === i ? { ...c, ...patch } : c)))
  const ajouter = () => {
    const ids = new Set(champs.map((c) => c.id))
    let n = champs.length + 1
    while (ids.has(`${questions ? 'q' : 'champ'}${n}`)) n++
    onChange([...champs, { id: `${questions ? 'q' : 'champ'}${n}`, label: '', type: types[0] === 'text' && questions ? 'textarea' : (questions ? 'textarea' : 'text'), required: true, ...(questions ? { min: 30 } : {}) }])
  }

  return (
    <div className="editeur-champs">
      {champs.map((c, i) => (
        <div key={c.id + i} className="editeur-champ">
          <div className="editeur-champ-haut">
            <span className="mono discret" title="Identifiant technique">{c.id}</span>
            <div className="editeur-actions">
              <button type="button" className="bouton-icone" onClick={() => onChange(deplacer(champs, i, -1))} disabled={i === 0} aria-label="Monter"><Icone nom="haut" taille={16} /></button>
              <button type="button" className="bouton-icone" onClick={() => onChange(deplacer(champs, i, 1))} disabled={i === champs.length - 1} aria-label="Descendre"><Icone nom="bas" taille={16} /></button>
              <button type="button" className="bouton-icone" onClick={() => onChange(champs.filter((_, k) => k !== i))} aria-label="Supprimer"><Icone nom="poubelle" taille={16} /></button>
            </div>
          </div>
          <input type="text" value={c.label} placeholder="Intitulé de la question" onChange={(e) => maj(i, { label: e.target.value })} aria-label="Intitulé" />
          <div className="editeur-ligne">
            {types.length > 1 && (
              <select value={c.type} onChange={(e) => maj(i, { type: e.target.value })} aria-label="Type">
                {TYPES_CHAMP.filter((t) => types.includes(t[0])).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            )}
            {(c.type === 'text' || c.type === 'textarea') && (
              <input type="number" min="0" value={c.min || ''} placeholder="Min. caractères" onChange={(e) => maj(i, { min: e.target.value ? Number(e.target.value) : undefined })} aria-label="Minimum de caractères" />
            )}
            <label className="case"><input type="checkbox" checked={c.required !== false} onChange={(e) => maj(i, { required: e.target.checked })} /> Obligatoire</label>
          </div>
          <input type="text" value={c.hint || ''} placeholder="Aide affichée sous la question (facultatif)" onChange={(e) => maj(i, { hint: e.target.value })} aria-label="Aide" />
          {(c.type === 'choice' || c.type === 'multi') && (
            <textarea rows={3} value={(c.options || []).join('\n')} placeholder="Une option par ligne" aria-label="Options"
                      onChange={(e) => maj(i, { options: e.target.value.split('\n').map((o) => o.trim()).filter(Boolean) })} />
          )}
        </div>
      ))}
      <button type="button" className="bouton fantome petit" onClick={ajouter}><Icone nom="plus" taille={15} /> {libelleAjout}</button>
    </div>
  )
}
