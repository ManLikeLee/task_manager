import { Card } from '@/components/ui/card'

export const EmptyState = ({ title, description, action }: { title: string; description: string; action?: React.ReactNode }) => (
  <Card className="flex min-h-52 flex-col items-center justify-center gap-3 border-dashed text-center">
    <h3 className="font-display text-lg font-semibold">{title}</h3>
    <p className="max-w-md text-sm text-[rgb(var(--text-muted))]">{description}</p>
    {action}
  </Card>
)
