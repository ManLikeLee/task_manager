import { Skeleton } from '@/components/ui/skeleton'

export const LoadingBoardSkeleton = () => (
  <div className="flex gap-4 overflow-hidden">
    {Array.from({ length: 4 }).map((_, columnIndex) => (
      <div key={columnIndex} className="w-80 shrink-0 space-y-3 rounded-xl border bg-[rgb(var(--surface))] p-3">
        <Skeleton className="h-6 w-24" />
        {Array.from({ length: 3 }).map((__, cardIndex) => (
          <Skeleton key={cardIndex} className="h-28 w-full" />
        ))}
      </div>
    ))}
  </div>
)
