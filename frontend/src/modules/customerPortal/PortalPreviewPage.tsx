import { CheckCircle2, ExternalLink, Smartphone, Info } from 'lucide-react';
import { Card } from '../../core/ui/Card';
import { Tag } from '../../core/ui/Tag';
import { PageLayout } from '../../core/layout/PageLayout';
import { Button } from '../../core/ui/Button';
import CustomerPortalStandalone from './CustomerPortalStandalone';

export function PortalPreviewPage() {
  return (
    <PageLayout>
      <div className="module-frame-header" style={{ marginBottom: '14px' }}>
        <div>
          <p className="eyebrow">Visual Simulator</p>
          <h2 style={{ fontSize: '1.8rem', margin: 0 }}>Customer Portal Preview</h2>
          <p className="muted">CRM interactive view showing the mobile-first customer interface exactly as seen on phones or inside WeChat.</p>
        </div>
      </div>
      
      <div className="portal-preview" style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 420px) minmax(0, 1fr)', gap: '24px' }}>
        {/* Left Side: Live Phone Simulator */}
        <div className="phone-frame" style={{ background: '#152524', borderRadius: '32px', padding: '14px', boxShadow: 'var(--shadow)' }}>
          <div className="phone-screen" style={{ background: '#fcfbf7', borderRadius: '22px', overflowY: 'auto', height: '620px', padding: '0px', display: 'block', border: '1px solid rgba(0,0,0,0.1)' }}>
            <CustomerPortalStandalone />
          </div>
        </div>

        {/* Right Side: Operational Context for the Operator */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Card>
            <div className="row-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <Smartphone size={18} style={{ color: 'var(--accent)' }} />
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>WeChat & Mobile First Design</h3>
            </div>
            <p className="muted" style={{ fontSize: '0.85rem', lineHeight: '1.5', margin: 0 }}>
              Customers access the portal using their mobile phone. It features large touch targets, quick copy shortcuts for verification codes/credentials, and clear warnings to prevent common login confusion.
            </p>
          </Card>

          <Card>
            <div className="row-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <CheckCircle2 size={18} style={{ color: 'var(--good)' }} />
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Dynamic Data Integration</h3>
            </div>
            <p className="muted" style={{ fontSize: '0.85rem', lineHeight: '1.5', margin: 0 }}>
              When a customer enters their D-Ticket order code (e.g. <code style={{ background: 'rgba(0,0,0,0.05)', padding: '2px 4px', borderRadius: '4px' }}>DT-XXXX</code>), this portal queries the database to show their specific mailbox details, ticket month, and status in real-time.
            </p>
          </Card>

          <Card>
            <div className="row-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <ExternalLink size={18} style={{ color: 'var(--accent-2)' }} />
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Domain & Access Path</h3>
            </div>
            <div style={{ fontSize: '0.85rem', color: 'rgba(16,25,47,0.7)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <p style={{ margin: 0 }}>
                In production, these services map to separate domains for clean customer/operator partitioning:
              </p>
              <ul style={{ margin: '4px 0 10px', paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <li><strong>portal.buffjo.top</strong> ➜ Customer Service Desk</li>
                <li><strong>ops.buffjo.top</strong> ➜ Admin Operations Desk</li>
                <li><strong>webmail.buffjo.top</strong> ➜ Customer Webmail Login</li>
              </ul>
              
              <a href="/customer/portal" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                <Button className="button" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', minHeight: '38px', fontSize: '0.8rem' }}>
                  在新标签页打开独立客户端 <ExternalLink size={14} />
                </Button>
              </a>
            </div>
          </Card>

          <div style={{ background: 'rgba(16,25,47,0.04)', borderRadius: '14px', padding: '14px', border: '1px solid rgba(16,25,47,0.06)', display: 'flex', gap: '8px', fontSize: '0.8rem' }}>
            <Info size={16} style={{ flexShrink: 0, color: 'var(--accent)' }} />
            <p style={{ margin: 0, color: 'rgba(16,25,47,0.7)', lineHeight: '1.4' }}>
              <strong>开发验证提示：</strong> 您可以通过左侧的手机模拟器，输入在“订单”模块中创建的测试订单编号（如 E2E 测试生成的编号），来实时预览及调试客户侧看到的数据展示和激活教程。
            </p>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
