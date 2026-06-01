import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Lock, Mail } from 'lucide-react';
import { Button } from '../core/ui/Button';
import { Card } from '../core/ui/Card';
import { Input } from '../core/ui/Input';
import { useAuth } from '../lib/auth';
import { OPERATOR_MIN_PASSWORD_LENGTH } from '../lib/operatorAuth';

export default function AdminLogin() {
  const { session, signInOrRegister } = useAuth();
  const navigate = useNavigate();
  const [loginName, setLoginName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (session) {
      navigate('/admin/orders', { replace: true });
    }
  }, [navigate, session]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setNotice('');
    setLoading(true);

    const result = await signInOrRegister(loginName, password);
    setLoading(false);

    if (result.status === 'signed_in') {
      setNotice(result.message);
      navigate('/admin/orders', { replace: true });
      return;
    }

    if (result.status === 'confirmation_required') {
      setNotice(result.message);
      return;
    }

    setError(result.message);
  }

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '24px' }}>
      <Card style={{ maxWidth: 400, width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: 'linear-gradient(135deg, var(--accent), #ffd18d)', display: 'grid', placeItems: 'center', margin: '0 auto 14px', fontWeight: 800, fontSize: '1.2rem', color: 'var(--ink)' }}>
            DT
          </div>
          <h2 style={{ margin: '0 0 6px' }}>操作员入口</h2>
          <p className="muted" style={{ fontSize: '0.85rem' }}>
            输入短账号即可，系统会自动补内部域名。客户不能在这里注册或登录。
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label className="eyebrow" style={{ display: 'block', marginBottom: '4px' }}>Operator Login</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(16,25,47,0.4)' }} />
              <Input
                value={loginName}
                onChange={(e) => setLoginName(e.target.value)}
                placeholder="abc"
                required
                style={{ paddingLeft: 38 }}
              />
            </div>
          </div>

          <div>
            <label className="eyebrow" style={{ display: 'block', marginBottom: '4px' }}>Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(16,25,47,0.4)' }} />
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={`至少 ${OPERATOR_MIN_PASSWORD_LENGTH} 位密码`}
                required
                minLength={OPERATOR_MIN_PASSWORD_LENGTH}
                style={{ paddingLeft: 38 }}
              />
            </div>
          </div>

          <p style={{ color: 'rgba(16,25,47,0.58)', fontSize: '0.78rem', lineHeight: 1.6, margin: 0 }}>
            例如账号填 <code>abc</code> 即可，不需要输入 @ 和后面的域名。密码默认至少 {OPERATOR_MIN_PASSWORD_LENGTH} 位。
          </p>

          {error && (
            <p style={{ color: 'var(--danger)', fontSize: '0.85rem', margin: 0, padding: '10px', background: 'rgba(180,35,24,0.06)', borderRadius: 10 }}>
              {error}
            </p>
          )}

          {notice && (
            <p style={{ color: 'var(--good)', fontSize: '0.85rem', margin: 0, padding: '10px', background: 'rgba(13,138,97,0.08)', borderRadius: 10 }}>
              {notice}
            </p>
          )}

          <Button type="submit" disabled={loading} style={{ width: '100%', marginTop: '4px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            {loading ? '处理中...' : '进入操作台'}
            {!loading && <ArrowRight size={16} />}
          </Button>
        </form>
      </Card>
    </div>
  );
}
