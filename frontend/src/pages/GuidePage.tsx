import { Link } from 'react-router-dom';
import { ArrowLeft, BookOpen, ExternalLink } from 'lucide-react';

export default function GuidePage() {
  return (
    <div style={{ maxWidth: '540px', margin: '0 auto', padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: '16px', minHeight: '100vh' }}>
      <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: 'rgba(16,25,47,0.6)', textDecoration: 'none' }}>
        <ArrowLeft size={14} /> Back to portal
      </Link>

      <header>
        <p className="eyebrow">Step-by-Step Guide</p>
        <h1 style={{ fontSize: '1.4rem', margin: '0 0 4px', fontFamily: 'var(--font-display)' }}>TicketPlus+ Login Guide</h1>
        <p style={{ margin: 0, fontSize: '0.82rem', color: 'rgba(16,25,47,0.6)' }}>
          Follow these steps to activate your Deutschlandticket on your phone.
        </p>
      </header>

      <div style={{ background: 'var(--card)', border: '1px solid rgba(16,25,47,0.08)', borderRadius: '18px', padding: '18px', boxShadow: 'var(--shadow)', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <BookOpen size={16} style={{ color: 'var(--accent)' }} />
          <h3 style={{ margin: 0 }}>Activation Steps</h3>
        </div>

        <ol style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.85rem', lineHeight: '1.6' }}>
          <li>
            <strong>Download TicketPlus+:</strong> Search for &quot;TicketPlus+&quot; in the App Store (iOS) or Google Play (Android) and install the official app.
          </li>
          <li>
            <strong>Open the app and select Email Login:</strong> Choose the email login option (not phone number). Enter the full email address from your handover record.
          </li>
          <li>
            <strong>Request OTP code:</strong> Tap &quot;Send verification code&quot;. The code will be sent to your dedicated mailbox.
          </li>
          <li>
            <strong>Check your mailbox:</strong> Open the webmail link provided in your handover record. Log in with your username (email prefix only, without the domain) and password.
          </li>
          <li>
            <strong>Find the OTP:</strong> Look for an email from TicketPlus+ in your inbox. The code is usually 6 digits. If you don&apos;t see it, check the spam/junk folder.
          </li>
          <li>
            <strong>Enter the code:</strong> Go back to the TicketPlus+ app and enter the OTP code to complete login.
          </li>
          <li>
            <strong>View your ticket:</strong> Once logged in, your Deutschlandticket QR code will appear in the app. Show this to ticket inspectors when asked.
          </li>
        </ol>
      </div>

      <div style={{ background: 'var(--card)', border: '1px solid rgba(16,25,47,0.08)', borderRadius: '18px', padding: '18px', boxShadow: 'var(--shadow)', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.82rem', lineHeight: '1.5' }}>
        <h3 style={{ margin: 0, fontSize: '0.95rem' }}>Important Notes</h3>
        <ul style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <li>Your ticket is <strong>personal and non-transferable</strong>. The QR code shows your name.</li>
          <li>Carry your passport or ID when traveling. Inspectors may check your identity.</li>
          <li>The ticket is valid for the entire calendar month it was purchased for.</li>
          <li>Keep your mailbox credentials safe. You need them to re-login if logged out.</li>
        </ul>
      </div>

      <div style={{ background: 'rgba(31,155,209,0.06)', border: '1px solid rgba(31,155,209,0.12)', borderRadius: '16px', padding: '14px', fontSize: '0.78rem', lineHeight: '1.5', display: 'flex', gap: '8px' }}>
        <ExternalLink size={16} style={{ flexShrink: 0, color: 'var(--accent-2)', marginTop: '2px' }} />
        <div>
          <strong>Webmail access:</strong> Visit <a href="https://webmail.buffjo.top" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-2)', textDecoration: 'underline' }}>webmail.buffjo.top</a> to check your mailbox for OTP codes.
        </div>
      </div>

      <footer style={{ textAlign: 'center', fontSize: '0.72rem', color: 'rgba(16,25,47,0.42)', marginTop: 'auto', paddingTop: '12px' }}>
        <span>D-Ticket Mail Portal &middot; Independent assistance service</span>
      </footer>
    </div>
  );
}
