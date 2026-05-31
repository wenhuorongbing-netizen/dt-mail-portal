import { useParams, Link } from 'react-router-dom';
import { Mail, Copy, Check, ExternalLink, Lock, Unlock, BookOpen, ShieldCheck, AlertTriangle, HelpCircle, ArrowLeft, Loader2 } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

interface HandoverData {
  handover_id: string;
  code: string;
  instructions: string;
  handover_status: string;
  viewed_at: string | null;
  order_id: string;
  customer_label: string | null;
  ticket_month: string | null;
  status: string;
  mailbox_email: string | null;
  mailbox_password: string | null;
  mailbox_domain: string | null;
}

export default function HandoverPage() {
  const { code } = useParams<{ code: string }>();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<HandoverData | null>(null);
  const [pwdVisible, setPwdVisible] = useState(false);
  const [copyState, setCopyState] = useState<Record<string, boolean>>({});

  const triggerCopy = useCallback((text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopyState((prev) => ({ ...prev, [key]: true }));
    setTimeout(() => setCopyState((prev) => ({ ...prev, [key]: false })), 2000);
  }, []);

  useEffect(() => {
    if (!code) {
      setError('No handover code provided.');
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchHandover() {
      setLoading(true);
      setError(null);

      const { data: result, error: rpcError } = await supabase.rpc('get_handover_by_code', {
        p_code: code!,
      });

      if (cancelled) return;

      if (rpcError) {
        console.error('Handover RPC error:', rpcError);
        setError('Unable to load handover information. Please try again.');
        setLoading(false);
        return;
      }

      if (!result) {
        setError('This handover code is invalid or has expired.');
        setLoading(false);
        return;
      }

      setData(result as HandoverData);
      setLoading(false);
    }

    fetchHandover();

    return () => {
      cancelled = true;
    };
  }, [code]);

  const localPart = data?.mailbox_email?.split('@')[0] ?? '';
  const webmailUrl = `https://webmail.${data?.mailbox_domain ?? 'tickets.buffjo.top'}`;

  // --- Loading state ---
  if (loading) {
    return (
      <div style={{ maxWidth: '540px', margin: '0 auto', padding: '24px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: '16px' }}>
        <Loader2 size={32} style={{ color: 'var(--accent-2)', animation: 'spin 1s linear infinite' }} />
        <p style={{ margin: 0, fontSize: '0.9rem', color: 'rgba(16,25,47,0.6)' }}>Loading handover details…</p>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // --- Error state ---
  if (error || !data) {
    return (
      <div style={{ maxWidth: '540px', margin: '0 auto', padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: '16px', minHeight: '100vh' }}>
        <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: 'rgba(16,25,47,0.6)', textDecoration: 'none' }}>
          <ArrowLeft size={14} /> Back to portal
        </Link>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', textAlign: 'center' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(180,35,24,0.08)', display: 'grid', placeItems: 'center' }}>
            <AlertTriangle size={28} style={{ color: 'var(--danger)' }} />
          </div>
          <h2 style={{ fontSize: '1.2rem', margin: 0, fontFamily: 'var(--font-display)' }}>Handover Not Found</h2>
          <p style={{ margin: 0, fontSize: '0.88rem', color: 'rgba(16,25,47,0.6)', lineHeight: '1.5', maxWidth: '360px' }}>
            {error ?? 'This handover link is invalid or has expired.'}
          </p>
          <div style={{ background: 'rgba(31,155,209,0.06)', border: '1px solid rgba(31,155,209,0.12)', borderRadius: '14px', padding: '14px', fontSize: '0.82rem', lineHeight: '1.5', display: 'flex', gap: '8px', maxWidth: '380px', textAlign: 'left' }}>
            <HelpCircle size={16} style={{ flexShrink: 0, color: 'var(--accent-2)', marginTop: '2px' }} />
            <div>
              <strong>Need help?</strong> Please contact the operator who sent you this link. They can verify your code or generate a new one.
            </div>
          </div>
        </div>

        <footer style={{ textAlign: 'center', fontSize: '0.72rem', color: 'rgba(16,25,47,0.42)', paddingTop: '12px' }}>
          <span>D-Ticket Mail Portal · Independent assistance service</span>
        </footer>
      </div>
    );
  }

  // --- Success state ---
  return (
    <div style={{ maxWidth: '540px', margin: '0 auto', padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: '16px', minHeight: '100vh' }}>
      <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: 'rgba(16,25,47,0.6)', textDecoration: 'none' }}>
        <ArrowLeft size={14} /> Back to portal
      </Link>

      <header>
        <p className="eyebrow">Handover Record</p>
        <h1 style={{ fontSize: '1.4rem', margin: '0 0 4px', fontFamily: 'var(--font-display)' }}>Your D-Ticket Mailbox</h1>
        <p style={{ margin: 0, fontSize: '0.82rem', color: 'rgba(16,25,47,0.6)' }}>
          Code: <code style={{ background: 'rgba(16,25,47,0.06)', padding: '2px 6px', borderRadius: '6px', fontWeight: 'bold' }}>{data.code}</code>
          {data.ticket_month && (
            <span style={{ marginLeft: '8px' }}>· Ticket: <strong>{data.ticket_month}</strong></span>
          )}
        </p>
      </header>

      {/* --- Mailbox credentials card --- */}
      <div style={{ background: 'var(--card)', border: '1px solid rgba(16,25,47,0.08)', borderRadius: '18px', padding: '18px', boxShadow: 'var(--shadow)', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ background: 'rgba(244,166,42,0.12)', width: '36px', height: '36px', borderRadius: '10px', display: 'grid', placeItems: 'center' }}>
            <Mail size={18} style={{ color: '#b7791f' }} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '0.95rem' }}>Mailbox Credentials</h3>
            <span style={{ fontSize: '0.72rem', color: 'rgba(16,25,47,0.52)' }}>Use these to log in and receive OTP codes</span>
          </div>
        </div>

        {/* Full email (for TicketPlus+) */}
        {data.mailbox_email && (
          <div style={{ background: 'white', border: '1px solid rgba(16,25,47,0.08)', borderRadius: '12px', padding: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ minWidth: 0 }}>
              <span style={{ display: 'block', fontSize: '0.7rem', color: 'gray' }}>Full Email (for TicketPlus+ login)</span>
              <code style={{ fontSize: '0.88rem', fontWeight: 'bold', color: 'var(--ink)', wordBreak: 'break-all' }}>{data.mailbox_email}</code>
            </div>
            <button
              onClick={() => triggerCopy(data.mailbox_email!, 'email')}
              style={{ background: 'rgba(16,25,47,0.08)', border: 'none', padding: '6px 10px', borderRadius: '8px', fontSize: '0.72rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600, flexShrink: 0, marginLeft: '8px' }}
            >
              {copyState['email'] ? <Check size={12} style={{ color: 'var(--good)' }} /> : <Copy size={12} />}
              {copyState['email'] ? 'Copied' : 'Copy'}
            </button>
          </div>
        )}

        {/* Username (local part for webmail) */}
        {localPart && (
          <div style={{ background: 'white', border: '1px solid rgba(16,25,47,0.08)', borderRadius: '12px', padding: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ display: 'block', fontSize: '0.7rem', color: 'gray' }}>Username (for webmail login only)</span>
              <code style={{ fontSize: '0.88rem', fontWeight: 'bold', color: 'var(--ink)' }}>{localPart}</code>
            </div>
            <button
              onClick={() => triggerCopy(localPart, 'local')}
              style={{ background: 'rgba(16,25,47,0.08)', border: 'none', padding: '6px 10px', borderRadius: '8px', fontSize: '0.72rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600, flexShrink: 0, marginLeft: '8px' }}
            >
              {copyState['local'] ? <Check size={12} style={{ color: 'var(--good)' }} /> : <Copy size={12} />}
              {copyState['local'] ? 'Copied' : 'Copy'}
            </button>
          </div>
        )}

        {/* Password */}
        {data.mailbox_password && (
          <div style={{ background: 'white', border: '1px solid rgba(16,25,47,0.08)', borderRadius: '12px', padding: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ display: 'block', fontSize: '0.7rem', color: 'gray' }}>Password</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <code style={{ fontSize: '0.88rem', fontWeight: 'bold', color: 'var(--ink)' }}>
                  {pwdVisible ? data.mailbox_password : '\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022'}
                </code>
                <button
                  onClick={() => setPwdVisible(!pwdVisible)}
                  style={{ background: 'none', border: 'none', color: 'gray', padding: 0, cursor: 'pointer', display: 'inline-flex' }}
                  aria-label={pwdVisible ? 'Hide password' : 'Show password'}
                >
                  {pwdVisible ? <Unlock size={14} /> : <Lock size={14} />}
                </button>
              </div>
            </div>
            <button
              onClick={() => triggerCopy(data.mailbox_password!, 'pwd')}
              style={{ background: 'rgba(16,25,47,0.08)', border: 'none', padding: '6px 10px', borderRadius: '8px', fontSize: '0.72rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600, flexShrink: 0, marginLeft: '8px' }}
            >
              {copyState['pwd'] ? <Check size={12} style={{ color: 'var(--good)' }} /> : <Copy size={12} />}
              {copyState['pwd'] ? 'Copied' : 'Copy'}
            </button>
          </div>
        )}

        {/* Open Webmail button */}
        <a href={webmailUrl} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
          <button style={{ width: '100%', minHeight: '44px', background: 'var(--accent-2)', color: 'white', border: 'none', borderRadius: '14px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.9rem' }}>
            Open Webmail <ExternalLink size={16} />
          </button>
        </a>
      </div>

      {/* --- Login warnings --- */}
      <div style={{ background: 'rgba(244,166,42,0.06)', border: '1px solid rgba(244,166,42,0.18)', borderRadius: '16px', padding: '14px', fontSize: '0.78rem', lineHeight: '1.6', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
          <AlertTriangle size={16} style={{ flexShrink: 0, color: 'var(--warn)', marginTop: '1px' }} />
          <div>
            <strong>Important — please read carefully:</strong>
          </div>
        </div>
        <ul style={{ margin: 0, paddingLeft: '24px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <li><strong>Webmail login:</strong> Use the <em>username</em> (part before @) only. Do NOT enter the full email address.</li>
          <li><strong>TicketPlus+ login:</strong> Use the <em>full email address</em> (e.g. {data.mailbox_email ?? 'user@tickets.buffjo.top'}). Do NOT use just the username.</li>
          <li><strong>Your ticket is personal.</strong> The name on the ticket must match your passport or ID. Inspectors may check.</li>
        </ul>
      </div>

      {/* --- Quick login steps --- */}
      <div style={{ background: 'var(--card)', border: '1px solid rgba(16,25,47,0.08)', borderRadius: '18px', padding: '18px', boxShadow: 'var(--shadow)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <BookOpen size={16} style={{ color: 'var(--accent)' }} />
          <h3 style={{ margin: 0, fontSize: '0.95rem' }}>Quick Login Steps</h3>
        </div>
        <ol style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.82rem', lineHeight: '1.5' }}>
          <li>Download <strong>TicketPlus+</strong> from your app store.</li>
          <li>Open the app and choose <strong>Email Login</strong>.</li>
          <li>Enter the <strong>full email address</strong> shown above.</li>
          <li>Open webmail (use the <strong>username</strong>, not the full email) to find the OTP code from TicketPlus+.</li>
          <li>Enter the OTP code in the app to complete login.</li>
          <li>Your Deutschlandticket QR code will appear in the app.</li>
        </ol>
        <Link to="/guide" style={{ textDecoration: 'none' }}>
          <button style={{ width: '100%', minHeight: '40px', background: 'rgba(16,25,47,0.06)', color: 'var(--ink)', border: '1px solid rgba(16,25,47,0.1)', borderRadius: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.82rem' }}>
            <BookOpen size={14} /> View Full Login Guide
          </button>
        </Link>
      </div>

      {/* --- Custom instructions from operator (if any) --- */}
      {data.instructions && data.instructions.trim() && (
        <div style={{ background: 'var(--card)', border: '1px solid rgba(16,25,47,0.08)', borderRadius: '18px', padding: '18px', boxShadow: 'var(--shadow)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <h3 style={{ margin: 0, fontSize: '0.95rem' }}>Operator Notes</h3>
          <p style={{ margin: 0, fontSize: '0.82rem', lineHeight: '1.5', whiteSpace: 'pre-wrap', color: 'rgba(16,25,47,0.8)' }}>
            {data.instructions}
          </p>
        </div>
      )}

      {/* --- Independent service disclaimer --- */}
      <div style={{ background: 'rgba(31,155,209,0.06)', border: '1px solid rgba(31,155,209,0.12)', borderRadius: '16px', padding: '14px', fontSize: '0.78rem', lineHeight: '1.5', display: 'flex', gap: '8px' }}>
        <ShieldCheck size={16} style={{ flexShrink: 0, color: 'var(--accent-2)', marginTop: '2px' }} />
        <div>
          <strong>Independent service:</strong> This is not an official TicketPlus+, Deutsche Bahn, or Deutschlandticket service. We provide mailbox hosting and purchase assistance only. We are not affiliated with any transport provider.
        </div>
      </div>

      <footer style={{ textAlign: 'center', fontSize: '0.72rem', color: 'rgba(16,25,47,0.42)', marginTop: 'auto', paddingTop: '12px' }}>
        <span>D-Ticket Mail Portal · Independent assistance service</span>
      </footer>
    </div>
  );
}
