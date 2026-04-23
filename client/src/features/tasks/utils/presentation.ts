import type { TaskPriority, TaskStatus } from '@/types/task'

export type BoardColumn = {
  id: string
  title: string
  status: TaskStatus
  dotColor: string
  accentColor: string
}

export const BOARD_COLUMNS: BoardColumn[] = [
  { id: 'backlog', title: 'Backlog', status: 'BLOCKED', dotColor: '#7d7a75', accentColor: '#7d7a75' },
  { id: 'todo', title: 'To do', status: 'TODO', dotColor: 'var(--tf-lavender)', accentColor: 'var(--tf-lavender)' },
  {
    id: 'inprogress',
    title: 'In progress',
    status: 'IN_PROGRESS',
    dotColor: 'var(--tf-gold)',
    accentColor: 'var(--tf-gold)',
  },
  { id: 'review', title: 'In review', status: 'IN_REVIEW', dotColor: 'var(--tf-teal)', accentColor: 'var(--tf-teal)' },
  { id: 'done', title: 'Done', status: 'DONE', dotColor: 'var(--tf-green)', accentColor: 'var(--tf-green)' },
]

export const statusLabel: Record<TaskStatus, string> = {
  TODO: 'To do',
  IN_PROGRESS: 'In progress',
  IN_REVIEW: 'In review',
  DONE: 'Done',
  BLOCKED: 'Backlog',
}

export const priorityTone: Record<TaskPriority, 'neutral' | 'info' | 'warning' | 'danger' | 'success'> = {
  LOW: 'neutral',
  MEDIUM: 'warning',
  HIGH: 'danger',
  URGENT: 'danger',
}

export const priorityShortLabel: Record<TaskPriority, string> = {
  LOW: 'L',
  MEDIUM: 'M',
  HIGH: 'H',
  URGENT: 'U',
}
