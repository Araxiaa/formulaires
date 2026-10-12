import { useAsync } from '../lib/hooks'
import { lireParametres } from '../lib/api'

export default function SiteFooter() {
  const { data: params } = useAsync(lireParametres, [])
  const invite = params?.discord_invite
  return (
    <footer className="site-footer">
      <p style={{ margin: 0 }}>Site réalisé par .araxia. · Fondateurs : .araxia. &amp; lavnd.13</p>
      {invite && <p style={{ margin: '6px 0 0' }}><a href={invite} target="_blank" rel="noopener noreferrer">Rejoindre le Discord</a></p>}
    </footer>
  )
}
