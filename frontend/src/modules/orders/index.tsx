import { useEffect, useState } from 'react';
import { Button } from '../../core/ui/Button';
import { Card } from '../../core/ui/Card';
import { Input } from '../../core/ui/Input';
import { Table } from '../../core/ui/Table';
import { Tag } from '../../core/ui/Tag';
import { 
  ClipboardList, Plus, Mail, KeyRound, Copy, Check, Calendar, User, 
  Wallet, AlertTriangle, Clock, ExternalLink, ShieldAlert, CheckCircle2,
  ArrowRight, Info
} from 'lucide-react';

interface MailboxRecord {
  id: number;
  local_part: string;
  domain: string;
  full_email: string;
  password: string;
  created_at: string;
  handed_over_at?: string;
}

interface AuditLog {
  id: number;
  action: string;
  metadata_json?: string;
  created_at: string;
}

interface Order {
  id: number;
  order_code: string;
  customer_label: string;
  customer_contact?: string;
  passenger_name?: string;
  passenger_birthdate?: string;
  ticket_month?: string;
  start_date?: string;
  after_tenth_day: boolean;
  ticket_month_count: number;
  ticket_price_total: number;
  service_fee: number;
  total_amount: number;
  status: string;
  created_at: string;
  updated_at: string;
  delivered_at?: string;
  mailbox_record?: MailboxRecord;
  audit_logs: AuditLog[];
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  
  // Form State
  const [customerLabel, setCustomerLabel] = useState('');
  const [customerContact, setCustomerContact] = useState('');
  const [passengerName, setPassengerName] = useState('');
  const [passengerBirthdate, setPassengerBirthdate] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [serviceFee, setServiceFee] = useState(10.0);
  
  const [handoverText, setHandoverText] = useState('');
  const [copying, setCopying] = useState(false);
  const [btnLoading, setBtnLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // 10th-day Pricing calculator helper for UI
  const calculateUiPrice = () => {
    if (!startDate) return { months: 1, ticketPrice: 63.0, total: 63.0 + serviceFee, after10th: false };
    const dateObj = new Date(startDate);
    const day = dateObj.getDate();
    const after10th = day > 10;
    const months = after10th ? 2 : 1;
    const ticketPrice = months * 63.0;
    return {
      months,
      ticketPrice,
      total: ticketPrice + Number(serviceFee),
      after10th
    };
  };

  const uiPrice = calculateUiPrice();

  async function loadOrders() {
    try {
      const res = await fetch('/api/orders');
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
        // Refresh selected order if it is currently displayed
        if (selectedOrder) {
          const updated = data.find((o: Order) => o.id === selectedOrder.id);
          if (updated) {
            setSelectedOrder(updated);
            if (updated.mailbox_record) {
              loadHandoverText(updated.id);
            }
          }
        }
      }
    } catch (err) {
      console.error("Failed to load orders:", err);
    }
  }

  async function loadHandoverText(orderId: number) {
    try {
      const res = await fetch(`/api/orders/${orderId}/handover`);
      if (res.ok) {
        const data = await res.json();
        setHandoverText(data.rendered_text);
      } else {
        setHandoverText('');
      }
    } catch {
      setHandoverText('');
    }
  }

