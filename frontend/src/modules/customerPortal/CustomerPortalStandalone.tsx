import { useEffect, useState } from 'react';
import { 
  Mail, KeyRound, Copy, Check, ExternalLink, Lock, Unlock, 
  BookOpen, ShieldCheck, AlertTriangle, Search, RefreshCw, Info,
  HelpCircle, User, Clock
} from 'lucide-react';
import { Card } from '../../core/ui/Card';
import { Tag } from '../../core/ui/Tag';
import { Button } from '../../core/ui/Button';
import { Input } from '../../core/ui/Input';

interface MailboxRecord {
  local_part: string;
  domain: string;
  full_email: string;
  password: string;
}

interface CustomerOrder {
  order_code: string;
  status: string;
  passenger_name?: string;
  ticket_month?: string;
  start_date?: string;
  ticket_month_count: number;
  after_tenth_day: boolean;
  ticket_price_total: number;
  service_fee: number;
  total_amount: number;
  created_at?: string;
  mailbox_record?: MailboxRecord;
}

export default function CustomerPortalStandalone() {
  const [code, setCode] = useState('');
  const [searchCode, setSearchCode] = useState('');
  const [order, setOrder] = useState<CustomerOrder | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Tab control
  const [activeTab, setActiveTab] = useState<'guide' | 'rules' | 'disclaimer'>('guide');
  
  // Password visible state
  const [pwdVisible, setPwdVisible] = useState(false);
  
  // Copy state trackers
  const [copyState, setCopyState] = useState<Record<string, boolean>>({});

  // Parse URL query parameter on load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const codeParam = params.get('code');
    if (codeParam) {
      setCode(codeParam);
      setSearchCode(codeParam);
      fetchOrder(codeParam);
    } else {
      // Check localStorage
      const savedCode = localStorage.getItem('dt_customer_order_code');
      if (savedCode) {
        setCode(savedCode);
        setSearchCode(savedCode);
        fetchOrder(savedCode);
      }
    }
  }, []);

  async function fetchOrder(orderCode: string) {
    if (!orderCode.trim()) return;
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch(`/api/customer_portal/order?code=${encodeURIComponent(orderCode.trim())}`);
      if (res.ok) {
        const data = await res.json();
        setOrder(data);
        localStorage.setItem('dt_customer_order_code', orderCode.trim());
      } else {
        const data = await res.json();
        setErrorMsg(data.detail || '未找到该订单，请检查输入或联系客服。');
        setOrder(null);
      }
    } catch {
      setErrorMsg('网络连接失败，请稍后重试。');
      setOrder(null);
    } finally {
      setLoading(false);
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (searchCode.trim()) {
      setCode(searchCode.trim());
      // Update URL query string silently without reloading page
      const newUrl = `${window.location.pathname}?code=${encodeURIComponent(searchCode.trim())}`;
      window.history.pushState({ path: newUrl }, '', newUrl);
      fetchOrder(searchCode);
    }
  }

  function triggerCopy(text: string, key: string) {
    navigator.clipboard.writeText(text);
    setCopyState((prev) => ({ ...prev, [key]: true }));
    setTimeout(() => {
      setCopyState((prev) => ({ ...prev, [key]: false }));
    }, 2000);
  }

  function handleLogout() {
    localStorage.removeItem('dt_customer_order_code');
    setOrder(null);
    setCode('');
    setSearchCode('');
    // Remove query param from URL
    const newUrl = window.location.pathname;
    window.history.pushState({ path: newUrl }, '', newUrl);
  }

  // Map backend status to user-friendly status in Chinese
  const getFriendlyStatus = (status: string) => {
    const mapping: Record<string, { label: string; tone: 'neutral' | 'success' | 'warning' | 'danger'; desc: string }> = {
      requested: {
        label: '服务已申请 (Awaiting Verification)',
        tone: 'neutral',
        desc: '您的协助购票申请已提交，系统正在等待管理员确认您的支付凭证。'
      },
      customer_authorized: {
        label: '已确认支付，正在创建账户 (Creating Mailbox)',
        tone: 'warning',
        desc: '我们已核对您的付款，系统正在为您生成德国 D-Ticket 专用托管邮箱。'
      },
      account_registered: {
        label: '邮箱已生成，正在为您购买车票 (Booking Ticket)',
        tone: 'warning',
        desc: '您的专属邮箱已创建完毕，客服人员正在登录德国购票系统为您手动下单购买月票。'
      },
      ticket_purchased: {
        label: '购票成功，车票已备齐 (Ticket Ready for Handover)',
        tone: 'success',
        desc: '车票已成功购买并绑定至您的专属邮箱！现在您可以登录系统或邮箱查阅您的车票。'
      },
      delivered_to_customer: {
        label: '已交付运行中 (Active)',
        tone: 'success',
        desc: '月票已正式向您完成交接并正常运行中，请妥善保管您的邮箱凭证。'
      },
      closed: {
        label: '订单已归档 (Archived)',
        tone: 'neutral',
        desc: '本期月票订单已安全结单归档，如有任何后续疑问请随时联系客服。'
      },
      exception: {
        label: '订单处理受阻 (Blocked / Under Exception)',
        tone: 'danger',
        desc: '当前订单遇到异常（如平台故障或付款审核疑问），客服已介入，请耐心等待或联系我们。'
      }
    };
    return mapping[status] || { label: '未知状态', tone: 'neutral', desc: '订单状态更新中。' };
  };

  // Main Customer Layout Style (Mobile view wrapper)
  return (
    <div style={{ maxWidth: '480px', margin: '0 auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px', minHeight: '100vh' }}>
      
      {/* Dynamic Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(16,25,47,0.1)', paddingBottom: '12px' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', margin: 0, fontWeight: 800, color: 'var(--ink)' }}>
            D-Ticket 客户自主服务
          </h2>
          <span style={{ fontSize: '0.72rem', color: 'rgba(16,25,47,0.52)' }}>D-Ticket Mail Portal</span>
        </div>
        {order && (
          <button 
            onClick={handleLogout}
            style={{ background: 'rgba(16,25,47,0.06)', border: 'none', padding: '6px 12px', borderRadius: '10px', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 'bold' }}
          >
            切换订单
          </button>
        )}
      </div>

      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px', gap: '12px' }}>
          <RefreshCw size={28} className="animate-spin" style={{ color: 'var(--accent-2)', animation: 'spin 1.5s linear infinite' }} />
          <span style={{ fontSize: '0.85rem', color: 'rgba(16,25,47,0.62)' }}>正在查询订单数据…</span>
        </div>
      )}

      {/* 1. If NOT logged in / order not loaded */}
      {!order && !loading && (
        <Card style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '6px' }}>查询您的车票信息</h3>
            <p className="muted" style={{ fontSize: '0.8rem', lineHeight: '1.5' }}>
              请输入您的专有车票订单号（格式为 DT-YYMM-XXXX）来查看您的邮箱凭证与乘车激活教程。
            </p>
          </div>

          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px' }}>
            <Input 
              value={searchCode}
              onChange={(e) => setSearchCode(e.target.value)}
              placeholder="请输入您的订单号 (DT-XXXX)"
              style={{ flex: 1, minHeight: '42px' }}
              required
            />
            <Button type="submit" style={{ minHeight: '42px', padding: '0 16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Search size={16} /> 查询
            </Button>
          </form>

          {errorMsg && (
            <div style={{ color: 'var(--danger)', fontSize: '0.8rem', display: 'flex', gap: '6px', alignItems: 'center', padding: '10px', background: 'rgba(180,35,24,0.06)', borderRadius: '10px' }}>
              <AlertTriangle size={14} style={{ flexShrink: 0 }} />
              <span>{errorMsg}</span>
            </div>
          )}

          <div style={{ borderTop: '1px solid rgba(16,25,47,0.08)', paddingTop: '16px', fontSize: '0.78rem', color: 'rgba(16,25,47,0.6)' }}>
            <p style={{ margin: '0 0 6px', fontWeight: 'bold' }}>常见问题提示：</p>
            <ul style={{ margin: 0, paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <li>订单号在哪里？请查看管理员发送给您的付款凭证或下单通知。</li>
              <li>车票姓名有误？请立即联系支持客服，车票实名制不可转让。</li>
            </ul>
          </div>
        </Card>
      )}

      {/* 2. Order details & instructions */}
      {order && !loading && (
        <>
          {/* Order Header / Status widget */}
          <Card style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <div>
                <span className="eyebrow" style={{ display: 'block', fontSize: '0.7rem' }}>订单编号</span>
                <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{order.order_code}</span>
              </div>
              <Tag tone={getFriendlyStatus(order.status).tone}>
                {getFriendlyStatus(order.status).label.split(' (')[0]}
              </Tag>
            </div>

            <p style={{ margin: 0, fontSize: '0.8rem', color: 'rgba(16,25,47,0.7)', lineHeight: '1.4' }}>
              {getFriendlyStatus(order.status).desc}
            </p>

            <div style={{ borderTop: '1px solid rgba(16,25,47,0.08)', paddingTop: '10px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.78rem' }}>
              <div>
                <span style={{ color: 'rgba(16,25,47,0.52)' }}>乘车人姓名:</span>
                <span style={{ display: 'block', fontWeight: 'bold' }}>{order.passenger_name || '未提供'}</span>
              </div>
              <div>
                <span style={{ color: 'rgba(16,25,47,0.52)' }}>车票适用月份:</span>
                <span style={{ display: 'block', fontWeight: 'bold' }}>{order.ticket_month || '未确定'}</span>
              </div>
            </div>
          </Card>

          {/* Mailbox Details widget (Only when mailbox is created) */}
          {order.mailbox_record ? (
            <Card style={{ background: '#fcfaf6', border: '1px dashed var(--accent)', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ background: 'rgba(244,166,42,0.12)', width: '32px', height: '32px', borderRadius: '8px', display: 'grid', placeItems: 'center' }}>
                  <Mail size={16} style={{ color: '#b7791f' }} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.92rem' }}>您的 D-Ticket 专属代收邮箱</h4>
                  <span style={{ fontSize: '0.72rem', color: 'gray' }}>用此账户接收 TicketPlus+ 登录验证码</span>
                </div>
              </div>

              {/* Login parameters with copy functions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.82rem' }}>
                
                {/* Local part (email username prefix) */}
                <div style={{ background: 'white', border: '1px solid rgba(16,25,47,0.08)', borderRadius: '10px', padding: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ display: 'block', fontSize: '0.7rem', color: 'gray' }}>邮箱登录用户名 (仅前缀，无后缀)</span>
                    <code style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--ink)' }}>{order.mailbox_record.local_part}</code>
                  </div>
                  <Button 
                    onClick={() => triggerCopy(order.mailbox_record!.local_part, 'local_part')}
                    className="button-secondary"
                    style={{ minHeight: '32px', padding: '0 8px', fontSize: '0.72rem', display: 'flex', gap: '4px' }}
                  >
                    {copyState['local_part'] ? <Check size={12} style={{ color: 'var(--good)' }} /> : <Copy size={12} />}
                    {copyState['local_part'] ? '已复制' : '复制前缀'}
                  </Button>
                </div>

                {/* Password input with toggle hide/show */}
                <div style={{ background: 'white', border: '1px solid rgba(16,25,47,0.08)', borderRadius: '10px', padding: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ display: 'block', fontSize: '0.7rem', color: 'gray' }}>专属邮箱密码</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <code style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--ink)' }}>
                        {pwdVisible ? order.mailbox_record.password : '••••••••••••'}
                      </code>
                      <button 
                        onClick={() => setPwdVisible(!pwdVisible)}
                        style={{ background: 'none', border: 'none', color: 'gray', padding: 0, cursor: 'pointer', display: 'inline-flex' }}
                      >
                        {pwdVisible ? <Unlock size={14} /> : <Lock size={14} />}
                      </button>
                    </div>
                  </div>
                  <Button 
                    onClick={() => triggerCopy(order.mailbox_record!.password, 'password')}
                    className="button-secondary"
                    style={{ minHeight: '32px', padding: '0 8px', fontSize: '0.72rem', display: 'flex', gap: '4px' }}
                  >
                    {copyState['password'] ? <Check size={12} style={{ color: 'var(--good)' }} /> : <Copy size={12} />}
                    {copyState['password'] ? '已复制' : '复制密码'}
                  </Button>
                </div>

                {/* Full email for TicketPlus+ login */}
                <div style={{ background: 'white', border: '1px solid rgba(16,25,47,0.08)', borderRadius: '10px', padding: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ display: 'block', fontSize: '0.7rem', color: 'gray' }}>TicketPlus+ 登录账号 (完整邮箱格式)</span>
                    <code style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--ink)' }}>{order.mailbox_record.full_email}</code>
                  </div>
                  <Button 
                    onClick={() => triggerCopy(order.mailbox_record!.full_email, 'full_email')}
                    className="button-secondary"
                    style={{ minHeight: '32px', padding: '0 8px', fontSize: '0.72rem', display: 'flex', gap: '4px' }}
                  >
                    {copyState['full_email'] ? <Check size={12} style={{ color: 'var(--good)' }} /> : <Copy size={12} />}
                    {copyState['full_email'] ? '已复制' : '复制完整邮箱'}
                  </Button>
                </div>

                {/* Highlight prompt warnings */}
                <div style={{ background: 'rgba(31,155,209,0.05)', borderRadius: '10px', padding: '10px', display: 'flex', gap: '8px', fontSize: '0.75rem', border: '1px solid rgba(31,155,209,0.1)' }}>
                  <Info size={16} style={{ flexShrink: 0, color: 'var(--accent-2)' }} />
                  <div style={{ color: 'rgba(16,25,47,0.8)', lineHeight: '1.4' }}>
                    <p style={{ margin: '0 0 4px', fontWeight: 'bold' }}>注意事项：</p>
                    <ul style={{ margin: 0, paddingLeft: '14px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <li><strong>登录邮箱站时：</strong>只输入前缀 <code style={{ background: 'white', padding: '0 2px' }}>{order.mailbox_record.local_part}</code>，不需要加上后缀。</li>
                      <li><strong>登录 TicketPlus+ APP时：</strong>必须输入完整邮箱 <code style={{ background: 'white', padding: '0 2px' }}>{order.mailbox_record.full_email}</code>。</li>
                    </ul>
                  </div>
                </div>

                {/* Open Webmail URL button */}
                <a 
                  href="https://webmail.buffjo.top" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ textDecoration: 'none', display: 'block', marginTop: '4px' }}
                >
                  <Button style={{ width: '100%', minHeight: '44px', background: 'var(--accent-2)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                    打开代收邮箱网站 <ExternalLink size={16} />
                  </Button>
                </a>

              </div>
            </Card>
          ) : (
            <Card style={{ padding: '24px', textAlign: 'center', color: 'gray', border: '1px dashed rgba(16,25,47,0.12)' }}>
              <Clock size={32} style={{ margin: '0 auto 8px', color: 'var(--warn)' }} />
              <h4 style={{ margin: 0 }}>专属代收邮箱正在准备中</h4>
              <p className="muted" style={{ fontSize: '0.8rem', marginTop: '6px' }}>
                待管理员为您成功申请完账号并录入后，此处将自动显示您的邮箱用户名、临时密码以及完整登录指引。请稍后刷新查看。
              </p>
            </Card>
          )}

          {/* Navigation Tabs for detailed pages */}
          <div style={{ display: 'flex', borderBottom: '1px solid rgba(16,25,47,0.1)', paddingBottom: '2px', gap: '16px' }}>
            <button 
              onClick={() => setActiveTab('guide')}
              style={{ 
                background: 'none', border: 'none', padding: '8px 0', fontSize: '0.85rem', fontWeight: 'bold',
                color: activeTab === 'guide' ? 'var(--accent)' : 'gray',
                borderBottom: activeTab === 'guide' ? '2px solid var(--accent)' : '2px solid transparent',
                cursor: 'pointer'
              }}
            >
              登车激活教程
            </button>
            <button 
              onClick={() => setActiveTab('rules')}
              style={{ 
                background: 'none', border: 'none', padding: '8px 0', fontSize: '0.85rem', fontWeight: 'bold',
                color: activeTab === 'rules' ? 'var(--accent)' : 'gray',
                borderBottom: activeTab === 'rules' ? '2px solid var(--accent)' : '2px solid transparent',
                cursor: 'pointer'
              }}
            >
              乘车与订阅规则
            </button>
            <button 
              onClick={() => setActiveTab('disclaimer')}
              style={{ 
                background: 'none', border: 'none', padding: '8px 0', fontSize: '0.85rem', fontWeight: 'bold',
                color: activeTab === 'disclaimer' ? 'var(--accent)' : 'gray',
                borderBottom: activeTab === 'disclaimer' ? '2px solid var(--accent)' : '2px solid transparent',
                cursor: 'pointer'
              }}
            >
              免责声明与条款
            </button>
          </div>

          {/* Tab 1: Login Guide */}
          {activeTab === 'guide' && (
            <Card style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <BookOpen size={16} style={{ color: 'var(--accent)' }} />
                <h4 style={{ margin: 0 }}>TicketPlus+ APP 登录激活流程</h4>
              </div>

              <ol style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.82rem', lineHeight: '1.5' }}>
                <li>
                  <strong>下载 TicketPlus+ 客户端：</strong> 
                  在您的手机应用商店（App Store / Google Play）下载官方名为 **TicketPlus+** 的客户端应用。
                </li>
                <li>
                  <strong>输入登录账号：</strong> 
                  打开客户端，选择 **Email Login**（邮件登录）方式。请在输入框中输入完整邮箱：
                  <code style={{ background: 'rgba(0,0,0,0.04)', padding: '2px 4px', borderRadius: '4px', display: 'block', width: 'fit-content', marginTop: '4px', fontWeight: 'bold' }}>
                    {order.mailbox_record ? order.mailbox_record.full_email : '您的专属邮箱地址'}
                  </code>
                </li>
                <li>
                  <strong>登录邮箱接收验证码：</strong> 
                  点击发送验证码。打开移动端浏览器或电脑浏览器访问 
                  <a href="https://webmail.buffjo.top" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-2)', textDecoration: 'underline', marginLeft: '4px' }}>
                    https://webmail.buffjo.top
                  </a>。
                  <br />
                  使用用户名：<code style={{ fontWeight: 'bold' }}>{order.mailbox_record ? order.mailbox_record.local_part : '邮箱前缀'}</code> 及相应密码登录。
                </li>
                <li>
                  <strong>提取验证码：</strong> 
                  在您的收件箱中，找到由 **TicketPlus+** 发送的登录验证码（通常为 6 位数字，如未收到请检查垃圾箱）。
                </li>
                <li>
                  <strong>激活绑定：</strong> 
                  将验证码输入到 TicketPlus+ 手机 APP 中完成绑定。
                </li>
                <li>
                  <strong>乘车出示：</strong> 
                  成功登入后，在手机客户端内即可看到您的 Deutschlandticket 二维码。乘车时请提前打开二维码界面以供查验。
                </li>
              </ol>
            </Card>
          )}

          {/* Tab 2: Deadlines & Rules */}
          {activeTab === 'rules' && (
            <Card style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <HelpCircle size={16} style={{ color: '#b7791f' }} />
                <h4 style={{ margin: 0 }}>乘车实名与取消订单规定</h4>
              </div>

              <div style={{ fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '10px', lineHeight: '1.5' }}>
                <div style={{ background: 'rgba(183,121,31,0.06)', padding: '10px', borderRadius: '10px', border: '1px solid rgba(183,121,31,0.1)' }}>
                  <p style={{ margin: '0 0 6px', fontWeight: 'bold', color: '#b7791f' }}>10号取消规则 (10th-Day Rule)：</p>
                  德国 Deutschlandticket 属于包月自动续费订阅制。
                  <ul style={{ margin: 0, paddingLeft: '14px', marginTop: '4px' }}>
                    <li><strong>每月10号前（含10号）：</strong>如您下个月不需要续订，必须在 10 号之前联系我们申请退订，即可仅消费本月车票。</li>
                    <li><strong>每月10号之后：</strong>德国铁路系统将自动扣除并锁定下个月的车票款。因此 10 号后下单通常需要预付“本月+下月”两个月的票款。已扣款无法撤销退款。</li>
                  </ul>
                </div>

                <div>
                  <p style={{ margin: '0 0 4px', fontWeight: 'bold' }}>实名制乘车：</p>
                  Deutschlandticket 是个人专属的记名电子票。
                  <ul style={{ margin: 0, paddingLeft: '14px' }}>
                    <li>二维码上方会显示您的护照拼音姓名。</li>
                    <li>车票不可转让给他人使用。德国列车查票时，查票员可能要求出示您的护照或带照片的身份证件以核对姓名，请务必配合。</li>
                  </ul>
                </div>

                <div>
                  <p style={{ margin: '0 0 4px', fontWeight: 'bold' }}>已出票不可退：</p>
                  由于客运公司票务性质，D-Ticket 车票一经出票并生成二维码，即表示消费已经成立，无法提供任何退款。
                </div>
              </div>
            </Card>
          )}

          {/* Tab 3: Terms & Disclaimers */}
          {activeTab === 'disclaimer' && (
            <Card style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.8rem', lineHeight: '1.5' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ShieldCheck size={16} style={{ color: 'var(--accent)' }} />
                <h4 style={{ margin: 0 }}>独立服务与隐私声明</h4>
              </div>

              <div>
                <p style={{ margin: '0 0 4px', fontWeight: 'bold' }}>独立协助声明：</p>
                本服务为独立的临时托管邮箱技术提供与代下单协助服务。我们并不是官方公共交通管理局，亦不是 DB (Deutsche Bahn) 或 TicketPlus+ 官方公司。我们不对官方 APP 平台的接口故障、网络波动或其政策更改承担责任。
              </div>

              <div>
                <p style={{ margin: '0 0 4px', fontWeight: 'bold' }}>乘车人隐私保护：</p>
                本服务仅存储您下单所需的最小敏感个人信息（如拼音姓名和出生日期，用于购票系统绑定）。交接完成且交易完成后，您可以向我们申请完全擦除或注销您的个人购票相关记录。
              </div>
            </Card>
          )}

        </>
      )}

      {/* Persistent Footer notice */}
      <div style={{ textAlign: 'center', fontSize: '0.72rem', color: 'rgba(16,25,47,0.42)', marginTop: 'auto', paddingTop: '20px' }}>
        <span>本网站为第三方技术平台服务 • 独立购票与代收邮箱托管</span>
      </div>
      
    </div>
  );
}
