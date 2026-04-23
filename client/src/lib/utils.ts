import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs))

export const formatDate = (value: string | null | undefined) => {
  if (!value) return 'No due date'
  const date = new Date(value)
  if (Number.isNaN(date.valueOf())) return 'No due date'

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export const toDateInputValue = (value: string | null | undefined) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.valueOf())) return ''
  return date.toISOString().slice(0, 10)
}

export const truncate = (text: string | null | undefined, max = 90) => {
  if (!text) return ''
  return text.length > max ? `${text.slice(0, max)}...` : text
}
