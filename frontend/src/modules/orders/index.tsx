import { useCallback, useEffect, useState, type CSSProperties, type FormEvent } from 'react';
import {
  ArrowRight,
  AlertTriangle,
  Check,
  ClipboardList,
  Copy,
  Info,
  Link as LinkIcon,
  Mail,
  Plus,
  RefreshCw,
  Wallet,
} from 'lucide-react';
import { Button } from '../../core/ui/Button';
import { Card } from '../../core/ui/Card';
import { Input } from '../../core/ui/Input';
import { Tag } from '../../core/ui/Tag';
import { supabase } from '../../lib/supabase';
import {
  DELIVERY_MODE_LABELS,
  STATUS_FLOW,
  STATUS_LABELS,
  buildHandoverText,
  calculatePricing,
  generateDetailedDeliveryPack,
  generateShortDeliveryPack,
  generateTroubleshootPack,
  getTicketMonth,
  logDeliveryPackCopy,
  type MailboxAccount,
  type Order,
  type OrderStatus,
} from './orderUtils';
import { looksLikeWalletLink } from '../../lib/handover';

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

function money(value: number | string | null | undefined) {
  return `${Number(value ?? 0).toFixed(2)} EUR`;
}

function mailboxSafetyLabel(mailbox: MailboxAccount) {
  if (mailbox.delivery_mode === 'wallet_only') return 'Wallet-only: customer does not receive account login';
  if (mailbox.customer_can_login) return 'Exception: customer can log in to mailbox';
  return 'Exception: operator-managed OTP';
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [mailboxes, setMailboxes] = useState<MailboxAccount[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [btnLoading, setBtnLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [copyState, setCopyState] = useState<Record<string, boolean>>({});

  const [customerLabel, setCustomerLabel] = useState('');
  const [customerContact, setCustomerContact] = useState('');
  const [passengerName, setPassengerName] = useState('');
  const [passengerBirthdate, setPassengerBirthdate] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [serviceFee, setServiceFee] = useState(10.0);
  const [selectedMailboxId, setSelectedMailboxId] = useState('');

  const [appleWalletLink, setAppleWalletLink] = useState('');
  const [googleWalletLink, setGoogleWalletLink] = useState('');
  const [checklist, setChecklist] = useState<Record<string, boolean>>({
    passenger_name_confirmed: false,
    ticket_month_confirmed: false,
    wallet_links_present: false,
    no_custom_pkpass: false,
    no_qr_only: false,
    risk_reviewed: false,
    handover_code_generated: false,
    delivery_pack_sent: false,
  });

  const pricing = calculatePricing(startDate, serviceFee);
  const selectedMailbox = mailboxes.find((mailbox) => mailbox.id === selectedMailboxId);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');

    const { data, error: fetchError } = await supabase
      .from('orders')
      .select(`
        *,
        mailbox_account:mailbox_account_id(*),
        handover_codes(*)
      `)
      .order('created_at', { ascending: false });

    if (fetchError) {
      setErrorMsg(fetchError.message);
    } else {
      setOrders((data ?? []) as unknown as Order[]);
    }
    setLoading(false);
  }, []);

  const loadMailboxes = useCallback(async () => {
    const { data } = await supabase
      .from('mailbox_accounts')
      .select('*')
      .eq('status', 'active')
      .order('email_address');
    setMailboxes((data ?? []) as unknown as MailboxAccount[]);
  }, []);

  useEffect(() => {
    void loadOrders();
    void loadMailboxes();
  }, [loadOrders, loadMailboxes]);

  useEffect(() => {
    if (selectedOrder) {
      setAppleWalletLink(selectedOrder.apple_wallet_link ?? '');
      setGoogleWalletLink(selectedOrder.google_wallet_link ?? '');
    }
  }, [selectedOrder]);

  async function refreshSelectedOrder(orderId: string) {
    const { data } = await supabase
      .from('orders')
      .select(`*, mailbox_account:mailbox_account_id(*), handover_codes(*)`)
      .eq('id', orderId)
      .single();

    if (data) {
      setSelectedOrder(data as unknown as Order);
    }
  }

  async function handleCreateOrder(e: FormEvent) {
    e.preventDefault();
    if (!customerLabel.trim()) {
      setErrorMsg('Customer label is required');
      return;
    }

    setBtnLoading(true);
    setErrorMsg('');

    const { data: userData } = await supabase.auth.getUser();
    const operatorId = userData.user?.id;
    if (!operatorId) {
      setErrorMsg('Not authenticated');
      setBtnLoading(false);
      return;
    }

    const { error: insertError } = await supabase.from('orders').insert({
      operator_id: operatorId,
      customer_label: customerLabel.trim(),
      customer_contact: customerContact.trim() || null,
      passenger_name: passengerName.trim() || null,
      passenger_birthdate: passengerBirthdate.trim() || null,
      ticket_month: getTicketMonth(startDate),
      start_date: startDate,
      after_tenth_day: pricing.after10th,
      ticket_month_count: pricing.monthCount,
      ticket_price_total: pricing.ticketPrice,
      service_fee: serviceFee,
      total_amount: pricing.total,
      status: 'requested',
      mailbox_account_id: selectedMailboxId || null,
    });

    if (insertError) {
      setErrorMsg(insertError.message);
    } else {
      setCustomerLabel('');
      setCustomerContact('');
      setPassengerName('');
      setPassengerBirthdate('');
      setSelectedMailboxId('');
      await loadOrders();
    }

    setBtnLoading(false);
  }

  async function updateStatus(orderId: string, newStatus: OrderStatus) {
    setBtnLoading(true);
    setErrorMsg('');

    const { error: updateError } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId);

    if (updateError) {
      setErrorMsg(updateError.message);
    } else {
      await loadOrders();
      if (selectedOrder?.id === orderId) {
        await refreshSelectedOrder(orderId);
      }
    }

    setBtnLoading(false);
  }

  async function handleGenerateHandover(orderId: string) {
    setBtnLoading(true);
    setErrorMsg('');

    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .select(`*, mailbox_account:mailbox_account_id(*)`)
      .eq('id', orderId)
      .single();

    if (orderError || !orderData) {
      setErrorMsg(orderError?.message ?? 'Order not found');
      setBtnLoading(false);
      return;
    }

    const order = orderData as unknown as Order;
    const instructions = buildHandoverText(order);

    const { data: code, error: rpcError } = await supabase.rpc('generate_handover_code');
    if (rpcError || !code) {
      setErrorMsg(rpcError?.message ?? 'Failed to generate handover code');
      setBtnLoading(false);
      return;
    }

    const { error: insertError } = await supabase.from('handover_codes').insert({
      order_id: orderId,
      code: code as string,
      instructions,
    });

    if (insertError) {
      setErrorMsg(insertError.message);
    } else {
      if (order.status === 'ticket_purchased') {
        await supabase.from('orders').update({ status: 'handover_created' }).eq('id', orderId);
      }
      await loadOrders();
      await refreshSelectedOrder(orderId);
    }

    setBtnLoading(false);
  }

  function triggerCopy(text: string, key: string) {
    if (navigator.clipboard) {
      void navigator.clipboard.writeText(text);
    }
    setCopyState((prev) => ({ ...prev, [key]: true }));
    setTimeout(() => setCopyState((prev) => ({ ...prev, [key]: false })), 1800);
  }

  async function handleSaveWalletLinks() {
    if (!selectedOrder) return;
    setBtnLoading(true);
    setErrorMsg('');

    const { error } = await supabase
      .from('orders')
      .update({
        apple_wallet_link: appleWalletLink.trim() || null,
        google_wallet_link: googleWalletLink.trim() || null,
      })
      .eq('id', selectedOrder.id);

    if (error) {
      setErrorMsg(error.message);
    } else {
      await loadOrders();
      await refreshSelectedOrder(selectedOrder.id);
    }

    setBtnLoading(false);
  }

  const copyButtonStyle: CSSProperties = {
    background: 'rgba(16,25,47,0.06)',
    border: 'none',
    padding: '6px 10px',
    borderRadius: 8,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '0.78rem',
    fontWeight: 600,
  };

  const appleLinkValid = !appleWalletLink || looksLikeWalletLink(appleWalletLink, 'apple');
  const googleLinkValid = !googleWalletLink || looksLikeWalletLink(googleWalletLink, 'google');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {errorMsg && (
        <p style={{ color: 'var(--danger)', fontSize: '0.85rem', margin: 0, padding: '10px 14px', background: 'rgba(180,35,24,0.06)', borderRadius: 10 }}>
          {errorMsg}
        </p>
      )}

      <div className="admin-grid-2col">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <Card>
            <div style={{ marginBottom: '16px' }}>
              <p className="eyebrow">Operations Desk</p>
              <h3>Create Order</h3>
              <p className="muted" style={{ fontSize: '0.82rem' }}>
                Register the customer and prepare a Wallet-only handover by default.
              </p>
            </div>

            <form onSubmit={handleCreateOrder} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label className="eyebrow" style={{ display: 'block', marginBottom: '4px' }}>WeChat Label *</label>
                <Input value={customerLabel} onChange={(e) => setCustomerLabel(e.target.value)} placeholder="e.g. 微信昵称" required />
              </div>
              <div>
                <label className="eyebrow" style={{ display: 'block', marginBottom: '4px' }}>Contact Details</label>
                <Input value={customerContact} onChange={(e) => setCustomerContact(e.target.value)} placeholder="e.g. wxid_xxxx" />
              </div>
              <div>
                <label className="eyebrow" style={{ display: 'block', marginBottom: '4px' }}>Passenger Name</label>
                <Input value={passengerName} onChange={(e) => setPassengerName(e.target.value)} placeholder="e.g. SAN ZHANG" />
              </div>
              <div>
                <label className="eyebrow" style={{ display: 'block', marginBottom: '4px' }}>Passenger Birthdate</label>
                <Input value={passengerBirthdate} onChange={(e) => setPassengerBirthdate(e.target.value)} placeholder="e.g. 1995-10-24" />
              </div>
              <div>
                <label className="eyebrow" style={{ display: 'block', marginBottom: '4px' }}>D-Ticket Start Date</label>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div>
                <label className="eyebrow" style={{ display: 'block', marginBottom: '4px' }}>Service Fee (EUR)</label>
                <Input type="number" step="0.01" value={serviceFee} onChange={(e) => setServiceFee(Number(e.target.value))} />
              </div>
              <div>
                <label className="eyebrow" style={{ display: 'block', marginBottom: '4px' }}>Assign Operator-controlled Email</label>
                <select value={selectedMailboxId} onChange={(e) => setSelectedMailboxId(e.target.value)} style={selectStyle}>
                  <option value="">No email record yet</option>
                  {mailboxes.map((mailbox) => (
                    <option key={mailbox.id} value={mailbox.id}>
                      {mailbox.email_address} · {DELIVERY_MODE_LABELS[mailbox.delivery_mode] ?? mailbox.delivery_mode}
                    </option>
                  ))}
                </select>
                {selectedMailbox && (
                  <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <p className="muted" style={{ fontSize: '0.78rem', margin: 0 }}>
                      Will assign: <strong>{selectedMailbox.email_address}</strong>
                    </p>
                    <Tag tone={selectedMailbox.delivery_mode === 'wallet_only' ? 'success' : 'warning'}>
                      {mailboxSafetyLabel(selectedMailbox)}
                    </Tag>
                  </div>
                )}
              </div>

              <Button type="submit" disabled={btnLoading} style={{ marginTop: '4px', width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <Plus size={16} />
                {btnLoading ? 'Creating...' : 'Create Order'}
              </Button>
            </form>
          </Card>

          <Card style={{ background: '#0f172a', color: '#f8fafc', border: '1px solid #334155' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <Wallet size={16} style={{ color: 'var(--accent)' }} />
              <h4 style={{ margin: 0, fontSize: '0.9rem', color: '#f1f5f9' }}>10th-Day Rule Calculator</h4>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #334155', paddingBottom: '6px' }}>
                <span style={{ color: '#94a3b8' }}>Start Day:</span>
                <span style={{ fontWeight: 'bold' }}>Day {new Date(startDate).getDate()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #334155', paddingBottom: '6px' }}>
                <span style={{ color: '#94a3b8' }}>Subscription Term:</span>
                <span style={{ fontWeight: 'bold', color: pricing.after10th ? '#f59e0b' : '#10b981' }}>
                  {pricing.monthCount} month{pricing.monthCount > 1 ? 's' : ''}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#94a3b8' }}>
                <span>Base D-Ticket Price</span>
                <span>{money(pricing.ticketPrice)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#94a3b8' }}>
                <span>Operator Service Fee</span>
                <span>{money(serviceFee)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1rem', color: '#ffd18d', paddingTop: '4px' }}>
                <span>Estimated Total</span>
                <span>{money(pricing.total)}</span>
              </div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '10px', marginTop: '12px', display: 'flex', gap: '8px', fontSize: '0.78rem', border: '1px solid rgba(255,255,255,0.06)' }}>
              <Info size={16} style={{ flexShrink: 0, color: '#f4a62a' }} />
              <p style={{ margin: 0, color: '#cbd5e1', lineHeight: '1.4' }}>
                Subscriptions must be cancelled by the 10th. Orders after the 10th require current and next month payment.
              </p>
            </div>
          </Card>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <h3 style={{ margin: 0 }}>Orders Ledger</h3>
              <Button onClick={loadOrders} className="button-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', minHeight: '36px', padding: '0 12px' }}>
                <RefreshCw size={14} />
                Refresh
              </Button>
            </div>

            {loading ? (
              <div className="empty-state" style={{ minHeight: 160 }}>Loading...</div>
            ) : orders.length === 0 ? (
              <div className="empty-state" style={{ minHeight: 160 }}>
                <div style={{ textAlign: 'center' }}>
                  <ClipboardList size={32} style={{ margin: '0 auto 8px', color: 'var(--muted)' }} />
                  <p style={{ margin: 0 }}>No orders yet.</p>
                  <p className="muted" style={{ fontSize: '0.82rem' }}>Create one using the form on the left.</p>
                </div>
              </div>
            ) : (
              <div style={{ overflow: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '620px' }}>
                  <thead>
                    <tr>
                      {['Customer', 'Month', 'Total', 'Status', 'Handover', ''].map((heading) => (
                        <th key={heading} style={{ textAlign: 'left', color: 'rgba(16,25,47,0.52)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '10px 8px', borderBottom: '1px solid rgba(16,25,47,0.08)' }}>
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => {
                      const statusInfo = STATUS_LABELS[order.status] ?? STATUS_LABELS.requested;
                      const latestHandover = order.handover_codes?.[0];
                      return (
                        <tr key={order.id} style={{ background: selectedOrder?.id === order.id ? 'rgba(244,166,42,0.06)' : undefined }}>
                          <td style={{ padding: '12px 8px', borderBottom: '1px solid rgba(16,25,47,0.06)', fontSize: '0.85rem' }}>
                            <strong>{order.customer_label}</strong>
                            {order.mailbox_account && (
                              <div style={{ fontSize: '0.75rem', color: 'rgba(16,25,47,0.48)', marginTop: '2px' }}>
                                <Mail size={10} style={{ display: 'inline', verticalAlign: 'middle' }} /> {order.mailbox_account.email_address}
                              </div>
                            )}
                          </td>
                          <td style={{ padding: '12px 8px', borderBottom: '1px solid rgba(16,25,47,0.06)', fontSize: '0.85rem' }}>
                            {order.ticket_month}
                            <div style={{ fontSize: '0.72rem', color: 'rgba(16,25,47,0.4)' }}>{order.ticket_month_count}mo</div>
                          </td>
                          <td style={{ padding: '12px 8px', borderBottom: '1px solid rgba(16,25,47,0.06)', fontSize: '0.85rem', fontWeight: 700 }}>
                            {money(order.total_amount)}
                          </td>
                          <td style={{ padding: '12px 8px', borderBottom: '1px solid rgba(16,25,47,0.06)' }}>
                            <Tag tone={statusInfo.tone}>{statusInfo.text}</Tag>
                          </td>
                          <td style={{ padding: '12px 8px', borderBottom: '1px solid rgba(16,25,47,0.06)' }}>
                            {latestHandover ? <Tag tone="success">Code: {latestHandover.code}</Tag> : <span style={{ fontSize: '0.78rem', color: 'rgba(16,25,47,0.4)' }}>None</span>}
                          </td>
                          <td style={{ padding: '12px 8px', borderBottom: '1px solid rgba(16,25,47,0.06)' }}>
                            <button
                              onClick={() => setSelectedOrder(order)}
                              style={{
                                background: selectedOrder?.id === order.id ? 'var(--ink)' : 'rgba(16,25,47,0.06)',
                                border: 'none',
                                padding: '6px 10px',
                                borderRadius: 8,
                                cursor: 'pointer',
                                fontSize: '0.72rem',
                                fontWeight: 600,
                                color: selectedOrder?.id === order.id ? 'var(--paper-2)' : 'var(--ink)',
                              }}
                            >
                              Open
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {selectedOrder && (
            <Card style={{ border: '1px solid rgba(16,25,47,0.14)', background: '#fdfdfb' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--line)', paddingBottom: '14px', marginBottom: '16px' }}>
                <div>
                  <p className="eyebrow" style={{ margin: 0 }}>Order Workspace</p>
                  <h2 style={{ margin: 0, fontSize: '1.4rem' }}>{selectedOrder.customer_label}</h2>
                  <p className="muted" style={{ margin: 0, fontSize: '0.82rem' }}>{selectedOrder.ticket_month} · {money(selectedOrder.total_amount)}</p>
                </div>
                <Button className="button-secondary" onClick={() => setSelectedOrder(null)}>Close</Button>
              </div>

              <div style={{ background: '#f4efe6', padding: '14px', borderRadius: 12, border: '1px solid rgba(0,0,0,0.06)', marginBottom: '16px' }}>
                <span className="eyebrow">Status Timeline</span>
                <div style={{ display: 'flex', alignItems: 'center', marginTop: '10px', gap: '6px', fontSize: '0.78rem', overflowX: 'auto', paddingBottom: '4px', flexWrap: 'wrap' }}>
                  {STATUS_FLOW.map((status, index) => {
                    const info = STATUS_LABELS[status];
                    const isActive = selectedOrder.status === status;
                    return (
                      <span key={status} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        {index > 0 && <ArrowRight size={12} style={{ color: 'rgba(16,25,47,0.3)' }} />}
                        <span style={{ fontWeight: isActive ? 800 : 500, color: isActive ? 'var(--accent)' : 'rgba(16,25,47,0.6)' }}>
                          {info.text}
                        </span>
                      </span>
                    );
                  })}
                  {selectedOrder.status === 'exception' && <Tag tone="danger">Exception</Tag>}
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ margin: '0 0 10px' }}>Operator Actions</h4>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {selectedOrder.status === 'requested' && <Button disabled={btnLoading} onClick={() => updateStatus(selectedOrder.id, 'paid')}>Mark as Paid</Button>}
                  {selectedOrder.status === 'paid' && <Button disabled={btnLoading} onClick={() => updateStatus(selectedOrder.id, 'mailbox_assigned')}>Mark Email Assigned</Button>}
                  {selectedOrder.status === 'mailbox_assigned' && <Button disabled={btnLoading} onClick={() => updateStatus(selectedOrder.id, 'ticket_purchased')}>Mark Ticket Purchased</Button>}
                  {selectedOrder.status === 'ticket_purchased' && <Button disabled={btnLoading} onClick={() => updateStatus(selectedOrder.id, 'handover_created')}>Mark Handover Prepared</Button>}
                  {selectedOrder.status === 'handover_created' && <Button disabled={btnLoading} onClick={() => updateStatus(selectedOrder.id, 'delivered')}>Mark Delivered</Button>}
                  {selectedOrder.status === 'delivered' && <Button disabled={btnLoading} onClick={() => updateStatus(selectedOrder.id, 'closed')}>Close Order</Button>}
                  {selectedOrder.status !== 'closed' && selectedOrder.status !== 'exception' && (
                    <Button className="button-secondary" style={{ backgroundColor: 'rgba(180,35,24,0.08)', color: 'var(--danger)' }} disabled={btnLoading} onClick={() => updateStatus(selectedOrder.id, 'exception')}>
                      Trigger Exception
                    </Button>
                  )}
                  {selectedOrder.status === 'exception' && <Button disabled={btnLoading} onClick={() => updateStatus(selectedOrder.id, 'requested')}>Resolve</Button>}
                </div>
              </div>

              {selectedOrder.mailbox_account && (
                <div style={{ background: '#fbf8ef', border: '1px dashed rgba(16,25,47,0.16)', borderRadius: 14, padding: '16px', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                    <Mail size={16} style={{ color: 'var(--accent-2)' }} />
                    <h4 style={{ margin: 0 }}>Assigned Email Record</h4>
                  </div>
                  <div style={{ fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div>
                      <strong>Email:</strong>{' '}
                      <code style={{ background: 'rgba(0,0,0,0.05)', padding: '2px 6px', borderRadius: 4 }}>{selectedOrder.mailbox_account.email_address}</code>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <Tag tone="neutral">{DELIVERY_MODE_LABELS[selectedOrder.mailbox_account.delivery_mode] ?? selectedOrder.mailbox_account.delivery_mode}</Tag>
                      <Tag tone={selectedOrder.mailbox_account.delivery_mode === 'wallet_only' ? 'success' : 'warning'}>
                        {mailboxSafetyLabel(selectedOrder.mailbox_account)}
                      </Tag>
                    </div>
                    {selectedOrder.mailbox_account.customer_can_login && selectedOrder.mailbox_account.password_enc && (
                      <div>
                        <strong>Password:</strong>{' '}
                        <code style={{ background: 'rgba(0,0,0,0.05)', padding: '2px 6px', borderRadius: 4 }}>{selectedOrder.mailbox_account.password_enc}</code>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* --- Wallet Links --- */}
              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ margin: '0 0 10px' }}>Wallet Links</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div>
                    <label className="eyebrow" style={{ display: 'block', marginBottom: '4px' }}>Apple Wallet Link</label>
                    <Input
                      value={appleWalletLink}
                      onChange={(e) => setAppleWalletLink(e.target.value)}
                      placeholder="https://wallet.apple.com/..."
                    />
                    {!appleLinkValid && (
                      <p style={{ color: 'var(--warn)', fontSize: '0.75rem', margin: '4px 0 0', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <AlertTriangle size={12} /> This URL does not look like an Apple Wallet link.
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="eyebrow" style={{ display: 'block', marginBottom: '4px' }}>Google Wallet Link</label>
                    <Input
                      value={googleWalletLink}
                      onChange={(e) => setGoogleWalletLink(e.target.value)}
                      placeholder="https://pay.google.com/..."
                    />
                    {!googleLinkValid && (
                      <p style={{ color: 'var(--warn)', fontSize: '0.75rem', margin: '4px 0 0', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <AlertTriangle size={12} /> This URL does not look like a Google Wallet link.
                      </p>
                    )}
                  </div>
                  <Button
                    className="button-secondary"
                    disabled={btnLoading}
                    onClick={handleSaveWalletLinks}
                    style={{ alignSelf: 'flex-start', minHeight: '36px', padding: '0 12px' }}
                  >
                    Save Wallet Links
                  </Button>
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <h4 style={{ margin: 0 }}>Handover Codes</h4>
                  {selectedOrder.mailbox_account_id && (
                    <Button className="button-secondary" disabled={btnLoading} onClick={() => handleGenerateHandover(selectedOrder.id)} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', minHeight: '36px', padding: '0 12px' }}>
                      <LinkIcon size={14} />
                      Generate Wallet Handover
                    </Button>
                  )}
                </div>

                {!selectedOrder.mailbox_account_id && (
                  <div style={{ border: '1px dashed var(--line)', padding: '16px', borderRadius: 14, textAlign: 'center', color: 'gray', fontSize: '0.85rem' }}>
                    Assign an operator-controlled email record before generating handover codes.
                  </div>
                )}

                {selectedOrder.handover_codes && selectedOrder.handover_codes.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {selectedOrder.handover_codes.map((handover) => {
                      const handoverUrl = `${window.location.origin}/#/h/${handover.code}`;
                      return (
                        <div key={handover.id} style={{ background: '#f0faf0', border: '1px solid rgba(13,138,97,0.15)', borderRadius: 14, padding: '16px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                            <div>
                              <Tag tone={handover.status === 'pending' ? 'neutral' : handover.status === 'viewed' ? 'warning' : 'success'}>{handover.status}</Tag>
                              <span style={{ marginLeft: '8px', fontWeight: 700, fontFamily: 'monospace', fontSize: '1rem' }}>{handover.code}</span>
                            </div>
                            <span style={{ fontSize: '0.72rem', color: 'rgba(16,25,47,0.4)' }}>{new Date(handover.created_at).toLocaleString()}</span>
                          </div>
                          <div style={{ display: 'flex', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
                            <button onClick={() => triggerCopy(handoverUrl, `url-${handover.id}`)} style={{ background: 'rgba(16,25,47,0.06)', border: 'none', padding: '6px 10px', borderRadius: 8, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', fontWeight: 600 }}>
                              {copyState[`url-${handover.id}`] ? <Check size={12} style={{ color: 'var(--good)' }} /> : <LinkIcon size={12} />}
                              {copyState[`url-${handover.id}`] ? 'Copied!' : 'Copy Link'}
                            </button>
                            <button onClick={() => triggerCopy(handover.instructions, `text-${handover.id}`)} style={{ background: 'rgba(16,25,47,0.06)', border: 'none', padding: '6px 10px', borderRadius: 8, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', fontWeight: 600 }}>
                              {copyState[`text-${handover.id}`] ? <Check size={12} style={{ color: 'var(--good)' }} /> : <Copy size={12} />}
                              {copyState[`text-${handover.id}`] ? 'Copied!' : 'Copy Text'}
                            </button>
                          </div>
                          <textarea readOnly value={handover.instructions} style={{ width: '100%', height: '160px', padding: '10px', border: '1px solid rgba(16,25,47,0.08)', borderRadius: 10, fontFamily: 'monospace', fontSize: '0.75rem', lineHeight: '1.4', resize: 'vertical', background: 'white' }} />
                        </div>
                      );
                    })}
                  </div>
                ) : selectedOrder.mailbox_account_id ? (
                  <div style={{ border: '1px dashed var(--line)', padding: '16px', borderRadius: 14, textAlign: 'center', color: 'gray', fontSize: '0.85rem' }}>
                    No handover code yet. Generate one after the official Wallet links are ready.
                  </div>
                ) : null}
              </div>

              {/* --- Wallet Delivery Pack --- */}
              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ margin: '0 0 10px' }}>Wallet Delivery Pack</h4>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
                  <button
                    onClick={() => {
                      const text = generateShortDeliveryPack(selectedOrder);
                      triggerCopy(text, 'pack-short');
                      void logDeliveryPackCopy('short', selectedOrder.id, selectedOrder.handover_codes?.[0]?.code ?? null);
                    }}
                    style={copyButtonStyle}
                  >
                    {copyState['pack-short'] ? <Check size={12} style={{ color: 'var(--good)' }} /> : <Copy size={12} />}
                    {copyState['pack-short'] ? '已复制' : '复制极简文案'}
                  </button>
                  <button
                    onClick={() => {
                      const text = generateDetailedDeliveryPack(selectedOrder);
                      triggerCopy(text, 'pack-detailed');
                      void logDeliveryPackCopy('detailed', selectedOrder.id, selectedOrder.handover_codes?.[0]?.code ?? null);
                    }}
                    style={copyButtonStyle}
                  >
                    {copyState['pack-detailed'] ? <Check size={12} style={{ color: 'var(--good)' }} /> : <Copy size={12} />}
                    {copyState['pack-detailed'] ? '已复制' : '复制详细文案'}
                  </button>
                  <button
                    onClick={() => {
                      const text = generateTroubleshootPack(selectedOrder);
                      triggerCopy(text, 'pack-troubleshoot');
                      void logDeliveryPackCopy('troubleshoot', selectedOrder.id, selectedOrder.handover_codes?.[0]?.code ?? null);
                    }}
                    style={copyButtonStyle}
                  >
                    {copyState['pack-troubleshoot'] ? <Check size={12} style={{ color: 'var(--good)' }} /> : <Copy size={12} />}
                    {copyState['pack-troubleshoot'] ? '已复制' : '复制售后文案'}
                  </button>
                </div>

                <details style={{ marginBottom: '12px' }}>
                  <summary style={{ cursor: 'pointer', fontSize: '0.82rem', color: 'var(--muted)' }}>Preview templates</summary>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
                    {[
                      { label: '极简交付文案', text: generateShortDeliveryPack(selectedOrder) },
                      { label: '详细交付文案', text: generateDetailedDeliveryPack(selectedOrder) },
                      { label: '售后排障文案', text: generateTroubleshootPack(selectedOrder) },
                    ].map(({ label, text }) => (
                      <div key={label}>
                        <p className="eyebrow" style={{ margin: '0 0 4px' }}>{label}</p>
                        <textarea
                          readOnly
                          value={text}
                          style={{
                            width: '100%',
                            height: '140px',
                            padding: '10px',
                            border: '1px solid rgba(16,25,47,0.08)',
                            borderRadius: 10,
                            fontFamily: 'monospace',
                            fontSize: '0.75rem',
                            lineHeight: '1.4',
                            resize: 'vertical',
                            background: 'white',
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </details>

                <div style={{ background: '#f4efe6', padding: '14px', borderRadius: 12, border: '1px solid rgba(0,0,0,0.06)' }}>
                  <span className="eyebrow">Pre-delivery Checklist</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px', fontSize: '0.85rem' }}>
                    {[
                      { key: 'passenger_name_confirmed', label: '乘车人姓名已确认' },
                      { key: 'ticket_month_confirmed', label: '车票月份已确认' },
                      { key: 'wallet_links_present', label: 'Wallet 链接来自官方邮件/App/网页' },
                      { key: 'no_custom_pkpass', label: '没有发送自制 pkpass' },
                      { key: 'no_qr_only', label: '没有只发二维码截图' },
                      { key: 'risk_reviewed', label: '已记录付款/订阅风险' },
                      { key: 'handover_code_generated', label: '已生成交付码' },
                      { key: 'delivery_pack_sent', label: '已发送客户交付包' },
                    ].map(({ key, label }) => (
                      <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={checklist[key]}
                          onChange={(e) => setChecklist((prev) => ({ ...prev, [key]: e.target.checked }))}
                          style={{ width: 18, height: 18, accentColor: 'var(--accent)' }}
                        />
                        <span style={{ textDecoration: checklist[key] ? 'line-through' : 'none', color: checklist[key] ? 'var(--muted)' : 'inherit' }}>
                          {label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--line)', paddingTop: '16px' }}>
                <h4 style={{ margin: '0 0 10px' }}>Customer Metadata</h4>
                <div style={{ fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div><span className="muted" style={{ display: 'block', fontSize: '0.75rem' }}>Passenger Name</span><strong>{selectedOrder.passenger_name || 'N/A'}</strong></div>
                  <div><span className="muted" style={{ display: 'block', fontSize: '0.75rem' }}>Passenger Birthdate</span><strong>{selectedOrder.passenger_birthdate || 'N/A'}</strong></div>
                  <div><span className="muted" style={{ display: 'block', fontSize: '0.75rem' }}>Contact</span><strong>{selectedOrder.customer_contact || 'N/A'}</strong></div>
                  <div><span className="muted" style={{ display: 'block', fontSize: '0.75rem' }}>Ticket Month</span><strong>{selectedOrder.ticket_month}</strong></div>
                  <div><span className="muted" style={{ display: 'block', fontSize: '0.75rem' }}>Start Date</span><strong>{selectedOrder.start_date ? new Date(selectedOrder.start_date).toLocaleDateString() : 'N/A'}</strong></div>
                  <div>
                    <span className="muted" style={{ display: 'block', fontSize: '0.75rem' }}>10th-Day Rule</span>
                    <Tag tone={selectedOrder.after_tenth_day ? 'warning' : 'success'}>{selectedOrder.after_tenth_day ? 'After 10th (2 Months)' : 'Before 10th (1 Month)'}</Tag>
                  </div>
                  <div style={{ borderTop: '1px solid var(--line)', paddingTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span className="muted">Base price:</span><span>{money(selectedOrder.ticket_price_total)}</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span className="muted">Service fee:</span><span>{money(selectedOrder.service_fee)}</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}><span>Total:</span><span>{money(selectedOrder.total_amount)}</span></div>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
