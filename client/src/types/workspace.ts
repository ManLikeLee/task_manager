export type WorkspaceRole = 'OWNER' | 'ADMIN' | 'MEMBER'

export type Workspace = {
  id: string
  name: string
  slug: string
  joinCode: string | null
  description: string | null
  ownerId: string
  createdAt: string
  updatedAt: string
  role: WorkspaceRole
  _count?: {
    projects: number
    members: number
    teams: number
  }
}

export type WorkspaceInvite = {
  id: string
  workspaceId: string
  code: string
  createdById: string
  roleToAssign: WorkspaceRole
  expiresAt: string | null
  revokedAt: string | null
  createdAt: string
  updatedAt: string
}
