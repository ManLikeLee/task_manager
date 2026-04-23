import { cn } from '@/lib/utils'

type Item = {
  value: string
  label: string
}

export const SegmentedTabs = ({
  items,
  value,
  onChange,
}: {
  items: Item[]
  value: string
  onChange: (value: string) => void
}) => (
  <div className="inline-flex rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--background-elevated))] p-1">
    {items.map((item) => (
      <button
        key={item.value}
        type="button"
        onClick={() => onChange(item.value)}
        className={cn(
          'rounded-md px-3 py-1.5 text-[12px] transition',
          value === item.value
            ? 'bg-[rgb(var(--surface-muted))] text-[rgb(var(--text-primary))]'
            : 'text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-secondary))]',
        )}
      >
        {item.label}
      </button>
    ))}
  </div>
)
