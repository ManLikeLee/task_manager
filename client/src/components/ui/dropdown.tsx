import { useEffect, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

type Item = {
  label: string
  onClick: () => void
}

export const DropdownMenu = ({ label, items }: { label: string; items: Item[] }) => {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open) return

    const onClickOutside = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    window.addEventListener('mousedown', onClickOutside)
    return () => window.removeEventListener('mousedown', onClickOutside)
  }, [open])

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((state) => !state)}
        className="inline-flex h-8 items-center gap-1 rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-2.5 text-[11px] text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))]"
      >
        {label}
        <ChevronDown className="h-3.5 w-3.5" />
      </button>
      <div
        className={cn(
          'absolute right-0 z-20 mt-2 min-w-40 rounded-lg border border-[rgb(var(--border-strong))] bg-[rgb(var(--background-panel))] p-1 shadow-[var(--card-shadow)]',
          open ? 'block' : 'hidden',
        )}
      >
        {items.map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={() => {
              item.onClick()
              setOpen(false)
            }}
            className="flex w-full rounded-md px-3 py-2 text-left text-[12px] text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--hover))]"
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  )
}
