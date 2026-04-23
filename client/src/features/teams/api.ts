import { apiRequest } from '@/lib/api'
import type { Team, TeamMember } from '@/types/team'

export const listTeams = () => apiRequest<{ teams: Team[] }>('/api/teams')

export const createTeam = (workspaceId: string, payload: { name: string; description?: string | null }) =>
  apiRequest<{ team: Team }>(`/api/workspaces/${workspaceId}/teams`, {
    method: 'POST',
    body: payload,
  })

export const listWorkspaceMembers = (workspaceId: string) =>
  apiRequest<{ members: Array<{ id: string; name: string; email: string }> }>(`/api/workspaces/${workspaceId}/members`)

export const updateTeam = (teamId: string, payload: { name?: string; description?: string | null }) =>
  apiRequest<{ team: Team }>(`/api/teams/${teamId}`, {
    method: 'PATCH',
    body: payload,
  })

export const listTeamMembers = (teamId: string) =>
  apiRequest<{ members: TeamMember[] }>(`/api/teams/${teamId}/members`)

export const addTeamMember = (teamId: string, payload: { userId: string; role?: 'LEAD' | 'MEMBER' }) =>
  apiRequest<{ member: TeamMember }>(`/api/teams/${teamId}/members`, {
    method: 'POST',
    body: payload,
  })

export const removeTeamMember = (teamId: string, memberId: string) =>
  apiRequest<void>(`/api/teams/${teamId}/members/${memberId}`, {
    method: 'DELETE',
  })

export const linkProjectToTeam = (projectId: string, teamId: string | null) =>
  apiRequest<{ project: { id: string; teamId: string | null } }>(`/api/projects/${projectId}/team`, {
    method: 'PATCH',
    body: { teamId },
  })
