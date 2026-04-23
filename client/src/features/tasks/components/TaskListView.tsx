import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { formatDate, truncate } from '@/lib/utils'
import type { Task } from '@/types/task'
import { priorityTone, statusLabel } from '@/features/tasks/utils/presentation'

export const TaskListView = ({ tasks, onSelectTask }: { tasks: Task[]; onSelectTask: (taskId: string) => void }) => {
  if (!tasks.length) {
    return <EmptyState title="No matching tasks" description="Adjust filters or create a new task." />
  }

  return (
    <Card className="overflow-auto p-0">
      <table className="w-full min-w-[760px] border-collapse text-sm">
        <thead>
          <tr className="border-b bg-[rgb(var(--surface-muted))] text-left text-xs uppercase tracking-wide text-[rgb(var(--text-muted))]">
            <th className="px-4 py-3">Title</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Priority</th>
            <th className="px-4 py-3">Due</th>
            <th className="px-4 py-3">Assignee</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => (
            <tr key={task.id} className="cursor-pointer border-b hover:bg-[rgb(var(--surface-muted))]" onClick={() => onSelectTask(task.id)}>
              <td className="px-4 py-3">
                <div className="font-medium">{task.title}</div>
                <div className="text-xs text-[rgb(var(--text-muted))]">{truncate(task.description, 110) || 'No description'}</div>
              </td>
              <td className="px-4 py-3">{statusLabel[task.status]}</td>
              <td className="px-4 py-3">
                <Badge tone={priorityTone[task.priority]}>{task.priority}</Badge>
              </td>
              <td className="px-4 py-3 text-[rgb(var(--text-muted))]">{formatDate(task.dueDate)}</td>
              <td className="px-4 py-3 text-[rgb(var(--text-muted))]">{task.assignee?.name || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  )
}
