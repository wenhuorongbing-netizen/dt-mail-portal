import { lazy, type ComponentType } from 'react';

export type ModuleComponentProps = {
  moduleId: string;
};

// Frontend addon convention:
// frontend/src/modules/<module_id>/index.tsx must default-export a React component.
// Vite includes all matching files at build time, so new modules do not require
// editing core layout/router code.
const moduleImporters = import.meta.glob('../../modules/*/index.tsx');

export function lazyLoadModuleComponent(moduleId: string) {
  const path = `../../modules/${moduleId}/index.tsx`;
  const importer = moduleImporters[path];

  if (!importer) {
    return lazy(async () => ({
      default: () => <div className="empty-state">No frontend component found for module: {moduleId}</div>,
    }));
  }

  return lazy(importer as () => Promise<{ default: ComponentType<ModuleComponentProps> }>);
}
