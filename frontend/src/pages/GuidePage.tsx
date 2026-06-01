import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, BookOpen, HelpCircle, ShieldCheck, Wallet } from 'lucide-react';

export default function GuidePage() {
  return (
    <div style={{ maxWidth: '540px', margin: '0 auto', padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: '16px', minHeight: '100vh' }}>
      <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: 'rgba(16,25,47,0.6)', textDecoration: 'none' }}>
        <ArrowLeft size={14} /> 返回首页
      </Link>

      <header>
        <p className="eyebrow">Wallet Guide</p>
        <h1 style={{ fontSize: '1.4rem', margin: '0 0 4px', fontFamily: 'var(--font-display)' }}>Apple Wallet / Google Wallet 使用指南</h1>
        <p style={{ margin: 0, fontSize: '0.82rem', color: 'rgba(16,25,47,0.6)', lineHeight: 1.5 }}>
          默认交付方式是官方 Wallet 添加链接。您不需要 TicketPlus+ 账号登录、邮箱密码或 OTP 验证码。
        </p>
      </header>

      <div style={{ background: 'var(--card)', border: '1px solid rgba(16,25,47,0.08)', borderRadius: '18px', padding: '18px', boxShadow: 'var(--shadow)', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Wallet size={16} style={{ color: 'var(--accent)' }} />
          <h3 style={{ margin: 0 }}>添加步骤</h3>
        </div>

        <ol style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.85rem', lineHeight: '1.6' }}>
          <li>
            <strong>打开官方添加链接：</strong>使用客服发送的 Apple Wallet 或 Google Wallet 链接。不要使用非官方自制 pass 或二维码截图作为最终交付。
          </li>
          <li>
            <strong>微信打不开时换浏览器：</strong>如果在微信内点击无反应，请复制链接到 Safari、Chrome 或手机默认浏览器打开。
          </li>
          <li>
            <strong>确认实名信息：</strong>添加前检查车票姓名、月份和二维码页面是否正常显示。
          </li>
          <li>
            <strong>保存到手机 Wallet：</strong>iPhone 选择添加到 Apple Wallet；Android 按页面提示添加到 Google Wallet 或系统钱包。
          </li>
          <li>
            <strong>乘车前检查：</strong>出发前打开 Wallet，确认二维码能显示，手机有电并可离线打开。
          </li>
          <li>
            <strong>验票时出示证件：</strong>Deutschlandticket 是实名票，查票时可能要求出示护照或身份证件。
          </li>
        </ol>
      </div>

      <div style={{ background: 'var(--card)', border: '1px solid rgba(16,25,47,0.08)', borderRadius: '18px', padding: '18px', boxShadow: 'var(--shadow)', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.82rem', lineHeight: '1.5' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <BookOpen size={16} style={{ color: 'var(--accent)' }} />
          <h3 style={{ margin: 0, fontSize: '0.95rem' }}>重要说明</h3>
        </div>
        <ul style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <li>默认情况下，客户不接收 TicketPlus+ 登录邮箱、邮箱密码或验证码。</li>
          <li>不要修改 TicketPlus+ 账号、邮箱、密码、订阅或支付方式。</li>
          <li>未来月份车票通常在当月 1 日凌晨约 03:00 后才会激活显示。</li>
          <li>每个邮箱或账号通常只能绑定一张有效 Deutschlandticket。</li>
          <li>如果 Wallet 链接过期、无法打开或显示信息不对，请联系客服补发或核对。</li>
        </ul>
      </div>

      <div style={{ background: 'rgba(31,155,209,0.06)', border: '1px solid rgba(31,155,209,0.12)', borderRadius: '16px', padding: '14px', fontSize: '0.78rem', lineHeight: '1.5', display: 'flex', gap: '8px' }}>
        <HelpCircle size={16} style={{ flexShrink: 0, color: 'var(--accent-2)', marginTop: '2px' }} />
        <div>
          <strong>账号登录例外：</strong>只有在确认没有运营方支付方式、订阅续费或账号接管风险后，客服才会提供 TicketPlus+ 登录或邮箱登录支持。
        </div>
      </div>

      <div style={{ background: 'rgba(244,166,42,0.06)', border: '1px solid rgba(244,166,42,0.18)', borderRadius: '16px', padding: '14px', fontSize: '0.78rem', lineHeight: '1.6', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
          <AlertTriangle size={16} style={{ flexShrink: 0, color: 'var(--warn)', marginTop: '1px' }} />
          <strong>常见问题</strong>
        </div>
        <ul style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <li><strong>链接打不开：</strong>复制到系统浏览器，关闭无痕模式或换网络后重试。</li>
          <li><strong>看不到车票：</strong>确认是否已到票面月份，未来月份车票可能尚未激活。</li>
          <li><strong>手机换机：</strong>联系客服联系票源方重新发送官方 Wallet 添加链接。</li>
          <li><strong>验票失败：</strong>立即联系客服，并保留票面月份、姓名和错误提示截图用于排查。</li>
        </ul>
      </div>

      <div style={{ background: 'rgba(31,155,209,0.06)', border: '1px solid rgba(31,155,209,0.12)', borderRadius: '16px', padding: '14px', fontSize: '0.78rem', lineHeight: '1.5', display: 'flex', gap: '8px' }}>
        <ShieldCheck size={16} style={{ flexShrink: 0, color: 'var(--accent-2)', marginTop: '2px' }} />
        <div>
          本服务不是 TicketPlus+、Deutsche Bahn、BVG 或 Deutschlandticket 官方服务。我们仅提供购票协助和交付说明。
        </div>
      </div>

      <footer style={{ textAlign: 'center', fontSize: '0.72rem', color: 'rgba(16,25,47,0.42)', marginTop: 'auto', paddingTop: '12px' }}>
        <span>D-Ticket 交付中心 · 独立协助服务</span>
      </footer>
    </div>
  );
}
