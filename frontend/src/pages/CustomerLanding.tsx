import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, BookOpen, HelpCircle, Search, ShieldCheck, Wallet } from 'lucide-react';
import { useState } from 'react';

export default function CustomerLanding() {
  const navigate = useNavigate();
  const [code, setCode] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = code.trim();
    if (trimmed) {
      navigate(`/h/${trimmed}`);
    }
  }

  return (
    <div className="customer-page">
      <header style={{ textAlign: 'center', paddingTop: '32px' }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: 'linear-gradient(135deg, var(--accent), #ffd18d)', display: 'grid', placeItems: 'center', margin: '0 auto 16px', fontWeight: 800, fontSize: '1.4rem', color: 'var(--ink)' }}>
          DT
        </div>
        <h1 style={{ fontSize: '1.6rem', margin: '0 0 8px', fontFamily: 'var(--font-display)' }}>D-Ticket 交付中心</h1>
        <p style={{ margin: 0, color: 'rgba(16,25,47,0.62)', fontSize: '0.85rem', lineHeight: '1.5' }}>
          Deutschlandticket 购票协助与 Wallet 交付说明
        </p>
      </header>

      <div style={{ background: 'rgba(31,155,209,0.06)', border: '1px solid rgba(31,155,209,0.12)', borderRadius: '16px', padding: '16px', fontSize: '0.82rem', lineHeight: '1.5', display: 'flex', gap: '10px' }}>
        <ShieldCheck size={18} style={{ flexShrink: 0, color: 'var(--accent-2)', marginTop: '2px' }} />
        <div>
          <strong>独立服务声明：</strong>本项目不是 TicketPlus+、Deutsche Bahn、BVG 或 Deutschlandticket 官方服务。我们仅提供购票协助和交付说明。
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ background: 'var(--card)', border: '1px solid rgba(16,25,47,0.08)', borderRadius: '18px', padding: '18px', boxShadow: 'var(--shadow)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Wallet size={18} style={{ color: 'var(--accent)' }} />
          <h3 style={{ margin: 0, fontSize: '0.95rem' }}>打开我的交付页</h3>
        </div>
        <p style={{ margin: 0, fontSize: '0.82rem', color: 'rgba(16,25,47,0.6)' }}>
          输入交付码查看 Wallet 添加说明、乘车前检查和客服备注。
        </p>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="输入交付码，如 a3b8k2m5"
            className="input"
            style={{ flex: 1, fontFamily: 'monospace', letterSpacing: '0.05em' }}
          />
          <button
            type="submit"
            disabled={!code.trim()}
            className="button"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '0 16px' }}
          >
            <Search size={16} /> 查看
          </button>
        </div>
      </form>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <Link to="/guide" style={{ textDecoration: 'none' }}>
          <div style={{ background: 'var(--card)', border: '1px solid rgba(16,25,47,0.08)', borderRadius: '18px', padding: '18px', display: 'flex', alignItems: 'center', gap: '14px', boxShadow: 'var(--shadow)', cursor: 'pointer', transition: 'transform 0.15s' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(244,166,42,0.12)', display: 'grid', placeItems: 'center' }}>
              <BookOpen size={20} style={{ color: 'var(--accent)' }} />
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: '0 0 4px', fontSize: '0.95rem' }}>Wallet 添加指南</h3>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'rgba(16,25,47,0.6)' }}>Apple Wallet / Google Wallet 添加步骤和常见问题</p>
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
              <h3 style={{ margin: '0 0 4px', fontSize: '0.95rem' }}>规则与费用说明</h3>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'rgba(16,25,47,0.6)' }}>10 号规则、计费方式、退订政策</p>
            </div>
            <ArrowRight size={18} style={{ color: 'rgba(16,25,47,0.3)' }} />
          </div>
        </Link>
      </nav>

      <footer style={{ textAlign: 'center', fontSize: '0.72rem', color: 'rgba(16,25,47,0.42)', marginTop: 'auto', paddingTop: '20px' }}>
        <span>独立购票协助服务 · 与任何官方交通运营商无关联</span>
      </footer>
    </div>
  );
}
