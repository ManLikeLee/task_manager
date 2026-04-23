import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as api from '@/features/projects/api'

export const projectKeys = {
  all: ['projects'] as const,
}

export const useProjects = () =>
  useQuery({
    queryKey: projectKeys.all,
    queryFn: api.listProjects,
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
