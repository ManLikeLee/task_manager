import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as api from '@/features/workspaces/api'

export const workspaceKeys = {
  all: ['workspaces'] as const,
  invites: (workspaceId: string) => ['workspace-invites', workspaceId] as const,
}

export const useWorkspaces = (enabled = true) =>
  useQuery({
    queryKey: workspaceKeys.all,
    queryFn: api.listWorkspaces,
    enabled,
    select: (data) => data.workspaces,
  })

export const useCreateWorkspace = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: api.createWorkspace,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workspaceKeys.all })
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
  })
}

export const useJoinWorkspace = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (code: string) => api.joinWorkspace(code),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workspaceKeys.all })
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
  })
}

export const useWorkspaceInvites = (workspaceId: string) =>
  useQuery({
    queryKey: workspaceKeys.invites(workspaceId),
    queryFn: () => api.listWorkspaceInvites(workspaceId),
    enabled: Boolean(workspaceId),
    select: (data) => data.invites,
  })

export const useCreateWorkspaceInvite = (workspaceId: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload?: { roleToAssign?: 'ADMIN' | 'MEMBER'; expiresAt?: string }) =>
      api.createWorkspaceInvite(workspaceId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workspaceKeys.invites(workspaceId) })
    },
  })
}
