import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { Button } from '../core/ui/Button';
import { Input } from '../core/ui/Input';
import { Card } from '../core/ui/Card';
import { Lock, Mail } from 'lucide-react';

export default function AdminLogin() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error: signInError } = await signIn(email, password);
    setLoading(false);
    if (signInError) {
      setError(signInError);
    } else {
      navigate('/admin/orders', { replace: true });
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '24px' }}>
      <Card style={{ maxWidth: 400, width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: 'linear-gradient(135deg, var(--accent), #ffd18d)', display: 'grid', placeItems: 'center', margin: '0 auto 14px', fontWeight: 800, fontSize: '1.2rem', color: 'var(--ink)' }}>
            DT
          </div>
          <h2 style={{ margin: '0 0 6px' }}>Operator Login</h2>
          <p className="muted" style={{ fontSize: '0.85rem' }}>Sign in to the operations desk.</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label className="eyebrow" style={{ display: 'block', marginBottom: '4px' }}>Email</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(16,25,47,0.4)' }} />
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="operator@example.com"
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
                placeholder="••••••••"
                required
                style={{ paddingLeft: 38 }}
              />
            </div>
          </div>

          {error && (
            <p style={{ color: 'var(--danger)', fontSize: '0.85rem', margin: 0, padding: '10px', background: 'rgba(180,35,24,0.06)', borderRadius: 10 }}>
              {error}
            </p>
          )}

          <Button type="submit" disabled={loading} style={{ width: '100%', marginTop: '4px' }}>
            {loading ? 'Signing in…' : 'Sign In'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
