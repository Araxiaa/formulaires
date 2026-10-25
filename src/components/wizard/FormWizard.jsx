import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Icone } from '../Icons'
import { Bouton } from '../Ui'
import Champ from './Champ'
import ChoixPoste from './ChoixPoste'
import Succes from './Succes'
import { champsEtape, cleOption, construireReponses, erreursEtape, optionsChoisies, questionsPoste } from './validation'
import { soumettre } from '../../lib/api'
import { messageErreur } from '../../lib/supabase'
import { useAuth } from '../../lib/auth'
import { useToast } from '../../lib/toast'
import { ilYa } from '../../lib/format'

const ETAPE_RECAP = { id: 'recap', kind: 'recap', titre: 'Vérification', description: 'Relis ta candidature avant de la sceller.' }

export default function FormWizard({ formulaire, postes, groupes, params, posteInitial }) {
  const type = formulaire.type
  const { session, pseudo: pseudoDiscord, discordId, connexionDiscord } = useAuth()
  const notifier = useToast()
  const cle = `lpdt_brouillon_${type}`
  const etapes = useMemo(() => [...formulaire.etapes, ETAPE_RECAP], [formulaire])

  const [valeurs, setValeurs] = useState({})
  const [choisis, setChoisis] = useState(() => (posteInitial ? [posteInitial] : []))
  const [options, setOptions] = useState([])
  const [index, setIndex] = useState(0)
  const [atteint, setAtteint] = useState(0)
  const [erreurs, setErreurs] = useState({})
  const [brouillon, setBrouillon] = useState(null)
  const [sauveLe, setSauveLe] = useState(null)
  const [confirme, setConfirme] = useState(false)
  const [envoi, setEnvoi] = useState(false)
  const [code, setCode] = useState(null)
  const [, rafraichir] = useState(0)
  const premier = useRef(true)
  const haut = useRef(null)

  const etape = etapes[index]
  const ctx = useMemo(() => ({ valeurs, postesChoisis: choisis, options }), [valeurs, choisis, options])

  /* ───── Brouillon ───── */
  useEffect(() => {
    try {
      const b = JSON.parse(localStorage.getItem(cle) || 'null')
      if (b && (Object.keys(b.valeurs || {}).length || b.choisis?.length)) setBrouillon(b)
    } catch { /* stockage indisponible */ }
  }, [cle])

  useEffect(() => {
    if (premier.current) { premier.current = false; return }
    const t = setTimeout(() => {
      try {
        localStorage.setItem(cle, JSON.stringify({ valeurs, choisis: choisis.map((p) => p.id), options, index, atteint, t: Date.now() }))
        setSauveLe(Date.now())
      } catch { /* ignore */ }
    }, 800)
    return () => clearTimeout(t)
  }, [valeurs, choisis, options, index, atteint, cle])

  // Le « il y a X » se met à jour sans interaction
  useEffect(() => { const t = setInterval(() => rafraichir((n) => n + 1), 20000); return () => clearInterval(t) }, [])

  function restaurer() {
    const ids = brouillon.choisis || []
    setValeurs(brouillon.valeurs || {})
    setOptions(brouillon.options || [])
    setChoisis(ids.map((id) => postes.find((p) => p.id === id)).filter(Boolean))
    setIndex(Math.min(brouillon.index || 0, etapes.length - 1))
    setAtteint(brouillon.atteint || brouillon.index || 0)
    setBrouillon(null)
    notifier('Brouillon restauré.', 'succes')
  }
  function ignorer() {
    try { localStorage.removeItem(cle) } catch { /* ignore */ }
    setBrouillon(null)
  }

  // Pré-remplissage du pseudo avec le compte Discord
  useEffect(() => {
    if (pseudoDiscord && !valeurs.pseudo) setValeurs((v) => ({ ...v, pseudo: pseudoDiscord }))
  }, [pseudoDiscord]) // eslint-disable-line react-hooks/exhaustive-deps

  /* ───── Navigation ───── */
  const aller = useCallback((i) => {
    setIndex(i)
    setAtteint((a) => Math.max(a, i))
    setErreurs({})
    requestAnimationFrame(() => haut.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }, [])

  function signaler(errs) {
    setErreurs(errs)
    requestAnimationFrame(() => document.querySelector('.champ.invalide, [data-champ="__poste"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' }))
    notifier('Certains champs sont à compléter.', 'erreur')
  }

  function suivant() {
    if (etape.kind === 'recap') return
    const errs = erreursEtape(etape, ctx)
    if (Object.keys(errs).length) return signaler(errs)
    aller(index + 1)
  }

  function basculerPoste(p) {
    const max = etape.max || 1
    setErreurs({})
    setChoisis((c) => {
      if (c.some((x) => x.id === p.id)) {
        setOptions((o) => o.filter((k) => !k.startsWith(`${p.id}:`)))
        return c.filter((x) => x.id !== p.id)
      }
      return max === 1 ? [p] : c.length >= max ? c : [...c, p]
    })
  }

  function basculerOption(p, o) {
    const k = cleOption(p.id, o.id)
    setOptions((l) => (l.includes(k) ? l.filter((x) => x !== k) : [...l, k]))
  }

  /* ───── Envoi ───── */
  async function envoyer() {
    for (let i = 0; i < etapes.length - 1; i++) {
      const errs = erreursEtape(etapes[i], ctx)
      if (Object.keys(errs).length) { aller(i); setTimeout(() => signaler(errs), 50); return }
    }
    if (!confirme) return notifier('Coche la confirmation pour envoyer.', 'erreur')
    setEnvoi(true)
    try {
      const reponses = construireReponses(formulaire.etapes, ctx)
      const principal = choisis[0]
      const groupe = principal && groupes.find((g) => g.id === principal.groupe)
      const opts = optionsChoisies(ctx).map((o) => o.nom)
      const resume = type === 'staff' ? choisis.map((p) => p.nom).join(' + ') + (opts.length ? ` (+ ${opts.join(', ')})` : '')
        : type === 'hr' ? `${principal?.nom} — ${groupe?.nom || ''}`
        : [formulaire.titre, valeurs.nom_oc].filter(Boolean).join(' · ')
      const c = await soumettre({
        type, posteId: principal?.id, secondaires: choisis.slice(1).map((p) => p.id),
        pseudo: valeurs.pseudo, discordId, reponses, resume,
      })
      try { localStorage.removeItem(cle) } catch { /* ignore */ }
      setCode(c)
    } catch (err) {
      notifier(messageErreur(err), 'erreur')
    } finally { setEnvoi(false) }
  }

  if (code) return <Succes code={code} delai={params?.delai_reponse} connecte={!!session} />

  const pct = Math.round((index / (etapes.length - 1)) * 100)
  const principal = choisis[0]
  const groupePrincipal = principal && groupes.find((g) => g.id === principal.groupe)
  const afficherAside = principal && index >= 1 && etape.kind !== 'recap'

  return (
    <div className="wizard" ref={haut}>
      {brouillon && (
        <div className="banniere-brouillon">
          <Icone nom="parchemin" taille={20} />
          <span>Brouillon trouvé · enregistré {ilYa(brouillon.t)}</span>
          <button className="bouton petit" onClick={restaurer}>Restaurer</button>
          <button className="bouton petit fantome" onClick={ignorer}>Recommencer</button>
        </div>
      )}

      <div className="wizard-mobile">
        <div className="wizard-mobile-titre"><span>Étape {index + 1} sur {etapes.length}</span><strong>{etape.titre}</strong></div>
        <div className="barre"><div className="barre-remplie" style={{ width: `${pct}%` }} /></div>
      </div>

      <div className="wizard-corps">
        <ol className="rail" aria-label="Étapes">
          {etapes.map((e, i) => {
            const fait = i < index || (i <= atteint && i !== index)
            return (
              <li key={e.id} className={i === index ? 'courante' : fait ? 'faite' : ''}>
                <button type="button" disabled={i > atteint} onClick={() => aller(i)} aria-current={i === index ? 'step' : undefined}>
                  <span className="rail-num">{fait && i !== index ? <Icone nom="check" taille={14} /> : i + 1}</span>
                  <span className="rail-titre">{e.titre}</span>
                </button>
              </li>
            )
          })}
          <li className="rail-sauvegarde">
            {sauveLe ? <><Icone nom="sauvegarde" taille={14} /> Brouillon enregistré {ilYa(sauveLe)}</> : <>Sauvegarde automatique</>}
          </li>
        </ol>

        <div className="wizard-centre">
          <form className="carte wizard-carte" key={etape.id} onSubmit={(e) => { e.preventDefault(); if (etape.kind === 'recap') envoyer(); else suivant() }} noValidate>
            <header className="wizard-entete">
              <p className="sous-titre">{formulaire.titre}</p>
              <h2>{etape.titre}</h2>
              {etape.description && <p className="discret">{etape.description}</p>}
            </header>

            {index === 0 && (
              <div className="carte-discord">
                {session ? (
                  <><Icone nom="discord" taille={22} /><span>Connecté·e en tant que <strong>{pseudoDiscord}</strong>. Ta candidature sera liée à ton compte : tu la retrouveras sans code dans « Mon suivi ».</span></>
                ) : (
                  <><Icone nom="discord" taille={22} /><span>Connecte-toi avec Discord pour lier ta candidature à ton compte et être mentionné·e à la décision <span className="discret">(facultatif)</span>.</span>
                    <button type="button" className="bouton petit" onClick={() => { try { localStorage.setItem(cle, JSON.stringify({ valeurs, choisis: choisis.map((p) => p.id), options, index, atteint, t: Date.now() })) } catch { /* ignore */ } connexionDiscord() }}>Se connecter</button></>
                )}
              </div>
            )}

            {etape.kind === 'poste' && (
              <ChoixPoste postes={postes} groupes={groupes} choisis={choisis} max={etape.max || 1} onToggle={basculerPoste} erreur={erreurs.__poste}
                          options={options} onToggleOption={basculerOption} />
            )}

            {etape.kind === 'questions_poste' && choisis.map((p) => {
              const qs = questionsPoste(p, options)
              const blocs = [{ titre: choisis.length > 1 ? p.nom : null, items: qs.filter((q) => !q.option) },
                ...(p.options || []).filter((o) => options.includes(cleOption(p.id, o.id))).map((o) => ({ titre: `Option : ${o.nom}`, items: qs.filter((q) => q.option?.id === o.id) }))]
              return (
                <section key={p.id} className="bloc-questions">
                  {blocs.map((b, bi) => (
                    <div key={bi}>
                      {b.titre && <h3 className="titre-section">{b.titre}</h3>}
                      {b.items.map((q, i) => (
                        <Champ key={q.cle} champ={q} indice={i + 1} valeur={valeurs[q.cle]} erreur={erreurs[q.cle]}
                               onChange={(v) => { setValeurs((st) => ({ ...st, [q.cle]: v })); if (erreurs[q.cle]) setErreurs((e) => ({ ...e, [q.cle]: '' })) }} />
                      ))}
                    </div>
                  ))}
                </section>
              )
            })}

            {!etape.kind && champsEtape(etape, ctx).map((c) => (
              <Champ key={c.cle} champ={c} valeur={valeurs[c.cle]} erreur={erreurs[c.cle]}
                     onChange={(v) => { setValeurs((s) => ({ ...s, [c.cle]: v })); if (erreurs[c.cle]) setErreurs((e) => ({ ...e, [c.cle]: '' })) }} />
            ))}

            {etape.kind === 'recap' && (
              <Recap etapes={formulaire.etapes} ctx={ctx} onModifier={aller} confirme={confirme} setConfirme={setConfirme} />
            )}

            <footer className="wizard-pied">
              {index > 0 ? <button type="button" className="bouton fantome" onClick={() => aller(index - 1)}><Icone nom="retour" taille={16} /> Retour</button> : <Link to="/candidater" className="bouton fantome"><Icone nom="retour" taille={16} /> Autre parcours</Link>}
              {etape.kind === 'recap'
                ? <Bouton className="bouton grand" chargement={envoi} disabled={!confirme}><Icone nom="sceau" taille={18} /> Sceller et envoyer</Bouton>
                : <button className="bouton">Continuer <Icone nom="fleche" taille={16} /></button>}
            </footer>
          </form>
        </div>

        {afficherAside && (
          <aside className="wizard-aside carte" style={{ '--couleur-camp': groupePrincipal?.couleur }}>
            <p className="sous-titre">{type === 'hr' ? 'Rang visé' : 'Rôle visé'}</p>
            <h3>{principal.nom}</h3>
            {groupePrincipal && <p className="discret" style={{ fontSize: '0.85rem' }}>{groupePrincipal.nom}</p>}
            {principal.missions?.length > 0 && <ul className="liste-missions petit">{principal.missions.map((m) => <li key={m}><Icone nom="check" taille={14} />{m}</li>)}</ul>}
            {(principal.anciennete || principal.disponibilite) && (
              <p className="discret" style={{ fontSize: '0.8rem', margin: 0 }}>{[principal.anciennete, principal.disponibilite].filter(Boolean).join(' · ')}</p>
            )}
            {principal.note_candidat && <div className="note-importante petit"><Icone nom="alerte" taille={15} />{principal.note_candidat}</div>}
          </aside>
        )}
      </div>
    </div>
  )
}

function Recap({ etapes, ctx, onModifier, confirme, setConfirme }) {
  return (
    <div className="recap">
      {etapes.map((e, i) => {
        const sections = construireReponses([e], ctx).sections
        if (!sections.length) return null
        return (
          <section key={e.id} className="recap-bloc">
            <div className="recap-entete"><h3>{e.titre}</h3><button type="button" className="bouton petit fantome" onClick={() => onModifier(i)}><Icone nom="crayon" taille={14} /> Modifier</button></div>
            {sections.map((s) => (
              <dl key={s.titre} className="qa">
                {sections.length > 1 && <p className="mono discret" style={{ fontSize: '0.72rem', margin: '8px 0 0' }}>{s.titre}</p>}
                {s.items.map((it) => <div key={it.id}><dt>{it.q}</dt><dd>{it.r}</dd></div>)}
              </dl>
            ))}
          </section>
        )
      })}
      <label className="confirmation">
        <input type="checkbox" checked={confirme} onChange={(e) => setConfirme(e.target.checked)} />
        <span>Je confirme que mes réponses sont sincères et que je pourrai les retrouver sur ma page de suivi.</span>
      </label>
    </div>
  )
}
