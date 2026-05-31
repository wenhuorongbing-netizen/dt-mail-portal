import { useEffect, useMemo, useState } from 'react'

export type ModuleLayout = 'list' | 'calendar' | 'chat' | 'form' | 'custom'

export type ModuleConfig = {
  id: string
  title: string
  route: string
  icon: string
  layout: ModuleLayout
  nav_position: number
  backend_router: string
  permissions: string[]
  description: string
  enabled: boolean
}

const fallbackModules: ModuleConfig[] = [
  {
    id: 'customer_portal',
    title: 'Customer Portal',
    route: '/portal',
    icon: 'Smartphone',
    layout: 'custom',
    nav_position: 10,
    backend_router: 'app.modules.customer_portal.backend.router.router',
    permissions: [],
    description: 'Mobile customer handover page for mailbox, ticket login, and rules.',
    enabled: true,
  },
  {
    id: 'orders',
    title: 'Orders',
    route: '/admin/orders',
    icon: 'ClipboardList',
    layout: 'list',
    nav_position: 20,
    backend_router: 'app.modules.orders.backend.router.router',
    permissions: ['admin', 'operator'],
    description: 'Internal order workflow for mailbox creation and delivery.',
    enabled: true,
  },
  {
    id: 'example',
    title: 'Module Example',
    route: '/modules/example',
    icon: 'Boxes',
    layout: 'list',
    nav_position: 90,
    backend_router: 'app.modules.example.backend.router.router',
    permissions: ['admin'],
    description: 'Reference module for future admin addons.',
    enabled: true,
  },
]

export function useModules() {
  const [modules, setModules] = useState<ModuleConfig[]>(fallbackModules)
  const [loading, setLoading] = useState(true)
  const [source, setSource] = useState<'api' | 'fallback'>('fallback')

  useEffect(() => {
    let cancelled = false

    async function loadModules() {
      try {
        const response = await fetch('/api/modules')
        if (!response.ok) {
          throw new Error(`Module registry returned ${response.status}`)
        }

        const payload = (await response.json()) as ModuleConfig[]
        if (!cancelled) {
          setModules(payload)
          setSource('api')
        }
      } catch {
        if (!cancelled) {
          setModules(fallbackModules)
          setSource('fallback')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadModules()

    return () => {
      cancelled = true
    }
  }, [])

  const visibleModules = useMemo(
    () =>
      modules
        .filter((module) => module.enabled)
        .sort((left, right) => left.nav_position - right.nav_position),
    [modules],
  )

  return { loading, modules: visibleModules, source }
}
