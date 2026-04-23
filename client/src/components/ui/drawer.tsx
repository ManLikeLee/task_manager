import { useEffect } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export const Drawer = ({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean
  title: string
  onClose: () => void
  children: React.ReactNode
}) => {
  useEffect(() => {
    if (!open) return

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', onEscape)
    return () => window.removeEventListener('keydown', onEscape)
  }, [onClose, open])

  return (
    <div className={cn('fixed inset-0 z-50', !open && 'pointer-events-none')} aria-hidden={!open}>
      <button
        type="button"
        className={cn('absolute inset-0 bg-slate-900/40 transition', open ? 'opacity-100' : 'opacity-0')}
        onClick={onClose}
        aria-label="Close drawer"
      />
      <aside
        className={cn(
          'absolute right-0 top-0 h-full w-full max-w-xl transform border-l bg-[rgb(var(--surface))] p-5 shadow-xl transition',
          open ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{title}</h2>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close drawer">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="h-[calc(100%-2.5rem)] overflow-auto">{children}</div>
      </aside>
    </div>
  )
}
