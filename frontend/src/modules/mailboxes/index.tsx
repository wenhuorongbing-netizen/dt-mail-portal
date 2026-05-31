import { useEffect, useState, useCallback } from 'react';
import { Button } from '../../core/ui/Button';
import { Card } from '../../core/ui/Card';
import { Input } from '../../core/ui/Input';
import { Tag } from '../../core/ui/Tag';
import { supabase } from '../../lib/supabase';
import { Copy, Check, Plus, RefreshCw, Mail, KeyRound, Package, Trash2 } from 'lucide-react';

interface MailboxAccount {
  id: string;
  email_address: string;
  password_enc: string;
  domain: string;
  status: string;
  notes: string;
  created_at: string;
}

export default function MailboxInventoryPage() {
  const [mailboxes, setMailboxes] = useState<MailboxAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [localPart, setLocalPart] = useState('');
  const [domain, setDomain] = useState('tickets.buffjo.top');
  const [password, setPassword] = useState('');
  const [notes, setNotes] = useState('');

  // Copy state
  const [copyState, setCopyState] = useState<Record<string, boolean>>({});

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
      setMailboxes(data ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadMailboxes();
  }, [loadMailboxes]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!localPart.trim() || !password.trim()) return;
    setCreating(true);
    setError('');

    const fullEmail = `${localPart.trim()}@${domain.trim()}`;

    const { error: insertError } = await supabase.from('mailbox_accounts').insert({
      email_address: fullEmail,
      password_enc: password.trim(),
      domain: domain.trim(),
      status: 'active',
      notes: notes.trim(),
    });

    if (insertError) {
      setError(insertError.message);
    } else {
      setLocalPart('');
      setPassword('');
      setNotes('');
      await loadMailboxes();
    }
    setCreating(false);
  }

  async function handleToggleStatus(id: string, currentStatus: string) {
    const newStatus = currentStatus === 'active' ? 'disabled' : 'active';
    const { error: updateError } = await supabase
      .from('mailbox_accounts')
      .update({ status: newStatus })
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
    navigator.clipboard.writeText(text);
    setCopyState((prev) => ({ ...prev, [key]: true }));
    setTimeout(() => setCopyState((prev) => ({ ...prev, [key]: false })), 2000);
  }

  function getLocalPart(email: string): string {
    return email.split('@')[0] ?? '';
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Package size={22} style={{ color: 'var(--accent)' }} />
          <div>
            <h2 style={{ margin: 0, fontSize: '1.4rem' }}>Mailbox Inventory</h2>
            <p className="muted" style={{ margin: 0, fontSize: '0.82rem' }}>Manage dedicated mailbox credentials for customers.</p>
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
        {/* Create form */}
        <Card>
          <div style={{ marginBottom: '16px' }}>
            <p className="eyebrow">Add Mailbox</p>
            <h3 style={{ margin: '0 0 4px' }}>New Record</h3>
            <p className="muted" style={{ fontSize: '0.82rem' }}>Manually import or create a mailbox entry.</p>
          </div>

          <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label className="eyebrow" style={{ display: 'block', marginBottom: '4px' }}>Local Part *</label>
              <Input
                value={localPart}
                onChange={(e) => setLocalPart(e.target.value)}
                placeholder="e.g. user123"
                required
              />
            </div>
            <div>
              <label className="eyebrow" style={{ display: 'block', marginBottom: '4px' }}>Domain *</label>
              <Input
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="tickets.buffjo.top"
                required
              />
            </div>
            <div>
              <label className="eyebrow" style={{ display: 'block', marginBottom: '4px' }}>Password *</label>
              <Input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mailbox password"
                required
              />
            </div>
            <div>
              <label className="eyebrow" style={{ display: 'block', marginBottom: '4px' }}>Notes</label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional notes"
              />
            </div>

            <Button type="submit" disabled={creating} style={{ width: '100%', marginTop: '4px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <Plus size={16} />
              {creating ? 'Creating…' : 'Create Mailbox'}
            </Button>
          </form>
        </Card>

        {/* Inventory list */}
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <h3 style={{ margin: 0 }}>Inventory</h3>
            <Tag tone="neutral">{mailboxes.length} record{mailboxes.length !== 1 ? 's' : ''}</Tag>
          </div>

          {loading ? (
            <div className="empty-state" style={{ minHeight: 160 }}>Loading…</div>
          ) : mailboxes.length === 0 ? (
            <div className="empty-state" style={{ minHeight: 160 }}>
              <div style={{ textAlign: 'center' }}>
                <Mail size={32} style={{ margin: '0 auto 8px', color: 'var(--muted)' }} />
                <p style={{ margin: 0 }}>No mailbox records yet.</p>
                <p className="muted" style={{ fontSize: '0.82rem' }}>Create one using the form.</p>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {mailboxes.map((mb) => (
                <div
                  key={mb.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 14px',
                    borderRadius: 14,
                    border: '1px solid rgba(16,25,47,0.08)',
                    background: mb.status === 'disabled' ? 'rgba(16,25,47,0.03)' : 'rgba(255,255,255,0.6)',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <code style={{ fontWeight: 700, fontSize: '0.9rem', wordBreak: 'break-all' }}>{mb.email_address}</code>
                      <Tag tone={mb.status === 'active' ? 'success' : 'warning'}>{mb.status}</Tag>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: 'rgba(16,25,47,0.52)' }}>
                      <KeyRound size={12} />
                      <code style={{ fontSize: '0.78rem' }}>{mb.password_enc}</code>
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'rgba(16,25,47,0.4)', marginTop: '2px' }}>
                      Created {new Date(mb.created_at).toLocaleDateString()}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                    <button
                      onClick={() => triggerCopy(mb.email_address, `email-${mb.id}`)}
                      title="Copy full email"
                      style={{ background: 'rgba(16,25,47,0.06)', border: 'none', padding: '6px 8px', borderRadius: 8, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', fontWeight: 600 }}
                    >
                      {copyState[`email-${mb.id}`] ? <Check size={12} style={{ color: 'var(--good)' }} /> : <Mail size={12} />}
                      {copyState[`email-${mb.id}`] ? 'Copied' : 'Email'}
                    </button>
                    <button
                      onClick={() => triggerCopy(getLocalPart(mb.email_address), `local-${mb.id}`)}
                      title="Copy local part"
                      style={{ background: 'rgba(16,25,47,0.06)', border: 'none', padding: '6px 8px', borderRadius: 8, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', fontWeight: 600 }}
                    >
                      {copyState[`local-${mb.id}`] ? <Check size={12} style={{ color: 'var(--good)' }} /> : <Copy size={12} />}
                      {copyState[`local-${mb.id}`] ? 'Copied' : 'User'}
                    </button>
                    <button
                      onClick={() => triggerCopy(mb.password_enc, `pwd-${mb.id}`)}
                      title="Copy password"
                      style={{ background: 'rgba(16,25,47,0.06)', border: 'none', padding: '6px 8px', borderRadius: 8, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', fontWeight: 600 }}
                    >
                      {copyState[`pwd-${mb.id}`] ? <Check size={12} style={{ color: 'var(--good)' }} /> : <KeyRound size={12} />}
                      {copyState[`pwd-${mb.id}`] ? 'Copied' : 'Pass'}
                    </button>
                    <button
                      onClick={() => handleToggleStatus(mb.id, mb.status)}
                      title={mb.status === 'active' ? 'Disable' : 'Enable'}
                      style={{ background: mb.status === 'active' ? 'rgba(183,121,31,0.08)' : 'rgba(13,138,97,0.08)', border: 'none', padding: '6px 8px', borderRadius: 8, cursor: 'pointer', fontSize: '0.72rem', fontWeight: 600 }}
                    >
                      {mb.status === 'active' ? 'Disable' : 'Enable'}
                    </button>
                    <button
                      onClick={() => handleDelete(mb.id)}
                      title="Delete"
                      style={{ background: 'rgba(180,35,24,0.06)', border: 'none', padding: '6px 8px', borderRadius: 8, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', fontSize: '0.72rem', fontWeight: 600, color: 'var(--danger)' }}
                    >
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
