import { useEffect, useState, useCallback } from 'react';
import { Button } from '../../core/ui/Button';
import { Card } from '../../core/ui/Card';
import { Input } from '../../core/ui/Input';
import { Tag } from '../../core/ui/Tag';
import { supabase, WEBMAIL_URL } from '../../lib/supabase';
import {
  ClipboardList, Plus, Mail, Copy, Check, Wallet,
  ArrowRight, Info, RefreshCw, Link as LinkIcon
} from 'lucide-react';

const TICKET_PRICE_PER_MONTH = 63.0;

type OrderStatus =
  | 'requested'
  | 'paid'
  | 'mailbox_assigned'
  | 'ticket_purchased'
  | 'handover_created'
  | 'delivered'
  | 'closed'
  | 'exception';

interface MailboxAccount {
  id: string;
  email_address: string;
  password_enc: string;
  domain: string;
  status: string;
}

interface HandoverCode {
  id: string;
  order_id: string;
  code: string;
  instructions: string;
  status: string;
  viewed_at: string | null;
  created_at: string;
}

interface Order {
  id: string;
  operator_id: string;
  customer_label: string;
  customer_contact: string | null;
  passenger_name: string | null;
  passenger_birthdate: string | null;
  ticket_month: string | null;
  start_date: string | null;
  after_tenth_day: boolean;
  ticket_month_count: number;
  ticket_price_total: number;
  service_fee: number;
  total_amount: number;
  status: OrderStatus;
  mailbox_account_id: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  mailbox_account?: MailboxAccount;
  handover_codes?: HandoverCode[];
}

const STATUS_LABELS: Record<OrderStatus, { text: string; tone: 'neutral' | 'success' | 'warning' | 'danger' }> = {
  requested:          { text: 'Requested',          tone: 'neutral' },
  paid:               { text: 'Paid',               tone: 'warning' },
  mailbox_assigned:   { text: 'Mailbox Assigned',   tone: 'warning' },
  ticket_purchased:   { text: 'Ticket Purchased',   tone: 'success' },
  handover_created:   { text: 'Handover Created',   tone: 'success' },
  delivered:          { text: 'Delivered',           tone: 'success' },
  closed:             { text: 'Closed',              tone: 'neutral' },
  exception:          { text: 'Exception',           tone: 'danger' },
};

const STATUS_FLOW: OrderStatus[] = [
  'requested', 'paid', 'mailbox_assigned', 'ticket_purchased', 'handover_created', 'delivered', 'closed',
];

