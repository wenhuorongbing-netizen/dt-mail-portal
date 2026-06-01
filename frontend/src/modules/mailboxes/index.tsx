import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Check, Copy, KeyRound, Mail, Package, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { Button } from '../../core/ui/Button';
import { Card } from '../../core/ui/Card';
import { Input } from '../../core/ui/Input';
import { Tag } from '../../core/ui/Tag';
import { supabase } from '../../lib/supabase';

type MailboxProvider = 'manual' | 'cloudflare_routing' | 'hosted_mailbox' | 'customer_mailbox' | 'other';
type DeliveryMode = 'wallet_only' | 'managed_otp' | 'external_mailbox' | 'customer_mailbox';

interface MailboxAccount {
  id: string;
  email_address: string;
  provider: MailboxProvider;
  delivery_mode: DeliveryMode;
  login_url: string | null;
  username: string | null;
  password_enc: string | null;
  customer_can_login: boolean;
  otp_managed_by_operator: boolean;
  domain: string;
  status: string;
  notes: string;
  created_at: string;
}

const PROVIDER_LABELS: Record<MailboxProvider, string> = {
  manual: 'Manual inbox',
  cloudflare_routing: 'Cloudflare Routing',
  hosted_mailbox: 'Hosted mailbox',
  customer_mailbox: 'Customer mailbox',
  other: 'Other',
};

const DELIVERY_MODE_LABELS: Record<DeliveryMode, string> = {
  wallet_only: 'Wallet-only',
  managed_otp: 'Managed OTP exception',
  external_mailbox: 'External mailbox exception',
  customer_mailbox: 'Customer mailbox exception',
};

const selectStyle = {
  width: '100%',
  minHeight: 44,
  padding: '0 14px',
  borderRadius: 14,
  border: '1px solid rgba(16,25,47,0.16)',
  background: 'rgba(255,255,255,0.62)',
  outline: 'none',
  fontFamily: 'inherit',
  fontSize: '0.9rem',
};

function customerCanLoginForMode(mode: DeliveryMode) {
  return mode === 'external_mailbox' || mode === 'customer_mailbox';
}

function getLocalPart(email: string): string {
  return email.split('@')[0] ?? '';
}

function accessLabel(mailbox: Pick<MailboxAccount, 'delivery_mode' | 'customer_can_login'>) {
  if (mailbox.delivery_mode === 'wallet_only') return 'Wallet-only / no customer login';
  if (mailbox.customer_can_login) return 'Customer can log in to mailbox';
  return 'Operator-managed OTP exception';
}

