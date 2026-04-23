import { create } from 'zustand'
import type { SortField, SortOrder, TaskPriority, TaskStatus } from '@/types/task'

type TaskUiState = {
  selectedProjectId: string
  selectedTaskId: string | null
  boardView: 'board' | 'projects' | 'teams'
  search: string
  status: TaskStatus | ''
  priority: TaskPriority | ''
  dueAfter: string
  dueBefore: string
  sortBy: SortField
  sortOrder: SortOrder
  showFilters: boolean
  createTaskOpen: boolean
  createProjectOpen: boolean
  mobileSidebarOpen: boolean
  setSelectedProjectId: (id: string) => void
  setSelectedTaskId: (id: string | null) => void
  setBoardView: (view: 'board' | 'projects' | 'teams') => void
  setFilters: (payload: Partial<Pick<TaskUiState, 'search' | 'status' | 'priority' | 'dueAfter' | 'dueBefore'>>) => void
  setSort: (sortBy: SortField, sortOrder: SortOrder) => void
  setShowFilters: (open: boolean) => void
  setCreateTaskOpen: (open: boolean) => void
  setCreateProjectOpen: (open: boolean) => void
  setMobileSidebarOpen: (open: boolean) => void
}

export const useTaskUiStore = create<TaskUiState>((set) => ({
  selectedProjectId: '',
  selectedTaskId: null,
  boardView: 'board',
  search: '',
  status: '',
  priority: '',
  dueAfter: '',
  dueBefore: '',
  sortBy: 'updatedAt',
  sortOrder: 'desc',
  showFilters: false,
  createTaskOpen: false,
  createProjectOpen: false,
  mobileSidebarOpen: false,
  setSelectedProjectId: (selectedProjectId) => set({ selectedProjectId }),
  setSelectedTaskId: (selectedTaskId) => set({ selectedTaskId }),
  setBoardView: (boardView) => set({ boardView }),
  setFilters: (payload) => set((state) => ({ ...state, ...payload })),
  setSort: (sortBy, sortOrder) => set({ sortBy, sortOrder }),
  setShowFilters: (showFilters) => set({ showFilters }),
  setCreateTaskOpen: (createTaskOpen) => set({ createTaskOpen }),
  setCreateProjectOpen: (createProjectOpen) => set({ createProjectOpen }),
  setMobileSidebarOpen: (mobileSidebarOpen) => set({ mobileSidebarOpen }),
}))
