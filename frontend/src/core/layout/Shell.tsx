import { ReactNode } from 'react';
import { ModuleConfig } from '../modules/modulesRegistry';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

export function Shell({ modules, children }: { modules: ModuleConfig[]; children: ReactNode }) {
  return (
    <div className="shell">
      <Sidebar modules={modules} />
      <main className="workspace">
        <Topbar modules={modules} />
        <section className="workspace-body">{children}</section>
      </main>
    </div>
  );
}
