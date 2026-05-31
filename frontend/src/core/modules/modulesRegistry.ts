import { useEffect, useState } from 'react';

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

const fallbackModules: ModuleConfig[] = [
  {
    id: 'example',
    title: 'Example Desk',
    route: '/example',
    icon: 'sparkles',
    layout: 'list',
    nav_position: 90,
    description: 'Local fallback module while the backend is offline.',
    enabled: true,
  },
];

export function useModules() {
  const [modules, setModules] = useState<ModuleConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch('/api/modules');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = (await response.json()) as ModuleConfig[];
        if (!cancelled) {
          setModules(data.sort((a, b) => a.nav_position - b.nav_position));
        }
      } catch (err) {
        // During early vibe-coding sessions the backend may not be running.
        // Use a local fallback so the UI shell remains testable.
        if (!cancelled) {
          setModules(fallbackModules);
          setError(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { modules, loading, error };
}
