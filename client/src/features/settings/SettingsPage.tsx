import { useMemo, useState } from 'react'
import { Check, Copy, Plus } from 'lucide-react'
import { useToast } from '@/components/ui/toast'
import { useAuthStore } from '@/features/auth/store'
import { useTaskUiStore } from '@/features/tasks/store'
import {
  useCreateWorkspace,
  useCreateWorkspaceInvite,
  useJoinWorkspace,
  useWorkspaceInvites,
  useWorkspaces,
} from '@/features/workspaces/hooks'

export const SettingsPage = () => {
  const user = useAuthStore((state) => state.user)
  const { notify } = useToast()

  const activeWorkspaceId = useTaskUiStore((state) => state.activeWorkspaceId)
  const setActiveWorkspaceId = useTaskUiStore((state) => state.setActiveWorkspaceId)
  const setSelectedProjectId = useTaskUiStore((state) => state.setSelectedProjectId)
  const setSelectedTaskId = useTaskUiStore((state) => state.setSelectedTaskId)

  const workspaces = useWorkspaces()
  const createWorkspace = useCreateWorkspace()
  const joinWorkspace = useJoinWorkspace()
  const workspaceInvites = useWorkspaceInvites(activeWorkspaceId || '')
  const createInvite = useCreateWorkspaceInvite(activeWorkspaceId || '')

  const [copied, setCopied] = useState(false)
  const [createForm, setCreateForm] = useState({ name: '', description: '' })
  const [joinCode, setJoinCode] = useState('')
  const [expiresInDays, setExpiresInDays] = useState('')
  const [inviteRole, setInviteRole] = useState<'ADMIN' | 'MEMBER'>('MEMBER')

  const activeWorkspace =
    workspaces.data?.find((workspace) => workspace.id === activeWorkspaceId) ||
    workspaces.data?.[0] ||
    null

  const sortedInvites = useMemo(
    () => [...(workspaceInvites.data || [])].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)),
    [workspaceInvites.data],
  )

  return (
    <section className="min-h-0 flex-1 overflow-y-auto px-4 py-6 lg:px-7">
      <div className="mx-auto max-w-4xl space-y-4">
        <header>
          <h2 className="text-[28px]" style={{ fontFamily: 'var(--font-display)' }}>
            Settings
          </h2>
          <p className="mt-1 text-sm" style={{ color: 'var(--tf-text-2)' }}>
            Manage your account and workspace access in TaskForce.
          </p>
        </header>

        <div className="grid gap-4 xl:grid-cols-2">
          <div className="rounded-xl border p-4" style={{ borderColor: 'var(--tf-border)', background: 'var(--tf-bg-3)' }}>
            <p className="mb-3 text-[11px] uppercase tracking-[0.08em]" style={{ color: 'var(--tf-text-3)' }}>
              Account
            </p>
            <div className="space-y-2">
              <div>
                <p className="text-[11px] uppercase tracking-[0.08em]" style={{ color: 'var(--tf-text-3)' }}>
                  Name
                </p>
                <p className="text-sm" style={{ color: 'var(--tf-text)' }}>
                  {user?.name || 'Unknown user'}
                </p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.08em]" style={{ color: 'var(--tf-text-3)' }}>
                  Username
                </p>
                <p className="text-sm" style={{ color: 'var(--tf-text)' }}>
                  {user?.username ? `@${user.username}` : 'No username'}
                </p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.08em]" style={{ color: 'var(--tf-text-3)' }}>
                  Email
                </p>
                <p className="text-sm" style={{ color: 'var(--tf-text)' }}>
                  {user?.email || 'No email'}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border p-4" style={{ borderColor: 'var(--tf-border)', background: 'var(--tf-bg-3)' }}>
            <p className="mb-3 text-[11px] uppercase tracking-[0.08em]" style={{ color: 'var(--tf-text-3)' }}>
              Active workspace
            </p>
            <div className="space-y-2">
              <select
                value={activeWorkspace?.id || ''}
                className="tf-input tf-settings-select"
                onChange={(event) => {
                  setActiveWorkspaceId(event.target.value)
                  setSelectedProjectId('')
                  setSelectedTaskId(null)
                  notify('Workspace switched.', 'success')
                }}
              >
                {(workspaces.data || []).map((workspace) => (
                  <option key={workspace.id} value={workspace.id}>
                    {workspace.name}
                  </option>
                ))}
              </select>
              {activeWorkspace?.joinCode ? (
                <button
                  type="button"
                  className="tf-settings-code-btn"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(activeWorkspace.joinCode || '')
                      setCopied(true)
                      notify('Workspace code copied', 'success')
                      setTimeout(() => setCopied(false), 1000)
                    } catch {
                      notify('Failed to copy workspace code.', 'error')
                    }
                  }}
                >
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {activeWorkspace.joinCode}
                </button>
              ) : (
                <p className="text-xs" style={{ color: 'var(--tf-text-3)' }}>
                  Workspace code unavailable.
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <div className="rounded-xl border p-4" style={{ borderColor: 'var(--tf-border)', background: 'var(--tf-bg-3)' }}>
            <p className="mb-3 text-[11px] uppercase tracking-[0.08em]" style={{ color: 'var(--tf-text-3)' }}>
              Create workspace
            </p>
            <form
              className="space-y-2"
              onSubmit={async (event) => {
                event.preventDefault()
                if (!createForm.name.trim()) return

                try {
                  const response = await createWorkspace.mutateAsync({
                    name: createForm.name.trim(),
                    description: createForm.description.trim() || null,
                  })
                  setCreateForm({ name: '', description: '' })
                  setActiveWorkspaceId(response.workspace.id)
                  setSelectedProjectId('')
                  setSelectedTaskId(null)
                  notify(`Workspace "${response.workspace.name}" created.`, 'success')
                } catch (error) {
                  notify(error instanceof Error ? error.message : 'Failed to create workspace.', 'error')
                }
              }}
            >
              <input
                className="tf-input"
                value={createForm.name}
                onChange={(event) => setCreateForm((state) => ({ ...state, name: event.target.value }))}
                placeholder="Workspace name"
                maxLength={120}
                required
              />
              <input
                className="tf-input"
                value={createForm.description}
                onChange={(event) => setCreateForm((state) => ({ ...state, description: event.target.value }))}
                placeholder="Description (optional)"
                maxLength={240}
              />
              <button type="submit" className="tf-primary-btn w-full" disabled={createWorkspace.isPending}>
                <Plus className="mr-1 h-3.5 w-3.5" />
                {createWorkspace.isPending ? 'Creating...' : 'Create workspace'}
              </button>
            </form>
          </div>

          <div className="rounded-xl border p-4" style={{ borderColor: 'var(--tf-border)', background: 'var(--tf-bg-3)' }}>
            <p className="mb-3 text-[11px] uppercase tracking-[0.08em]" style={{ color: 'var(--tf-text-3)' }}>
              Join workspace
            </p>
            <form
              className="space-y-2"
              onSubmit={async (event) => {
                event.preventDefault()
                if (!joinCode.trim()) return

                try {
                  const response = await joinWorkspace.mutateAsync(joinCode.trim())
                  setJoinCode('')
                  setActiveWorkspaceId(response.workspace.id)
                  setSelectedProjectId('')
                  setSelectedTaskId(null)
                  notify(response.alreadyMember ? 'You are already in this workspace.' : 'Joined workspace.', 'success')
                } catch (error) {
                  notify(error instanceof Error ? error.message : 'Failed to join workspace.', 'error')
                }
              }}
            >
              <input
                className="tf-input"
                value={joinCode}
                onChange={(event) => setJoinCode(event.target.value.toUpperCase())}
                placeholder="e.g. TF-8K29Q"
                maxLength={64}
                required
              />
              <button type="submit" className="tf-secondary-btn w-full" disabled={joinWorkspace.isPending}>
                {joinWorkspace.isPending ? 'Joining...' : 'Join with code'}
              </button>
            </form>
          </div>
        </div>

        <div className="rounded-xl border p-4" style={{ borderColor: 'var(--tf-border)', background: 'var(--tf-bg-3)' }}>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[11px] uppercase tracking-[0.08em]" style={{ color: 'var(--tf-text-3)' }}>
              Workspace invites
            </p>
            <span className="text-[11px]" style={{ color: 'var(--tf-text-3)' }}>
              {activeWorkspace?.name || 'No workspace'}
            </span>
          </div>
          {!activeWorkspaceId ? (
            <p className="text-xs" style={{ color: 'var(--tf-text-3)' }}>
              Select a workspace to manage invites.
            </p>
          ) : (
            <>
              <form
                className="mb-3 grid gap-2 md:grid-cols-[1fr_1fr_auto]"
                onSubmit={async (event) => {
                  event.preventDefault()
                  try {
                    const expiresAt =
                      expiresInDays.trim() && Number(expiresInDays) > 0
                        ? new Date(Date.now() + Number(expiresInDays) * 24 * 60 * 60 * 1000).toISOString()
                        : undefined

                    await createInvite.mutateAsync({
                      roleToAssign: inviteRole,
                      expiresAt,
                    })
                    setExpiresInDays('')
                    notify('Invite code created.', 'success')
                  } catch (error) {
                    notify(error instanceof Error ? error.message : 'Failed to create invite.', 'error')
                  }
                }}
              >
                <select
                  value={inviteRole}
                  onChange={(event) => setInviteRole(event.target.value as 'ADMIN' | 'MEMBER')}
                  className="tf-input tf-settings-select"
                >
                  <option value="MEMBER">Member invite</option>
                  <option value="ADMIN">Admin invite</option>
                </select>
                <input
                  className="tf-input"
                  type="number"
                  min={1}
                  max={365}
                  value={expiresInDays}
                  onChange={(event) => setExpiresInDays(event.target.value)}
                  placeholder="Expiry days (optional)"
                />
                <button type="submit" className="tf-secondary-btn" disabled={createInvite.isPending}>
                  {createInvite.isPending ? 'Generating...' : 'Generate'}
                </button>
              </form>

              <div className="space-y-2">
                {workspaceInvites.isLoading ? (
                  <p className="text-xs" style={{ color: 'var(--tf-text-3)' }}>
                    Loading invites…
                  </p>
                ) : sortedInvites.length ? (
                  sortedInvites.map((invite) => (
                    <div
                      key={invite.id}
                      className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2"
                      style={{ borderColor: 'var(--tf-border)', background: 'var(--tf-bg-2)' }}
                    >
                      <div className="min-w-0">
                        <p className="text-sm" style={{ color: 'var(--tf-text)' }}>
                          {invite.code}
                        </p>
                        <p className="text-[11px]" style={{ color: 'var(--tf-text-3)' }}>
                          {invite.roleToAssign} · created {new Date(invite.createdAt).toLocaleDateString()}
                          {invite.expiresAt ? ` · expires ${new Date(invite.expiresAt).toLocaleDateString()}` : ''}
                        </p>
                      </div>
                      <button
                        type="button"
                        className="tf-settings-copy-btn"
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(invite.code)
                            notify('Invite code copied', 'success')
                          } catch {
                            notify('Failed to copy invite code.', 'error')
                          }
                        }}
                        title="Copy invite code"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-xs" style={{ color: 'var(--tf-text-3)' }}>
                    No invite codes yet.
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  )
}
