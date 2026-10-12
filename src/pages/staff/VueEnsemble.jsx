import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useStaffData } from '../../lib/staffData'
import { Chargeur } from '../../components/Ui'
import { Icone } from '../../components/Icons'
import { Barres, Donut, Entonnoir, LegendeBarres } from '../../components/staff/Graphiques'
import { STATUTS, TYPES, ilYa, joursDepuis } from '../../lib/format'

const COULEURS_TYPE = { staff: '#e2b866', hr: '#6aa07a', oc3: '#5aa19c', oc4: '#cdbf8c' }

export default function VueEnsemble() {
  const { candidatures: c, chargement, postes } = useStaffData()

  const k = useMemo(() => {
    const maintenant = new Date()
    const debutMois = new Date(maintenant.getFullYear(), maintenant.getMonth(), 1)
    const decidees = c.filter((x) => x.decide_le)
    const acceptees = c.filter((x) => x.statut === 'acceptee').length
    const refusees = c.filter((x) => x.statut === 'refusee').length
    const delais = decidees.map((x) => (new Date(x.decide_le) - new Date(x.created_at)) / 86400000).sort((a, b) => a - b)
    const mois = Array.from({ length: 6 }, (_, i) => new Date(maintenant.getFullYear(), maintenant.getMonth() - 5 + i, 1))
    return {
      recues: c.filter((x) => x.statut === 'recue').length,
      examen: c.filter((x) => x.statut === 'examen').length,
      ceMois: c.filter((x) => new Date(x.created_at) >= debutMois).length,
      taux: acceptees + refusees ? Math.round((100 * acceptees) / (acceptees + refusees)) : null,
      mediane: delais.length ? delais[Math.floor(delais.length / 2)].toFixed(1) : null,
      retard48: c.filter((x) => x.statut === 'recue' && joursDepuis(x.created_at) >= 2),
      retard7: c.filter((x) => x.statut === 'examen' && joursDepuis(x.updated_at) >= 7),
      mois: mois.map((m) => ({
        label: m.toLocaleDateString('fr-FR', { month: 'short' }),
        valeur: c.filter((x) => { const d = new Date(x.created_at); return d.getFullYear() === m.getFullYear() && d.getMonth() === m.getMonth() }).length,
      })),
      types: Object.entries(TYPES).map(([t, i]) => ({ label: i.label, couleur: COULEURS_TYPE[t], valeur: c.filter((x) => x.type === t).length })),
      entonnoir: [
        { label: 'Reçues', valeur: c.filter((x) => x.statut === 'recue').length, couleur: 'var(--statut-recue)' },
        { label: 'En examen', valeur: c.filter((x) => x.statut === 'examen').length, couleur: 'var(--statut-examen)' },
        { label: 'Acceptées', valeur: acceptees, couleur: 'var(--statut-ok)' },
        { label: 'Refusées', valeur: refusees, couleur: 'var(--statut-ko)' },
      ],
      recent: [...c].sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at)).slice(0, 10),
    }
  }, [c])

  if (chargement && !c.length) return <Chargeur />
  const ouverts = postes.filter((p) => p.statut === 'ouvert').length

  return (
    <div>
      <header className="staff-entete"><div><p className="sous-titre">Dashboard</p><h1>Vue d'ensemble</h1></div>
        <Link to="/staff/candidatures" className="bouton">Traiter les candidatures <Icone nom="fleche" taille={16} /></Link></header>

      <div className="kpis">
        <Kpi valeur={k.recues} label="À traiter" alerte={k.recues > 0} lien="/staff/candidatures?statut=recue" />
        <Kpi valeur={k.examen} label="En examen" lien="/staff/candidatures?statut=examen" />
        <Kpi valeur={k.ceMois} label="Ce mois-ci" />
        <Kpi valeur={k.taux != null ? `${k.taux} %` : '—'} label="Taux d'acceptation" />
        <Kpi valeur={k.mediane != null ? `${k.mediane} j` : '—'} label="Délai médian" />
        <Kpi valeur={ouverts} label="Postes ouverts" lien="/staff/postes" />
      </div>

      {(k.retard48.length > 0 || k.retard7.length > 0) && (
        <section className="carte alertes">
          <h2><Icone nom="alerte" taille={20} /> À faire maintenant</h2>
          {k.retard48.map((x) => <LigneAlerte key={x.id} c={x} texte={`reçue depuis ${joursDepuis(x.created_at)} jours, pas encore ouverte`} />)}
          {k.retard7.map((x) => <LigneAlerte key={x.id} c={x} texte={`en examen depuis ${joursDepuis(x.updated_at)} jours`} />)}
        </section>
      )}

      <div className="staff-grille-3">
        <section className="carte"><h2 className="titre-carte">Par mois</h2><Barres donnees={k.mois} /><LegendeBarres donnees={k.mois} /></section>
        <section className="carte"><h2 className="titre-carte">Par type</h2><Donut parts={k.types} /></section>
        <section className="carte"><h2 className="titre-carte">Pipeline</h2><Entonnoir etapes={k.entonnoir} /></section>
      </div>

      <section className="carte" style={{ marginTop: 14 }}>
        <h2 className="titre-carte">Activité récente</h2>
        {k.recent.length === 0 && <p className="discret">Aucune candidature pour le moment.</p>}
        <ul className="activite">
          {k.recent.map((x) => (
            <li key={x.id}><Link to={`/staff/candidatures/${x.id}`}>
              <strong>{x.pseudo_discord}</strong><span className="badge">{TYPES[x.type]?.label}</span>
              <span className="badge pastille" data-statut={x.statut}>{STATUTS[x.statut]?.label}</span>
              <span className="discret mono grow-droite">{ilYa(x.updated_at)}</span>
            </Link></li>
          ))}
        </ul>
      </section>
    </div>
  )
}

function Kpi({ valeur, label, alerte, lien }) {
  const contenu = <><span className="kpi-valeur">{valeur}</span><span className="kpi-label">{label}</span></>
  return lien ? <Link to={lien} className={`kpi cliquable${alerte ? ' kpi-alerte' : ''}`}>{contenu}</Link> : <div className="kpi">{contenu}</div>
}

function LigneAlerte({ c, texte }) {
  return (
    <Link to={`/staff/candidatures/${c.id}`} className="ligne-alerte">
      <strong>{c.pseudo_discord}</strong><span className="badge">{TYPES[c.type]?.label}</span><span className="discret">{texte}</span><Icone nom="fleche" taille={15} />
    </Link>
  )
}
