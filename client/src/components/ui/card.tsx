import { forwardRef, type HTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

export const Card = forwardRef<
  HTMLDivElement,
  { className?: string; children: ReactNode } & HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-4 shadow-[var(--card-shadow)]', className)}
    {...props}
  >
    {children}
  </div>
))

Card.displayName = 'Card'
