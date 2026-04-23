export const Avatar = ({ name }: { name: string }) => {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join('')

  return (
    <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[rgb(var(--border-strong))] bg-[rgb(var(--surface-muted))] text-xs font-semibold text-[rgb(var(--text-muted))] shadow-sm">
      {initials || 'U'}
    </div>
  )
}
