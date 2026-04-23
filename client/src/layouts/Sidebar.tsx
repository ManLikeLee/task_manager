import { FolderKanban, LayoutGrid, Plus, Users2, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/features/auth/store'
import { useProjects } from '@/features/projects/hooks'
import { useTeams } from '@/features/teams/hooks'
import { useTaskUiStore } from '@/features/tasks/store'

export const Sidebar = () => {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const projects = useProjects()
  const teams = useTeams()
  const selectedProjectId = useTaskUiStore((state) => state.selectedProjectId)
  const setSelectedProjectId = useTaskUiStore((state) => state.setSelectedProjectId)
  const setCreateProjectOpen = useTaskUiStore((state) => state.setCreateProjectOpen)
  const boardView = useTaskUiStore((state) => state.boardView)
  const setBoardView = useTaskUiStore((state) => state.setBoardView)
  const mobileOpen = useTaskUiStore((state) => state.mobileSidebarOpen)
  const setMobileOpen = useTaskUiStore((state) => state.setMobileSidebarOpen)

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
        <p className="nav-label mb-1.5 px-2 text-[10px] font-medium uppercase tracking-[0.1em]" style={{ color: 'var(--tf-text-3)' }}>
          Workspace
        </p>
        <button
          type="button"
          className={`tf-nav-item ${boardView === 'board' ? 'tf-nav-item-active' : ''}`}
          onClick={() => {
            const targetProjectId = selectedProjectId || projects.data?.[0]?.id
            setBoardView('board')
            if (targetProjectId) {
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
        <div className="flex items-center gap-2 rounded-lg px-2.5 py-2 transition hover:bg-[#1e1e1b]">
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
              Workspace member
            </p>
          </div>
        </div>
      </div>
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