function getTicketMonth(startDate: string): string {
  const d = new Date(startDate);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

function calculatePricing(startDate: string, serviceFee: number) {
  const d = new Date(startDate);
  const day = d.getDate();
  const after10th = day > 10;
  const monthCount = after10th ? 2 : 1;
  const ticketPrice = monthCount * TICKET_PRICE_PER_MONTH;
  return {
    after10th,
    monthCount,
    ticketPrice,
    total: ticketPrice + serviceFee,
  };
}

function buildHandoverText(order: Order): string {
  const mailbox = order.mailbox_account;
  if (!mailbox) return '';

  const fullEmail = mailbox.email_address;
  const localPart = fullEmail.split('@')[0] ?? '';
  const domain = mailbox.domain;
  const password = mailbox.password_enc;
  const webmailUrl = WEBMAIL_URL;
  const guideUrl = `${window.location.origin}/#/guide`;
  const rulesUrl = `${window.location.origin}/#/rules`;

  return [
    `=== D-Ticket Mailbox Handover ===`,
    ``,
    `Hello! Your D-Ticket mailbox is ready.`,
    ``,
    `--- Mailbox Login ---`,
    `Webmail URL: ${webmailUrl}`,
    `Username (for webmail): ${localPart}`,
    `Full email (for TicketPlus+ login): ${fullEmail}`,
    `Password: ${password}`,
    ``,
    `--- Quick Start ---`,
    `1. Open the webmail link above and log in with your username and password.`,
    `2. Download the TicketPlus+ app from your app store.`,
    `3. In TicketPlus+, choose "Email Login" and enter the FULL email: ${fullEmail}`,
    `4. TicketPlus+ will send an OTP code to your mailbox — find it in the webmail inbox.`,
    `5. Enter the OTP in TicketPlus+ to complete login.`,
    `6. Your Deutschlandticket QR code will appear in the app.`,
    ``,
    `--- Important Rules ---`,
    `- Your ticket is personal and non-transferable. The name on the ticket must match your ID.`,
    `- Keep your ID with you when traveling. Inspectors may check it.`,
    `- To cancel for next month, you must request before the 10th of the current month.`,
    `- After the 10th, the next month's subscription is already locked in.`,
    ``,
    `--- Links ---`,
    `Login Guide: ${guideUrl}`,
    `Rules & Billing: ${rulesUrl}`,
    ``,
    `--- Disclaimer ---`,
    `This is an independent mailbox hosting and purchase assistance service.`,
    `We are NOT affiliated with Deutsche Bahn, TicketPlus+, or any official transport provider.`,
    ``,
    `If you have questions, contact us via WeChat.`,
  ].join('\n');
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [mailboxes, setMailboxes] = useState<MailboxAccount[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [btnLoading, setBtnLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [copyState, setCopyState] = useState<Record<string, boolean>>({});

  // Form state
  const [customerLabel, setCustomerLabel] = useState('');
  const [customerContact, setCustomerContact] = useState('');
  const [passengerName, setPassengerName] = useState('');
  const [passengerBirthdate, setPassengerBirthdate] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [serviceFee, setServiceFee] = useState(10.0);
  const [selectedMailboxId, setSelectedMailboxId] = useState('');

  const pricing = calculatePricing(startDate, serviceFee);

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
    loadOrders();
    loadMailboxes();
  }, [loadOrders, loadMailboxes]);

  async function handleCreateOrder(e: React.FormEvent) {
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

    const insertPayload = {
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
      status: 'requested' as const,
      mailbox_account_id: selectedMailboxId || null,
    };

    const { error: insertError } = await supabase
      .from('orders')
      .insert(insertPayload);

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
      // Update selected order if it was the one changed
      if (selectedOrder?.id === orderId) {
        const { data } = await supabase
          .from('orders')
          .select(`*, mailbox_account:mailbox_account_id(*), handover_codes(*)`)
          .eq('id', orderId)
          .single();
        if (data) setSelectedOrder(data as unknown as Order);
      }
    }
    setBtnLoading(false);
  }

  async function handleGenerateHandover(orderId: string) {
    setBtnLoading(true);
    setErrorMsg('');

    // Get the order with mailbox data
    const { data: orderData } = await supabase
      .from('orders')
      .select(`*, mailbox_account:mailbox_account_id(*)`)
      .eq('id', orderId)
      .single();

    if (!orderData) {
      setErrorMsg('Order not found');
      setBtnLoading(false);
      return;
    }

    const order = orderData as unknown as Order;
    const instructions = buildHandoverText(order);

    // Generate code via RPC
    const { data: code, error: rpcError } = await supabase
      .rpc('generate_handover_code');

    if (rpcError || !code) {
      setErrorMsg(rpcError?.message ?? 'Failed to generate code');
      setBtnLoading(false);
      return;
    }

    // Insert handover code
    const { error: insertError } = await supabase
      .from('handover_codes')
      .insert({
        order_id: orderId,
        code: code as string,
        instructions,
      });

    if (insertError) {
      setErrorMsg(insertError.message);
    } else {
      await loadOrders();
      // Refresh selected order
      const { data: refreshed } = await supabase
        .from('orders')
        .select(`*, mailbox_account:mailbox_account_id(*), handover_codes(*)`)
        .eq('id', orderId)
        .single();
      if (refreshed) setSelectedOrder(refreshed as unknown as Order);
    }
    setBtnLoading(false);
  }

  function triggerCopy(text: string, key: string) {
    navigator.clipboard.writeText(text);
    setCopyState((prev) => ({ ...prev, [key]: true }));
    setTimeout(() => setCopyState((prev) => ({ ...prev, [key]: false })), 2000);
  }

  function selectOrder(order: Order) {
    setSelectedOrder(order);
  }

  const selectedMailbox = mailboxes.find((m) => m.id === selectedMailboxId);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {errorMsg && (
        <p style={{ color: 'var(--danger)', fontSize: '0.85rem', margin: 0, padding: '10px 14px', background: 'rgba(180,35,24,0.06)', borderRadius: 10 }}>
          {errorMsg}
        </p>
      )}

      <div className="admin-grid-2col">
        {/* Left Column: Create Order + Pricing */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <Card>
            <div style={{ marginBottom: '16px' }}>
              <p className="eyebrow">Operations Desk</p>
              <h3>Create Order</h3>
              <p className="muted" style={{ fontSize: '0.82rem' }}>Register a new customer order.</p>
            </div>

            <form onSubmit={handleCreateOrder} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label className="eyebrow" style={{ display: 'block', marginBottom: '4px' }}>WeChat Label *</label>
                <Input
                  value={customerLabel}
                  onChange={(e) => setCustomerLabel(e.target.value)}
                  placeholder="e.g. 微信号/昵称"
                  required
                />
              </div>
              <div>
                <label className="eyebrow" style={{ display: 'block', marginBottom: '4px' }}>Contact Details</label>
                <Input
                  value={customerContact}
                  onChange={(e) => setCustomerContact(e.target.value)}
                  placeholder="e.g. wxid_xxxx"
                />
              </div>
              <div>
                <label className="eyebrow" style={{ display: 'block', marginBottom: '4px' }}>Passenger Name</label>
                <Input
                  value={passengerName}
                  onChange={(e) => setPassengerName(e.target.value)}
                  placeholder="e.g. SAN ZHANG"
                />
              </div>
              <div>
                <label className="eyebrow" style={{ display: 'block', marginBottom: '4px' }}>Passenger Birthdate</label>
                <Input
                  value={passengerBirthdate}
                  onChange={(e) => setPassengerBirthdate(e.target.value)}
                  placeholder="e.g. 1995-10-24"
                />
              </div>
              <div>
                <label className="eyebrow" style={{ display: 'block', marginBottom: '4px' }}>D-Ticket Start Date</label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <label className="eyebrow" style={{ display: 'block', marginBottom: '4px' }}>Service Fee (EUR)</label>
                <Input
                  type="number"
                  step="0.01"
                  value={serviceFee}
                  onChange={(e) => setServiceFee(Number(e.target.value))}
                />
              </div>
              <div>
                <label className="eyebrow" style={{ display: 'block', marginBottom: '4px' }}>Assign Mailbox</label>
                <select
                  value={selectedMailboxId}
                  onChange={(e) => setSelectedMailboxId(e.target.value)}
                  style={{
                    width: '100%', minHeight: 44, padding: '0 14px', borderRadius: 14,
                    border: '1px solid rgba(16,25,47,0.16)', background: 'rgba(255,255,255,0.62)',
                    outline: 'none', fontFamily: 'inherit', fontSize: '0.9rem',
                  }}
                >
                  <option value="">— No mailbox —</option>
                  {mailboxes.map((mb) => (
                    <option key={mb.id} value={mb.id}>{mb.email_address}</option>
                  ))}
                </select>
                {selectedMailbox && (
                  <p className="muted" style={{ fontSize: '0.78rem', marginTop: '4px' }}>
                    Will assign: <strong>{selectedMailbox.email_address}</strong>
                  </p>
                )}
              </div>

              <Button type="submit" disabled={btnLoading} style={{ marginTop: '4px', width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <Plus size={16} />
                {btnLoading ? 'Creating…' : 'Create Order'}
              </Button>
            </form>
          </Card>

          {/* Pricing Calculator */}
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
                  {pricing.monthCount} Month{pricing.monthCount > 1 ? 's' : ''} {pricing.after10th ? '(Current + Next)' : '(Current Only)'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#94a3b8' }}>
                <span>Base D-Ticket Price (63.00€/mo)</span>
                <span>{pricing.ticketPrice.toFixed(2)} €</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#94a3b8' }}>
                <span>Operator Service Fee</span>
                <span>{serviceFee.toFixed(2)} €</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1rem', color: '#ffd18d', paddingTop: '4px' }}>
                <span>Estimated Total</span>
                <span>{pricing.total.toFixed(2)} €</span>
              </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '10px', marginTop: '12px', display: 'flex', gap: '8px', fontSize: '0.78rem', border: '1px solid rgba(255,255,255,0.06)' }}>
              <Info size={16} style={{ flexShrink: 0, color: '#f4a62a' }} />
              <p style={{ margin: 0, color: '#cbd5e1', lineHeight: '1.4' }}>
                <strong>D-Ticket billing policy:</strong> Subscriptions must be cancelled by the 10th. Orders after the 10th require payment for 2 months because cancellation affects the next month.
              </p>
            </div>
          </Card>
        </div>

        {/* Right Column: Orders List + Detail */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Orders List */}
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <h3 style={{ margin: 0 }}>Orders Ledger</h3>
              <Button onClick={loadOrders} className="button-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', minHeight: '36px', padding: '0 12px' }}>
                <RefreshCw size={14} />
                Refresh
              </Button>
            </div>

            {loading ? (
              <div className="empty-state" style={{ minHeight: 160 }}>Loading…</div>
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
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', color: 'rgba(16,25,47,0.52)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '10px 8px', borderBottom: '1px solid rgba(16,25,47,0.08)' }}>Customer</th>
                      <th style={{ textAlign: 'left', color: 'rgba(16,25,47,0.52)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '10px 8px', borderBottom: '1px solid rgba(16,25,47,0.08)' }}>Month</th>
                      <th style={{ textAlign: 'left', color: 'rgba(16,25,47,0.52)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '10px 8px', borderBottom: '1px solid rgba(16,25,47,0.08)' }}>Total</th>
                      <th style={{ textAlign: 'left', color: 'rgba(16,25,47,0.52)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '10px 8px', borderBottom: '1px solid rgba(16,25,47,0.08)' }}>Status</th>
                      <th style={{ textAlign: 'left', color: 'rgba(16,25,47,0.52)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '10px 8px', borderBottom: '1px solid rgba(16,25,47,0.08)' }}>Handover</th>
                      <th style={{ padding: '10px 8px', borderBottom: '1px solid rgba(16,25,47,0.08)' }} />
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => {
                      const statusInfo = STATUS_LABELS[order.status] ?? STATUS_LABELS.requested;
                      const hasHandover = (order.handover_codes?.length ?? 0) > 0;
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
                            {order.total_amount.toFixed(2)}€
                          </td>
                          <td style={{ padding: '12px 8px', borderBottom: '1px solid rgba(16,25,47,0.06)' }}>
                            <Tag tone={statusInfo.tone}>{statusInfo.text}</Tag>
                          </td>
                          <td style={{ padding: '12px 8px', borderBottom: '1px solid rgba(16,25,47,0.06)' }}>
                            {hasHandover ? (
                              <Tag tone="success">Code: {order.handover_codes![0].code}</Tag>
                            ) : (
                              <span style={{ fontSize: '0.78rem', color: 'rgba(16,25,47,0.4)' }}>—</span>
                            )}
                          </td>
                          <td style={{ padding: '12px 8px', borderBottom: '1px solid rgba(16,25,47,0.06)' }}>
                            <button
                              onClick={() => selectOrder(order)}
                              style={{
                                background: selectedOrder?.id === order.id ? 'var(--ink)' : 'rgba(16,25,47,0.06)',
                                border: 'none', padding: '6px 10px', borderRadius: 8,
                                cursor: 'pointer', fontSize: '0.72rem', fontWeight: 600,
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

          {/* Selected Order Detail */}
          {selectedOrder && (
            <Card style={{ border: '1px solid rgba(16,25,47,0.14)', background: '#fdfdfb' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--line)', paddingBottom: '14px', marginBottom: '16px' }}>
                <div>
                  <p className="eyebrow" style={{ margin: 0 }}>Order Workspace</p>
                  <h2 style={{ margin: 0, fontSize: '1.4rem' }}>{selectedOrder.customer_label}</h2>
                  <p className="muted" style={{ margin: 0, fontSize: '0.82rem' }}>{selectedOrder.ticket_month} · {selectedOrder.total_amount.toFixed(2)} €</p>
                </div>
                <Button className="button-secondary" onClick={() => setSelectedOrder(null)}>Close</Button>
              </div>

              {/* Status Timeline */}
              <div style={{ background: '#f4efe6', padding: '14px', borderRadius: 12, border: '1px solid rgba(0,0,0,0.06)', marginBottom: '16px' }}>
                <span className="eyebrow">Status Timeline</span>
                <div style={{ display: 'flex', alignItems: 'center', marginTop: '10px', gap: '6px', fontSize: '0.78rem', overflowX: 'auto', paddingBottom: '4px', flexWrap: 'wrap' }}>
                  {STATUS_FLOW.map((s, i) => {
                    const info = STATUS_LABELS[s];
                    const isActive = selectedOrder.status === s;
                    const isException = selectedOrder.status === 'exception';
                    return (
                      <span key={s} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        {i > 0 && <ArrowRight size={12} style={{ color: 'rgba(16,25,47,0.3)' }} />}
                        <span style={{ fontWeight: isActive ? 800 : 500, color: isActive ? 'var(--accent)' : isException && i === 0 ? 'var(--danger)' : 'rgba(16,25,47,0.6)' }}>
                          {info.text}
                        </span>
                      </span>
                    );
                  })}
                  {selectedOrder.status === 'exception' && (
                    <>
                      <ArrowRight size={12} style={{ color: 'rgba(16,25,47,0.3)' }} />
                      <Tag tone="danger">Exception</Tag>
                    </>
                  )}
                </div>
              </div>

              {/* Operator Actions */}
              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ margin: '0 0 10px' }}>Operator Actions</h4>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {selectedOrder.status === 'requested' && (
                    <Button disabled={btnLoading} onClick={() => updateStatus(selectedOrder.id, 'paid')}>
                      Mark as Paid
                    </Button>
                  )}
                  {selectedOrder.status === 'paid' && (
                    <Button disabled={btnLoading} onClick={() => updateStatus(selectedOrder.id, 'mailbox_assigned')}>
                      Mark Mailbox Assigned
                    </Button>
                  )}
                  {selectedOrder.status === 'mailbox_assigned' && (
                    <Button disabled={btnLoading} onClick={() => updateStatus(selectedOrder.id, 'ticket_purchased')}>
                      Mark Ticket Purchased
                    </Button>
                  )}
                  {selectedOrder.status === 'ticket_purchased' && (
                    <Button disabled={btnLoading} onClick={() => updateStatus(selectedOrder.id, 'handover_created')}>
                      Mark Handover Created
                    </Button>
                  )}
                  {selectedOrder.status === 'handover_created' && (
                    <Button disabled={btnLoading} onClick={() => updateStatus(selectedOrder.id, 'delivered')}>
                      Mark Delivered
                    </Button>
                  )}
                  {selectedOrder.status === 'delivered' && (
                    <Button disabled={btnLoading} onClick={() => updateStatus(selectedOrder.id, 'closed')}>
                      Close Order
                    </Button>
                  )}
                  {selectedOrder.status !== 'closed' && selectedOrder.status !== 'exception' && (
                    <Button
                      className="button-secondary"
                      style={{ backgroundColor: 'rgba(180,35,24,0.08)', color: 'var(--danger)' }}
                      disabled={btnLoading}
                      onClick={() => updateStatus(selectedOrder.id, 'exception')}
                    >
                      Trigger Exception
                    </Button>
                  )}
                  {selectedOrder.status === 'exception' && (
                    <Button disabled={btnLoading} onClick={() => updateStatus(selectedOrder.id, 'requested')}>
                      Resolve (Reset to Requested)
                    </Button>
                  )}
                </div>
              </div>

              {/* Mailbox Info */}
              {selectedOrder.mailbox_account && (
                <Card style={{ background: '#fbf8ef', border: '1px dashed rgba(16,25,47,0.16)', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                    <Mail size={16} style={{ color: 'var(--accent-2)' }} />
                    <h4 style={{ margin: 0 }}>Assigned Mailbox</h4>
                  </div>
                  <div style={{ fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div>
                      <strong>Email:</strong>{' '}
                      <code style={{ background: 'rgba(0,0,0,0.05)', padding: '2px 6px', borderRadius: 4 }}>{selectedOrder.mailbox_account.email_address}</code>
                    </div>
                    <div>
                      <strong>Password:</strong>{' '}
                      <code style={{ background: 'rgba(0,0,0,0.05)', padding: '2px 6px', borderRadius: 4 }}>{selectedOrder.mailbox_account.password_enc}</code>
                    </div>
                  </div>
                </Card>
              )}

              {/* Handover Section */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <h4 style={{ margin: 0 }}>Handover Codes</h4>
                  {selectedOrder.mailbox_account_id && (
                    <Button
                      className="button-secondary"
                      disabled={btnLoading}
                      onClick={() => handleGenerateHandover(selectedOrder.id)}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', minHeight: '36px', padding: '0 12px' }}
                    >
                      <LinkIcon size={14} />
                      Generate Handover Code
                    </Button>
                  )}
                </div>

                {!selectedOrder.mailbox_account_id && (
                  <div style={{ border: '1px dashed var(--line)', padding: '16px', borderRadius: 14, textAlign: 'center', color: 'gray', fontSize: '0.85rem' }}>
                    Assign a mailbox to this order before generating handover codes.
                  </div>
                )}

                {selectedOrder.handover_codes && selectedOrder.handover_codes.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {selectedOrder.handover_codes.map((hc) => {
                      const handoverUrl = `${window.location.origin}/#/h/${hc.code}`;
                      return (
                        <Card key={hc.id} style={{ background: '#f0faf0', border: '1px solid rgba(13,138,97,0.15)', padding: '16px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                            <div>
                              <Tag tone={hc.status === 'pending' ? 'neutral' : hc.status === 'viewed' ? 'warning' : 'success'}>{hc.status}</Tag>
                              <span style={{ marginLeft: '8px', fontWeight: 700, fontFamily: 'monospace', fontSize: '1rem' }}>{hc.code}</span>
                            </div>
                            <span style={{ fontSize: '0.72rem', color: 'rgba(16,25,47,0.4)' }}>
                              {new Date(hc.created_at).toLocaleString()}
                            </span>
                          </div>

                          <div style={{ display: 'flex', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
                            <button
                              onClick={() => triggerCopy(handoverUrl, `url-${hc.id}`)}
                              style={{ background: 'rgba(16,25,47,0.06)', border: 'none', padding: '6px 10px', borderRadius: 8, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', fontWeight: 600 }}
                            >
                              {copyState[`url-${hc.id}`] ? <Check size={12} style={{ color: 'var(--good)' }} /> : <LinkIcon size={12} />}
                              {copyState[`url-${hc.id}`] ? 'Copied!' : 'Copy Link'}
                            </button>
                            <button
                              onClick={() => triggerCopy(hc.instructions, `text-${hc.id}`)}
                              style={{ background: 'rgba(16,25,47,0.06)', border: 'none', padding: '6px 10px', borderRadius: 8, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', fontWeight: 600 }}
                            >
                              {copyState[`text-${hc.id}`] ? <Check size={12} style={{ color: 'var(--good)' }} /> : <Copy size={12} />}
                              {copyState[`text-${hc.id}`] ? 'Copied!' : 'Copy Handover Text'}
                            </button>
                          </div>

                          <textarea
                            readOnly
                            value={hc.instructions}
                            style={{
                              width: '100%', height: '160px', padding: '10px', border: '1px solid rgba(16,25,47,0.08)',
                              borderRadius: 10, fontFamily: 'monospace', fontSize: '0.75rem',
                              lineHeight: '1.4', resize: 'vertical', background: 'white',
                            }}
                          />
                        </Card>
                      );
                    })}
                  </div>
                ) : selectedOrder.mailbox_account_id ? (
                  <div style={{ border: '1px dashed var(--line)', padding: '16px', borderRadius: 14, textAlign: 'center', color: 'gray', fontSize: '0.85rem' }}>
                    No handover code yet. Click "Generate Handover Code" above.
                  </div>
                ) : null}
              </div>

              {/* Customer Metadata */}
              <div style={{ borderTop: '1px solid var(--line)', paddingTop: '16px' }}>
                <h4 style={{ margin: '0 0 10px' }}>Customer Metadata</h4>
                <div style={{ fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div>
                    <span className="muted" style={{ display: 'block', fontSize: '0.75rem' }}>Passenger Name</span>
                    <strong>{selectedOrder.passenger_name || 'N/A'}</strong>
                  </div>
                  <div>
                    <span className="muted" style={{ display: 'block', fontSize: '0.75rem' }}>Passenger Birthdate</span>
                    <strong>{selectedOrder.passenger_birthdate || 'N/A'}</strong>
                  </div>
                  <div>
                    <span className="muted" style={{ display: 'block', fontSize: '0.75rem' }}>Contact</span>
                    <strong>{selectedOrder.customer_contact || 'N/A'}</strong>
                  </div>
                  <div>
                    <span className="muted" style={{ display: 'block', fontSize: '0.75rem' }}>Ticket Month</span>
                    <strong>{selectedOrder.ticket_month}</strong>
                  </div>
                  <div style={{ borderTop: '1px solid var(--line)', paddingTop: '8px' }}>
                    <span className="muted" style={{ display: 'block', fontSize: '0.75rem' }}>Start Date</span>
                    <strong>{selectedOrder.start_date ? new Date(selectedOrder.start_date).toLocaleDateString() : 'N/A'}</strong>
                  </div>
                  <div>
                    <span className="muted" style={{ display: 'block', fontSize: '0.75rem' }}>10th-Day Rule</span>
                    <Tag tone={selectedOrder.after_tenth_day ? 'warning' : 'success'}>
                      {selectedOrder.after_tenth_day ? 'After 10th (2 Months)' : 'Before 10th (1 Month)'}
                    </Tag>
                  </div>
                  <div style={{ borderTop: '1px solid var(--line)', paddingTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span className="muted">Base price ({selectedOrder.ticket_month_count} mo):</span>
                      <span>{selectedOrder.ticket_price_total.toFixed(2)} €</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span className="muted">Service fee:</span>
                      <span>{selectedOrder.service_fee.toFixed(2)} €</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                      <span>Total:</span>
                      <span>{selectedOrder.total_amount.toFixed(2)} €</span>
                    </div>
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
