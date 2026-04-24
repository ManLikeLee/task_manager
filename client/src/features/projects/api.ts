import { apiRequest } from '@/lib/api'
import type { Project } from '@/types/project'

export const listProjects = (workspaceId?: string) => {
  const query = workspaceId ? `?workspaceId=${encodeURIComponent(workspaceId)}` : ''
  return apiRequest<{ projects: Project[] }>(`/api/projects${query}`)
}

export const createProject = (payload: { name: string; description?: string | null; workspaceId?: string; teamId?: string | null }) =>
  apiRequest<{ project: Project }>('/api/projects', {
    method: 'POST',
    body: payload,
  })
