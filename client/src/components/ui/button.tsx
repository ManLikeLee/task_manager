import type { ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
}

const variantMap: Record<ButtonVariant, string> = {
  primary:
    'border-transparent bg-[rgb(var(--accent-gold))] text-[#1a1200] hover:bg-[rgb(var(--accent-gold-strong))] shadow-sm',
  secondary:
    'border-[rgb(var(--border-strong))] bg-transparent text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--hover))] hover:text-[rgb(var(--text-primary))]',
  ghost:
    'border-transparent bg-transparent text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--hover))] hover:text-[rgb(var(--text-primary))]',
  danger: 'border-transparent bg-[rgb(var(--accent-rose))] text-white hover:brightness-105',
}

const sizeMap: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-[12px]',
  md: 'h-9 px-3.5 text-[12px]',
  lg: 'h-10 px-4 text-sm',
}

export const Button = ({
  className,
  variant = 'primary',
  size = 'md',
  loading,
  children,
  disabled,
  ...props
}: Props) => (
  <button
    className={cn(
      'inline-flex items-center justify-center rounded-lg border font-ui font-semibold tracking-[0.01em] transition duration-150 disabled:cursor-not-allowed disabled:opacity-60',
      variantMap[variant],
      sizeMap[size],
      className,
    )}
    disabled={disabled || loading}
    {...props}
  >
    {loading ? 'Please wait...' : children}
  </button>
)
