import { Link } from 'react-router-dom';
import { ArrowLeft, HelpCircle, ShieldCheck } from 'lucide-react';

export default function RulesPage() {
  return (
    <div style={{ maxWidth: '540px', margin: '0 auto', padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: '16px', minHeight: '100vh' }}>
      <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: 'rgba(16,25,47,0.6)', textDecoration: 'none' }}>
        <ArrowLeft size={14} /> Back to portal
      </Link>

      <header>
        <p className="eyebrow">Policies</p>
        <h1 style={{ fontSize: '1.4rem', margin: '0 0 4px', fontFamily: 'var(--font-display)' }}>Rules & Billing</h1>
        <p style={{ margin: 0, fontSize: '0.82rem', color: 'rgba(16,25,47,0.6)' }}>
          Important rules about your Deutschlandticket subscription.
        </p>
      </header>

      <div style={{ background: 'var(--card)', border: '1px solid rgba(16,25,47,0.08)', borderRadius: '18px', padding: '18px', boxShadow: 'var(--shadow)', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <HelpCircle size={16} style={{ color: 'var(--warn)' }} />
          <h3 style={{ margin: 0 }}>10th-Day Cancellation Rule</h3>
        </div>

        <div style={{ fontSize: '0.82rem', lineHeight: '1.6' }}>
          <p style={{ margin: '0 0 10px' }}>
            The Deutschlandticket is a monthly auto-renewing subscription. Cancellation deadlines are strict:
          </p>
          <div style={{ background: 'rgba(183,121,31,0.06)', padding: '12px', borderRadius: '12px', border: '1px solid rgba(183,121,31,0.1)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div>
              <strong style={{ color: '#b7791f' }}>Before the 10th (including the 10th):</strong>
              <p style={{ margin: '4px 0 0' }}>If you do not need the ticket for next month, contact us before the 10th to cancel. You will only be charged for the current month.</p>
            </div>
            <div>
              <strong style={{ color: '#b7791f' }}>After the 10th:</strong>
              <p style={{ margin: '4px 0 0' }}>The system automatically locks in next month&apos;s ticket. Orders placed after the 10th typically require payment for both the current and next month. This charge cannot be reversed.</p>
            </div>
          </div>
        </div>
      </div>

      <div style={{ background: 'var(--card)', border: '1px solid rgba(16,25,47,0.08)', borderRadius: '18px', padding: '18px', boxShadow: 'var(--shadow)', display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.82rem', lineHeight: '1.6' }}>
        <h3 style={{ margin: 0, fontSize: '0.95rem' }}>Personal Ticket Rules</h3>
        <ul style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <li>The Deutschlandticket is <strong>personal and non-transferable</strong>.</li>
          <li>Your passport-name initials appear on the QR code.</li>
          <li>Ticket inspectors may ask for your passport or photo ID to verify your identity.</li>
          <li>Sharing your ticket with others is a violation of the terms of use.</li>
        </ul>
      </div>

      <div style={{ background: 'var(--card)', border: '1px solid rgba(16,25,47,0.08)', borderRadius: '18px', padding: '18px', boxShadow: 'var(--shadow)', display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.82rem', lineHeight: '1.6' }}>
        <h3 style={{ margin: 0, fontSize: '0.95rem' }}>Refund Policy</h3>
        <p style={{ margin: 0 }}>
          Once a ticket has been issued and the QR code generated, the purchase is final. No refunds can be provided for issued tickets, as per the transport company&apos;s ticketing policy.
        </p>
      </div>

      <div style={{ background: 'rgba(31,155,209,0.06)', border: '1px solid rgba(31,155,209,0.12)', borderRadius: '16px', padding: '14px', fontSize: '0.78rem', lineHeight: '1.5', display: 'flex', gap: '8px' }}>
        <ShieldCheck size={16} style={{ flexShrink: 0, color: 'var(--accent-2)', marginTop: '2px' }} />
        <div>
          <strong>Independent service:</strong> This service is not affiliated with Deutsche Bahn, TicketPlus+, or any official transport provider. We provide mailbox hosting and purchase assistance only.
        </div>
      </div>

      <footer style={{ textAlign: 'center', fontSize: '0.72rem', color: 'rgba(16,25,47,0.42)', marginTop: 'auto', paddingTop: '12px' }}>
        <span>D-Ticket Mail Portal &middot; Independent assistance service</span>
      </footer>
    </div>
  );
}
