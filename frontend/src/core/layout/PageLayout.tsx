import type { ReactNode } from 'react'

type PageLayoutProps = {
  actions?: ReactNode
  children: ReactNode
  subtitle: string
  title: string
}

export function PageLayout({ actions, children, subtitle, title }: PageLayoutProps) {
  return (
    <section className="page-layout">
      <header className="page-header">
        <div>
          <h2 className="page-title">{title}</h2>
          <p className="page-subtitle">{subtitle}</p>
        </div>
        {actions ? <div className="page-actions">{actions}</div> : null}
      </header>
      {children}
    </section>
  )
}
