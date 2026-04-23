import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useProjects } from '@/features/projects/hooks'
import { useTaskUiStore } from '@/features/tasks/store'
import { Sidebar } from '@/layouts/Sidebar'
import { Topbar } from '@/layouts/Topbar'
import { TasksWorkspace } from '@/features/tasks/TasksWorkspace'

export const AppShell = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const projects = useProjects()

  const selectedProjectId = useTaskUiStore((state) => state.selectedProjectId)
  const boardView = useTaskUiStore((state) => state.boardView)
  const setSelectedProjectId = useTaskUiStore((state) => state.setSelectedProjectId)
  const setBoardView = useTaskUiStore((state) => state.setBoardView)
  const setSelectedTaskId = useTaskUiStore((state) => state.setSelectedTaskId)

  useEffect(() => {
    if (projects.isLoading) return

    const pathname = location.pathname
    const projectRouteMatch = pathname.match(/^\/projects\/([^/]+)$/)
    const availableProjects = projects.data || []

    if (pathname === '/projects') {
      if (boardView !== 'projects') setBoardView('projects')
      if (selectedProjectId && !availableProjects.some((project) => project.id === selectedProjectId)) {
        setSelectedProjectId('')
      }
      setSelectedTaskId(null)
      return
    }

    if (pathname === '/teams') {
      if (boardView !== 'teams') setBoardView('teams')
      setSelectedTaskId(null)
      return
    }

    if (projectRouteMatch) {
      const routeProjectId = decodeURIComponent(projectRouteMatch[1])
      const routeProjectExists = availableProjects.some((project) => project.id === routeProjectId)

      if (!routeProjectExists && availableProjects.length) {
        navigate(`/projects/${availableProjects[0].id}`, { replace: true })
        return
      }
      if (!routeProjectExists && !availableProjects.length) {
        if (boardView !== 'projects') setBoardView('projects')
        setSelectedTaskId(null)
        navigate('/projects', { replace: true })
        return
      }

      if (boardView !== 'board') setBoardView('board')
      if (selectedProjectId !== routeProjectId) {
        setSelectedProjectId(routeProjectId)
        setSelectedTaskId(null)
      }
      return
    }

    if (availableProjects.length) {
      const fallbackProjectId =
        selectedProjectId && availableProjects.some((project) => project.id === selectedProjectId)
          ? selectedProjectId
          : availableProjects[0].id
      if (boardView !== 'board') setBoardView('board')
      if (selectedProjectId !== fallbackProjectId) setSelectedProjectId(fallbackProjectId)
      navigate(`/projects/${fallbackProjectId}`, { replace: true })
      return
    }

    if (boardView !== 'projects') setBoardView('projects')
    navigate('/projects', { replace: true })
  }, [
    boardView,
    location.pathname,
    navigate,
    projects.data,
    projects.isLoading,
    selectedProjectId,
    setBoardView,
    setSelectedProjectId,
    setSelectedTaskId,
  ])

  return (
    <div className="app flex h-screen overflow-hidden" style={{ background: 'var(--tf-bg)', color: 'var(--tf-text)' }}>
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Topbar />
        <main className="min-h-0 flex-1 overflow-hidden">
          <TasksWorkspace />
        </main>
      </div>
    </div>
  )
}
