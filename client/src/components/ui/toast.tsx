import { createContext, useContext, useMemo, useState } from 'react'
import { cn } from '@/lib/utils'

type ToastItem = {
  id: string
  message: string
  tone: 'info' | 'success' | 'error'
}

type ToastContextValue = {
  notify: (message: string, tone?: ToastItem['tone']) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const toneMap = {
  info: 'bg-slate-800 text-white',
  success: 'bg-emerald-600 text-white',
  error: 'bg-rose-600 text-white',
}

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [items, setItems] = useState<ToastItem[]>([])

  const value = useMemo(
    () => ({
      notify: (message: string, tone: ToastItem['tone'] = 'info') => {
        const id = crypto.randomUUID()
        setItems((current) => [...current, { id, message, tone }])
        window.setTimeout(() => {
          setItems((current) => current.filter((item) => item.id !== id))
        }, 2800)
      },
    }),
    [],
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-[100] flex w-full max-w-sm flex-col gap-2">
        {items.map((item) => (
          <div key={item.id} className={cn('rounded-lg px-4 py-3 text-sm shadow-lg', toneMap[item.tone])}>
            {item.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used within ToastProvider')
  return context
}
