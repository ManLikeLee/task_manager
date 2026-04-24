import { useEffect, useMemo, useState } from 'react'
import { CalendarDays, Link2, Loader2, MoreHorizontal, Paperclip, SendHorizontal, Trash2, X } from 'lucide-react'
import { useToast } from '@/components/ui/toast'
import { useAuthStore } from '@/features/auth/store'
import { useCreateTaskComment, useTaskComments } from '@/features/tasks/hooks/useTasks'
import { statusLabel } from '@/features/tasks/utils/presentation'
import type { Task, TaskAssigneeOption, TaskPriority, TaskStatus, UpdateTaskPayload } from '@/types/task'

const PRIORITY_OPTIONS: TaskPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT']
const STATUS_OPTIONS: TaskStatus[] = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'BLOCKED']

const statusClassByValue: Record<TaskStatus, string> = {
  TODO: 's-todo',
  IN_PROGRESS: 's-progress',
  IN_REVIEW: 's-review',
  DONE: 's-done',
  BLOCKED: 's-blocked',
}

const priorityLabel: Record<TaskPriority, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  URGENT: 'Urgent',
}

const toDateInputValue = (value: string | null) => (value ? value.slice(0, 10) : '')

const formatDueDate = (value: string | null) => {
  if (!value) return 'No due date'
  return new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

const formatDateTime = (value?: string) => {
  if (!value) return '—'
  return new Date(value).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

const initials = (name: string) =>
  name
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0] || '')
    .join('')
    .toUpperCase()

