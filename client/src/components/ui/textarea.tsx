import type { TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export const Textarea = ({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea
    className={cn(
      'w-full rounded-lg border border-[rgb(var(--border-strong))] bg-[rgb(var(--surface))] px-3 py-2 text-[13px] text-[rgb(var(--text-primary))] placeholder:text-[rgb(var(--text-muted))] focus-visible:border-[rgb(var(--accent-gold))] focus-visible:outline-none',
      className,
    )}
    {...props}
  />
)
