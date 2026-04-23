export type Team = {
  id: string
  workspaceId: string
  name: string
  description: string | null
  createdAt: string
  updatedAt: string
  workspace?: {
    id: string
    name: string
    slug: string
  }
  _count?: {
    members: number
    projects: number
  }
}

export type TeamMember = {
  id: string
  teamId: string
  userId: string
  role: 'LEAD' | 'MEMBER'
  createdAt: string
  updatedAt: string
  user: {
    id: string
    name: string
    email: string
  }
}

