import { useEffect, useState } from 'react'
import { X } from 'lucide-react'

export const CreateProjectModal = ({
  open,
  onClose,
  onCreate,
  workspaces = [],
  teams = [],
  defaultWorkspaceId = '',
}: {
  open: boolean
  onClose: () => void
  onCreate: (payload: { name: string; description: string | null; workspaceId?: string; teamId?: string | null }) => Promise<void>
  workspaces?: Array<{ id: string; name: string }>
  teams?: Array<{ id: string; name: string; workspaceId: string }>
  defaultWorkspaceId?: string
}) => {
  const [form, setForm] = useState({ name: '', description: '', workspaceId: defaultWorkspaceId, teamId: '' })
  const [loading, setLoading] = useState(false)
  const [fieldError, setFieldError] = useState('')

  const filteredTeams = teams.filter((team) => team.workspaceId === form.workspaceId)

  useEffect(() => {
    if (!open) return
    setForm((current) => ({ ...current, workspaceId: current.workspaceId || defaultWorkspaceId }))
  }, [defaultWorkspaceId, open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="w-full max-w-[380px] rounded-2xl border p-6" style={{ background: 'var(--tf-bg-3)', borderColor: 'var(--tf-border-2)' }}>
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-[28px]" style={{ fontFamily: 'var(--font-display)' }}>
            New project
          </h2>
          <button type="button" className="tf-ghost-btn" onClick={onClose} aria-label="Close modal">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form
          className="space-y-3"
          onSubmit={async (event) => {
            event.preventDefault()

            if (!form.name.trim()) {
              setFieldError('Project name is required.')
              return
            }

            setFieldError('')
            setLoading(true)
            try {
              await onCreate({
                name: form.name.trim(),
                description: form.description.trim() || null,
                workspaceId: form.workspaceId || undefined,
                teamId: form.teamId || null,
              })
              setForm({ name: '', description: '', workspaceId: defaultWorkspaceId, teamId: '' })
              onClose()
            } finally {
              setLoading(false)
            }
          }}
        >
          <label className="block space-y-1.5">
            <span className="text-[11px] uppercase tracking-[0.08em]" style={{ color: 'var(--tf-text-3)' }}>
              Title
            </span>
            <input
              value={form.name}
              onChange={(event) => setForm((state) => ({ ...state, name: event.target.value }))}
              className="tf-input"
            />
            {fieldError ? <p className="text-xs" style={{ color: 'var(--tf-rose)' }}>{fieldError}</p> : null}
          </label>

          <div className="grid grid-cols-2 gap-2.5">
            <label className="block space-y-1.5">
              <span className="text-[11px] uppercase tracking-[0.08em]" style={{ color: 'var(--tf-text-3)' }}>
                Workspace
              </span>
              <select
                className="tf-input"
                value={form.workspaceId}
                onChange={(event) => setForm((state) => ({ ...state, workspaceId: event.target.value, teamId: '' }))}
              >
                <option value="">Select workspace</option>
                {workspaces.map((workspace) => (
                  <option key={workspace.id} value={workspace.id}>
                    {workspace.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block space-y-1.5">
              <span className="text-[11px] uppercase tracking-[0.08em]" style={{ color: 'var(--tf-text-3)' }}>
                Team (optional)
              </span>
              <select
                className="tf-input"
                value={form.teamId}
                onChange={(event) => setForm((state) => ({ ...state, teamId: event.target.value }))}
                disabled={!form.workspaceId}
              >
                <option value="">No team</option>
                {filteredTeams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="block space-y-1.5">
            <span className="text-[11px] uppercase tracking-[0.08em]" style={{ color: 'var(--tf-text-3)' }}>
              Description
            </span>
            <textarea
              rows={3}
              value={form.description}
              onChange={(event) => setForm((state) => ({ ...state, description: event.target.value }))}
              className="tf-input"
            />
          </label>

          <div className="flex gap-2 pt-2">
            <button type="button" className="tf-secondary-btn flex-1" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="tf-primary-btn flex-[1.4]" disabled={loading}>
              {loading ? 'Creating...' : 'Create project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
