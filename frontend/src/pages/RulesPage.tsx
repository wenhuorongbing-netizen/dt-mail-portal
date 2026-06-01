import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Calculator, HelpCircle, ShieldCheck } from 'lucide-react';

const TICKET_PRICE = 63;

export default function RulesPage() {
  const [calcDate, setCalcDate] = useState(new Date().toISOString().split('T')[0]);
  const [serviceFee, setServiceFee] = useState(10);

  const calc = useMemo(() => {
    const date = new Date(calcDate);
    const day = date.getDate();
    const after10th = day > 10;
    const monthCount = after10th ? 2 : 1;
    const ticketTotal = monthCount * TICKET_PRICE;
    return { day, after10th, monthCount, ticketTotal, total: ticketTotal + serviceFee };
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
          Deutschlandticket 订阅和交付的重要规则。
        </p>
      </header>

      <div style={{ background: 'var(--card)', border: '1px solid rgba(16,25,47,0.08)', borderRadius: '18px', padding: '18px', boxShadow: 'var(--shadow)', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <HelpCircle size={16} style={{ color: 'var(--warn)' }} />
          <h3 style={{ margin: 0 }}>10 号取消规则</h3>
        </div>

        <div style={{ fontSize: '0.82rem', lineHeight: '1.6' }}>
          <p style={{ margin: '0 0 10px' }}>
            Deutschlandticket 通常是按月自动续费的订阅票。取消下一月订阅有严格截止时间。
          </p>
          <div style={{ background: 'rgba(183,121,31,0.06)', padding: '12px', borderRadius: '12px', border: '1px solid rgba(183,121,31,0.1)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div>
              <strong style={{ color: '#b7791f' }}>1 到 10 号下单：</strong>
              <p style={{ margin: '4px 0 0' }}>通常只需处理当前月车票。如需取消下月，请务必在当月 10 号前联系处理。</p>
            </div>
            <div>
              <strong style={{ color: '#b7791f' }}>10 号之后下单：</strong>
              <p style={{ margin: '4px 0 0' }}>系统通常已锁定下月订阅，需要支付当前月和下月两个月费用。</p>
            </div>
          </div>
        </div>
      </div>

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
            <span style={{ fontWeight: 'bold', color: calc.after10th ? '#f59e0b' : '#10b981' }}>
              {calc.monthCount} 个月 {calc.after10th ? '(当前月 + 下月)' : '(当前月)'}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#94a3b8' }}>
            <span>车票费用 (63 EUR/月)</span>
            <span>{calc.ticketTotal.toFixed(2)} EUR</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#94a3b8' }}>
            <span>服务费</span>
            <span>{serviceFee.toFixed(2)} EUR</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1rem', color: '#ffd18d', paddingTop: '4px' }}>
            <span>预计总费用</span>
            <span>{calc.total.toFixed(2)} EUR</span>
          </div>
        </div>
      </div>

      <div style={{ background: 'var(--card)', border: '1px solid rgba(16,25,47,0.08)', borderRadius: '18px', padding: '18px', boxShadow: 'var(--shadow)', display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.82rem', lineHeight: '1.6' }}>
        <h3 style={{ margin: 0, fontSize: '0.95rem' }}>实名制规则</h3>
        <ul style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <li>Deutschlandticket 是实名制、不可转让的个人票。</li>
          <li>票面姓名必须与乘客证件一致。</li>
          <li>验票员可能要求出示护照或带照片的身份证件。</li>
          <li>将车票借给他人使用违反使用条款。</li>
        </ul>
      </div>

      <div style={{ background: 'var(--card)', border: '1px solid rgba(16,25,47,0.08)', borderRadius: '18px', padding: '18px', boxShadow: 'var(--shadow)', display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.82rem', lineHeight: '1.6' }}>
        <h3 style={{ margin: 0, fontSize: '0.95rem' }}>退款与交付</h3>
        <p style={{ margin: 0 }}>
          车票一旦出票或生成 Wallet/二维码，通常视为最终确认。已出票车票是否可退取决于票源方政策和订阅状态。
        </p>
      </div>

      <div style={{ background: 'rgba(31,155,209,0.06)', border: '1px solid rgba(31,155,209,0.12)', borderRadius: '16px', padding: '14px', fontSize: '0.78rem', lineHeight: '1.5', display: 'flex', gap: '8px' }}>
        <ShieldCheck size={16} style={{ flexShrink: 0, color: 'var(--accent-2)', marginTop: '2px' }} />
        <div>
          <strong>独立服务声明：</strong>本服务不是 TicketPlus+、Deutsche Bahn、BVG 或 Deutschlandticket 官方服务。我们仅提供购票协助和交付说明。
        </div>
      </div>

      <footer style={{ textAlign: 'center', fontSize: '0.72rem', color: 'rgba(16,25,47,0.42)', marginTop: 'auto', paddingTop: '12px' }}>
        <span>D-Ticket 交付中心 · 独立协助服务</span>
      </footer>
    </div>
  );
}
