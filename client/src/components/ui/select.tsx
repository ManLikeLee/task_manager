import type { SelectHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export const Select = ({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) => (
  <select
    className={cn(
      'h-9 w-full rounded-lg border border-[rgb(var(--border-strong))] bg-[rgb(var(--surface))] px-3 text-[12px] text-[rgb(var(--text-primary))] focus-visible:border-[rgb(var(--accent-gold))] focus-visible:outline-none',
      className,
    )}
    {...props}
  >
    {children}
  </select>
)
