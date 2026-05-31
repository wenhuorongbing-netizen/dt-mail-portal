import { Database, GitBranch, RefreshCw } from 'lucide-react'
import { Button } from '../ui/Button'
import { Tag } from '../ui/Tag'

type TopbarProps = {
  loading: boolean
  source: 'api' | 'fallback'
}

export function Topbar({ loading, source }: TopbarProps) {
  return (
    <header className="topbar">
      <div>
        <h1>Mailbox handover operations</h1>
        <p>Customer portal, internal orders, and deployment workflow.</p>
      </div>
      <div className="topbar-actions">
        <Tag tone={source === 'api' ? 'success' : 'warning'}>
          {loading ? 'Loading registry' : source === 'api' ? 'Backend registry' : 'Local registry'}
        </Tag>
        <Button icon={Database} variant="secondary">
          Modules
        </Button>
        <Button icon={GitBranch} variant="ghost">
          GitHub
        </Button>
        <Button icon={RefreshCw} variant="ghost">
          Sync
        </Button>
      </div>
    </header>
  )
}
