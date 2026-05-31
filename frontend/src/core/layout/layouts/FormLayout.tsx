import type { ReactNode } from 'react'

type FormLayoutProps = {
  children: ReactNode
}

export function FormLayout({ children }: FormLayoutProps) {
  return <div className="panel">{children}</div>
}
