import { useEffect } from 'react'
import { Select } from '@/components/ui/select'
import { useProjects } from '@/features/projects/hooks'
import { useTaskUiStore } from '@/features/tasks/store'

export const ProjectSwitcher = () => {
  const projects = useProjects()
  const selectedProjectId = useTaskUiStore((state) => state.selectedProjectId)
  const setSelectedProjectId = useTaskUiStore((state) => state.setSelectedProjectId)

  useEffect(() => {
    if (!projects.data?.length) {
      if (selectedProjectId) {
        setSelectedProjectId('')
      }
      return
    }

    const projectExists = projects.data.some((project) => project.id === selectedProjectId)

    if (!selectedProjectId || !projectExists) {
      setSelectedProjectId(projects.data[0].id)
    }
  }, [projects.data, selectedProjectId, setSelectedProjectId])

  return (
    <Select
      value={selectedProjectId}
      onChange={(event) => setSelectedProjectId(event.target.value)}
      aria-label="Select project"
      className="min-w-44"
    >
      {!projects.data?.length ? <option value="">No projects yet</option> : null}
      {projects.data?.map((project) => (
        <option key={project.id} value={project.id}>
          {project.name}
        </option>
      ))}
    </Select>
  )
}
