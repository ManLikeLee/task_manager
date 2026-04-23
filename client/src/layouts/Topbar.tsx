import { Filter, Menu, Plus, Search } from 'lucide-react'
import { useProjects } from '@/features/projects/hooks'
import { useTaskUiStore } from '@/features/tasks/store'

export const Topbar = () => {
  const projects = useProjects()

  const search = useTaskUiStore((state) => state.search)
  const selectedProjectId = useTaskUiStore((state) => state.selectedProjectId)
  const boardView = useTaskUiStore((state) => state.boardView)
  const setFilters = useTaskUiStore((state) => state.setFilters)
  const setCreateTaskOpen = useTaskUiStore((state) => state.setCreateTaskOpen)
  const setCreateProjectOpen = useTaskUiStore((state) => state.setCreateProjectOpen)
  const setMobileSidebarOpen = useTaskUiStore((state) => state.setMobileSidebarOpen)
  const showFilters = useTaskUiStore((state) => state.showFilters)
  const setShowFilters = useTaskUiStore((state) => state.setShowFilters)

  const selectedProjectName = projects.data?.find((project) => project.id === selectedProjectId)?.name || 'Task board'
  const title = boardView === 'projects' ? 'Projects' : boardView === 'teams' ? 'Teams' : selectedProjectName
  const canCreateTask = Boolean(projects.data?.length && selectedProjectId)

  return (
    <header className="shrink-0 border-b" style={{ background: 'var(--tf-bg-2)', borderColor: 'var(--tf-border)' }}>
      <div className="topbar flex h-[56px] items-center gap-4 px-4 lg:px-7">
        <button
          type="button"
          className="rounded-md border p-1.5 lg:hidden"
          style={{ borderColor: 'var(--tf-border-2)', color: 'var(--tf-text-2)' }}
          onClick={() => setMobileSidebarOpen(true)}
          aria-label="Open navigation"
        >
          <Menu className="h-4 w-4" />
        </button>

        <p className="topbar-title truncate">
          {title} {boardView === 'board' ? <span className="topbar-subtitle">/ Sprint</span> : null}
        </p>

        <div className="topbar-actions ml-auto flex items-center gap-2">
          {boardView === 'board' ? (
            <label
              className="search-bar hidden md:flex"
              style={{ background: 'var(--tf-bg-3)', borderColor: 'var(--tf-border)' }}
            >
              <Search className="h-3 w-3" style={{ color: 'var(--tf-text-3)' }} />
              <input
                value={search}
                onChange={(event) => setFilters({ search: event.target.value })}
                placeholder="Search tasks..."
                className="search-text w-[160px] bg-transparent outline-none placeholder:text-[var(--tf-text-3)]"
                aria-label="Search tasks"
              />
            </label>
          ) : null}

          {boardView === 'board' ? (
            <button
              type="button"
              className="filter-btn border"
              style={{ borderColor: 'var(--tf-border-2)', color: 'var(--tf-text-2)' }}
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-3 w-3" />
              Filter
            </button>
          ) : null}

          {boardView !== 'teams' ? (
            <button
              type="button"
              className="add-btn"
              style={{ background: 'var(--tf-gold)', color: '#1a1200' }}
              onClick={() => (boardView === 'projects' ? setCreateProjectOpen(true) : setCreateTaskOpen(true))}
              disabled={boardView === 'board' && !canCreateTask}
            >
              <Plus className="h-3 w-3" />
              {boardView === 'projects' ? 'New project' : 'New task'}
            </button>
          ) : null}
        </div>
      </div>
    </header>
  )
}
