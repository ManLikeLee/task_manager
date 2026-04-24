import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { useToast } from '@/components/ui/toast'
import { TASK_PRIORITIES, TASK_STATUSES, type TaskAssigneeOption, type TaskPriority, type TaskStatus } from '@/types/task'

const statusLabel: Record<TaskStatus, string> = {
  TODO: 'To do',
  IN_PROGRESS: 'In progress',
  IN_REVIEW: 'In review',
  DONE: 'Done',
  BLOCKED: 'Backlog',
}

export const CreateTaskModal = ({
  open,
  onClose,
  onCreate,
  disabled,
  disabledReason,
  initialStatus,
  assignees = [],
  loadingAssignees = false,
}: {
  open: boolean
  onClose: () => void
  onCreate: (payload: {
    title: string
    description: string | null
    status: TaskStatus
    priority: TaskPriority
    dueDate: string | null
    assigneeId: string | null
    assigneeName: string | null
  }) => Promise<void>
  disabled?: boolean
  disabledReason?: string
  initialStatus?: TaskStatus
  assignees?: TaskAssigneeOption[]
  loadingAssignees?: boolean
}) => {
  const normalizeUsername = (value: string) => value.trim().toLowerCase().replace(/^@/, '')
  const [form, setForm] = useState({
    title: '',
    description: '',
    status: 'TODO' as TaskStatus,
    priority: 'MEDIUM' as TaskPriority,
    dueDate: '',
    assigneeName: '',
  })
  const [loading, setLoading] = useState(false)
  const [fieldError, setFieldError] = useState('')
  const { notify } = useToast()

  useEffect(() => {
    if (open && initialStatus) {
      setForm((current) => ({ ...current, status: initialStatus }))
    }
  }, [initialStatus, open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="w-full max-w-[380px] rounded-2xl border p-6" style={{ background: 'var(--tf-bg-3)', borderColor: 'var(--tf-border-2)' }}>
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-[28px]" style={{ fontFamily: 'var(--font-display)' }}>
            New task
          </h2>
          <button type="button" className="tf-ghost-btn" onClick={onClose} aria-label="Close modal">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form
          className="space-y-3"
          onSubmit={async (event) => {
            event.preventDefault()

            if (disabled) {
              notify(disabledReason || 'Create a project first.', 'error')
              return
            }

            if (!form.title.trim()) {
              setFieldError('Task title is required.')
              notify('Task title is required.', 'error')
              return
            }

            setFieldError('')
            setLoading(true)
            try {
              const typedAssignee = form.assigneeName.trim()
              const targetUsername = normalizeUsername(typedAssignee)
              const matchedAssignee =
                targetUsername
                  ? assignees.find((assignee) => assignee.username?.toLowerCase() === targetUsername)
                  : null
              await onCreate({
                title: form.title.trim(),
                description: form.description.trim() || null,
                status: form.status,
                priority: form.priority,
                dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : null,
                assigneeId: matchedAssignee?.id || null,
                assigneeName: matchedAssignee ? null : typedAssignee || null,
              })
              setForm({
                title: '',
                description: '',
                status: initialStatus || 'TODO',
                priority: 'MEDIUM',
                dueDate: '',
                assigneeName: '',
              })
              onClose()
            } finally {
              setLoading(false)
            }
          }}
        >
          {disabled ? (
            <p className="rounded-lg border border-dashed px-3 py-2 text-xs" style={{ borderColor: 'var(--tf-border)', color: 'var(--tf-text-2)' }}>
              {disabledReason || 'Create a project first.'}
            </p>
          ) : null}

          <label className="block space-y-1.5">
            <span className="text-[11px] uppercase tracking-[0.08em]" style={{ color: 'var(--tf-text-3)' }}>
              Title
            </span>
            <input
              value={form.title}
              onChange={(event) => setForm((state) => ({ ...state, title: event.target.value }))}
              className="tf-input"
              placeholder="What needs to be done?"
            />
            {fieldError ? <p className="text-xs" style={{ color: 'var(--tf-rose)' }}>{fieldError}</p> : null}
          </label>

          <label className="block space-y-1.5">
            <span className="text-[11px] uppercase tracking-[0.08em]" style={{ color: 'var(--tf-text-3)' }}>
              Description
            </span>
            <textarea
              rows={3}
              value={form.description}
              onChange={(event) => setForm((state) => ({ ...state, description: event.target.value }))}
              className="tf-input"
            />
          </label>

          <div className="grid grid-cols-2 gap-2.5">
            <label className="block space-y-1.5">
              <span className="text-[11px] uppercase tracking-[0.08em]" style={{ color: 'var(--tf-text-3)' }}>
                Column
              </span>
              <select
                value={form.status}
                onChange={(event) => setForm((state) => ({ ...state, status: event.target.value as TaskStatus }))}
                className="tf-input"
              >
                {TASK_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {statusLabel[status]}
                  </option>
                ))}
              </select>
            </label>

            <label className="block space-y-1.5">
              <span className="text-[11px] uppercase tracking-[0.08em]" style={{ color: 'var(--tf-text-3)' }}>
                Priority
              </span>
              <select
                value={form.priority}
                onChange={(event) => setForm((state) => ({ ...state, priority: event.target.value as TaskPriority }))}
                className="tf-input"
              >
                {TASK_PRIORITIES.map((priority) => (
                  <option key={priority} value={priority}>
                    {priority}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <label className="block space-y-1.5">
              <span className="text-[11px] uppercase tracking-[0.08em]" style={{ color: 'var(--tf-text-3)' }}>
                Due date
              </span>
              <input
                type="date"
                value={form.dueDate}
                onChange={(event) => setForm((state) => ({ ...state, dueDate: event.target.value }))}
                className="tf-input tf-date-input"
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-[11px] uppercase tracking-[0.08em]" style={{ color: 'var(--tf-text-3)' }}>
                Assignee
              </span>
              <input
                value={form.assigneeName}
                onChange={(event) => setForm((state) => ({ ...state, assigneeName: event.target.value }))}
                className="tf-input"
                list="create-task-assignees"
                placeholder={loadingAssignees ? 'Loading…' : '@username or manual name'}
              />
              <datalist id="create-task-assignees">
                {assignees
                  .filter((assignee) => Boolean(assignee.username))
                  .map((assignee) => (
                    <option key={assignee.id} value={`@${assignee.username}`} />
                  ))}
              </datalist>
            </label>
          </div>

          <div className="flex gap-2 pt-2">
            <button type="button" className="tf-secondary-btn flex-1" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="tf-primary-btn flex-[1.4]" disabled={loading || disabled}>
              {loading ? 'Creating...' : 'Create task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
