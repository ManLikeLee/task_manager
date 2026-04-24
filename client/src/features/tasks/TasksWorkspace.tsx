import { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '@/components/ui/toast'
import { ApiError } from '@/types/api'
import { useAuthStore } from '@/features/auth/store'
import { CreateProjectModal } from '@/features/projects/CreateProjectModal'
import { ProjectsPage } from '@/features/projects/ProjectsPage'
import { useCreateProject, useProjects } from '@/features/projects/hooks'
import { TeamsPage } from '@/features/teams/TeamsPage'
import { SettingsPage } from '@/features/settings/SettingsPage'
import { useTeams } from '@/features/teams/hooks'
import { CreateTaskModal } from '@/features/tasks/components/CreateTaskModal'
import { LoadingBoardSkeleton } from '@/features/tasks/components/LoadingBoardSkeleton'
import { TaskBoard } from '@/features/tasks/components/TaskBoard'
import { TaskDetailDrawer } from '@/features/tasks/components/TaskDetailDrawer'
import { useCreateTask, useDeleteTask, useProjectAssignees, useTasks, useUpdateTask } from '@/features/tasks/hooks/useTasks'
import { useTaskUiStore } from '@/features/tasks/store'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import type { TaskFilters as TaskFilterType, TaskPriority, TaskStatus } from '@/types/task'
import { useWorkspaces } from '@/features/workspaces/hooks'

const VIEW_TABS = [
  { value: 'all', label: 'All tasks' },
  { value: 'mine', label: 'My tasks' },
  { value: 'blocked', label: 'Blocked' },
  { value: 'completed', label: 'Completed' },
] as const

type ViewTab = (typeof VIEW_TABS)[number]['value']

export const TasksWorkspace = () => {
  const navigate = useNavigate()
  const { notify } = useToast()
  const user = useAuthStore((state) => state.user)
  const activeWorkspaceId = useTaskUiStore((state) => state.activeWorkspaceId)
  const projects = useProjects(activeWorkspaceId || undefined)
  const workspaces = useWorkspaces(Boolean(user))
  const teams = useTeams(activeWorkspaceId || undefined)
  const {
    setActiveWorkspaceId,
    selectedProjectId,
    selectedTaskId,
    search,
    status,
    priority,
    dueAfter,
    dueBefore,
    sortBy,
    sortOrder,
    showFilters,
    boardView,
    createTaskOpen,
    createProjectOpen,
    setSelectedTaskId,
    setFilters,
    setSort,
    setBoardView,
    setCreateTaskOpen,
    setCreateProjectOpen,
  } = useTaskUiStore()

  const [activeTab, setActiveTab] = useState<ViewTab>('all')
  const [initialCreateStatus, setInitialCreateStatus] = useState<TaskStatus>('TODO')
  const debouncedSearch = useDebouncedValue(search)

  const filters = useMemo<TaskFilterType>(
    () => ({
      q: debouncedSearch || undefined,
      status:
        activeTab === 'blocked'
          ? 'BLOCKED'
          : activeTab === 'completed'
            ? 'DONE'
            : status || undefined,
      assigneeId: activeTab === 'mine' ? user?.id || undefined : undefined,
      priority: priority || undefined,
      dueAfter: dueAfter || undefined,
      dueBefore: dueBefore || undefined,
      sortBy,
      sortOrder,
      limit: 100,
    }),
    [activeTab, debouncedSearch, dueAfter, dueBefore, priority, sortBy, sortOrder, status, user?.id],
  )

  const hasProjects = Boolean(projects.data?.length)
  const hasWorkspaces = Boolean(workspaces.data?.length)
  const canCreateTask = hasProjects && Boolean(selectedProjectId)

  const tasks = useTasks(selectedProjectId, filters)
  const assignees = useProjectAssignees(selectedProjectId)
  const createTask = useCreateTask(selectedProjectId, filters)
  const createProject = useCreateProject()
  const updateTask = useUpdateTask(selectedProjectId, filters)
  const deleteTask = useDeleteTask(selectedProjectId, filters)

  const selectedTask = tasks.data?.tasks.find((task) => task.id === selectedTaskId) ?? null

  return (
    <div className="flex h-full min-h-0 flex-col">
      {boardView === 'board' ? (
        <>
          <div
            className="tab-bar flex h-[44px] items-center gap-1 border-b px-4 lg:px-7"
            style={{ borderColor: 'var(--tf-border)', background: 'var(--tf-bg-2)' }}
          >
            {VIEW_TABS.map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => setActiveTab(tab.value)}
                className={`tab workspace-tab transition ${activeTab === tab.value ? 'workspace-tab-active' : 'workspace-tab-inactive'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {showFilters ? (
            <div
              className="flex flex-wrap items-center gap-2 border-b px-4 py-2 lg:px-7"
              style={{ borderColor: 'var(--tf-border)', background: 'var(--tf-bg-2)' }}
            >
              <select
                value={status}
                onChange={(event) => setFilters({ status: event.target.value as TaskStatus | '' })}
                className="tf-field"
                aria-label="Filter status"
              >
                <option value="">All statuses</option>
                <option value="TODO">To do</option>
                <option value="IN_PROGRESS">In progress</option>
                <option value="IN_REVIEW">In review</option>
                <option value="DONE">Done</option>
                <option value="BLOCKED">Backlog</option>
              </select>
              <select
                value={priority}
                onChange={(event) => setFilters({ priority: event.target.value as TaskPriority | '' })}
                className="tf-field"
                aria-label="Filter priority"
              >
                <option value="">All priorities</option>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
              <input
                type="date"
                value={dueAfter}
                onChange={(event) => setFilters({ dueAfter: event.target.value })}
                className="tf-field"
                aria-label="Due after"
              />
              <input
                type="date"
                value={dueBefore}
                onChange={(event) => setFilters({ dueBefore: event.target.value })}
                className="tf-field"
                aria-label="Due before"
              />
              <select
                value={sortBy}
                onChange={(event) => setSort(event.target.value as typeof sortBy, sortOrder)}
                className="tf-field"
                aria-label="Sort by"
              >
                <option value="updatedAt">Updated</option>
                <option value="createdAt">Created</option>
                <option value="dueDate">Due date</option>
                <option value="priority">Priority</option>
                <option value="status">Status</option>
                <option value="title">Title</option>
              </select>
              <select
                value={sortOrder}
                onChange={(event) => setSort(sortBy, event.target.value as typeof sortOrder)}
                className="tf-field"
                aria-label="Sort order"
              >
                <option value="desc">Desc</option>
                <option value="asc">Asc</option>
              </select>
            </div>
          ) : null}

          <section className="min-h-0 flex-1 overflow-hidden px-4 py-5 lg:px-7">
            {!hasWorkspaces ? (
              <div
                className="mx-auto mt-8 max-w-md rounded-2xl border border-dashed p-6 text-center"
                style={{ borderColor: 'var(--tf-border-2)', background: 'var(--tf-bg-3)' }}
              >
                <h2 className="text-2xl" style={{ fontFamily: 'var(--font-display)' }}>
                  Create your first workspace
                </h2>
                <p className="mt-2 text-sm" style={{ color: 'var(--tf-text-2)' }}>
                  You can skip setup, then create or join a workspace anytime from Settings.
                </p>
                <button
                  type="button"
                  className="mt-4 inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold"
                  style={{ background: 'var(--tf-gold)', color: '#1a1200' }}
                  onClick={() => {
                    setBoardView('settings')
                    navigate('/settings')
                  }}
                >
                  Open settings
                </button>
              </div>
            ) : !hasProjects ? (
              <div
                className="mx-auto mt-8 max-w-md rounded-2xl border border-dashed p-6 text-center"
                style={{ borderColor: 'var(--tf-border-2)', background: 'var(--tf-bg-3)' }}
              >
                <h2 className="text-2xl" style={{ fontFamily: 'var(--font-display)' }}>
                  Start with a project
                </h2>
                <p className="mt-2 text-sm" style={{ color: 'var(--tf-text-2)' }}>
                  Create your first project to unlock TaskForce board workflows.
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
            ) : tasks.isLoading ? (
              <LoadingBoardSkeleton />
            ) : tasks.isError ? (
              <div
                className="mx-auto mt-8 max-w-md rounded-2xl border p-6 text-center"
                style={{ borderColor: 'var(--tf-border-2)', background: 'var(--tf-bg-3)' }}
              >
                <h2 className="text-[24px]" style={{ fontFamily: 'var(--font-display)' }}>
                  Unable to load tasks
                </h2>
                <p className="mt-2 text-sm" style={{ color: 'var(--tf-text-2)' }}>
                  {tasks.error instanceof ApiError ? tasks.error.message : 'Could not fetch tasks for this project.'}
                </p>
                <button
                  type="button"
                  className="mt-4 inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold"
                  style={{ background: 'var(--tf-gold)', color: '#1a1200' }}
                  onClick={() => {
                    void tasks.refetch()
                  }}
                >
                  Retry
                </button>
              </div>
            ) : (
              <TaskBoard
                tasks={tasks.data?.tasks || []}
                selectedTaskId={selectedTaskId}
                onSelectTask={setSelectedTaskId}
                onAddTaskInStatus={(statusValue) => {
                  setInitialCreateStatus(statusValue)
                  setCreateTaskOpen(true)
                }}
                onMove={async (taskId, nextStatus) => {
                  try {
                    await updateTask.mutateAsync({ id: taskId, payload: { status: nextStatus as TaskStatus } })
                  } catch (error) {
                    notify(error instanceof Error ? error.message : 'Failed to move task.', 'error')
                  }
                }}
              />
            )}
          </section>
        </>
      ) : boardView === 'teams' ? (
        <TeamsPage />
      ) : boardView === 'settings' ? (
        <SettingsPage />
      ) : (
        <ProjectsPage />
      )}

      <CreateTaskModal
        open={createTaskOpen}
        onClose={() => setCreateTaskOpen(false)}
        initialStatus={initialCreateStatus}
        disabled={!canCreateTask}
        disabledReason="Create and select a project before adding tasks."
        assignees={assignees.data || []}
        loadingAssignees={assignees.isLoading}
        onCreate={async (payload) => {
          if (!selectedProjectId) {
            notify('Select a project first.', 'error')
            throw new Error('Select a project first.')
          }

          try {
            await createTask.mutateAsync({ projectId: selectedProjectId, ...payload })
            notify('Task created.', 'success')
          } catch (error) {
            notify(error instanceof Error ? error.message : 'Failed to create task.', 'error')
            throw error
          }
        }}
      />

      <CreateProjectModal
        open={createProjectOpen}
        onClose={() => setCreateProjectOpen(false)}
        workspaces={(workspaces.data || []).map((workspace) => ({ id: workspace.id, name: workspace.name }))}
        teams={(teams.data || []).map((team) => ({ id: team.id, name: team.name, workspaceId: team.workspaceId }))}
        defaultWorkspaceId={activeWorkspaceId || workspaces.data?.[0]?.id || ''}
        onCreate={async (payload) => {
          try {
            const response = await createProject.mutateAsync(payload)
            setActiveWorkspaceId(response.project.workspace.id)
            useTaskUiStore.getState().setSelectedProjectId(response.project.id)
            setBoardView('board')
            navigate(`/projects/${response.project.id}`)
            notify('Project created.', 'success')
          } catch (error) {
            notify(error instanceof Error ? error.message : 'Failed to create project.', 'error')
            throw error
          }
        }}
      />

      <TaskDetailDrawer
        task={selectedTask}
        open={Boolean(selectedTask)}
        onClose={() => setSelectedTaskId(null)}
        saving={updateTask.isPending}
        deleting={deleteTask.isPending}
        assignees={assignees.data || []}
        onSave={async (payload) => {
          if (!selectedTaskId) return

          try {
            await updateTask.mutateAsync({ id: selectedTaskId, payload })
          } catch (error) {
            notify(error instanceof Error ? error.message : 'Failed to update task.', 'error')
            throw error
          }
        }}
        onDelete={async () => {
          if (!selectedTaskId) return

          try {
            await deleteTask.mutateAsync(selectedTaskId)
            setSelectedTaskId(null)
            notify('Task deleted.', 'success')
          } catch (error) {
            notify(error instanceof Error ? error.message : 'Failed to delete task.', 'error')
            throw error
          }
        }}
      />
    </div>
  )
}
