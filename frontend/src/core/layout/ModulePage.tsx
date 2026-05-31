import type { ModuleConfig } from '../modules/modulesRegistry'
import { Card } from '../ui/Card'
import { PageLayout } from './PageLayout'

type ModulePageProps = {
  module?: ModuleConfig
}

export function ModulePage({ module }: ModulePageProps) {
  return (
    <PageLayout
      subtitle={module?.description ?? 'Select a module from the workspace navigation.'}
      title={module?.title ?? 'Module not found'}
    >
      <Card>
        <div className="empty-state">
          <p>Module route is registered, but no dedicated frontend page has been added yet.</p>
        </div>
      </Card>
    </PageLayout>
  )
}