  async function createOrder(e: React.FormEvent) {
    e.preventDefault();
    if (!customerLabel.trim()) {
      setErrorMsg('Customer label (WeChat name) is required');
      return;
    }
    setErrorMsg('');
    setBtnLoading(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_label: customerLabel.trim(),
          customer_contact: customerContact.trim() || undefined,
          passenger_name: passengerName.trim() || undefined,
          passenger_birthdate: passengerBirthdate.trim() || undefined,
          start_date: new Date(startDate).toISOString(),
          service_fee: Number(serviceFee)
        })
      });
      if (res.ok) {
        // Reset form
        setCustomerLabel('');
        setCustomerContact('');
        setPassengerName('');
        setPassengerBirthdate('');
        await loadOrders();
      } else {
        const data = await res.json();
        setErrorMsg(data.detail || 'Failed to create order');
      }
    } catch {
      setErrorMsg('Network error creating order');
    } finally {
      setBtnLoading(false);
    }
  }

  async function updateStatus(orderId: number, newStatus: string, metadata?: object) {
    setBtnLoading(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          metadata
        })
      });
      if (res.ok) {
        await loadOrders();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setBtnLoading(false);
    }
  }

  async function generateMailbox(orderId: number) {
    setBtnLoading(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/mailbox`, {
        method: 'POST'
      });
      if (res.ok) {
        await loadOrders();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setBtnLoading(false);
    }
  }

  function handleCopy() {
    if (!handoverText) return;
    navigator.clipboard.writeText(handoverText);
    setCopying(true);
    setTimeout(() => setCopying(false), 2000);
  }

  useEffect(() => {
    loadOrders();
  }, []);

  // Format Status for humans
  const getStatusText = (status: string) => {
    const mapping: Record<string, string> = {
      requested: 'Requested (待付款)',
      customer_authorized: 'Authorized (待开邮箱)',
      account_registered: 'Mailbox Ready (待购票)',
      ticket_purchased: 'Ticket Issued (待交付)',
      delivered_to_customer: 'Delivered (已交接)',
      closed: 'Closed (已归档)',
      exception: 'Exception (异常中断)',
    };
    return mapping[status] || status;
  };

  const getStatusTone = (status: string): 'neutral' | 'success' | 'warning' | 'danger' => {
    if (status === 'ticket_purchased' || status === 'delivered_to_customer') return 'success';
    if (status === 'customer_authorized' || status === 'account_registered') return 'warning';
    if (status === 'exception') return 'danger';
    return 'neutral';
  };

  return (
    <div className="module-grid" style={{ gridTemplateColumns: '360px 1fr', gap: '24px' }}>
      {/* Left Column: Form & Pricing Calculator */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <Card>
          <div style={{ marginBottom: '16px' }}>
            <p className="eyebrow">Operations Desk</p>
            <h3>Register Order</h3>
            <p className="muted">Create an order and check pricing automatically.</p>
          </div>
          
          <form onSubmit={createOrder} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label className="eyebrow" style={{ display: 'block', marginBottom: '4px' }}>WeChat Account Label *</label>
              <Input 
                value={customerLabel} 
                onChange={(e) => setCustomerLabel(e.target.value)} 
                placeholder="e.g. 微信号/昵称" 
                required 
              />
            </div>
            <div>
              <label className="eyebrow" style={{ display: 'block', marginBottom: '4px' }}>WeChat Contact Details</label>
              <Input 
                value={customerContact} 
                onChange={(e) => setCustomerContact(e.target.value)} 
                placeholder="e.g. wxid_xxxx" 
              />
            </div>
            <div>
              <label className="eyebrow" style={{ display: 'block', marginBottom: '4px' }}>Passenger Full Name</label>
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
            
            {errorMsg && <p style={{ color: 'var(--danger)', fontSize: '0.85rem', margin: '4px 0' }}>{errorMsg}</p>}
            
            <Button type="submit" disabled={btnLoading} style={{ marginTop: '8px', width: '100%' }}>
              {btnLoading ? 'Registering...' : 'Register New Order'}
            </Button>
          </form>
        </Card>

        {/* Pricing Calculator Visual Widget */}
        <Card style={{ background: '#0f172a', color: '#f8fafc', border: '1px solid #334155' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <Wallet size={16} className="text-accent" style={{ color: 'var(--accent)' }} />
            <h4 style={{ margin: 0, fontSize: '0.9rem', color: '#f1f5f9' }}>10th-Day Rule calculator</h4>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #334155', paddingBottom: '6px' }}>
              <span style={{ color: '#94a3b8' }}>D-Ticket Start Day:</span>
              <span style={{ fontWeight: 'bold' }}>Day {startDate ? new Date(startDate).getDate() : '-'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #334155', paddingBottom: '6px' }}>
              <span style={{ color: '#94a3b8' }}>Subscription Term:</span>
              <span style={{ fontWeight: 'bold', color: uiPrice.after10th ? '#f59e0b' : '#10b981' }}>
                {uiPrice.months} Month{uiPrice.months > 1 ? 's' : ''} {uiPrice.after10th ? '(Current + Next)' : '(Current Only)'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#94a3b8' }}>
              <span>Base D-Ticket Price (63.00€/mo)</span>
              <span>{uiPrice.ticketPrice.toFixed(2)} €</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#94a3b8' }}>
              <span>Operator Service Fee</span>
              <span>{Number(serviceFee).toFixed(2)} €</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1rem', color: '#ffd18d', paddingTop: '4px' }}>
              <span>Estimated Total Cost</span>
              <span>{uiPrice.total.toFixed(2)} €</span>
            </div>
          </div>
          
          <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '8px', padding: '10px', marginTop: '12px', display: 'flex', gap: '8px', fontSize: '0.78rem', border: '1px solid rgba(255,255,255,0.06)' }}>
            <Info size={16} style={{ flexShrink: 0, color: '#f4a62a' }} />
            <p style={{ margin: 0, color: '#cbd5e1', lineHeight: '1.4' }}>
              <strong>D-Ticket billing policy:</strong> Subscriptions must be cancelled by the 10th. Orders after the 10th require payment for 2 months because cancellation affects the next month.
            </p>
          </div>
        </Card>
      </div>

      {/* Right Column: Ledger & Details */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Ledger Table */}
        <Card>
          <div className="section-header" style={{ marginBottom: '14px' }}>
            <h3>Orders Ledger</h3>
            <Button onClick={loadOrders} className="button-secondary" style={{ padding: '4px 10px', minHeight: '32px' }}>
              Refresh
            </Button>
          </div>
          
          <Table 
            data={orders}
            columns={[
              { 
                key: 'order_code', 
                header: 'Order Code', 
                render: (o) => (
                  <button 
                    onClick={() => {
                      setSelectedOrder(o);
                      if (o.mailbox_record) {
                        loadHandoverText(o.id);
                      } else {
                        setHandoverText('');
                      }
                    }}
                    style={{ 
                      background: 'none', border: 'none', color: 'var(--accent-2)', 
                      fontWeight: 'bold', cursor: 'pointer', textDecoration: 'underline',
                      padding: 0
                    }}
                  >
                    {o.order_code}
                  </button>
                ) 
              },
              { key: 'customer_label', header: 'Customer WeChat', render: (o) => o.customer_label },
              { 
                key: 'ticket_month', 
                header: 'Ticket Info', 
                render: (o) => (
                  <span style={{ fontSize: '0.85rem' }}>
                    {o.ticket_month} ({o.ticket_month_count} mo)
                  </span>
                ) 
              },
              { 
                key: 'total_amount', 
                header: 'Amount', 
                render: (o) => <span style={{ fontWeight: 'bold' }}>{o.total_amount.toFixed(2)} €</span> 
              },
              { 
                key: 'status', 
                header: 'Status', 
                render: (o) => <Tag tone={getStatusTone(o.status)}>{getStatusText(o.status)}</Tag> 
              },
              { 
                key: 'created_at', 
                header: 'Created At', 
                render: (o) => <span style={{ fontSize: '0.78rem', color: 'gray' }}>{new Date(o.created_at).toLocaleDateString()}</span> 
              }
            ]}
          />
        </Card>

        {/* Selected Order detail panel */}
        {selectedOrder ? (
          <Card style={{ border: '1px solid rgba(16,25,47,0.14)', background: '#fdfdfb' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--line)', paddingBottom: '14px', marginBottom: '16px' }}>
              <div>
                <p className="eyebrow" style={{ margin: 0 }}>Order Details Workspace</p>
                <h2 style={{ margin: 0, fontSize: '1.6rem' }}>{selectedOrder.order_code}</h2>
              </div>
              <Button className="button-secondary" onClick={() => setSelectedOrder(null)}>
                Close Workspace
              </Button>
            </div>

            <div className="module-grid" style={{ gridTemplateColumns: '1.1fr 0.9fr', gap: '20px' }}>
              {/* Workspace Main Panel: Actions, Mailbox, Handover */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                
                {/* Status progress tracker */}
                <div style={{ background: '#f4efe6', padding: '14px', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.06)' }}>
                  <span className="eyebrow">Status Timeline</span>
                  <div style={{ display: 'flex', alignItems: 'center', marginTop: '10px', gap: '8px', fontSize: '0.8rem', overflowX: 'auto', paddingBottom: '4px' }}>
                    <span style={{ fontWeight: selectedOrder.status === 'requested' ? 'bold' : 'normal', color: selectedOrder.status === 'requested' ? 'var(--accent)' : 'black' }}>1. Requested</span>
                    <ArrowRight size={12} className="muted" />
                    <span style={{ fontWeight: selectedOrder.status === 'customer_authorized' ? 'bold' : 'normal', color: selectedOrder.status === 'customer_authorized' ? 'var(--accent)' : 'black' }}>2. Authorized</span>
                    <ArrowRight size={12} className="muted" />
                    <span style={{ fontWeight: selectedOrder.status === 'account_registered' ? 'bold' : 'normal', color: selectedOrder.status === 'account_registered' ? 'var(--accent)' : 'black' }}>3. Mailbox Ready</span>
                    <ArrowRight size={12} className="muted" />
                    <span style={{ fontWeight: selectedOrder.status === 'ticket_purchased' ? 'bold' : 'normal', color: selectedOrder.status === 'ticket_purchased' ? 'var(--accent)' : 'black' }}>4. Ticket Issued</span>
                    <ArrowRight size={12} className="muted" />
                    <span style={{ fontWeight: selectedOrder.status === 'delivered_to_customer' ? 'bold' : 'normal', color: selectedOrder.status === 'delivered_to_customer' ? 'var(--accent)' : 'black' }}>5. Delivered</span>
                    <ArrowRight size={12} className="muted" />
                    <span style={{ fontWeight: selectedOrder.status === 'closed' ? 'bold' : 'normal', color: selectedOrder.status === 'closed' ? 'var(--accent)' : 'black' }}>6. Closed</span>
                  </div>
                </div>

                {/* Operations area */}
                <div>
                  <h4 style={{ margin: '0 0 10px' }}>Operator Actions</h4>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    {selectedOrder.status === 'requested' && (
                      <Button disabled={btnLoading} onClick={() => updateStatus(selectedOrder.id, 'customer_authorized')}>
                        Mark Paid & Authorize
                      </Button>
                    )}
                    {selectedOrder.status === 'customer_authorized' && (
                      <Button disabled={btnLoading} onClick={() => generateMailbox(selectedOrder.id)}>
                        Create Mock Mailbox Credentials
                      </Button>
                    )}
                    {selectedOrder.status === 'account_registered' && (
                      <Button disabled={btnLoading} onClick={() => updateStatus(selectedOrder.id, 'ticket_purchased')}>
                        Mark Ticket Issued (Manual Purchase Done)
                      </Button>
                    )}
                    {selectedOrder.status === 'ticket_purchased' && (
                      <Button disabled={btnLoading} onClick={() => updateStatus(selectedOrder.id, 'delivered_to_customer')}>
                        Mark Delivered to Customer
                      </Button>
                    )}
                    {selectedOrder.status === 'delivered_to_customer' && (
                      <Button disabled={btnLoading} onClick={() => updateStatus(selectedOrder.id, 'closed')}>
                        Archive & Close Order
                      </Button>
                    )}
                    
                    {/* Exception trigger */}
                    {selectedOrder.status !== 'closed' && selectedOrder.status !== 'exception' && (
                      <Button className="button-secondary" style={{ backgroundColor: 'rgba(180,35,24,0.08)', color: 'var(--danger)' }} disabled={btnLoading} onClick={() => updateStatus(selectedOrder.id, 'exception')}>
                        Trigger Escalate Exception
                      </Button>
                    )}
                    {selectedOrder.status === 'exception' && (
                      <Button disabled={btnLoading} onClick={() => updateStatus(selectedOrder.id, 'requested')}>
                        Resolve Exception (Reset to Requested)
                      </Button>
                    )}
                  </div>
                </div>

                {/* Mailbox Details Display Card */}
                {selectedOrder.mailbox_record ? (
                  <Card style={{ background: '#fbf8ef', border: '1px dashed rgba(16,25,47,0.16)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                      <Mail size={16} className="text-accent" style={{ color: 'var(--accent-2)' }} />
                      <h4 style={{ margin: 0 }}>D-Ticket Customer Mailbox (Created)</h4>
                    </div>
                    
                    <div style={{ fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div>
                        <strong>Webmail URL:</strong> <a href="https://webmail.buffjo.top" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-2)', textDecoration: 'underline' }}>https://webmail.buffjo.top <ExternalLink size={12} style={{ display: 'inline' }} /></a>
                      </div>
                      <div>
                        <strong>Username Prefix:</strong> <code style={{ background: 'rgba(0,0,0,0.05)', padding: '2px 4px', borderRadius: '4px' }}>{selectedOrder.mailbox_record.local_part}</code> (login input only)
                      </div>
                      <div>
                        <strong>Email Password:</strong> <code style={{ background: 'rgba(0,0,0,0.05)', padding: '2px 4px', borderRadius: '4px' }}>{selectedOrder.mailbox_record.password}</code>
                      </div>
                      <div>
                        <strong>Full TicketPlus+ Login Email:</strong> <code style={{ background: 'rgba(0,0,0,0.05)', padding: '2px 4px', borderRadius: '4px', fontWeight: 'bold' }}>{selectedOrder.mailbox_record.full_email}</code>
                      </div>
                    </div>
                  </Card>
                ) : (
                  <div style={{ border: '1px dashed var(--line)', padding: '16px', borderRadius: '14px', textAlign: 'center', color: 'gray', fontSize: '0.85rem' }}>
                    Mailbox credentials will be generated here once the customer is authorized.
                  </div>
                )}

                {/* Handover template generator */}
                {selectedOrder.mailbox_record && (
                  <div style={{ marginTop: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <h4 style={{ margin: 0 }}>Customer Handover Copy</h4>
                      <Button onClick={handleCopy} className="button-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', minHeight: '34px', padding: '0 10px', fontSize: '0.8rem' }}>
                        {copying ? <Check size={14} style={{ color: 'var(--good)' }} /> : <Copy size={14} />}
                        {copying ? 'Copied!' : 'Copy Copy Text'}
                      </Button>
                    </div>
                    <textarea 
                      readOnly 
                      value={handoverText} 
                      style={{ 
                        width: '100%', height: '220px', padding: '12px', border: '1px solid var(--line)', 
                        borderRadius: '10px', fontFamily: 'var(--mono)', fontSize: '0.8rem', 
                        lineHeight: '1.5', resize: 'none', background: '#fdfcf7' 
                      }} 
                    />
                  </div>
                )}
              </div>

              {/* Workspace Right Panel: Customer Meta & Audit Logs */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', borderLeft: '1px solid var(--line)', paddingLeft: '20px' }}>
                <div>
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
                      <span className="muted" style={{ display: 'block', fontSize: '0.75rem' }}>Contact Address</span>
                      <strong>{selectedOrder.customer_contact || 'N/A'}</strong>
                    </div>
                    <div>
                      <span className="muted" style={{ display: 'block', fontSize: '0.75rem' }}>Target month</span>
                      <strong>{selectedOrder.ticket_month}</strong>
                    </div>
                    <div style={{ borderTop: '1px solid var(--line)', paddingTop: '8px' }}>
                      <span className="muted" style={{ display: 'block', fontSize: '0.75rem' }}>D-Ticket Start date</span>
                      <strong>{selectedOrder.start_date ? new Date(selectedOrder.start_date).toLocaleDateString() : 'N/A'}</strong>
                    </div>
                    <div>
                      <span className="muted" style={{ display: 'block', fontSize: '0.75rem' }}>10th-Day Rule status</span>
                      <span>
                        {selectedOrder.after_tenth_day ? (
                          <Tag tone="warning">After 10th Day (2 Months Required)</Tag>
                        ) : (
                          <Tag tone="success">Before 10th Day (1 Month Required)</Tag>
                        )}
                      </span>
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
                        <span>Total collected:</span>
                        <span>{selectedOrder.total_amount.toFixed(2)} €</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Audit Logs list */}
                <div style={{ borderTop: '1px solid var(--line)', paddingTop: '16px' }}>
                  <h4 style={{ margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Clock size={16} /> Audit Log History
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '200px', overflowY: 'auto', paddingRight: '4px' }}>
                    {selectedOrder.audit_logs && selectedOrder.audit_logs.length > 0 ? (
                      selectedOrder.audit_logs.map((log) => {
                        let parsedMeta = null;
                        try {
                          if (log.metadata_json) parsedMeta = JSON.parse(log.metadata_json);
                        } catch {}
                        
                        return (
                          <div key={log.id} style={{ fontSize: '0.75rem', borderBottom: '1px solid rgba(0,0,0,0.04)', paddingBottom: '6px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', color: 'var(--ink)' }}>
                              <span>{log.action}</span>
                              <span style={{ color: 'gray' }}>{new Date(log.created_at).toLocaleTimeString()}</span>
                            </div>
                            {parsedMeta && (
                              <div style={{ color: 'gray', marginTop: '2px', wordBreak: 'break-all' }}>
                                {parsedMeta.old_status && parsedMeta.new_status ? (
                                  <span>Status changed: {parsedMeta.old_status} ➜ {parsedMeta.new_status}</span>
                                ) : (
                                  <span>{parsedMeta.message || JSON.stringify(parsedMeta)}</span>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <span style={{ fontSize: '0.8rem', color: 'gray' }}>No logs recorded yet.</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ) : (
          <Card style={{ padding: '40px', textAlign: 'center', color: 'gray', border: '1px dashed var(--line)' }}>
            <ClipboardList size={40} style={{ margin: '0 auto 10px', color: 'var(--muted)' }} />
            <h4>No order selected</h4>
            <p className="muted" style={{ fontSize: '0.85rem' }}>Select an order code from the list above to open the processing workspace.</p>
          </Card>
        )}
      </div>
    </div>
  );
}
