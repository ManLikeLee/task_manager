export const TASK_STATUSES = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'BLOCKED'] as const
export type TaskStatus = (typeof TASK_STATUSES)[number]

export const TASK_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const
export type TaskPriority = (typeof TASK_PRIORITIES)[number]

export const SORT_FIELDS = ['createdAt', 'updatedAt', 'dueDate', 'priority', 'status', 'title'] as const
export type SortField = (typeof SORT_FIELDS)[number]

export type SortOrder = 'asc' | 'desc'

export type Task = {
  id: string
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  dueDate: string | null
  assigneeId: string | null
  assigneeName: string | null
  creatorId: string
  projectId: string
  createdAt: string
  updatedAt: string
  commentsCount?: number
  _count?: {
    comments?: number
  }
  assignee: {
    id: string
    name: string
    email: string
  } | null
  creator?: {
    id: string
    name: string
    email: string
  } | null
  project?: {
    id: string
    name: string
    workspaceId: string
    workspace?: {
      id: string
      name: string
      slug: string
      ownerId: string
    }
  } | null
}

export type TaskComment = {
  id: string
  taskId: string
  authorId: string
  body: string
  createdAt: string
  updatedAt: string
  author: {
    id: string
    name: string
    email: string
  }
}

export type TaskFilters = {
  q?: string
  status?: TaskStatus | ''
  priority?: TaskPriority | ''
  dueAfter?: string
  dueBefore?: string
  sortBy?: SortField
  sortOrder?: SortOrder
  limit?: number
  cursor?: string
}

export type CreateTaskPayload = {
  projectId: string
  title: string
  description?: string | null
  status?: TaskStatus
  priority?: TaskPriority
  dueDate?: string | null
  assigneeId?: string | null
  assigneeName?: string | null
}

export type UpdateTaskPayload = Partial<Omit<CreateTaskPayload, 'projectId'>>

export type TaskAssigneeOption = {
  id: string
  name: string
  email: string
}
