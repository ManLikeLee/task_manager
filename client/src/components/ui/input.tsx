import type { InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export const Input = ({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) => (
  <input
    className={cn(
      'h-9 w-full rounded-lg border border-[rgb(var(--border-strong))] bg-[rgb(var(--surface))] px-3 text-[13px] text-[rgb(var(--text-primary))] placeholder:text-[rgb(var(--text-muted))] focus-visible:border-[rgb(var(--accent-gold))] focus-visible:outline-none',
      className,
    )}
    {...props}
  />
)
