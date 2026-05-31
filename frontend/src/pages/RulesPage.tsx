import { Link } from 'react-router-dom';
import { ArrowLeft, HelpCircle, ShieldCheck, Calculator } from 'lucide-react';
import { useState, useMemo } from 'react';

const TICKET_PRICE = 63;

export default function RulesPage() {
  const [calcDate, setCalcDate] = useState(new Date().toISOString().split('T')[0]);
  const [serviceFee, setServiceFee] = useState(10);

  const calc = useMemo(() => {
    const d = new Date(calcDate);
    const day = d.getDate();
    const onOrAfter10th = day >= 10;
    const monthCount = onOrAfter10th ? 2 : 1;
    const ticketTotal = monthCount * TICKET_PRICE;
    return { day, onOrAfter10th, monthCount, ticketTotal, total: ticketTotal + serviceFee };
  }, [calcDate, serviceFee]);

  return (
    <div className="customer-page">
      <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: 'rgba(16,25,47,0.6)', textDecoration: 'none' }}>
        <ArrowLeft size={14} /> 返回首页
      </Link>

      <header>
        <p className="eyebrow">规则说明</p>
        <h1 style={{ fontSize: '1.4rem', margin: '0 0 4px', fontFamily: 'var(--font-display)' }}>规则与费用</h1>
        <p style={{ margin: 0, fontSize: '0.82rem', color: 'rgba(16,25,47,0.6)' }}>
          Deutschlandticket 订阅的重要规则。
        </p>
      </header>

      {/* 10th-day rule */}
      <div style={{ background: 'var(--card)', border: '1px solid rgba(16,25,47,0.08)', borderRadius: '18px', padding: '18px', boxShadow: 'var(--shadow)', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <HelpCircle size={16} style={{ color: 'var(--warn)' }} />
          <h3 style={{ margin: 0 }}>10 号取消规则</h3>
        </div>

        <div style={{ fontSize: '0.82rem', lineHeight: '1.6' }}>
          <p style={{ margin: '0 0 10px' }}>
            Deutschlandticket 是按月自动续费的订阅制。取消截止日非常严格：
          </p>
          <div style={{ background: 'rgba(183,121,31,0.06)', padding: '12px', borderRadius: '12px', border: '1px solid rgba(183,121,31,0.1)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div>
              <strong style={{ color: '#b7791f' }}>1–9 号下单：</strong>
              <p style={{ margin: '4px 0 0' }}>通常只需处理当前月的车票。如需取消下月，须在当月 10 号之前联系我们。</p>
            </div>
            <div>
              <strong style={{ color: '#b7791f' }}>10 号及之后下单：</strong>
              <p style={{ margin: '4px 0 0' }}>系统已锁定下月车票。通常需要支付<strong>当前月 + 下月</strong>两个月的费用。此费用无法退还。</p>
            </div>
          </div>
        </div>
      </div>

      {/* Price calculator */}
      <div style={{ background: '#0f172a', color: '#f8fafc', border: '1px solid #334155', borderRadius: '18px', padding: '18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Calculator size={16} style={{ color: 'var(--accent)' }} />
          <h3 style={{ margin: 0, fontSize: '0.95rem', color: '#f1f5f9' }}>费用计算器</h3>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '140px' }}>
            <label style={{ display: 'block', fontSize: '0.72rem', color: '#94a3b8', marginBottom: '4px' }}>下单日期</label>
            <input
              type="date"
              value={calcDate}
              onChange={(e) => setCalcDate(e.target.value)}
              style={{ width: '100%', minHeight: '40px', padding: '0 10px', borderRadius: 10, border: '1px solid #334155', background: '#1e293b', color: '#f8fafc', fontFamily: 'inherit', fontSize: '0.85rem' }}
            />
          </div>
          <div style={{ flex: 1, minWidth: '140px' }}>
            <label style={{ display: 'block', fontSize: '0.72rem', color: '#94a3b8', marginBottom: '4px' }}>服务费 (EUR)</label>
            <input
              type="number"
              step="0.01"
              value={serviceFee}
              onChange={(e) => setServiceFee(Number(e.target.value))}
              style={{ width: '100%', minHeight: '40px', padding: '0 10px', borderRadius: 10, border: '1px solid #334155', background: '#1e293b', color: '#f8fafc', fontFamily: 'inherit', fontSize: '0.85rem' }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem', marginTop: '4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #334155', paddingBottom: '6px' }}>
            <span style={{ color: '#94a3b8' }}>下单日：</span>
            <span style={{ fontWeight: 'bold' }}>每月 {calc.day} 号</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #334155', paddingBottom: '6px' }}>
            <span style={{ color: '#94a3b8' }}>订阅时长：</span>
            <span style={{ fontWeight: 'bold', color: calc.onOrAfter10th ? '#f59e0b' : '#10b981' }}>
              {calc.monthCount} 个月 {calc.onOrAfter10th ? '（当月+下月）' : '（仅当月）'}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#94a3b8' }}>
            <span>车票费用（63€/月）</span>
            <span>{calc.ticketTotal.toFixed(2)} €</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#94a3b8' }}>
            <span>服务费</span>
            <span>{serviceFee.toFixed(2)} €</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1rem', color: '#ffd18d', paddingTop: '4px' }}>
            <span>预计总费用</span>
            <span>{calc.total.toFixed(2)} €</span>
          </div>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '10px', fontSize: '0.78rem', border: '1px solid rgba(255,255,255,0.06)', lineHeight: '1.4', color: '#cbd5e1' }}>
          <strong>计费规则：</strong>每月 10 号（含）之前下单，通常只需支付当月。10 号之后下单，系统已锁定下月续费，需支付两个月。
        </div>
      </div>

      {/* Personal ticket rules */}
      <div style={{ background: 'var(--card)', border: '1px solid rgba(16,25,47,0.08)', borderRadius: '18px', padding: '18px', boxShadow: 'var(--shadow)', display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.82rem', lineHeight: '1.6' }}>
        <h3 style={{ margin: 0, fontSize: '0.95rem' }}>实名制规则</h3>
        <ul style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <li>Deutschlandticket 是<strong>实名制、不可转让</strong>的个人票。</li>
          <li>QR 码上显示您的护照姓名拼音。</li>
          <li>查票员可能要求出示护照或带照片的身份证件核对姓名。</li>
          <li>将车票借给他人使用违反使用条款。</li>
        </ul>
      </div>

      {/* Refund policy */}
      <div style={{ background: 'var(--card)', border: '1px solid rgba(16,25,47,0.08)', borderRadius: '18px', padding: '18px', boxShadow: 'var(--shadow)', display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.82rem', lineHeight: '1.6' }}>
        <h3 style={{ margin: 0, fontSize: '0.95rem' }}>退款政策</h3>
        <p style={{ margin: 0 }}>
          车票一旦出票（QR 码生成），购买即为最终确认。根据交通公司的票务政策，已出票的车票无法退款。
        </p>
      </div>

      {/* Disclaimer */}
      <div style={{ background: 'rgba(31,155,209,0.06)', border: '1px solid rgba(31,155,209,0.12)', borderRadius: '16px', padding: '14px', fontSize: '0.78rem', lineHeight: '1.5', display: 'flex', gap: '8px' }}>
        <ShieldCheck size={16} style={{ flexShrink: 0, color: 'var(--accent-2)', marginTop: '2px' }} />
        <div>
          <strong>独立服务声明：</strong>本服务与 Deutsche Bahn、TicketPlus+ 或任何官方交通运营商无关联。我们仅提供邮箱托管和购票协助。
        </div>
      </div>

      <footer style={{ textAlign: 'center', fontSize: '0.72rem', color: 'rgba(16,25,47,0.42)', marginTop: 'auto', paddingTop: '12px' }}>
        <span>D-Ticket 交付中心 · 独立协助服务</span>
      </footer>
    </div>
  );
}
