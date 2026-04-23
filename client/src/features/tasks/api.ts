import { apiRequest } from '@/lib/api'
import type { CreateTaskPayload, Task, TaskAssigneeOption, TaskComment, TaskFilters, UpdateTaskPayload } from '@/types/task'

const toQueryString = (filters: TaskFilters) => {
  const params = new URLSearchParams()

  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return
    params.set(key, String(value))
  })

  const query = params.toString()
  return query ? `?${query}` : ''
}

export const listTasks = (projectId: string, filters: TaskFilters) =>
  apiRequest<{ tasks: Task[]; nextCursor: string | null; hasMore: boolean }>(
    `/api/projects/${projectId}/tasks${toQueryString(filters)}`,
  )

export const listProjectAssignees = (projectId: string) =>
  apiRequest<{ assignees: TaskAssigneeOption[] }>(`/api/projects/${projectId}/assignees`)

export const createTask = (payload: CreateTaskPayload) =>
  apiRequest<{ task: Task }>('/api/tasks', {
    method: 'POST',
    body: payload,
  })

export const updateTask = (taskId: string, payload: UpdateTaskPayload) =>
  apiRequest<{ task: Task }>(`/api/tasks/${taskId}`, {
    method: 'PATCH',
    body: payload,
  })

export const deleteTask = (taskId: string) =>
  apiRequest<void>(`/api/tasks/${taskId}`, {
    method: 'DELETE',
  })

export const listTaskComments = (taskId: string) =>
  apiRequest<{ comments: TaskComment[] }>(`/api/tasks/${taskId}/comments`)

export const createTaskComment = (taskId: string, body: string) =>
  apiRequest<{ comment: TaskComment }>(`/api/tasks/${taskId}/comments`, {
    method: 'POST',
    body: { body },
  })

export const getOverview = () =>
  apiRequest<{
    stats: {
      totalProjects: number
      totalTasks: number
      inProgress: number
      dueToday: number
    }
    recentActivity: Array<{
      id: string
      taskTitle: string
      projectName: string
      action: string
      timestamp: string
    }>
  }>('/api/dashboard/overview')
