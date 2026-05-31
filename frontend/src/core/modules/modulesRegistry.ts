export type ModuleLayout = 'list' | 'calendar' | 'chat' | 'form' | 'custom';

export interface ModuleConfig {
  id: string;
  title: string;
  route: string;
  icon: string;
  layout: ModuleLayout;
  nav_position: number;
  description?: string;
  enabled?: boolean;
  permissions?: string[];
}

const staticModules: ModuleConfig[] = [
  {
    id: 'orders',
    title: 'Orders',
    route: '/admin/orders',
    icon: 'crm',
    layout: 'list',
    nav_position: 10,
    description: 'Order management and status tracking.',
    enabled: true,
  },
  {
    id: 'mailboxes',
    title: 'Mailboxes',
    route: '/admin/mailboxes',
    icon: 'package',
    layout: 'custom',
    nav_position: 20,
    description: 'Mailbox inventory and credential management.',
    enabled: true,
  },
  {
    id: 'example',
    title: 'Example Desk',
    route: '/admin/example',
    icon: 'sparkles',
    layout: 'list',
    nav_position: 90,
    description: 'Local fallback module while the backend is offline.',
    enabled: true,
  },
];

export function useModules() {
  return { modules: staticModules, loading: false, error: null as string | null };
}
