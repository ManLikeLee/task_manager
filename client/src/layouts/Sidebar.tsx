import { Check, Copy, FolderKanban, LayoutGrid, LogOut, Plus, Settings, Users2, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { useToast } from '@/components/ui/toast'
import { useLogout } from '@/features/auth/hooks'
import { useAuthStore } from '@/features/auth/store'
import { useProjects } from '@/features/projects/hooks'
import { useTeams } from '@/features/teams/hooks'
import { useTaskUiStore } from '@/features/tasks/store'
import { CreateWorkspaceModal } from '@/features/workspaces/CreateWorkspaceModal'
import { useCreateWorkspace, useWorkspaces } from '@/features/workspaces/hooks'

export const Sidebar = () => {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const { notify } = useToast()
  const [copied, setCopied] = useState(false)
  const workspaces = useWorkspaces()
  const logoutMutation = useLogout()
  const activeWorkspaceId = useTaskUiStore((state) => state.activeWorkspaceId)
  const setActiveWorkspaceId = useTaskUiStore((state) => state.setActiveWorkspaceId)
  const projects = useProjects(activeWorkspaceId || undefined)
  const teams = useTeams(activeWorkspaceId || undefined)
  const createWorkspace = useCreateWorkspace()
  const [createWorkspaceOpen, setCreateWorkspaceOpen] = useState(false)
  const selectedProjectId = useTaskUiStore((state) => state.selectedProjectId)
  const setSelectedProjectId = useTaskUiStore((state) => state.setSelectedProjectId)
  const setSelectedTaskId = useTaskUiStore((state) => state.setSelectedTaskId)
  const setCreateProjectOpen = useTaskUiStore((state) => state.setCreateProjectOpen)
  const boardView = useTaskUiStore((state) => state.boardView)
  const setBoardView = useTaskUiStore((state) => state.setBoardView)
  const mobileOpen = useTaskUiStore((state) => state.mobileSidebarOpen)
  const setMobileOpen = useTaskUiStore((state) => state.setMobileSidebarOpen)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const activeWorkspace =
    workspaces.data?.find((workspace) => workspace.id === activeWorkspaceId) ||
    workspaces.data?.[0] ||
    null

  const activeWorkspaceJoinCode = useMemo(() => {
    if (activeWorkspace?.joinCode) return activeWorkspace.joinCode
    if (!activeWorkspace?.id) return null
    return (
      projects.data?.find((project) => project.workspace.id === activeWorkspace.id)?.workspace.joinCode ||
      null
    )
  }, [activeWorkspace?.id, activeWorkspace?.joinCode, projects.data])

  const content = (
    <div className="flex h-full flex-col">
      <div className="sidebar-logo mb-4 border-b px-5 pb-6" style={{ borderColor: 'var(--tf-border)' }}>
        <div className="flex items-center gap-2.5 pt-1">
          <div
            className="logo-mark flex h-7 w-7 items-center justify-center rounded-lg text-sm"
            style={{ color: '#1a1200', fontFamily: 'var(--font-display)' }}
          >
            T
          </div>
          <p className="logo-text text-base font-light tracking-[0.02em]" style={{ fontFamily: 'var(--font-display)' }}>
            TaskForce
          </p>
        </div>
      </div>

      <div className="nav-section mb-5 px-3">
        <div className="mb-1.5 flex items-center justify-between px-2">
          <p className="nav-label m-0 text-[10px] font-medium uppercase tracking-[0.1em]" style={{ color: 'var(--tf-text-3)' }}>
            Workspace
          </p>
          <button
            type="button"
            className="rounded-md border p-1 transition"
            style={{ borderColor: 'var(--tf-border)', color: 'var(--tf-text-3)' }}
            onClick={() => setCreateWorkspaceOpen(true)}
            aria-label="Create workspace"
            title="Create workspace"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="space-y-1.5 px-2 pb-2">
          <select
            value={activeWorkspace?.id || ''}
            className="tf-sidebar-workspace-select"
            onChange={(event) => {
              const nextWorkspaceId = event.target.value
              setActiveWorkspaceId(nextWorkspaceId)
              setSelectedProjectId('')
              setSelectedTaskId(null)
              setBoardView('projects')
              navigate('/projects')
              setMobileOpen(false)
            }}
            aria-label="Switch workspace"
          >
            {(workspaces.data || []).map((workspace) => (
              <option key={workspace.id} value={workspace.id}>
                {workspace.name}
              </option>
            ))}
          </select>
          {activeWorkspaceJoinCode ? (
            <button
              type="button"
              className="tf-sidebar-workspace-code"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(activeWorkspaceJoinCode)
                  setCopied(true)
                  notify('Workspace code copied', 'success')
                  setTimeout(() => setCopied(false), 1200)
                } catch {
                  notify('Failed to copy workspace code', 'error')
                }
              }}
              title="Copy workspace code"
            >
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              {activeWorkspaceJoinCode}
            </button>
          ) : (
            <p className="text-[10px]" style={{ color: 'var(--tf-text-3)' }}>
              Workspace code unavailable
            </p>
          )}
        </div>
        <button
          type="button"
          className={`tf-nav-item ${boardView === 'board' ? 'tf-nav-item-active' : ''}`}
          onClick={() => {
            const targetProjectId = selectedProjectId || projects.data?.[0]?.id
            setBoardView('board')
            if (targetProjectId) {
              const projectWorkspaceId = projects.data?.find((project) => project.id === targetProjectId)?.workspace.id
              if (projectWorkspaceId) setActiveWorkspaceId(projectWorkspaceId)
              setSelectedProjectId(targetProjectId)
              navigate(`/projects/${targetProjectId}`)
            } else {
              navigate('/projects')
            }
            setMobileOpen(false)
          }}
        >
          <LayoutGrid className="h-4 w-4" />
          Board
        </button>
        <button
          type="button"
          className={`tf-nav-item ${boardView === 'projects' ? 'tf-nav-item-active' : ''}`}
          onClick={() => {
            setBoardView('projects')
            navigate('/projects')
            setMobileOpen(false)
          }}
        >
          <FolderKanban className="h-4 w-4" />
          Projects
        </button>
        <button
          type="button"
          className={`tf-nav-item ${boardView === 'teams' ? 'tf-nav-item-active' : ''}`}
          onClick={() => {
            setBoardView('teams')
            navigate('/teams')
            setMobileOpen(false)
          }}
        >
          <Users2 className="h-4 w-4" />
          Teams
        </button>
      </div>

      <div className="nav-section px-3">
        <div className="mb-1.5 flex items-center justify-between px-2">
          <p className="nav-label text-[10px] font-medium uppercase tracking-[0.1em]" style={{ color: 'var(--tf-text-3)' }}>
            Projects
          </p>
          <button
            type="button"
            className="rounded-md border p-1 transition"
            style={{ borderColor: 'var(--tf-border)', color: 'var(--tf-text-3)' }}
            onClick={() => setCreateProjectOpen(true)}
            aria-label="Create project"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="space-y-0.5">
          {projects.data?.map((project, index) => (
            <button
              key={project.id}
              type="button"
              className={`tf-nav-item tf-project-nav w-full ${selectedProjectId === project.id ? 'tf-nav-item-active' : ''}`}
              onClick={() => {
                setActiveWorkspaceId(project.workspace.id)
                setSelectedProjectId(project.id)
                setBoardView('board')
                navigate(`/projects/${project.id}`)
                setMobileOpen(false)
              }}
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{
                  background:
                    index % 4 === 0
                      ? 'var(--tf-lavender)'
                      : index % 4 === 1
                        ? 'var(--tf-teal)'
                        : index % 4 === 2
                          ? 'var(--tf-gold)'
                          : 'var(--tf-rose)',
                }}
              />
              <span className="truncate">{project.name}</span>
            </button>
          ))}

          {!projects.data?.length ? (
            <div
              className="rounded-lg border border-dashed px-3 py-2 text-xs"
              style={{ borderColor: 'var(--tf-border)', color: 'var(--tf-text-3)' }}
            >
              No projects yet
            </div>
          ) : null}
        </div>
      </div>

      <div className="nav-section mt-4 px-3">
        <p className="nav-label mb-1.5 px-2 text-[10px] font-medium uppercase tracking-[0.1em]" style={{ color: 'var(--tf-text-3)' }}>
          Teams
        </p>
        <div className="space-y-0.5">
          {teams.data?.map((team) => (
            <button
              key={team.id}
              type="button"
              className={`tf-nav-item tf-project-nav w-full ${boardView === 'teams' ? 'tf-nav-item-active' : ''}`}
              onClick={() => {
                setBoardView('teams')
                navigate('/teams')
                setMobileOpen(false)
              }}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: 'var(--tf-teal)' }} />
              <span className="truncate">{team.name}</span>
            </button>
          ))}
          {!teams.data?.length ? (
            <div
              className="rounded-lg border border-dashed px-3 py-2 text-xs"
              style={{ borderColor: 'var(--tf-border)', color: 'var(--tf-text-3)' }}
            >
              No teams yet
            </div>
          ) : null}
        </div>
      </div>

      <div className="sidebar-footer mt-auto border-t px-3 pt-4" style={{ borderColor: 'var(--tf-border)' }}>
        <div className="relative">
          {userMenuOpen ? (
            <div
              className="absolute bottom-[calc(100%+8px)] left-0 right-0 z-30 rounded-lg border p-1"
              style={{
                borderColor: 'var(--tf-border-2)',
                background: 'var(--tf-bg-3)',
                boxShadow: '0 12px 30px rgba(0,0,0,0.4)',
              }}
            >
              <button
                type="button"
                className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-[12px] transition hover:bg-[var(--tf-bg-4)]"
                style={{ color: 'var(--tf-text-2)' }}
                onClick={() => {
                  setUserMenuOpen(false)
                  setBoardView('settings')
                  setSelectedTaskId(null)
                  navigate('/settings')
                }}
              >
                <Settings className="h-3.5 w-3.5" />
                Settings
              </button>
              <button
                type="button"
                className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-[12px] transition hover:bg-[var(--tf-bg-4)]"
                style={{ color: '#e8b4a8' }}
                onClick={() => {
                  setUserMenuOpen(false)
                  logout()
                  setActiveWorkspaceId('')
                  setSelectedProjectId('')
                  setSelectedTaskId(null)
                  if (typeof window !== 'undefined') {
                    window.localStorage.removeItem('taskforce.activeWorkspaceId')
                    window.location.replace('/auth')
                  } else {
                    navigate('/auth', { replace: true })
                  }
                  logoutMutation.mutate(undefined, {
                    onError: () => {
                      notify('Signed out locally. Server sign-out can be retried.', 'error')
                    },
                  })
                }}
              >
                <LogOut className="h-3.5 w-3.5" />
                Logout
              </button>
            </div>
          ) : null}
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left transition hover:bg-[#1e1e1b]"
            onClick={() => setUserMenuOpen((current) => !current)}
            aria-haspopup="menu"
            aria-expanded={userMenuOpen}
            aria-label="Open user menu"
          >
            <div
              className="flex h-[30px] w-[30px] items-center justify-center rounded-lg text-[11px] font-medium text-white"
              style={{ background: 'linear-gradient(135deg, var(--tf-gold) 0%, var(--tf-rose) 100%)' }}
            >
              {(user?.name || 'U')
                .split(' ')
                .slice(0, 2)
                .map((part) => part[0])
                .join('')
                .toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-[13px] text-[var(--tf-text)]">{user?.name || 'TaskForce User'}</p>
              <p className="text-[11px]" style={{ color: 'var(--tf-text-3)' }}>
                {user?.username ? `@${user.username}` : 'Workspace member'}
              </p>
            </div>
          </button>
        </div>
      </div>
      <CreateWorkspaceModal
        open={createWorkspaceOpen}
        onClose={() => setCreateWorkspaceOpen(false)}
        onCreate={async (payload) => {
          const response = await createWorkspace.mutateAsync(payload)
          setActiveWorkspaceId(response.workspace.id)
          setSelectedProjectId('')
          setSelectedTaskId(null)
          setBoardView('projects')
          navigate('/projects')
          notify(`Workspace "${response.workspace.name}" created.`, 'success')
        }}
      />
    </div>
  )

  return (
    <>
      <aside
        className="tf-sidebar hidden h-screen w-[228px] flex-col border-r py-5 lg:flex"
        style={{ background: 'var(--tf-bg-2)', borderColor: 'var(--tf-border)' }}
      >
        {content}
      </aside>

      {mobileOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-label="Close navigation backdrop"
        />
      ) : null}

      <aside
        className={`tf-sidebar fixed left-0 top-0 z-50 h-screen w-[228px] border-r py-5 transition lg:hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ background: 'var(--tf-bg-2)', borderColor: 'var(--tf-border)' }}
      >
        <div className="mb-3 flex justify-end px-3">
          <button
            type="button"
            className="rounded-md border p-1"
            style={{ borderColor: 'var(--tf-border)', color: 'var(--tf-text-2)' }}
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {content}
      </aside>
    </>
  )
}
