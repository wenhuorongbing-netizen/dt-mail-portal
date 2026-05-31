import { MailPlus, Plus } from 'lucide-react'
import { PageLayout } from '../../core/layout/PageLayout'
import { ListLayout } from '../../core/layout/layouts/ListLayout'
import { Button } from '../../core/ui/Button'
import { Card } from '../../core/ui/Card'
import { Tag } from '../../core/ui/Tag'

const orders = [
  ['DT-1001', 'Sample customer', 'pending mailbox', <Tag tone="warning">Draft</Tag>],
  ['DT-1002', 'Mobile handover', 'ticket_ready', <Tag tone="success">Ready</Tag>],
]

export function OrdersPage() {
  return (
    <PageLayout
      actions={
        <>
          <Button icon={MailPlus} variant="secondary">
            Generate mailbox
          </Button>
          <Button icon={Plus}>New order</Button>
        </>
      }
      subtitle="Internal workflow for mailbox creation, account delivery, and status tracking."
      title="Orders"
    >
      <div className="layout-grid">
        <Card>
          <span className="muted">Open orders</span>
          <span className="stat-value">2</span>
        </Card>
        <Card>
          <span className="muted">Mailboxes ready</span>
          <span className="stat-value">1</span>
        </Card>
        <Card>
          <span className="muted">Delivery blockers</span>
          <span className="stat-value">0</span>
        </Card>
      </div>

      <ListLayout columns={['Order', 'Customer', 'Mailbox', 'Status']} rows={orders} />
    </PageLayout>
  )
}
