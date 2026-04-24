import { FolderOpenDot, Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useProjects } from '@/features/projects/hooks'
import { useTaskUiStore } from '@/features/tasks/store'
import { useWorkspaces } from '@/features/workspaces/hooks'

export const ProjectsPage = () => {
  const navigate = useNavigate()
  const activeWorkspaceId = useTaskUiStore((state) => state.activeWorkspaceId)
  const projects = useProjects(activeWorkspaceId || undefined)
  const workspaces = useWorkspaces()
  const selectedProjectId = useTaskUiStore((state) => state.selectedProjectId)
  const setSelectedProjectId = useTaskUiStore((state) => state.setSelectedProjectId)
  const setBoardView = useTaskUiStore((state) => state.setBoardView)
  const setCreateProjectOpen = useTaskUiStore((state) => state.setCreateProjectOpen)
  const hasWorkspace = Boolean(workspaces.data?.length)

  if (projects.isLoading) {
    return (
      <section className="min-h-0 flex-1 overflow-y-auto px-4 py-6 lg:px-7">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div
              key={`skel-${idx}`}
              className="rounded-xl border p-4"
              style={{ background: 'var(--tf-bg-3)', borderColor: 'var(--tf-border)' }}
            >
              <div className="h-4 w-1/2 animate-pulse rounded" style={{ background: 'var(--tf-bg-4)' }} />
              <div className="mt-3 h-3 w-4/5 animate-pulse rounded" style={{ background: 'var(--tf-bg-4)' }} />
              <div className="mt-2 h-3 w-3/5 animate-pulse rounded" style={{ background: 'var(--tf-bg-4)' }} />
            </div>
          ))}
        </div>
      </section>
    )
  }

  return (
    <section className="min-h-0 flex-1 overflow-y-auto px-4 py-6 lg:px-7">
      {!hasWorkspace ? (
        <div
          className="mx-auto mt-8 max-w-md rounded-2xl border border-dashed p-7 text-center"
          style={{ borderColor: 'var(--tf-border-2)', background: 'var(--tf-bg-3)' }}
        >
          <h2 className="text-[30px] font-light leading-[1.2]" style={{ fontFamily: 'var(--font-display)' }}>
            Create your first workspace
          </h2>
          <p className="mt-2 text-sm font-ui leading-6" style={{ color: 'var(--tf-text-2)' }}>
            You skipped setup. Create or join a workspace to start creating projects.
          </p>
          <button
            type="button"
            className="tf-primary-btn mt-5"
            onClick={() => navigate('/settings')}
          >
            Open settings
          </button>
        </div>
      ) : !projects.data?.length ? (
        <div
          className="mx-auto mt-8 max-w-md rounded-2xl border border-dashed p-6 text-center"
          style={{ borderColor: 'var(--tf-border-2)', background: 'var(--tf-bg-3)' }}
        >
          <h2 className="text-2xl" style={{ fontFamily: 'var(--font-display)' }}>
            No projects yet
          </h2>
          <p className="mt-2 text-sm" style={{ color: 'var(--tf-text-2)' }}>
            Create your first project to start organizing work.
          </p>
          <button
            type="button"
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold"
            style={{ background: 'var(--tf-gold)', color: '#1a1200' }}
            onClick={() => setCreateProjectOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Create project
          </button>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {projects.data.map((project, index) => {
            const dotColor =
              index % 4 === 0
                ? 'var(--tf-lavender)'
                : index % 4 === 1
                  ? 'var(--tf-teal)'
                  : index % 4 === 2
                    ? 'var(--tf-gold)'
                    : 'var(--tf-green)'

            return (
              <button
                key={project.id}
                type="button"
                className={`tf-project-card ${selectedProjectId === project.id ? 'active' : ''}`}
                onClick={() => {
                  setSelectedProjectId(project.id)
                  setBoardView('board')
                  navigate(`/projects/${project.id}`)
                }}
              >
                <span className="accent" style={{ background: dotColor }} />

                <header className="head">
                  <span className="name">{project.name}</span>
                  <span className="status">{project.status.toLowerCase()}</span>
                </header>

                <p className="desc">{project.description || 'No description yet.'}</p>

                <footer className="meta">
                  <span className="meta-item">
                    <FolderOpenDot className="h-3.5 w-3.5" />
                    {project.taskCount} task{project.taskCount === 1 ? '' : 's'}
                  </span>
                  <span className="meta-item">
                    {project.team?.name ? `Team ${project.team.name}` : `Updated ${new Date(project.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`}
                  </span>
                </footer>
              </button>
            )
          })}
        </div>
      )}
    </section>
  )
}
