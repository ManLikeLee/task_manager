import { apiRequest } from '@/lib/api'
import type { Workspace, WorkspaceInvite } from '@/types/workspace'

export const listWorkspaces = () => apiRequest<{ workspaces: Workspace[] }>('/api/workspaces')

export const createWorkspace = (payload: { name: string; description?: string | null }) =>
  apiRequest<{ workspace: Workspace }>('/api/workspaces', {
    method: 'POST',
    body: payload,
  })

export const joinWorkspace = (code: string) =>
  apiRequest<{ workspace: Pick<Workspace, 'id' | 'name' | 'slug' | 'joinCode'>; alreadyMember: boolean; role: string }>('/api/workspaces/join', {
    method: 'POST',
    body: { code },
  })

export const createWorkspaceInvite = (workspaceId: string, payload?: { roleToAssign?: 'ADMIN' | 'MEMBER'; expiresAt?: string }) =>
  apiRequest<{ invite: WorkspaceInvite }>(`/api/workspaces/${workspaceId}/invites`, {
    method: 'POST',
    body: payload || {},
  })

export const listWorkspaceInvites = (workspaceId: string) =>
  apiRequest<{ invites: WorkspaceInvite[] }>(`/api/workspaces/${workspaceId}/invites`)
