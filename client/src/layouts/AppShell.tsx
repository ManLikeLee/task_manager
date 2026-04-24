import { useEffect, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useProjects } from '@/features/projects/hooks'
import { useTaskUiStore } from '@/features/tasks/store'
import { Sidebar } from '@/layouts/Sidebar'
import { Topbar } from '@/layouts/Topbar'
import { TasksWorkspace } from '@/features/tasks/TasksWorkspace'
import { useWorkspaces } from '@/features/workspaces/hooks'
import { usePageTitle } from '@/hooks/usePageTitle'

export const AppShell = () => {
  const navigate = useNavigate()
  const location = useLocation()

  const activeWorkspaceId = useTaskUiStore((state) => state.activeWorkspaceId)
  const setActiveWorkspaceId = useTaskUiStore((state) => state.setActiveWorkspaceId)
  const workspaces = useWorkspaces()
  const projects = useProjects(activeWorkspaceId || undefined)
  const selectedProjectId = useTaskUiStore((state) => state.selectedProjectId)
  const boardView = useTaskUiStore((state) => state.boardView)
  const setSelectedProjectId = useTaskUiStore((state) => state.setSelectedProjectId)
  const setBoardView = useTaskUiStore((state) => state.setBoardView)
  const setSelectedTaskId = useTaskUiStore((state) => state.setSelectedTaskId)

  const pageTitle = useMemo(() => {
    const pathname = location.pathname
    const availableProjects = projects.data || []

    if (pathname === '/projects') return 'Projects'
    if (pathname === '/teams') return 'Teams'
    if (pathname === '/settings') return 'Settings'

    const projectRouteMatch = pathname.match(/^\/projects\/([^/]+)$/)
    if (projectRouteMatch) {
      if (projects.isLoading) return 'Loading Project'
      const routeProjectId = decodeURIComponent(projectRouteMatch[1])
      const routeProject = availableProjects.find((project) => project.id === routeProjectId)
      return routeProject?.name || 'Board'
    }

    if (boardView === 'teams') return 'Teams'
    if (boardView === 'settings') return 'Settings'
    if (boardView === 'projects') return 'Projects'

    const selectedProject = availableProjects.find((project) => project.id === selectedProjectId)
    return selectedProject?.name || availableProjects[0]?.name || 'Board'
  }, [boardView, location.pathname, projects.data, projects.isLoading, selectedProjectId])

  usePageTitle(pageTitle)

  useEffect(() => {
    if (workspaces.isLoading) return
    const items = workspaces.data || []
    if (!items.length) {
      if (activeWorkspaceId) setActiveWorkspaceId('')
      return
    }

    if (!activeWorkspaceId || !items.some((workspace) => workspace.id === activeWorkspaceId)) {
      setActiveWorkspaceId(items[0].id)
      setSelectedProjectId('')
      setSelectedTaskId(null)
    }
  }, [
    activeWorkspaceId,
    setActiveWorkspaceId,
    setSelectedProjectId,
    setSelectedTaskId,
    workspaces.data,
    workspaces.isLoading,
  ])

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

    if (pathname === '/settings') {
      if (boardView !== 'settings') setBoardView('settings')
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
      const routeProject = availableProjects.find((project) => project.id === routeProjectId)
      if (routeProject?.workspace.id && routeProject.workspace.id !== activeWorkspaceId) {
        setActiveWorkspaceId(routeProject.workspace.id)
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
    activeWorkspaceId,
    selectedProjectId,
    setActiveWorkspaceId,
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
