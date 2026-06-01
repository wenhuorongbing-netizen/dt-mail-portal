import { useState } from 'react';
import { BookOpen, Check, Copy, Search, ShieldCheck, Wallet } from 'lucide-react';
import { Button } from '../../core/ui/Button';
import { Card } from '../../core/ui/Card';
import { Input } from '../../core/ui/Input';

export default function CustomerPortalStandalone() {
  const [handoverCode, setHandoverCode] = useState('');
  const [copied, setCopied] = useState(false);

  const handoverUrl = handoverCode.trim()
    ? `${window.location.origin}/#/h/${handoverCode.trim()}`
    : `${window.location.origin}/#/h/CODE`;

  function handleOpen(e: React.FormEvent) {
    e.preventDefault();
    if (!handoverCode.trim()) return;
    window.location.hash = `/h/${handoverCode.trim()}`;
  }

  function copyExample() {
    if (navigator.clipboard) {
      void navigator.clipboard.writeText(handoverUrl);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '14px', minHeight: '100%' }}>
      <header>
        <p className="eyebrow">D-Ticket Handover</p>
        <h2 style={{ margin: '0 0 6px', fontSize: '1.25rem' }}>客户交付入口</h2>
        <p className="muted" style={{ margin: 0, fontSize: '0.82rem', lineHeight: 1.5 }}>
          默认使用 Wallet-only 交付：客户只接收官方 Apple Wallet / Google Wallet 添加说明，不接收 TicketPlus+ 账号、邮箱密码或 OTP。
        </p>
      </header>

      <Card style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <form onSubmit={handleOpen} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <label className="eyebrow">交付码</label>
          <Input
            value={handoverCode}
            onChange={(e) => setHandoverCode(e.target.value)}
            placeholder="输入 handover code"
          />
          <Button type="submit" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <Search size={16} />
            打开交付页
          </Button>
        </form>

        <button
          onClick={copyExample}
          className="button-secondary"
          style={{ minHeight: '38px', borderRadius: '12px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? '已复制链接' : '复制当前交付链接'}
        </button>
      </Card>

      <Card style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.82rem', lineHeight: 1.5 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Wallet size={16} style={{ color: 'var(--accent)' }} />
          <strong>客户看到的默认流程</strong>
        </div>
        <ol style={{ margin: 0, paddingLeft: '20px' }}>
          <li>打开客服发送的交付链接。</li>
          <li>使用官方 Apple Wallet / Google Wallet 添加链接。</li>
          <li>乘车前打开 Wallet 中的 D-Ticket 二维码。</li>
          <li>验票时出示二维码和护照或身份证件。</li>
        </ol>
      </Card>

      <Card style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.82rem', lineHeight: 1.5 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BookOpen size={16} style={{ color: 'var(--accent)' }} />
          <strong>账号登录只作为例外</strong>
        </div>
        <p style={{ margin: 0 }}>
          只有在确认没有运营方支付方式、订阅续费或账号接管风险后，才能向客户提供 TicketPlus+ 登录邮箱、邮箱密码或 OTP 支持。
        </p>
      </Card>

      <Card style={{ background: 'rgba(31,155,209,0.06)', border: '1px solid rgba(31,155,209,0.12)', display: 'flex', gap: '8px', fontSize: '0.78rem', lineHeight: 1.5 }}>
        <ShieldCheck size={16} style={{ flexShrink: 0, color: 'var(--accent-2)', marginTop: '2px' }} />
        <div>
          独立协助服务，不是 TicketPlus+、Deutsche Bahn、BVG 或 Deutschlandticket 官方服务。
        </div>
      </Card>
    </div>
  );
}
