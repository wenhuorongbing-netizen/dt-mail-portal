import type { HTMLAttributes } from 'react'

export function Card({ children, className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`card ${className}`.trim()} {...props}>
      {children}
    </div>
  )
}
