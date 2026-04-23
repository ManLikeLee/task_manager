export type ProjectStatus = 'PLANNING' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED'

export type Project = {
  id: string
  name: string
  description: string | null
  status: ProjectStatus
  createdAt: string
  updatedAt: string
  taskCount: number
  workspace: {
    id: string
    name: string
    slug: string
  }
  team?: {
    id: string
    name: string
  } | null
}
