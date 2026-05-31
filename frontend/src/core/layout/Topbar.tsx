import { Bell, Search } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { ModuleConfig } from '../modules/modulesRegistry';

export function Topbar({ modules }: { modules: ModuleConfig[] }) {
  const location = useLocation();
  const current = modules.find((module) => module.route === location.pathname) ?? modules[0];

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
        <div className="avatar">EZ</div>
      </div>
    </header>
  );
}
