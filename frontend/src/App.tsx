import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AppShell } from './core/layout/AppShell'
import { ModulePage } from './core/layout/ModulePage'
import { useModules } from './core/modules/modulesRegistry'
import { PortalPreviewPage } from './modules/customerPortal/PortalPreviewPage'
import { ExamplePage } from './modules/example/ExamplePage'
import { OrdersPage } from './modules/orders/OrdersPage'

function App() {
  const location = useLocation()
  const registry = useModules()
  const activeModuleId =
    registry.modules.find((module) => location.pathname.startsWith(module.route))?.id ??
    'customer_portal'

  return (
    <AppShell
      activeModuleId={activeModuleId}
      loading={registry.loading}
      modules={registry.modules}
      source={registry.source}
    >
      <Routes>
        <Route path="/" element={<Navigate to="/portal" replace />} />
        <Route path="/portal" element={<PortalPreviewPage />} />
        <Route path="/admin/orders" element={<OrdersPage />} />
        <Route path="/modules/example" element={<ExamplePage />} />
        <Route path="*" element={<ModulePage module={registry.modules[0]} />} />
      </Routes>
    </AppShell>
  )
}

export default App