export default function MailboxInventoryPage() {
  const [mailboxes, setMailboxes] = useState<MailboxAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const [localPart, setLocalPart] = useState('');
  const [domain, setDomain] = useState('tickets.buffjo.top');
  const [provider, setProvider] = useState<MailboxProvider>('cloudflare_routing');
  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>('wallet_only');
  const [loginUrl, setLoginUrl] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [notes, setNotes] = useState('');
  const [copyState, setCopyState] = useState<Record<string, boolean>>({});

  const customersCanLogin = customerCanLoginForMode(deliveryMode);

  const loadMailboxes = useCallback(async () => {
    setLoading(true);
    setError('');

    const { data, error: fetchError } = await supabase
      .from('mailbox_accounts')
      .select('*')
      .order('created_at', { ascending: false });

    if (fetchError) {
      setError(fetchError.message);
    } else {
      setMailboxes((data ?? []) as MailboxAccount[]);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    void loadMailboxes();
  }, [loadMailboxes]);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!localPart.trim()) return;

    if (customersCanLogin && !password.trim()) {
      setError('Password is required when customers can log in to the mailbox.');
      return;
    }

    setCreating(true);
    setError('');

    const trimmedLocalPart = localPart.trim();
    const fullEmail = `${trimmedLocalPart}@${domain.trim()}`;

    const { error: insertError } = await supabase.from('mailbox_accounts').insert({
      email_address: fullEmail,
      provider,
      delivery_mode: deliveryMode,
      login_url: customersCanLogin ? loginUrl.trim() || null : null,
      username: customersCanLogin ? username.trim() || trimmedLocalPart : trimmedLocalPart,
      password_enc: password.trim() || null,
      customer_can_login: customersCanLogin,
      otp_managed_by_operator: !customersCanLogin,
      domain: domain.trim(),
      status: 'active',
      notes: notes.trim(),
    });

    if (insertError) {
      setError(insertError.message);
    } else {
      setLocalPart('');
      setUsername('');
      setPassword('');
      setLoginUrl('');
      setNotes('');
      setProvider('cloudflare_routing');
      setDeliveryMode('wallet_only');
      await loadMailboxes();
    }

    setCreating(false);
  }

  async function handleToggleStatus(id: string, currentStatus: string) {
    const nextStatus = currentStatus === 'active' ? 'disabled' : 'active';
    const { error: updateError } = await supabase
      .from('mailbox_accounts')
      .update({ status: nextStatus })
      .eq('id', id);

    if (!updateError) {
      await loadMailboxes();
    }
  }

  async function handleDelete(id: string) {
    const { error: deleteError } = await supabase
      .from('mailbox_accounts')
      .delete()
      .eq('id', id);

    if (!deleteError) {
      await loadMailboxes();
    }
  }

  function triggerCopy(text: string, key: string) {
    if (navigator.clipboard) {
      void navigator.clipboard.writeText(text);
    }
    setCopyState((prev) => ({ ...prev, [key]: true }));
    setTimeout(() => setCopyState((prev) => ({ ...prev, [key]: false })), 1800);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Package size={22} style={{ color: 'var(--accent)' }} />
          <div>
            <h2 style={{ margin: 0, fontSize: '1.4rem' }}>Email Inventory</h2>
            <p className="muted" style={{ margin: 0, fontSize: '0.82rem' }}>
              Manage operator-controlled login email records. Wallet-only is the default customer delivery mode.
            </p>
          </div>
        </div>
        <Button onClick={loadMailboxes} className="button-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', minHeight: '36px', padding: '0 12px' }}>
          <RefreshCw size={14} />
          Refresh
        </Button>
      </div>

      {error && (
        <p style={{ color: 'var(--danger)', fontSize: '0.85rem', margin: 0, padding: '10px 14px', background: 'rgba(180,35,24,0.06)', borderRadius: 10 }}>
          {error}
        </p>
      )}

      <div className="admin-grid-2col-wide">
        <Card>
          <div style={{ marginBottom: '16px' }}>
            <p className="eyebrow">Add Email Record</p>
            <h3 style={{ margin: '0 0 4px' }}>New Record</h3>
            <p className="muted" style={{ fontSize: '0.82rem' }}>
              Default mode is Wallet-only, so customers do not receive TicketPlus+ login email, password, or OTP.
            </p>
          </div>

          <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label className="eyebrow" style={{ display: 'block', marginBottom: '4px' }}>Local Part *</label>
              <Input value={localPart} onChange={(e) => setLocalPart(e.target.value)} placeholder="e.g. user123" required />
            </div>
            <div>
              <label className="eyebrow" style={{ display: 'block', marginBottom: '4px' }}>Domain *</label>
              <Input value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="tickets.buffjo.top" required />
            </div>
            <div>
              <label className="eyebrow" style={{ display: 'block', marginBottom: '4px' }}>Provider</label>
              <select value={provider} onChange={(e) => setProvider(e.target.value as MailboxProvider)} style={selectStyle}>
                {Object.entries(PROVIDER_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="eyebrow" style={{ display: 'block', marginBottom: '4px' }}>Delivery Mode</label>
              <select value={deliveryMode} onChange={(e) => setDeliveryMode(e.target.value as DeliveryMode)} style={selectStyle}>
                {Object.entries(DELIVERY_MODE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
              <div style={{ marginTop: '8px' }}>
                <Tag tone={customersCanLogin ? 'warning' : 'success'}>
                  {customersCanLogin ? 'Customer can log in to mailbox' : 'Customer does not receive account login'}
                </Tag>
              </div>
            </div>
            <div>
              <label className="eyebrow" style={{ display: 'block', marginBottom: '4px' }}>Password {customersCanLogin ? '*' : ''}</label>
              <Input value={password} onChange={(e) => setPassword(e.target.value)} placeholder={customersCanLogin ? 'Mailbox password' : 'Optional internal note/password'} required={customersCanLogin} />
            </div>
            {customersCanLogin && (
              <>
                <div>
                  <label className="eyebrow" style={{ display: 'block', marginBottom: '4px' }}>Login URL</label>
                  <Input value={loginUrl} onChange={(e) => setLoginUrl(e.target.value)} placeholder="https://mail.example.com" />
                </div>
                <div>
                  <label className="eyebrow" style={{ display: 'block', marginBottom: '4px' }}>Username</label>
                  <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Defaults to local part" />
                </div>
              </>
            )}
            <div>
              <label className="eyebrow" style={{ display: 'block', marginBottom: '4px' }}>Notes</label>
              <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes" />
            </div>

            <Button type="submit" disabled={creating} style={{ width: '100%', marginTop: '4px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <Plus size={16} />
              {creating ? 'Creating...' : 'Create Email Record'}
            </Button>
          </form>
        </Card>

        <Card>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <h3 style={{ margin: 0 }}>Inventory</h3>
            <Tag tone="neutral">{mailboxes.length} record{mailboxes.length !== 1 ? 's' : ''}</Tag>
          </div>

          {loading ? (
            <div className="empty-state" style={{ minHeight: 160 }}>Loading...</div>
          ) : mailboxes.length === 0 ? (
            <div className="empty-state" style={{ minHeight: 160 }}>
              <div style={{ textAlign: 'center' }}>
                <Mail size={32} style={{ margin: '0 auto 8px', color: 'var(--muted)' }} />
                <p style={{ margin: 0 }}>No email records yet.</p>
                <p className="muted" style={{ fontSize: '0.82rem' }}>Create one using the form.</p>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {mailboxes.map((mailbox) => (
                <div
                  key={mailbox.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 14px',
                    borderRadius: 14,
                    border: '1px solid rgba(16,25,47,0.08)',
                    background: mailbox.status === 'disabled' ? 'rgba(16,25,47,0.03)' : 'rgba(255,255,255,0.6)',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <code style={{ fontWeight: 700, fontSize: '0.9rem', wordBreak: 'break-all' }}>{mailbox.email_address}</code>
                      <Tag tone={mailbox.status === 'active' ? 'success' : 'warning'}>{mailbox.status}</Tag>
                    </div>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '4px' }}>
                      <Tag tone="neutral">{PROVIDER_LABELS[mailbox.provider] ?? mailbox.provider}</Tag>
                      <Tag tone={mailbox.customer_can_login ? 'warning' : 'success'}>{accessLabel(mailbox)}</Tag>
                      <Tag tone="neutral">{DELIVERY_MODE_LABELS[mailbox.delivery_mode] ?? mailbox.delivery_mode}</Tag>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: 'rgba(16,25,47,0.52)' }}>
                      <KeyRound size={12} />
                      <code style={{ fontSize: '0.78rem' }}>
                        {mailbox.customer_can_login && mailbox.password_enc ? mailbox.password_enc : 'Wallet-only / operator controlled'}
                      </code>
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'rgba(16,25,47,0.4)', marginTop: '2px' }}>
                      Created {new Date(mailbox.created_at).toLocaleDateString()}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '6px', flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    <button onClick={() => triggerCopy(mailbox.email_address, `email-${mailbox.id}`)} title="Copy full email" style={{ background: 'rgba(16,25,47,0.06)', border: 'none', padding: '6px 8px', borderRadius: 8, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', fontWeight: 600 }}>
                      {copyState[`email-${mailbox.id}`] ? <Check size={12} style={{ color: 'var(--good)' }} /> : <Mail size={12} />}
                      {copyState[`email-${mailbox.id}`] ? 'Copied' : 'Email'}
                    </button>
                    <button onClick={() => triggerCopy(getLocalPart(mailbox.email_address), `local-${mailbox.id}`)} title="Copy local part" style={{ background: 'rgba(16,25,47,0.06)', border: 'none', padding: '6px 8px', borderRadius: 8, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', fontWeight: 600 }}>
                      {copyState[`local-${mailbox.id}`] ? <Check size={12} style={{ color: 'var(--good)' }} /> : <Copy size={12} />}
                      {copyState[`local-${mailbox.id}`] ? 'Copied' : 'User'}
                    </button>
                    {mailbox.customer_can_login && mailbox.password_enc && (
                      <button onClick={() => triggerCopy(mailbox.password_enc!, `pwd-${mailbox.id}`)} title="Copy password" style={{ background: 'rgba(16,25,47,0.06)', border: 'none', padding: '6px 8px', borderRadius: 8, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', fontWeight: 600 }}>
                        {copyState[`pwd-${mailbox.id}`] ? <Check size={12} style={{ color: 'var(--good)' }} /> : <KeyRound size={12} />}
                        {copyState[`pwd-${mailbox.id}`] ? 'Copied' : 'Pass'}
                      </button>
                    )}
                    <button onClick={() => handleToggleStatus(mailbox.id, mailbox.status)} title={mailbox.status === 'active' ? 'Disable' : 'Enable'} style={{ background: mailbox.status === 'active' ? 'rgba(183,121,31,0.08)' : 'rgba(13,138,97,0.08)', border: 'none', padding: '6px 8px', borderRadius: 8, cursor: 'pointer', fontSize: '0.72rem', fontWeight: 600 }}>
                      {mailbox.status === 'active' ? 'Disable' : 'Enable'}
                    </button>
                    <button onClick={() => handleDelete(mailbox.id)} title="Delete" style={{ background: 'rgba(180,35,24,0.06)', border: 'none', padding: '6px 8px', borderRadius: 8, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', fontSize: '0.72rem', fontWeight: 600, color: 'var(--danger)' }}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