export const TaskDetailDrawer = ({
  task,
  open,
  onClose,
  onSave,
  onDelete,
  saving,
  deleting,
  assignees = [],
}: {
  task: Task | null
  open: boolean
  onClose: () => void
  onSave: (payload: UpdateTaskPayload) => Promise<void>
  onDelete: () => Promise<void>
  saving?: boolean
  deleting?: boolean
  assignees?: TaskAssigneeOption[]
}) => {
  const [titleDraft, setTitleDraft] = useState('')
  const [descriptionDraft, setDescriptionDraft] = useState('')
  const [assigneeDraft, setAssigneeDraft] = useState('')
  const [commentDraft, setCommentDraft] = useState('')
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [isEditingDescription, setIsEditingDescription] = useState(false)
  const [savingField, setSavingField] = useState<string | null>(null)
  const { notify } = useToast()
  const currentUser = useAuthStore((state) => state.user)

  const comments = useTaskComments(task?.id || '')
  const createComment = useCreateTaskComment(task?.id || '')

  const assignableUsers = useMemo(() => {
    const map = new Map<string, TaskAssigneeOption>()
    assignees.forEach((assignee) => map.set(assignee.id, assignee))
    if (task?.assignee && !map.has(task.assignee.id)) {
      map.set(task.assignee.id, task.assignee)
    }
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name))
  }, [assignees, task?.assignee])

  useEffect(() => {
    setTitleDraft(task?.title || '')
    setDescriptionDraft(task?.description || '')
    setAssigneeDraft(task?.assignee?.username ? `@${task.assignee.username}` : task?.assigneeName || '')
    setCommentDraft('')
    setIsEditingTitle(false)
    setIsEditingDescription(false)
  }, [task?.id, task?.title, task?.description, task?.assignee?.username, task?.assigneeName])

  useEffect(() => {
    if (!open) return
    const onEsc = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      if (isEditingTitle) {
        setIsEditingTitle(false)
        setTitleDraft(task?.title || '')
        return
      }
      if (isEditingDescription) {
        setIsEditingDescription(false)
        setDescriptionDraft(task?.description || '')
        return
      }
      onClose()
    }
    window.addEventListener('keydown', onEsc)
    return () => window.removeEventListener('keydown', onEsc)
  }, [isEditingDescription, isEditingTitle, onClose, open, task?.description, task?.title])

  if (!open || !task) return null

  const saveField = async (field: keyof UpdateTaskPayload, value: UpdateTaskPayload[keyof UpdateTaskPayload]) => {
    setSavingField(String(field))
    try {
      await onSave({ [field]: value } as UpdateTaskPayload)
    } finally {
      setSavingField(null)
    }
  }

  const saveTitle = async () => {
    const trimmed = titleDraft.trim()
    if (!trimmed || trimmed === task.title) {
      setTitleDraft(task.title)
      setIsEditingTitle(false)
      return
    }
    await saveField('title', trimmed)
    setIsEditingTitle(false)
  }

  const saveDescription = async () => {
    const trimmed = descriptionDraft.trim()
    const normalized = trimmed || null
    if ((task.description || null) === normalized) {
      setDescriptionDraft(task.description || '')
      setIsEditingDescription(false)
      return
    }
    await saveField('description', normalized)
    setIsEditingDescription(false)
  }

  const saveAssignee = async () => {
    const trimmed = assigneeDraft.trim()

    if (!trimmed) {
      if (task.assigneeId) {
        await onSave({ assigneeId: null, assigneeName: null })
      }
      return
    }

    const normalizedUsername = trimmed.replace(/^@/, '').trim().toLowerCase()
    const usernameMatch = assignableUsers.find((option) => option.username?.toLowerCase() === normalizedUsername)

    if (!usernameMatch) {
      await onSave({ assigneeId: null, assigneeName: trimmed })
      setAssigneeDraft(trimmed)
      return
    }

    if (usernameMatch.id !== task.assigneeId || task.assigneeName !== null) {
      await onSave({ assigneeId: usernameMatch.id, assigneeName: null })
    }
    setAssigneeDraft(`@${usernameMatch.username || normalizedUsername}`)
  }

  const submitComment = async () => {
    const body = commentDraft.trim()
    if (!body) return

    try {
      await createComment.mutateAsync({ body })
      setCommentDraft('')
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Failed to post comment.', 'error')
    }
  }

  const isDueOverdue = Boolean(
    task.dueDate && task.status !== 'DONE' && new Date(task.dueDate).getTime() < Date.now() - 24 * 60 * 60 * 1000,
  )

  return (
    <div className="fixed inset-0 z-40 flex justify-end pointer-events-none">
      <button
        type="button"
        className="absolute inset-0 bg-black/35 backdrop-blur-[1px] pointer-events-auto"
        aria-label="Close task detail"
        onClick={onClose}
      />

      <aside className="tfd-panel open pointer-events-auto relative" role="dialog" aria-modal="true" aria-label="Task detail panel">
        <div className="tfd-topbar">
          <button type="button" className="tfd-close-btn" onClick={onClose} aria-label="Close panel">
            <X size={12} />
          </button>

          <div className="tfd-breadcrumb">
            {task.project?.name || 'Project'} <span className="sep">›</span> <span>TaskForce</span>
          </div>

          <div className="tfd-topbar-actions">
            <button type="button" className="tfd-icon-btn" title="Copy link">
              <Link2 size={12} />
            </button>
            <button type="button" className="tfd-icon-btn" title="Attachment">
              <Paperclip size={12} />
            </button>
            <button type="button" className="tfd-icon-btn" title="More options">
              <MoreHorizontal size={12} />
            </button>
          </div>
        </div>

        <div className="tfd-body tf-scrollbar">
          <div className="tfd-status-row">
            <div className={`tfd-status-pill ${statusClassByValue[task.status]}`}>
              <span className="dot" />
              <select
                className="tfd-select"
                value={task.status}
                disabled={Boolean(saving || savingField)}
                onChange={(event) => void saveField('status', event.target.value as TaskStatus)}
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {statusLabel[option]}
                  </option>
                ))}
              </select>
            </div>

            <div className="tfd-priority-chip">
              <select
                className="tfd-select"
                value={task.priority}
                disabled={Boolean(saving || savingField)}
                onChange={(event) => void saveField('priority', event.target.value as TaskPriority)}
              >
                {PRIORITY_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {priorityLabel[option]}
                  </option>
                ))}
              </select>
            </div>

            <span className="tfd-task-id">{task.id.slice(0, 8).toUpperCase()}</span>
          </div>

          {isEditingTitle ? (
            <input
              autoFocus
              value={titleDraft}
              className="tfd-title"
              onChange={(event) => setTitleDraft(event.target.value)}
              onBlur={() => void saveTitle()}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  void saveTitle()
                }
                if (event.key === 'Escape') {
                  setIsEditingTitle(false)
                  setTitleDraft(task.title)
                }
              }}
            />
          ) : (
            <h1 className="tfd-title cursor-text" onClick={() => setIsEditingTitle(true)}>
              {task.title}
            </h1>
          )}

          <div className="tfd-meta-grid">
            <div className="tfd-meta-cell">
              <div className="label">Assignee</div>
              <div className="value">
                <input
                  className="tfd-inline-input"
                  list={`assignee-options-${task.id}`}
                  placeholder="Unassigned"
                  value={assigneeDraft}
                  onChange={(event) => setAssigneeDraft(event.target.value)}
                  disabled={Boolean(saving || savingField)}
                  onBlur={() => void saveAssignee()}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault()
                      void saveAssignee()
                    }
                    if (event.key === 'Escape') {
                      setAssigneeDraft(task.assignee?.username ? `@${task.assignee.username}` : task.assigneeName || '')
                    }
                  }}
                />
                <datalist id={`assignee-options-${task.id}`}>
                  {assignableUsers
                    .filter((user) => Boolean(user.username))
                    .map((user) => (
                      <option key={user.id} value={`@${user.username}`} />
                    ))}
                </datalist>
              </div>
            </div>

            <div className="tfd-meta-cell">
              <div className="label">Due date</div>
              <div className={`value ${isDueOverdue ? 'warn' : ''}`}>
                <input
                  type="date"
                  className="tfd-select"
                  value={toDateInputValue(task.dueDate)}
                  disabled={Boolean(saving || savingField)}
                  onChange={(event) =>
                    void saveField('dueDate', event.target.value ? new Date(event.target.value).toISOString() : null)
                  }
                />
              </div>
            </div>

            <div className="tfd-meta-cell">
              <div className="label">Project</div>
              <div className="value">
                <span className="tfd-project-dot" />
                {task.project?.name || 'TaskForce project'}
              </div>
            </div>

            <div className="tfd-meta-cell">
              <div className="label">Status</div>
              <div className="value">{statusLabel[task.status]}</div>
            </div>

            <div className="tfd-meta-cell">
              <div className="label">Created</div>
              <div className="value">{formatDateTime(task.createdAt)}</div>
            </div>

            <div className="tfd-meta-cell">
              <div className="label">Updated</div>
              <div className="value">{formatDateTime(task.updatedAt)}</div>
            </div>
          </div>

          <section className="tfd-section">
            <div className="tfd-section-label">
              Description
              <button type="button" className="action" onClick={() => setIsEditingDescription((state) => !state)}>
                {isEditingDescription ? 'Cancel' : 'Edit'}
              </button>
            </div>
            {isEditingDescription ? (
              <textarea
                autoFocus
                className="tfd-desc"
                value={descriptionDraft}
                placeholder="Add a detailed task description..."
                onChange={(event) => setDescriptionDraft(event.target.value)}
                onBlur={() => void saveDescription()}
                onKeyDown={(event) => {
                  if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
                    void saveDescription()
                  }
                  if (event.key === 'Escape') {
                    setIsEditingDescription(false)
                    setDescriptionDraft(task.description || '')
                  }
                }}
              />
            ) : (
              <div className="tfd-desc cursor-text" onClick={() => setIsEditingDescription(true)}>
                {task.description || 'No description yet. Click to add context for this task.'}
              </div>
            )}
          </section>

          <section className="tfd-section">
            <div className="tfd-section-label">Comments</div>
            <div className="tfd-activity-feed">
              {comments.isLoading ? (
                <div className="tfd-empty">Loading comments…</div>
              ) : comments.data && comments.data.length > 0 ? (
                comments.data.map((comment) => (
                  <div key={comment.id} className="tfd-activity-item">
                    <div className="av">{initials(comment.author?.name || 'TF')}</div>
                    <div className="body">
                      <div className="line">
                        <strong>{comment.author?.name || 'Unknown user'}</strong>
                      </div>
                      <div className="tfd-comment-bubble">{comment.body}</div>
                      <div className="time">{formatDateTime(comment.createdAt)}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="tfd-empty">No comments yet.</div>
              )}
            </div>
          </section>

          <section className="tfd-section">
            <div className="tfd-section-label">Activity</div>
            <div className="tfd-activity-feed">
              <div className="tfd-activity-item">
                <div className="av">{initials(task.creator?.name || 'TF')}</div>
                <div className="body">
                  <div className="line">
                    <strong>{task.creator?.name || 'TaskForce'}</strong> last updated this task
                  </div>
                  <div className="time">{formatDateTime(task.updatedAt)}</div>
                </div>
              </div>
              <div className="tfd-activity-item">
                <div className="av">{initials(task.assignee?.name || task.assigneeName || 'NA')}</div>
                <div className="body">
                  <div className="line">
                    Due date: <strong>{formatDueDate(task.dueDate)}</strong>
                  </div>
                  <div className="time">Live task metadata</div>
                </div>
              </div>
            </div>
          </section>

          <div style={{ height: 20 }} />
        </div>

        <div className="tfd-comment-box">
          <div className="comment-av">{initials(currentUser?.name || 'TF')}</div>
          <div className="comment-wrap">
            <textarea
              className="tfd-comment-input"
              placeholder="Leave a comment or @mention someone…"
              rows={2}
              value={commentDraft}
              onChange={(event) => setCommentDraft(event.target.value)}
              onKeyDown={(event) => {
                if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
                  event.preventDefault()
                  void submitComment()
                }
              }}
            />
            <div className="footer">
              <div className="hints">
                <button type="button" className="hint-btn" disabled title="Attach">
                  <Paperclip size={12} />
                </button>
                <button type="button" className="hint-btn" disabled title="Reminder">
                  <CalendarDays size={12} />
                </button>
              </div>
              <div className="actions">
                <button type="button" className="tfd-delete-btn" onClick={() => void onDelete()} disabled={Boolean(deleting)}>
                  <Trash2 size={12} />
                  {deleting ? 'Deleting…' : 'Delete'}
                </button>
                <button
                  type="button"
                  className="tfd-send-btn"
                  disabled={createComment.isPending || !commentDraft.trim()}
                  onClick={() => void submitComment()}
                >
                  {createComment.isPending ? <Loader2 size={12} className="animate-spin" /> : <SendHorizontal size={12} />}
                  {createComment.isPending ? 'Posting…' : 'Post'}
                </button>
              </div>
            </div>
            {savingField || saving ? <div className="tfd-comment-note">Saving task changes…</div> : null}
          </div>
        </div>
      </aside>
    </div>
  )
}
