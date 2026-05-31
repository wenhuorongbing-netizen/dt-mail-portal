import type { ReactNode } from 'react'

type TagProps = {
  children: ReactNode
  tone?: 'neutral' | 'success' | 'warning'
}

export function Tag({ children, tone = 'neutral' }: TagProps) {
  return <span className={`tag ${tone}`}>{children}</span>
}
