import { useParams, Link } from 'react-router-dom';
import { Mail, Copy, Check, ExternalLink, Lock, Unlock, BookOpen, ShieldCheck, AlertTriangle, HelpCircle, ArrowLeft, Loader2 } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { supabase, WEBMAIL_URL } from '../lib/supabase';

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

const STEPS = ['登录邮箱', '收验证码', '登录 TicketPlus+', '查看车票'];

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

  const copyAll = useCallback(() => {
    if (!data?.mailbox_email || !data?.mailbox_password) return;
    const localPart = data.mailbox_email.split('@')[0] ?? '';
    const text = [
      `TicketPlus+ 登录邮箱: ${data.mailbox_email}`,
      `邮箱网页登录用户名: ${localPart}`,
      `邮箱密码: ${data.mailbox_password}`,
      `邮箱登录地址: ${WEBMAIL_URL}`,
    ].join('\n');
    triggerCopy(text, 'all');
  }, [data, triggerCopy]);

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

      const { data: result, error: rpcError } = await supabase.rpc('get_handover_by_code', {
        p_code: code!,
      });

      if (cancelled) return;

      if (rpcError) {
        console.error('Handover RPC error:', rpcError);
        setError('无法加载交付信息，请稍后重试。');
        setLoading(false);
        return;
      }

      if (!result) {
        setError('此交付码无效或已过期。');
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

  // --- Loading state ---
  if (loading) {
    return (
      <div className="customer-page" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <Loader2 size={32} style={{ color: 'var(--accent-2)', animation: 'spin 1s linear infinite' }} />
        <p style={{ margin: 0, fontSize: '0.9rem', color: 'rgba(16,25,47,0.6)' }}>加载交付信息中…</p>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // --- Error state ---
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
              <strong>需要帮助？</strong>请联系发送此链接的客服人员，确认交付码或重新生成。
            </div>
          </div>
        </div>

        <footer style={{ textAlign: 'center', fontSize: '0.72rem', color: 'rgba(16,25,47,0.42)', paddingTop: '12px' }}>
          <span>D-Ticket 交付中心 · 独立协助服务</span>
        </footer>
      </div>
    );
  }

  // --- Success state ---
  return (
    <div className="customer-page">
      <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: 'rgba(16,25,47,0.6)', textDecoration: 'none' }}>
        <ArrowLeft size={14} /> 返回首页
      </Link>

      <header>
        <p className="eyebrow">交付记录</p>
        <h1 style={{ fontSize: '1.4rem', margin: '0 0 4px', fontFamily: 'var(--font-display)' }}>您的 D-Ticket 邮箱</h1>
        <p style={{ margin: 0, fontSize: '0.82rem', color: 'rgba(16,25,47,0.6)' }}>
          交付码：<code style={{ background: 'rgba(16,25,47,0.06)', padding: '2px 6px', borderRadius: '6px', fontWeight: 'bold' }}>{data.code}</code>
          {data.ticket_month && (
            <span style={{ marginLeft: '8px' }}>· 车票月份：<strong>{data.ticket_month}</strong></span>
          )}
        </p>
      </header>

      {/* Stepper */}
      <div className="stepper">
        {STEPS.map((step, i) => (
          <span key={step} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            {i > 0 && <span className="stepper-arrow">→</span>}
            <span className={`stepper-step ${i === 0 ? 'active' : ''}`}>{i + 1}. {step}</span>
          </span>
        ))}
      </div>

      {/* Primary action buttons */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <a href={WEBMAIL_URL} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', flex: 1, minWidth: '140px' }}>
          <button style={{ width: '100%', minHeight: '48px', background: 'var(--accent-2)', color: 'white', border: 'none', borderRadius: '14px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.9rem' }}>
            <ExternalLink size={16} /> 打开邮箱收验证码
          </button>
        </a>
        {data.mailbox_email && (
          <button
            onClick={() => triggerCopy(data.mailbox_email!, 'email')}
            style={{ flex: 1, minWidth: '140px', minHeight: '48px', background: 'var(--accent)', color: 'var(--ink)', border: 'none', borderRadius: '14px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.9rem' }}
          >
            {copyState['email'] ? <Check size={16} /> : <Copy size={16} />}
            {copyState['email'] ? '已复制登录邮箱' : '复制 TicketPlus+ 登录邮箱'}
          </button>
        )}
      </div>

      {/* Mailbox credentials card */}
      <div style={{ background: 'var(--card)', border: '1px solid rgba(16,25,47,0.08)', borderRadius: '18px', padding: '18px', boxShadow: 'var(--shadow)', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ background: 'rgba(244,166,42,0.12)', width: '36px', height: '36px', borderRadius: '10px', display: 'grid', placeItems: 'center' }}>
            <Mail size={18} style={{ color: '#b7791f' }} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '0.95rem' }}>邮箱登录凭证</h3>
            <span style={{ fontSize: '0.72rem', color: 'rgba(16,25,47,0.52)' }}>用于登录邮箱接收 OTP 验证码</span>
          </div>
        </div>

        {/* Full email */}
        {data.mailbox_email && (
          <div className="cred-row">
            <div style={{ minWidth: 0 }}>
              <span style={{ display: 'block', fontSize: '0.7rem', color: 'gray' }}>TicketPlus+ 登录邮箱</span>
              <code style={{ fontSize: '0.88rem', fontWeight: 'bold', color: 'var(--ink)', wordBreak: 'break-all' }}>{data.mailbox_email}</code>
            </div>
            <button onClick={() => triggerCopy(data.mailbox_email!, 'email2')} className="copy-btn">
              {copyState['email2'] ? <Check size={12} style={{ color: 'var(--good)' }} /> : <Copy size={12} />}
              {copyState['email2'] ? '已复制' : '复制'}
            </button>
          </div>
        )}

        {/* Username */}
        {localPart && (
          <div className="cred-row">
            <div>
              <span style={{ display: 'block', fontSize: '0.7rem', color: 'gray' }}>邮箱网页登录用户名（仅用户名，不含@后缀）</span>
              <code style={{ fontSize: '0.88rem', fontWeight: 'bold', color: 'var(--ink)' }}>{localPart}</code>
            </div>
            <button onClick={() => triggerCopy(localPart, 'local')} className="copy-btn">
              {copyState['local'] ? <Check size={12} style={{ color: 'var(--good)' }} /> : <Copy size={12} />}
              {copyState['local'] ? '已复制' : '复制'}
            </button>
          </div>
        )}

        {/* Password */}
        {data.mailbox_password && (
          <div className="cred-row">
            <div>
              <span style={{ display: 'block', fontSize: '0.7rem', color: 'gray' }}>邮箱密码</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <code style={{ fontSize: '0.88rem', fontWeight: 'bold', color: 'var(--ink)' }}>
                  {pwdVisible ? data.mailbox_password : '\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022'}
                </code>
                <button
                  onClick={() => setPwdVisible(!pwdVisible)}
                  style={{ background: 'none', border: 'none', color: 'gray', padding: 0, cursor: 'pointer', display: 'inline-flex' }}
                  aria-label={pwdVisible ? '隐藏密码' : '显示密码'}
                >
                  {pwdVisible ? <Unlock size={14} /> : <Lock size={14} />}
                </button>
              </div>
            </div>
            <button onClick={() => triggerCopy(data.mailbox_password!, 'pwd')} className="copy-btn">
              {copyState['pwd'] ? <Check size={12} style={{ color: 'var(--good)' }} /> : <Copy size={12} />}
              {copyState['pwd'] ? '已复制' : '复制'}
            </button>
          </div>
        )}

        {/* Copy all */}
        <button
          onClick={copyAll}
          className="button-secondary"
          style={{ width: '100%', minHeight: '40px', borderRadius: '12px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.85rem' }}
        >
          {copyState['all'] ? <Check size={14} style={{ color: 'var(--good)' }} /> : <Copy size={14} />}
          {copyState['all'] ? '已复制全部登录信息' : '一键复制全部登录信息'}
        </button>
      </div>

      {/* Login warnings */}
      <div style={{ background: 'rgba(244,166,42,0.06)', border: '1px solid rgba(244,166,42,0.18)', borderRadius: '16px', padding: '14px', fontSize: '0.78rem', lineHeight: '1.6', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
          <AlertTriangle size={16} style={{ flexShrink: 0, color: 'var(--warn)', marginTop: '1px' }} />
          <div>
            <strong>重要提醒，请仔细阅读：</strong>
          </div>
        </div>
        <ul style={{ margin: 0, paddingLeft: '24px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <li><strong>邮箱网页登录：</strong>只输入 <em>用户名</em>（@前面的部分），不要输入完整邮箱地址。</li>
          <li><strong>TicketPlus+ 登录：</strong>必须输入<em>完整邮箱地址</em>（如 {data.mailbox_email ?? 'user@tickets.buffjo.top'}），不要只输入用户名。</li>
          <li><strong>车票是实名制。</strong>票面显示您的姓名，查票时可能要求出示护照或身份证。</li>
          <li><strong>每月1号凌晨约3点后</strong>，下月车票才会激活显示。如果登录后看不到票，请确认是否到了新月份。</li>
          <li><strong>每个邮箱只能有一张活跃的 Deutschlandticket。</strong></li>
        </ul>
      </div>

      {/* Quick login steps */}
      <div style={{ background: 'var(--card)', border: '1px solid rgba(16,25,47,0.08)', borderRadius: '18px', padding: '18px', boxShadow: 'var(--shadow)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <BookOpen size={16} style={{ color: 'var(--accent)' }} />
          <h3 style={{ margin: 0, fontSize: '0.95rem' }}>快速登录步骤</h3>
        </div>
        <ol style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.82rem', lineHeight: '1.5' }}>
          <li>在应用商店下载 <strong>TicketPlus+</strong>。</li>
          <li>打开应用，选择 <strong>Email Login（邮箱登录）</strong>。</li>
          <li>输入上方的<strong>完整邮箱地址</strong>。</li>
          <li>打开邮箱（用<strong>用户名</strong>登录，不是完整邮箱），找到 TicketPlus+ 发来的验证码。</li>
          <li>在 TicketPlus+ 中输入验证码完成登录。</li>
          <li>您的 Deutschlandticket 二维码将显示在应用中。</li>
        </ol>
        <Link to="/guide" style={{ textDecoration: 'none' }}>
          <button style={{ width: '100%', minHeight: '40px', background: 'rgba(16,25,47,0.06)', color: 'var(--ink)', border: '1px solid rgba(16,25,47,0.1)', borderRadius: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.82rem' }}>
            <BookOpen size={14} /> 查看完整登录教程
          </button>
        </Link>
      </div>

      {/* Operator instructions */}
      {data.instructions && data.instructions.trim() && (
        <div style={{ background: 'var(--card)', border: '1px solid rgba(16,25,47,0.08)', borderRadius: '18px', padding: '18px', boxShadow: 'var(--shadow)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <h3 style={{ margin: 0, fontSize: '0.95rem' }}>客服备注</h3>
          <p style={{ margin: 0, fontSize: '0.82rem', lineHeight: '1.5', whiteSpace: 'pre-wrap', color: 'rgba(16,25,47,0.8)' }}>
            {data.instructions}
          </p>
        </div>
      )}

      {/* Disclaimer */}
      <div style={{ background: 'rgba(31,155,209,0.06)', border: '1px solid rgba(31,155,209,0.12)', borderRadius: '16px', padding: '14px', fontSize: '0.78rem', lineHeight: '1.5', display: 'flex', gap: '8px' }}>
        <ShieldCheck size={16} style={{ flexShrink: 0, color: 'var(--accent-2)', marginTop: '2px' }} />
        <div>
          <strong>独立服务声明：</strong>本服务不是 TicketPlus+、Deutsche Bahn 或 Deutschlandticket 的官方服务。我们仅提供邮箱托管和购票协助。与任何交通运营商无关联。
        </div>
      </div>

      <footer style={{ textAlign: 'center', fontSize: '0.72rem', color: 'rgba(16,25,47,0.42)', marginTop: 'auto', paddingTop: '12px' }}>
        <span>D-Ticket 交付中心 · 独立协助服务</span>
      </footer>
    </div>
  );
}
