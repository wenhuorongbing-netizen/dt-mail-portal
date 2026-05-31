import type { ButtonHTMLAttributes } from 'react'
import type { LucideIcon } from 'lucide-react'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  icon?: LucideIcon
  variant?: 'primary' | 'secondary' | 'ghost'
}

export function Button({ children, className = '', icon: Icon, variant = 'primary', ...props }: ButtonProps) {
  return (
    <button className={`button ${variant} ${className}`.trim()} type="button" {...props}>
      {Icon ? <Icon size={16} /> : null}
      <span>{children}</span>
    </button>
  )
}
