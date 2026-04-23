import { CalendarDays, MessageSquare, Paperclip } from 'lucide-react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { truncate } from '@/lib/utils'
import type { Task } from '@/types/task'
import { priorityShortLabel } from '@/features/tasks/utils/presentation'

const priorityStyle: Record<Task['priority'], { bg: string; text: string }> = {
  LOW: { bg: 'rgba(74,155,138,0.15)', text: 'var(--tf-teal)' },
  MEDIUM: { bg: 'rgba(212,168,83,0.2)', text: 'var(--tf-gold-2)' },
  HIGH: { bg: 'rgba(181,97,74,0.2)', text: 'var(--tf-rose)' },
  URGENT: { bg: 'rgba(181,97,74,0.26)', text: '#ff9a81' },
}

export const TaskCard = ({
  task,
  onClick,
  accentColor,
  isSelected = false,
}: {
  task: Task
  onClick: (taskId: string) => void
  accentColor: string
  isSelected?: boolean
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { task },
  })

  const description = truncate(task.description || '', 92)
  const assigneeDisplayName = task.assignee?.name || task.assigneeName || 'Unassigned'
  const assigneeInitials = assigneeDisplayName
    ? assigneeDisplayName
        .split(' ')
        .slice(0, 2)
        .map((part) => part[0])
        .join('')
        .toUpperCase()
    : 'NA'

  const isDueSoon = Boolean(task.dueDate && new Date(task.dueDate).getTime() < Date.now() + 2 * 24 * 60 * 60 * 1000)
  const dueDateLabel = task.dueDate
    ? new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    : null
  const isCompleted = task.status === 'DONE'
  const commentsCount = task.commentsCount ?? task._count?.comments ?? 0
  const attachmentsCount = Math.max((task.description?.length || 0) % 3, 0)
  const isFeatured = task.status === 'IN_PROGRESS'

  return (
    <article
      ref={setNodeRef as never}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`tf-card group relative cursor-grab overflow-hidden rounded-xl border px-3.5 py-3 transition ${
        isFeatured ? 'featured' : ''
      } ${
        isSelected ? 'tf-card-selected' : ''
      } ${
        isDragging ? 'opacity-70' : ''
      }`}
      onClick={() => {
        if (!isDragging) {
          onClick(task.id)
        }
      }}
      {...attributes}
      {...listeners}
    >
      <span className="tf-card-accent absolute inset-y-0 left-0 w-[2px] rounded-l-xl" style={{ background: accentColor }} />
      <div className="absolute inset-0 -z-10 rounded-xl" style={{ background: 'var(--tf-bg-3)' }} />

      <div className="card-top mb-2 flex items-start gap-2">
        <h4
          className={`card-title flex-1 text-[12.5px] font-normal leading-[1.45] ${isCompleted ? 'line-through' : ''}`}
          style={{ color: isCompleted ? 'var(--tf-text-2)' : 'var(--tf-text)' }}
        >
          {task.title}
        </h4>
        <span
          className="priority-badge flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-md text-[9px] font-semibold"
          style={{ background: priorityStyle[task.priority].bg, color: priorityStyle[task.priority].text }}
        >
          {priorityShortLabel[task.priority]}
        </span>
      </div>

      <div className={`card-tags mb-2 flex flex-wrap gap-1.5 ${isCompleted ? 'opacity-75' : ''}`}>
        <span className="tf-tag tf-tag-teal">{task.priority.toLowerCase()}</span>
        <span className="tf-tag tf-tag-lavender">task</span>
      </div>

      {description ? (
        <p className="mb-1.5 text-[10.5px] leading-relaxed" style={{ color: 'var(--tf-text-2)' }}>
          {description}
        </p>
      ) : null}

      <div className={`contextual ${isCompleted ? 'opacity-90' : ''}`}>
        {task.status === 'IN_PROGRESS' ? (
          <div className="progress-bar mb-2.5 h-[3px] w-full overflow-hidden rounded" style={{ background: 'var(--tf-bg-5)' }}>
            <span className="progress-fill block h-full rounded" style={{ width: '55%', background: 'var(--tf-teal)' }} />
          </div>
        ) : null}

        <footer className="card-footer flex items-center gap-1.5">
          <div className="card-assignees flex items-center">
            <span
              className="mini-avatar flex h-[18px] w-[18px] items-center justify-center rounded-md border text-[7px] font-semibold text-white"
              style={{ borderColor: 'var(--tf-bg-3)', background: 'var(--tf-lavender)' }}
            >
              {assigneeInitials}
            </span>
          </div>

          <div className="card-meta ml-auto flex items-center gap-2 text-[9px]" style={{ color: 'var(--tf-text-3)' }}>
            <span className="meta-item inline-flex items-center gap-1">
              <Paperclip className="meta-icon h-3 w-3" />
              {attachmentsCount}
            </span>
            <span className="meta-item inline-flex items-center gap-1">
              <MessageSquare className="meta-icon h-3 w-3" />
              {commentsCount}
            </span>
            {dueDateLabel ? (
              <span
                className={`meta-item inline-flex items-center gap-1 ${isDueSoon ? 'due-soon' : ''}`}
                style={{ color: isDueSoon ? 'var(--tf-rose)' : 'var(--tf-text-3)' }}
              >
                <CalendarDays className="meta-icon h-3 w-3" />
                {dueDateLabel}
              </span>
            ) : null}
          </div>
        </footer>
      </div>
    </article>
  )
}
