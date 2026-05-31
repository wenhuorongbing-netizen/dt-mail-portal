import type { ReactNode } from 'react'
import type { ModuleConfig } from '../modules/modulesRegistry'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

type AppShellProps = {
  activeModuleId: string
  children: ReactNode
  loading: boolean
  modules: ModuleConfig[]
  source: 'api' | 'fallback'
}

export function AppShell({ activeModuleId, children, loading, modules, source }: AppShellProps) {
  return (
    <div className="app-shell">
      <Sidebar activeModuleId={activeModuleId} modules={modules} />
      <div className="workspace">
        <Topbar loading={loading} source={source} />
        <main className="main-content">{children}</main>
      </div>
    </div>
  )
}
