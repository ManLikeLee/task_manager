import { useState } from 'react'
import { Plus, Users, X } from 'lucide-react'
import { useToast } from '@/components/ui/toast'
import { useProjects } from '@/features/projects/hooks'
import { useAddTeamMember, useCreateTeam, useLinkProjectTeam, useRemoveTeamMember, useTeamMembers, useTeams } from '@/features/teams/hooks'
import { useTaskUiStore } from '@/features/tasks/store'
import { useWorkspaces } from '@/features/workspaces/hooks'

export const TeamsPage = () => {
  const { notify } = useToast()
  const activeWorkspaceId = useTaskUiStore((state) => state.activeWorkspaceId)
  const teams = useTeams(activeWorkspaceId || undefined)
  const projects = useProjects(activeWorkspaceId || undefined)
  const workspaces = useWorkspaces()
  const createTeam = useCreateTeam()

  const [createOpen, setCreateOpen] = useState(false)
  const [createForm, setCreateForm] = useState({ name: '', description: '' })
  const [selectedTeamId, setSelectedTeamId] = useState<string>('')
  const [memberUsername, setMemberUsername] = useState('')

  const fallbackWorkspaceId = activeWorkspaceId || projects.data?.[0]?.workspace.id || workspaces.data?.[0]?.id || ''
  const selectedTeam = teams.data?.find((team) => team.id === selectedTeamId) || teams.data?.[0] || null
  const workspaceId = selectedTeam?.workspaceId || fallbackWorkspaceId
  const teamMembers = useTeamMembers(selectedTeam?.id || '')
  const addMember = useAddTeamMember(selectedTeam?.id || '')
  const removeMember = useRemoveTeamMember(selectedTeam?.id || '')
  const linkProjectTeam = useLinkProjectTeam()
  const [projectToLink, setProjectToLink] = useState('')

  return (
    <section className="min-h-0 flex-1 overflow-y-auto px-4 py-6 lg:px-7">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-[28px]" style={{ fontFamily: 'var(--font-display)' }}>
          Teams
        </h2>
        <button type="button" className="tf-primary-btn" onClick={() => setCreateOpen(true)}>
          <Plus className="h-3.5 w-3.5" />
          Create team
        </button>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_1fr]">
        <div className="rounded-xl border p-3" style={{ borderColor: 'var(--tf-border)', background: 'var(--tf-bg-3)' }}>
          <p className="mb-2 text-[11px] uppercase tracking-[0.08em]" style={{ color: 'var(--tf-text-3)' }}>
            Team list
          </p>
          <div className="space-y-2">
            {teams.data?.map((team) => (
              <button
                key={team.id}
                type="button"
                className={`w-full rounded-lg border px-3 py-2 text-left transition ${selectedTeam?.id === team.id ? 'tf-nav-item-active' : ''}`}
                style={{ borderColor: 'var(--tf-border)', background: 'var(--tf-bg-2)' }}
                onClick={() => setSelectedTeamId(team.id)}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm" style={{ color: 'var(--tf-text)' }}>
                    {team.name}
                  </span>
                  <span className="text-[11px]" style={{ color: 'var(--tf-text-3)' }}>
                    {(team._count?.members || 0)} members
                  </span>
                </div>
                <p className="mt-1 text-xs" style={{ color: 'var(--tf-text-2)' }}>
                  {team.description || 'No description yet'}
                </p>
              </button>
            ))}
            {!teams.data?.length ? (
              <div className="rounded-lg border border-dashed px-3 py-3 text-xs" style={{ borderColor: 'var(--tf-border)', color: 'var(--tf-text-3)' }}>
                No teams yet.
              </div>
            ) : null}
          </div>
        </div>

        <div className="rounded-xl border p-3" style={{ borderColor: 'var(--tf-border)', background: 'var(--tf-bg-3)' }}>
          <p className="mb-2 text-[11px] uppercase tracking-[0.08em]" style={{ color: 'var(--tf-text-3)' }}>
            Team members
          </p>
          {selectedTeam ? (
            <>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm" style={{ color: 'var(--tf-text)' }}>
                  {selectedTeam.name}
                </p>
                <span className="inline-flex items-center gap-1 text-[11px]" style={{ color: 'var(--tf-text-3)' }}>
                  <Users className="h-3.5 w-3.5" />
                  {(teamMembers.data || []).length}
                </span>
              </div>

              <div className="space-y-2">
                {(teamMembers.data || []).map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between rounded-lg border px-3 py-2"
                    style={{ borderColor: 'var(--tf-border)', background: 'var(--tf-bg-2)' }}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm" style={{ color: 'var(--tf-text)' }}>
                        {member.user.name}
                      </p>
                      <p className="truncate text-[11px]" style={{ color: 'var(--tf-text-3)' }}>
                        @{member.user.username} · {member.role.toLowerCase()}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="rounded-md border p-1"
                      style={{ borderColor: 'var(--tf-border)', color: 'var(--tf-text-3)' }}
                      onClick={async () => {
                        try {
                          await removeMember.mutateAsync(member.userId)
                        } catch (error) {
                          notify(error instanceof Error ? error.message : 'Failed to remove member.', 'error')
                        }
                      }}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
                {!(teamMembers.data || []).length ? (
                  <div className="rounded-lg border border-dashed px-3 py-3 text-xs" style={{ borderColor: 'var(--tf-border)', color: 'var(--tf-text-3)' }}>
                    No members in this team yet.
                  </div>
                ) : null}
              </div>

              <div className="mt-3 flex gap-2">
                <input
                  className="tf-input flex-1"
                  value={memberUsername}
                  onChange={(event) => setMemberUsername(event.target.value)}
                  placeholder="Add by username (e.g. jordan_hayes)"
                />
                <button
                  type="button"
                  className="tf-secondary-btn"
                  onClick={async () => {
                    if (!memberUsername.trim() || !selectedTeam?.id) return
                    try {
                      await addMember.mutateAsync({ username: memberUsername.trim().toLowerCase(), role: 'MEMBER' })
                      setMemberUsername('')
                    } catch (error) {
                      notify(error instanceof Error ? error.message : 'Failed to add member.', 'error')
                    }
                  }}
                >
                  Add
                </button>
              </div>

              <div className="mt-3 flex gap-2">
                <select className="tf-input flex-1" value={projectToLink} onChange={(event) => setProjectToLink(event.target.value)}>
                  <option value="">Link project to this team…</option>
                  {(projects.data || []).map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="tf-secondary-btn"
                  onClick={async () => {
                    if (!projectToLink || !selectedTeam?.id) return
                    try {
                      await linkProjectTeam.mutateAsync({ projectId: projectToLink, teamId: selectedTeam.id })
                      setProjectToLink('')
                    } catch (error) {
                      notify(error instanceof Error ? error.message : 'Failed to link project.', 'error')
                    }
                  }}
                >
                  Link
                </button>
              </div>
            </>
          ) : (
            <div className="rounded-lg border border-dashed px-3 py-3 text-xs" style={{ borderColor: 'var(--tf-border)', color: 'var(--tf-text-3)' }}>
              Select a team to manage members.
            </div>
          )}
        </div>
      </div>

      {createOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-[380px] rounded-2xl border p-6" style={{ background: 'var(--tf-bg-3)', borderColor: 'var(--tf-border-2)' }}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-[24px]" style={{ fontFamily: 'var(--font-display)' }}>
                New team
              </h3>
              <button type="button" className="tf-ghost-btn" onClick={() => setCreateOpen(false)}>
                <X className="h-4 w-4" />
              </button>
            </div>
            <form
              className="space-y-3"
              onSubmit={async (event) => {
                event.preventDefault()
                if (!workspaceId) {
                  notify('Create or join a workspace first.', 'error')
                  return
                }
                try {
                  await createTeam.mutateAsync({
                    workspaceId,
                    payload: { name: createForm.name.trim(), description: createForm.description.trim() || null },
                  })
                  setCreateForm({ name: '', description: '' })
                  setCreateOpen(false)
                } catch (error) {
                  notify(error instanceof Error ? error.message : 'Failed to create team.', 'error')
                }
              }}
            >
              <label className="block space-y-1.5">
                <span className="text-[11px] uppercase tracking-[0.08em]" style={{ color: 'var(--tf-text-3)' }}>
                  Team name
                </span>
                <input className="tf-input" value={createForm.name} onChange={(event) => setCreateForm((state) => ({ ...state, name: event.target.value }))} />
              </label>
              <label className="block space-y-1.5">
                <span className="text-[11px] uppercase tracking-[0.08em]" style={{ color: 'var(--tf-text-3)' }}>
                  Description
                </span>
                <textarea
                  rows={3}
                  className="tf-input"
                  value={createForm.description}
                  onChange={(event) => setCreateForm((state) => ({ ...state, description: event.target.value }))}
                />
              </label>
              <div className="flex gap-2 pt-2">
                <button type="button" className="tf-secondary-btn flex-1" onClick={() => setCreateOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="tf-primary-btn flex-[1.4]" disabled={createTeam.isPending}>
                  {createTeam.isPending ? 'Creating…' : 'Create team'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  )
}
