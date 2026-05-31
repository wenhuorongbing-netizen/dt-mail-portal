import { Link, useLocation } from 'react-router-dom';
import { CalendarDays, MessageCircle, NotebookTabs, Plus, Search, Settings, Sparkles, UsersRound } from 'lucide-react';
import { ModuleConfig } from '../modules/modulesRegistry';

const iconMap = {
  calendar: CalendarDays,
  crm: UsersRound,
  chat: MessageCircle,
  notes: NotebookTabs,
  settings: Settings,
  sparkles: Sparkles,
  search: Search,
};

export function Sidebar({ modules }: { modules: ModuleConfig[] }) {
  const location = useLocation();

  return (
    <aside className="sidebar">
      <div className="brand-block">
        <div className="brand-mark">DT</div>
        <div>
          <div className="brand-title">Mail Desk</div>
          <div className="brand-subtitle">Transit ops portal</div>
        </div>
      </div>

      <nav className="nav-list">
        {modules.map((module) => {
          const Icon = iconMap[module.icon as keyof typeof iconMap] ?? Sparkles;
          const active = location.pathname === module.route;
          return (
            <Link key={module.id} className={`nav-item ${active ? 'active' : ''}`} to={module.route}>
              <Icon size={18} />
              <span>{module.title}</span>
            </Link>
          );
        })}
      </nav>

      <button className="add-module-button" type="button">
        <Plus size={18} />
        <span>Add module</span>
      </button>
    </aside>
  );
}
