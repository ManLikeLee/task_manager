import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as api from '@/features/teams/api'

export const teamKeys = {
  all: ['teams'] as const,
  members: (teamId: string) => ['team-members', teamId] as const,
  workspaceMembers: (workspaceId: string) => ['workspace-members', workspaceId] as const,
}

export const useTeams = () =>
  useQuery({
    queryKey: teamKeys.all,
    queryFn: api.listTeams,
    select: (data) => data.teams,
  })

export const useCreateTeam = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ workspaceId, payload }: { workspaceId: string; payload: { name: string; description?: string | null } }) =>
      api.createTeam(workspaceId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teamKeys.all })
    },
  })
}

export const useTeamMembers = (teamId: string) =>
  useQuery({
    queryKey: teamKeys.members(teamId),
    queryFn: () => api.listTeamMembers(teamId),
    enabled: Boolean(teamId),
    select: (data) => data.members,
  })

export const useWorkspaceMembers = (workspaceId: string) =>
  useQuery({
    queryKey: teamKeys.workspaceMembers(workspaceId),
    queryFn: () => api.listWorkspaceMembers(workspaceId),
    enabled: Boolean(workspaceId),
    select: (data) => data.members,
  })

export const useAddTeamMember = (teamId: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: api.addTeamMember.bind(null, teamId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teamKeys.members(teamId) })
      queryClient.invalidateQueries({ queryKey: teamKeys.all })
    },
  })
}

export const useRemoveTeamMember = (teamId: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (memberId: string) => api.removeTeamMember(teamId, memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teamKeys.members(teamId) })
      queryClient.invalidateQueries({ queryKey: teamKeys.all })
    },
  })
}

export const useLinkProjectTeam = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ projectId, teamId }: { projectId: string; teamId: string | null }) => api.linkProjectToTeam(projectId, teamId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      queryClient.invalidateQueries({ queryKey: teamKeys.all })
    },
  })
}
