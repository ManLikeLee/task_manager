import { Plus } from 'lucide-react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import type { Task } from '@/types/task'
import type { BoardColumn } from '@/features/tasks/utils/presentation'
import { TaskCard } from '@/features/tasks/components/TaskCard'

export const TaskColumn = ({
  column,
  tasks,
  selectedTaskId,
  onSelectTask,
  onAddTask,
}: {
  column: BoardColumn
  tasks: Task[]
  selectedTaskId?: string | null
  onSelectTask: (taskId: string) => void
  onAddTask: () => void
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: { status: column.status, type: 'column' },
  })

  return (
    <section className="column flex w-[280px] min-w-[280px] flex-col">
      <header className="col-header mb-2.5 flex items-center gap-2.5 px-1">
        <span className="col-dot h-2 w-2 rounded-full" style={{ background: column.dotColor }} />
        <span className="col-title flex-1" style={{ color: 'var(--tf-text-2)' }}>
          {column.title}
        </span>
        <span
          className="col-count flex h-[22px] w-[22px] items-center justify-center rounded-md text-[10px]"
          style={{ background: 'var(--tf-bg-3)', color: 'var(--tf-text-3)', borderColor: 'var(--tf-border)' }}
        >
          {tasks.length}
        </span>
      </header>

      <SortableContext items={tasks.map((task) => task.id)} strategy={verticalListSortingStrategy}>
        <div
          ref={setNodeRef}
          id={column.id}
          className={`col-body tf-scrollbar flex min-h-[7rem] flex-1 flex-col gap-2.5 overflow-y-auto rounded-xl pr-0.5 transition ${isOver ? 'col-drop-active' : ''}`}
        >
          {tasks.length ? (
            tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onClick={onSelectTask}
                accentColor={column.accentColor}
                isSelected={selectedTaskId === task.id}
              />
            ))
          ) : (
            <div
              className="rounded-xl border border-dashed px-3 py-3.5 text-center text-[11px]"
              style={{ borderColor: 'var(--tf-border)', color: 'var(--tf-text-3)', background: 'var(--tf-bg-3)' }}
            >
              No tasks in this stage
            </div>
          )}
        </div>
      </SortableContext>

      <button
        type="button"
        onClick={onAddTask}
        className="add-card-btn mt-2 inline-flex w-full items-center justify-center gap-1 rounded-[10px] border border-dashed px-3 py-2 text-[11px] transition"
        style={{ borderColor: 'var(--tf-border)', color: 'var(--tf-text-3)', background: 'transparent' }}
      >
        <Plus className="h-3.5 w-3.5" />
        Add task
      </button>
    </section>
  )
}
