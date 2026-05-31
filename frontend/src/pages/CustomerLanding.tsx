import { Link } from 'react-router-dom';
import { Mail, ShieldCheck, BookOpen, HelpCircle, ArrowRight } from 'lucide-react';

export default function CustomerLanding() {
  return (
    <div style={{ maxWidth: '540px', margin: '0 auto', padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: '24px', minHeight: '100vh' }}>
      <header style={{ textAlign: 'center', paddingTop: '32px' }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: 'linear-gradient(135deg, var(--accent), #ffd18d)', display: 'grid', placeItems: 'center', margin: '0 auto 16px', fontWeight: 800, fontSize: '1.4rem', color: 'var(--ink)' }}>
          DT
        </div>
        <h1 style={{ fontSize: '1.6rem', margin: '0 0 8px', fontFamily: 'var(--font-display)' }}>D-Ticket Mail Portal</h1>
        <p style={{ margin: 0, color: 'rgba(16,25,47,0.62)', fontSize: '0.85rem', lineHeight: '1.5' }}>
          Dedicated mailbox and ticket handover for Deutschlandticket purchase assistance.
        </p>
      </header>

      <div style={{ background: 'rgba(31,155,209,0.06)', border: '1px solid rgba(31,155,209,0.12)', borderRadius: '16px', padding: '16px', fontSize: '0.82rem', lineHeight: '1.5', display: 'flex', gap: '10px' }}>
        <ShieldCheck size={18} style={{ flexShrink: 0, color: 'var(--accent-2)', marginTop: '2px' }} />
        <div>
          <strong>Independent service notice:</strong> This project is not an official TicketPlus+, Deutsche Bahn, BVG, or Deutschlandticket service. It is a mailbox/account handover and operational workflow system for purchase assistance.
        </div>
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <Link to="/guide" style={{ textDecoration: 'none' }}>
          <div style={{ background: 'var(--card)', border: '1px solid rgba(16,25,47,0.08)', borderRadius: '18px', padding: '18px', display: 'flex', alignItems: 'center', gap: '14px', boxShadow: 'var(--shadow)', cursor: 'pointer', transition: 'transform 0.15s' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(244,166,42,0.12)', display: 'grid', placeItems: 'center' }}>
              <BookOpen size={20} style={{ color: 'var(--accent)' }} />
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: '0 0 4px', fontSize: '0.95rem' }}>TicketPlus+ Login Guide</h3>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'rgba(16,25,47,0.6)' }}>Step-by-step instructions for activating your ticket.</p>
            </div>
            <ArrowRight size={18} style={{ color: 'rgba(16,25,47,0.3)' }} />
          </div>
        </Link>

        <Link to="/rules" style={{ textDecoration: 'none' }}>
          <div style={{ background: 'var(--card)', border: '1px solid rgba(16,25,47,0.08)', borderRadius: '18px', padding: '18px', display: 'flex', alignItems: 'center', gap: '14px', boxShadow: 'var(--shadow)', cursor: 'pointer', transition: 'transform 0.15s' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(183,121,31,0.12)', display: 'grid', placeItems: 'center' }}>
              <HelpCircle size={20} style={{ color: 'var(--warn)' }} />
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: '0 0 4px', fontSize: '0.95rem' }}>Rules & Billing</h3>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'rgba(16,25,47,0.6)' }}>10th-day rule, cancellation policy, and pricing.</p>
            </div>
            <ArrowRight size={18} style={{ color: 'rgba(16,25,47,0.3)' }} />
          </div>
        </Link>

        <div style={{ background: 'var(--card)', border: '1px solid rgba(16,25,47,0.08)', borderRadius: '18px', padding: '18px', display: 'flex', alignItems: 'center', gap: '14px', boxShadow: 'var(--shadow)' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(31,155,209,0.12)', display: 'grid', placeItems: 'center' }}>
            <Mail size={20} style={{ color: 'var(--accent-2)' }} />
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: '0 0 4px', fontSize: '0.95rem' }}>Handover Lookup</h3>
            <p style={{ margin: 0, fontSize: '0.78rem', color: 'rgba(16,25,47,0.6)' }}>Open your handover link to view mailbox credentials.</p>
          </div>
        </div>
      </nav>

      <footer style={{ textAlign: 'center', fontSize: '0.72rem', color: 'rgba(16,25,47,0.42)', marginTop: 'auto', paddingTop: '20px' }}>
        <span>Independent ticket assistance service &middot; Not affiliated with any official transport provider</span>
      </footer>
    </div>
  );
}
