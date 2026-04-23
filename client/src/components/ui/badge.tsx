import { cn } from '@/lib/utils'

type Props = {
  children: React.ReactNode
  tone?: 'neutral' | 'info' | 'warning' | 'danger' | 'success'
}

const toneMap = {
  neutral: 'border border-[rgb(var(--border))] bg-[rgb(var(--surface))] text-[rgb(var(--text-muted))]',
  info: 'border border-[rgb(var(--accent-lavender))]/30 bg-[rgb(var(--accent-lavender))]/18 text-[rgb(var(--accent-lavender))]',
  warning: 'border border-[rgb(var(--accent-gold))]/35 bg-[rgb(var(--accent-gold))]/18 text-[rgb(var(--accent-gold-strong))]',
  danger: 'border border-[rgb(var(--accent-rose))]/30 bg-[rgb(var(--accent-rose))]/18 text-[rgb(var(--accent-rose))]',
  success: 'border border-[rgb(var(--accent-teal))]/30 bg-[rgb(var(--accent-teal))]/18 text-[rgb(var(--accent-teal))]',
}

export const Badge = ({ children, tone = 'neutral' }: Props) => (
  <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium tracking-[0.02em]', toneMap[tone])}>
    {children}
  </span>
)
