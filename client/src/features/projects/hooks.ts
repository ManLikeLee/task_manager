import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as api from '@/features/projects/api'

export const projectKeys = {
  all: ['projects'] as const,
  byWorkspace: (workspaceId: string) => ['projects', workspaceId] as const,
}

export const useProjects = (workspaceId?: string) =>
  useQuery({
    queryKey: workspaceId ? projectKeys.byWorkspace(workspaceId) : projectKeys.all,
    queryFn: () => api.listProjects(workspaceId),
    select: (data) => data.projects,
  })

export const useCreateProject = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: api.createProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.all })
    },
  })
}
