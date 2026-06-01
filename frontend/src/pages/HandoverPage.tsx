import { Link, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  Check,
  Copy,
  ExternalLink,
  HelpCircle,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  Unlock,
  Wallet,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import {
  createHandoverViewModel,
  getHandoverByCode,
  getWalletLinkLabel,
  type HandoverData,
} from '../lib/handover';

const MODE_LABELS: Record<string, string> = {
  wallet_only: 'Wallet-only 交付',
  managed_otp: '托管 OTP 例外',
  external_mailbox: '外部邮箱例外',
  customer_mailbox: '客户邮箱例外',
};

export default function HandoverPage() {
  const { code } = useParams<{ code: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<HandoverData | null>(null);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [copyState, setCopyState] = useState<Record<string, boolean>>({});

  const triggerCopy = useCallback((text: string, key: string) => {
    if (navigator.clipboard) {
      void navigator.clipboard.writeText(text);
    }
    setCopyState((prev) => ({ ...prev, [key]: true }));
    setTimeout(() => setCopyState((prev) => ({ ...prev, [key]: false })), 1800);
  }, []);

  useEffect(() => {
    if (!code) {
      setError('未提供交付码。');
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchHandover() {
      setLoading(true);
      setError(null);

      try {
        const result = await getHandoverByCode(code!);
        if (cancelled) return;

        if (!result) {
          setError('此交付码无效或已过期。');
          setLoading(false);
          return;
        }

        setData(result);
      } catch (rpcError) {
        console.error('Handover RPC error:', rpcError);
        if (!cancelled) {
          setError('无法加载交付信息，请稍后重试。');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void fetchHandover();

    return () => {
      cancelled = true;
    };
  }, [code]);

  if (loading) {
    return (
      <div className="customer-page" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <Loader2 size={32} style={{ color: 'var(--accent-2)', animation: 'spin 1s linear infinite' }} />
        <p style={{ margin: 0, fontSize: '0.9rem', color: 'rgba(16,25,47,0.6)' }}>加载交付信息中...</p>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="customer-page">
        <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: 'rgba(16,25,47,0.6)', textDecoration: 'none' }}>
          <ArrowLeft size={14} /> 返回首页
        </Link>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', textAlign: 'center' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(180,35,24,0.08)', display: 'grid', placeItems: 'center' }}>
            <AlertTriangle size={28} style={{ color: 'var(--danger)' }} />
          </div>
          <h2 style={{ fontSize: '1.2rem', margin: 0, fontFamily: 'var(--font-display)' }}>交付码未找到</h2>
          <p style={{ margin: 0, fontSize: '0.88rem', color: 'rgba(16,25,47,0.6)', lineHeight: '1.5', maxWidth: '360px' }}>
            {error ?? '此交付链接无效或已过期。'}
          </p>
          <div style={{ background: 'rgba(31,155,209,0.06)', border: '1px solid rgba(31,155,209,0.12)', borderRadius: '14px', padding: '14px', fontSize: '0.82rem', lineHeight: '1.5', display: 'flex', gap: '8px', maxWidth: '380px', textAlign: 'left' }}>
            <HelpCircle size={16} style={{ flexShrink: 0, color: 'var(--accent-2)', marginTop: '2px' }} />
            <div>
              <strong>需要帮助？</strong>请联系发送此链接的客服人员，确认交付码或重新生成交付链接。
            </div>
          </div>
        </div>

        <footer style={{ textAlign: 'center', fontSize: '0.72rem', color: 'rgba(16,25,47,0.42)', paddingTop: '12px' }}>
          <span>D-Ticket 交付中心 · 独立协助服务</span>
        </footer>
      </div>
    );
  }

  const view = createHandoverViewModel(data);
  const modeLabel = MODE_LABELS[view.deliveryMode] ?? view.deliveryMode;

  return (
    <div className="customer-page">
      <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: 'rgba(16,25,47,0.6)', textDecoration: 'none' }}>
        <ArrowLeft size={14} /> 返回首页
      </Link>

      <header>
        <p className="eyebrow">交付记录</p>
        <h1 style={{ fontSize: '1.4rem', margin: '0 0 4px', fontFamily: 'var(--font-display)' }}>
          {view.isWalletOnly ? '您的 D-Ticket Wallet 交付' : '您的 D-Ticket 例外交付信息'}
        </h1>
        <p style={{ margin: 0, fontSize: '0.82rem', color: 'rgba(16,25,47,0.6)' }}>
          交付码：
          <code style={{ background: 'rgba(16,25,47,0.06)', padding: '2px 6px', borderRadius: '6px', fontWeight: 'bold' }}>{data.code}</code>
          {data.ticket_month && <span style={{ marginLeft: '8px' }}>· 车票月份：<strong>{data.ticket_month}</strong></span>}
        </p>
      </header>

      <div className="stepper">
        {view.steps.map((step, index) => (
          <span key={step} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            {index > 0 && <span className="stepper-arrow">→</span>}
            <span className={`stepper-step ${index === 0 ? 'active' : ''}`}>{index + 1}. {step}</span>
          </span>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        {view.isWalletOnly && view.walletLinks.slice(0, 2).map((walletLink, index) => (
          <a key={walletLink} href={walletLink} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', flex: 1, minWidth: '170px' }}>
            <button style={{ width: '100%', minHeight: '48px', background: index === 0 ? 'var(--ink)' : 'var(--accent-2)', color: 'white', border: 'none', borderRadius: '14px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.9rem' }}>
              <ExternalLink size={16} /> {getWalletLinkLabel(walletLink, index)}
            </button>
          </a>
        ))}

        {!view.isWalletOnly && view.canCustomerLogin && view.mailboxLoginUrl && (
          <a href={view.mailboxLoginUrl} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', flex: 1, minWidth: '160px' }}>
            <button style={{ width: '100%', minHeight: '48px', background: 'var(--accent-2)', color: 'white', border: 'none', borderRadius: '14px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.9rem' }}>
              <ExternalLink size={16} /> 打开邮箱收验证码
            </button>
          </a>
        )}

        {!view.isWalletOnly && view.visibleEmail && (
          <button
            onClick={() => triggerCopy(view.visibleEmail!, 'email')}
            style={{ flex: 1, minWidth: '160px', minHeight: '48px', background: 'var(--accent)', color: 'var(--ink)', border: 'none', borderRadius: '14px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.9rem' }}
          >
            {copyState.email ? <Check size={16} /> : <Copy size={16} />}
            {copyState.email ? '已复制登录邮箱' : '复制 TicketPlus+ 登录邮箱'}
          </button>
        )}

        <button
          onClick={() => triggerCopy(view.copyText, 'all')}
          style={{ flex: 1, minWidth: '150px', minHeight: '48px', background: 'rgba(16,25,47,0.06)', color: 'var(--ink)', border: '1px solid rgba(16,25,47,0.1)', borderRadius: '14px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.9rem' }}
        >
          {copyState.all ? <Check size={16} /> : <Copy size={16} />}
          {copyState.all ? '已复制交付信息' : '复制交付信息'}
        </button>

        <Link to="/guide" style={{ textDecoration: 'none', flex: 1, minWidth: '120px' }}>
          <button style={{ width: '100%', minHeight: '48px', background: 'rgba(16,25,47,0.06)', color: 'var(--ink)', border: '1px solid rgba(16,25,47,0.1)', borderRadius: '14px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.9rem' }}>
            <BookOpen size={16} /> 查看指南
          </button>
        </Link>
      </div>

      <div style={{ background: 'var(--card)', border: '1px solid rgba(16,25,47,0.08)', borderRadius: '18px', padding: '18px', boxShadow: 'var(--shadow)', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ background: 'rgba(244,166,42,0.12)', width: '36px', height: '36px', borderRadius: '10px', display: 'grid', placeItems: 'center' }}>
            {view.isWalletOnly ? <Wallet size={18} style={{ color: '#b7791f' }} /> : <Mail size={18} style={{ color: '#b7791f' }} />}
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '0.95rem' }}>{modeLabel}</h3>
            <span style={{ fontSize: '0.72rem', color: 'rgba(16,25,47,0.52)' }}>
              {view.isWalletOnly
                ? '默认模式：只交付官方 Wallet 添加方式，不交付账号登录信息'
                : '例外模式：仅在支付方式和订阅风险确认后使用'}
            </span>
          </div>
        </div>

        {view.isWalletOnly ? (
          <>
            <div style={{ background: 'rgba(13,138,97,0.08)', border: '1px solid rgba(13,138,97,0.16)', borderRadius: '14px', padding: '14px', fontSize: '0.82rem', lineHeight: 1.6 }}>
              <strong>请优先添加到 Apple Wallet 或 Google Wallet。</strong>
              <br />
              这是当前推荐的交付方式。您不需要登录 TicketPlus+ 账号，也不需要邮箱密码或验证码。
            </div>

            {view.walletLinks.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {view.walletLinks.map((walletLink, index) => (
                  <a key={walletLink} href={walletLink} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                    <button style={{ width: '100%', minHeight: '42px', background: 'white', color: 'var(--ink)', border: '1px solid rgba(16,25,47,0.12)', borderRadius: '12px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', padding: '0 12px', fontSize: '0.84rem' }}>
                      <span>{getWalletLinkLabel(walletLink, index)}</span>
                      <ExternalLink size={14} />
                    </button>
                  </a>
                ))}
              </div>
            ) : (
              <div style={{ background: 'rgba(244,166,42,0.08)', border: '1px solid rgba(244,166,42,0.2)', borderRadius: '14px', padding: '14px', fontSize: '0.82rem', lineHeight: 1.5, display: 'flex', gap: '8px' }}>
                <HelpCircle size={16} style={{ flexShrink: 0, color: 'var(--warn)', marginTop: '2px' }} />
                <div>
                  客服尚未在此页面贴入 Wallet 链接。请使用聊天中收到的官方 Apple Wallet / Google Wallet 添加链接；如未收到，请联系客服补发。
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            {view.visibleEmail && (
              <div className="cred-row">
                <div style={{ minWidth: 0 }}>
                  <span style={{ display: 'block', fontSize: '0.7rem', color: 'gray' }}>TicketPlus+ 登录邮箱</span>
                  <code style={{ fontSize: '0.88rem', fontWeight: 'bold', color: 'var(--ink)', wordBreak: 'break-all' }}>{view.visibleEmail}</code>
                </div>
                <button onClick={() => triggerCopy(view.visibleEmail!, 'email2')} className="copy-btn">
                  {copyState.email2 ? <Check size={12} style={{ color: 'var(--good)' }} /> : <Copy size={12} />}
                  {copyState.email2 ? '已复制' : '复制'}
                </button>
              </div>
            )}

            {view.isManagedOtp && (
              <div style={{ background: 'rgba(31,155,209,0.06)', border: '1px solid rgba(31,155,209,0.12)', borderRadius: '14px', padding: '14px', display: 'flex', gap: '10px', fontSize: '0.82rem', lineHeight: 1.5 }}>
                <HelpCircle size={16} style={{ flexShrink: 0, color: 'var(--accent-2)', marginTop: '2px' }} />
                <div>
                  <strong>验证码获取方式：</strong>请联系客服获取 TicketPlus+ 登录验证码。不要自行接管邮箱、修改账号或更改支付方式。
                </div>
              </div>
            )}

            {view.canCustomerLogin && view.mailboxUsername && (
              <div className="cred-row">
                <div>
                  <span style={{ display: 'block', fontSize: '0.7rem', color: 'gray' }}>邮箱网页登录用户名</span>
                  <code style={{ fontSize: '0.88rem', fontWeight: 'bold', color: 'var(--ink)' }}>{view.mailboxUsername}</code>
                </div>
                <button onClick={() => triggerCopy(view.mailboxUsername!, 'local')} className="copy-btn">
                  {copyState.local ? <Check size={12} style={{ color: 'var(--good)' }} /> : <Copy size={12} />}
                  {copyState.local ? '已复制' : '复制'}
                </button>
              </div>
            )}

            {view.canCustomerLogin && view.visiblePassword && (
              <div className="cred-row">
                <div>
                  <span style={{ display: 'block', fontSize: '0.7rem', color: 'gray' }}>邮箱密码</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <code style={{ fontSize: '0.88rem', fontWeight: 'bold', color: 'var(--ink)' }}>
                      {passwordVisible ? view.visiblePassword : '••••••••••••'}
                    </code>
                    <button
                      onClick={() => setPasswordVisible(!passwordVisible)}
                      style={{ background: 'none', border: 'none', color: 'gray', padding: 0, cursor: 'pointer', display: 'inline-flex' }}
                      aria-label={passwordVisible ? '隐藏密码' : '显示密码'}
                    >
                      {passwordVisible ? <Unlock size={14} /> : <Lock size={14} />}
                    </button>
                  </div>
                </div>
                <button onClick={() => triggerCopy(view.visiblePassword!, 'pwd')} className="copy-btn">
                  {copyState.pwd ? <Check size={12} style={{ color: 'var(--good)' }} /> : <Copy size={12} />}
                  {copyState.pwd ? '已复制' : '复制'}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <div style={{ background: 'rgba(244,166,42,0.06)', border: '1px solid rgba(244,166,42,0.18)', borderRadius: '16px', padding: '14px', fontSize: '0.78rem', lineHeight: '1.6', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
          <AlertTriangle size={16} style={{ flexShrink: 0, color: 'var(--warn)', marginTop: '1px' }} />
          <strong>重要提醒</strong>
        </div>
        <ul style={{ margin: 0, paddingLeft: '24px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {view.isWalletOnly ? (
            <>
              <li>默认交付不提供 TicketPlus+ 登录邮箱、邮箱密码或 OTP 验证码。</li>
              <li>请只使用 TicketPlus+ 官方渠道生成的 Apple Wallet / Google Wallet 添加链接。</li>
              <li>不要把二维码截图作为唯一凭证保存，乘车时优先打开 Wallet 中的动态车票。</li>
            </>
          ) : (
            <>
              <li>账号登录是例外流程，请不要修改 TicketPlus+ 账号邮箱、密码或支付方式。</li>
              {view.canCustomerLogin && <li>邮箱网页登录只输入用户名，不要输入完整邮箱地址。</li>}
              {view.visibleEmail && <li>TicketPlus+ 登录必须输入完整邮箱地址：{view.visibleEmail}</li>}
            </>
          )}
          <li>车票为实名制，验票时可能要求出示护照或身份证件。</li>
          <li>未来月份车票通常在当月 1 日凌晨约 03:00 后才会激活显示。</li>
          <li>每个邮箱或账号通常只能绑定一张有效 Deutschlandticket。</li>
        </ul>
      </div>

      <div style={{ background: 'var(--card)', border: '1px solid rgba(16,25,47,0.08)', borderRadius: '18px', padding: '18px', boxShadow: 'var(--shadow)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <BookOpen size={16} style={{ color: 'var(--accent)' }} />
          <h3 style={{ margin: 0, fontSize: '0.95rem' }}>{view.isWalletOnly ? 'Wallet 使用步骤' : '账号登录步骤'}</h3>
        </div>
        <ol style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.82rem', lineHeight: '1.5' }}>
          {view.isWalletOnly ? (
            <>
              <li>打开客服发送的官方 Apple Wallet / Google Wallet 添加链接。</li>
              <li>如果微信内无法打开，请复制链接到 Safari 或 Chrome。</li>
              <li>确认车票姓名和月份无误后添加到手机 Wallet。</li>
              <li>乘车前打开 Wallet 中的二维码，验票时同时出示证件。</li>
            </>
          ) : (
            <>
              <li>打开 TicketPlus+，选择 Email Login / 邮箱登录。</li>
              {view.visibleEmail && <li>输入完整邮箱地址：{view.visibleEmail}</li>}
              {view.isManagedOtp ? (
                <li>联系客服获取 TicketPlus+ 验证码。</li>
              ) : (
                <li>打开邮箱收取 TicketPlus+ 验证码。</li>
              )}
              <li>输入验证码后查看 Deutschlandticket 二维码。</li>
            </>
          )}
        </ol>
      </div>

      {data.instructions?.trim() && (
        <div style={{ background: 'var(--card)', border: '1px solid rgba(16,25,47,0.08)', borderRadius: '18px', padding: '18px', boxShadow: 'var(--shadow)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <h3 style={{ margin: 0, fontSize: '0.95rem' }}>客服备注</h3>
          <p style={{ margin: 0, fontSize: '0.82rem', lineHeight: '1.5', whiteSpace: 'pre-wrap', color: 'rgba(16,25,47,0.8)' }}>
            {data.instructions}
          </p>
        </div>
      )}

      <div style={{ background: 'rgba(31,155,209,0.06)', border: '1px solid rgba(31,155,209,0.12)', borderRadius: '16px', padding: '14px', fontSize: '0.78rem', lineHeight: '1.5', display: 'flex', gap: '8px' }}>
        <ShieldCheck size={16} style={{ flexShrink: 0, color: 'var(--accent-2)', marginTop: '2px' }} />
        <div>
          <strong>独立服务声明：</strong>本服务不是 TicketPlus+、Deutsche Bahn、BVG 或 Deutschlandticket 官方服务。我们仅提供购票协助和交付说明，与任何官方交通运营商无关联。
        </div>
      </div>

      <footer style={{ textAlign: 'center', fontSize: '0.72rem', color: 'rgba(16,25,47,0.42)', marginTop: 'auto', paddingTop: '12px' }}>
        <span>D-Ticket 交付中心 · 独立协助服务</span>
      </footer>
    </div>
  );
}
