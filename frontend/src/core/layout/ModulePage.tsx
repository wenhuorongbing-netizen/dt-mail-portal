import { Suspense, useMemo } from 'react';
import { ModuleConfig } from '../modules/modulesRegistry';
import { lazyLoadModuleComponent } from '../modules/loadModuleComponent';
import { PageLayout } from './PageLayout';
import { CalendarLayout, ChatLayout, FormLayout, ListLayout } from './StandardLayouts';

function frameFor(layout: ModuleConfig['layout'], children: React.ReactNode, module: ModuleConfig) {
  if (layout === 'calendar') return <CalendarLayout module={module}>{children}</CalendarLayout>;
  if (layout === 'chat') return <ChatLayout module={module}>{children}</ChatLayout>;
  if (layout === 'form') return <FormLayout module={module}>{children}</FormLayout>;
  if (layout === 'custom') return <>{children}</>;
  return <ListLayout module={module}>{children}</ListLayout>;
}

export function ModulePage({ module }: { module: ModuleConfig }) {
  const Component = useMemo(() => lazyLoadModuleComponent(module.id), [module.id]);

  return (
    <PageLayout>
      {frameFor(
        module.layout,
        <Suspense fallback={<div className="empty-state">Loading module…</div>}>
          <Component moduleId={module.id} />
        </Suspense>,
        module,
      )}
    </PageLayout>
  );
}
