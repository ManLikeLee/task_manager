import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as api from '@/features/tasks/api'
import type { TaskFilters, TaskStatus, UpdateTaskPayload } from '@/types/task'

export const taskKeys = {
  overview: ['overview'] as const,
  projectTasks: (projectId: string, filters: TaskFilters) => ['tasks', projectId, filters] as const,
  projectAssignees: (projectId: string) => ['project-assignees', projectId] as const,
  taskComments: (taskId: string) => ['task-comments', taskId] as const,
}

export const useTaskOverview = () =>
  useQuery({
    queryKey: taskKeys.overview,
    queryFn: api.getOverview,
  })

export const useTasks = (projectId: string, filters: TaskFilters) =>
  useQuery({
    queryKey: taskKeys.projectTasks(projectId, filters),
    queryFn: () => api.listTasks(projectId, filters),
    enabled: Boolean(projectId),
  })

export const useProjectAssignees = (projectId: string) =>
  useQuery({
    queryKey: taskKeys.projectAssignees(projectId),
    queryFn: () => api.listProjectAssignees(projectId),
    enabled: Boolean(projectId),
    select: (data) => data.assignees,
  })

export const useTaskComments = (taskId: string) =>
  useQuery({
    queryKey: taskKeys.taskComments(taskId),
    queryFn: () => api.listTaskComments(taskId),
    enabled: Boolean(taskId),
    select: (data) => data.comments,
  })

export const useCreateTaskComment = (taskId: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ body }: { body: string }) => api.createTaskComment(taskId, body),
    onSuccess: (response) => {
      queryClient.setQueryData(taskKeys.taskComments(taskId), (existing: Awaited<ReturnType<typeof api.listTaskComments>> | undefined) => {
        if (!existing) {
          return { comments: [response.comment] }
        }
        return {
          ...existing,
          comments: [...existing.comments, response.comment],
        }
      })
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}

export const useCreateTask = (projectId: string, _filters: TaskFilters) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: api.createTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] })
      queryClient.invalidateQueries({ queryKey: taskKeys.overview })
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
  })
}

export const useUpdateTask = (projectId: string, filters: TaskFilters) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateTaskPayload }) => api.updateTask(id, payload),
    onMutate: async ({ id, payload }) => {
      const key = taskKeys.projectTasks(projectId, filters)
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<Awaited<ReturnType<typeof api.listTasks>>>(key)

      if (previous) {
        queryClient.setQueryData(key, {
          ...previous,
          tasks: previous.tasks.map((task) => {
            if (task.id !== id) return task

            const nextTask = { ...task, ...payload }

            if (Object.prototype.hasOwnProperty.call(payload, 'assigneeId')) {
              if (!payload.assigneeId) {
                nextTask.assignee = null
              }
            }

            if (Object.prototype.hasOwnProperty.call(payload, 'assigneeName')) {
              nextTask.assigneeName = payload.assigneeName ?? null
            }

            return nextTask
          }),
        })
      }

      return { previous }
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(taskKeys.projectTasks(projectId, filters), context.previous)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] })
      queryClient.invalidateQueries({ queryKey: taskKeys.overview })
    },
  })
}

export const useDeleteTask = (projectId: string, _filters: TaskFilters) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: api.deleteTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] })
      queryClient.invalidateQueries({ queryKey: taskKeys.overview })
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
  })
}

export const statusUpdatePayload = (status: TaskStatus) => ({ status })
