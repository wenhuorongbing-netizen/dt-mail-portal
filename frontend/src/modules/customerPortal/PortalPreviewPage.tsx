import { CheckCircle2, ExternalLink, KeyRound, Mail } from 'lucide-react'
import { Card } from '../../core/ui/Card'
import { Tag } from '../../core/ui/Tag'
import { PageLayout } from '../../core/layout/PageLayout'

const steps = [
  'Open the assigned mailbox at webmail.buffjo.top.',
  'Find the TicketPlus+ login message and confirm the account email.',
  'Open the TicketPlus+ app or web login and follow the handover guide.',
  'Review cancellation deadline, account rules, and privacy notes.',
]

export function PortalPreviewPage() {
  return (
    <PageLayout
      subtitle="Mobile customer-facing entry point for mailbox access, TicketPlus+ login, and rules."
      title="Customer Portal"
    >
      <div className="portal-preview">
        <div className="phone-frame">
          <div className="phone-screen">
            <Tag tone="success">Ready for handover</Tag>
            <div>
              <h2>D-Ticket access</h2>
              <p className="muted">Your mailbox and TicketPlus+ guide are prepared.</p>
            </div>

            <Card>
              <div className="row-actions">
                <Mail size={18} />
                <strong>webmail.buffjo.top</strong>
              </div>
              <p className="muted">Login with the mailbox account provided by support.</p>
            </Card>

            <Card>
              <div className="row-actions">
                <KeyRound size={18} />
                <strong>TicketPlus+ login</strong>
              </div>
              <p className="muted">Use the mailbox to receive codes and account notices.</p>
            </Card>

            <ol className="step-list">
              {steps.map((step, index) => (
                <li key={step}>
                  <span className="step-index">{index + 1}</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>

        <div className="page-layout">
          <Card>
            <div className="row-actions">
              <CheckCircle2 size={18} />
              <strong>MVP page set</strong>
            </div>
            <p className="muted">
              Home, TicketPlus+ tutorial, rules, privacy note, and Roundcube login entry are
              the first customer-facing screens.
            </p>
          </Card>
          <Card>
            <div className="row-actions">
              <ExternalLink size={18} />
              <strong>Domain mapping</strong>
            </div>
            <p className="muted">
              Planned domains: tickets.buffjo.top for portal, webmail.buffjo.top for mailbox,
              ops.buffjo.top for internal tools.
            </p>
          </Card>
        </div>
      </div>
    </PageLayout>
  )
}
