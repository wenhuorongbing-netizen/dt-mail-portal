import { Bell, LogOut, Search } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { ModuleConfig } from '../modules/modulesRegistry';
import { useAuth } from '../../lib/auth';

export function Topbar({ modules }: { modules: ModuleConfig[] }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const current = modules.find((module) => module.route === location.pathname) ?? modules[0];

  async function handleLogout() {
    await signOut();
    navigate('/admin/login', { replace: true });
  }

  return (
    <header className="topbar">
      <div>
        <div className="eyebrow">Independent ticket assistance workspace</div>
        <h1>{current?.title ?? 'Operating Desk'}</h1>
      </div>
      <div className="topbar-actions">
        <div className="global-search">
          <Search size={16} />
          <input placeholder="Search orders, mailboxes, notes…" />
        </div>
        <button className="icon-button" type="button" aria-label="Notifications">
          <Bell size={18} />
        </button>
        <div className="avatar" title={user?.email ?? 'Operator'}>
          {user?.email?.charAt(0).toUpperCase() ?? 'O'}
        </div>
        <button className="icon-button" type="button" aria-label="Sign out" onClick={handleLogout} title="Sign out">
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
}
