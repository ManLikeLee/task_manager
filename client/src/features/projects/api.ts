import { apiRequest } from '@/lib/api'
import type { Project } from '@/types/project'

export const listProjects = () => apiRequest<{ projects: Project[] }>('/api/projects')

export const createProject = (payload: { name: string; description?: string | null }) =>
  apiRequest<{ project: Project }>('/api/projects', {
    method: 'POST',
    body: payload,
  })
