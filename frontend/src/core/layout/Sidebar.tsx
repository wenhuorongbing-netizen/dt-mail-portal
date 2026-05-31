import {
  Boxes,
  ClipboardList,
  FileText,
  LayoutDashboard,
  ShieldCheck,
  Smartphone,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import type { ModuleConfig } from '../modules/modulesRegistry'

const iconMap: Record<string, LucideIcon> = {
  Boxes,
  ClipboardList,
  FileText,
  LayoutDashboard,
  ShieldCheck,
  Smartphone,
}

type SidebarProps = {
  activeModuleId: string
  modules: ModuleConfig[]
}

export function Sidebar({ activeModuleId, modules }: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="brand-mark">DT</span>
        <span>
          <span className="brand-title">DT Mail Portal</span>
          <span className="brand-subtitle">节操都市 / TicketPlus+</span>
        </span>
      </div>

      <span className="sidebar-section">Workspace</span>
      <nav className="sidebar-nav" aria-label="Primary navigation">
        {modules.map((module) => {
          const Icon = iconMap[module.icon] ?? LayoutDashboard

          return (
            <NavLink
              className={({ isActive }) =>
                isActive || activeModuleId === module.id ? 'nav-item active' : 'nav-item'
              }
              key={module.id}
              to={module.route}
            >
              <Icon size={18} />
              <span>{module.title}</span>
            </NavLink>
          )
        })}
      </nav>

      <div className="sidebar-footer">
        <span className="meta-label">Domain plan</span>
        <span className="meta-value">tickets.buffjo.top</span>
        <span className="meta-value">webmail.buffjo.top</span>
      </div>
    </aside>
  )
}
