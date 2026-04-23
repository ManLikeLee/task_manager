import { useEffect } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const Modal = ({
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

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="surface-elevated max-h-[90vh] w-full max-w-md overflow-auto rounded-2xl p-6">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="display-text text-2xl font-normal">{title}</h2>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close modal">
            <X className="h-4 w-4" />
          </Button>
        </div>
        {children}
      </div>
    </div>
  )
}
