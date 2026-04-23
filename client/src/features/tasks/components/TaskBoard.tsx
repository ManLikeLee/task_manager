import {
  DndContext,
  DragOverlay,
  type DragStartEvent,
  type DragEndEvent,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { useState } from 'react'
import type { Task, TaskStatus } from '@/types/task'
import { BOARD_COLUMNS } from '@/features/tasks/utils/presentation'
import { TaskColumn } from '@/features/tasks/components/TaskColumn'

const findContainerStatus = (id: string, tasks: Task[]): TaskStatus | null => {
  const byTask = tasks.find((task) => task.id === id)
  if (byTask) return byTask.status

  const byColumn = BOARD_COLUMNS.find((column) => column.id === id)
  if (byColumn) return byColumn.status

  return null
}

export const TaskBoard = ({
  tasks,
  selectedTaskId,
  onMove,
  onSelectTask,
  onAddTaskInStatus,
}: {
  tasks: Task[]
  selectedTaskId?: string | null
  onMove: (taskId: string, status: TaskStatus) => void
  onSelectTask: (taskId: string) => void
  onAddTaskInStatus: (status: TaskStatus) => void
}) => {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null)

  const onDragStart = (event: DragStartEvent) => {
    setActiveTaskId(String(event.active.id))
  }

  const onDragEnd = (event: DragEndEvent) => {
    setActiveTaskId(null)
    const { active, over } = event
    if (!over) return

    const from = findContainerStatus(String(active.id), tasks)
    const to = findContainerStatus(String(over.id), tasks)

    if (!from || !to || from === to) return

    onMove(String(active.id), to)
  }

  const onDragCancel = () => {
    setActiveTaskId(null)
  }

  const activeTask = activeTaskId ? tasks.find((task) => task.id === activeTaskId) : null

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={onDragStart} onDragEnd={onDragEnd} onDragCancel={onDragCancel}>
      <div className="board tf-scrollbar flex h-full gap-4 overflow-x-auto overflow-y-hidden pb-2">
        {BOARD_COLUMNS.map((column) => (
          <TaskColumn
            key={column.id}
            column={column}
            tasks={tasks.filter((task) => task.status === column.status)}
            selectedTaskId={selectedTaskId}
            onSelectTask={onSelectTask}
            onAddTask={() => onAddTaskInStatus(column.status)}
          />
        ))}
      </div>
      <DragOverlay>
        {activeTask ? (
          <article className="tf-drag-overlay rounded-xl border px-3.5 py-3">
            <h4 className="text-[12.5px] leading-[1.45]" style={{ color: 'var(--tf-text)' }}>
              {activeTask.title}
            </h4>
          </article>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
