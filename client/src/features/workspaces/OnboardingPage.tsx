import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '@/components/ui/toast'
import { useAuthStore } from '@/features/auth/store'
import { useCreateWorkspace, useJoinWorkspace } from '@/features/workspaces/hooks'
import { markWorkspaceOnboardingSkipped } from '@/features/workspaces/onboardingSkip'
import { usePageTitle } from '@/hooks/usePageTitle'

export const OnboardingPage = () => {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const [workspaceForm, setWorkspaceForm] = useState({ name: '', description: '' })
  const [workspaceCode, setWorkspaceCode] = useState('')
  const [fieldError, setFieldError] = useState('')
  const { notify } = useToast()
  const createWorkspace = useCreateWorkspace()
  const joinWorkspace = useJoinWorkspace()
  usePageTitle('Create Workspace')

  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <section
        className="hidden p-12 lg:flex lg:flex-col lg:justify-between"
        style={{ borderRight: '1px solid var(--tf-border)', background: 'var(--tf-bg-2)' }}
      >
        <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[rgb(var(--text-muted))]">TaskForce</div>
        <div className="space-y-4">
          <h1 className="font-display max-w-lg text-[52px] font-light leading-[1.05] tracking-[0.01em]">Set up your workspace.</h1>
          <p className="max-w-md text-base font-ui text-[rgb(var(--text-muted))]">
            Create a new workspace or join an existing one with a workspace code to start collaborating in TaskForce.
          </p>
        </div>
        <p className="text-xs font-ui text-[rgb(var(--text-muted))]">Workspace-code onboarding enabled</p>
      </section>

      <section className="flex items-center justify-center p-6 lg:p-10">
        <div className="w-full max-w-xl space-y-4">
          <div className="rounded-xl border p-5" style={{ borderColor: 'var(--tf-border)', background: 'var(--tf-bg-3)' }}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-[26px] font-light leading-[1.2]">Skip workspace setup</h2>
                <p className="mt-1 text-xs font-ui" style={{ color: 'var(--tf-text-2)' }}>
                  You can create or join a workspace later from sidebar or settings.
                </p>
              </div>
              <button
                type="button"
                className="tf-secondary-btn px-4"
                onClick={() => {
                  markWorkspaceOnboardingSkipped(user?.id)
                  notify('You can set up your workspace later.', 'success')
                  navigate('/', { replace: true })
                }}
              >
                Skip for now
              </button>
            </div>
          </div>

          <div className="rounded-xl border p-7" style={{ borderColor: 'var(--tf-border)', background: 'var(--tf-bg-3)' }}>
            <h2 className="mb-4 font-display text-[30px] font-light leading-[1.2]">Create workspace</h2>
            <form
              className="space-y-3"
              onSubmit={async (event) => {
                event.preventDefault()
                if (!workspaceForm.name.trim()) {
                  const message = 'Workspace name is required.'
                  setFieldError(message)
                  notify(message, 'error')
                  return
                }

                setFieldError('')
                try {
                  await createWorkspace.mutateAsync({
                    name: workspaceForm.name.trim(),
                    description: workspaceForm.description.trim() || null,
                  })
                  notify('Workspace created.', 'success')
                } catch (error) {
                  notify(error instanceof Error ? error.message : 'Failed to create workspace.', 'error')
                }
              }}
            >
              <label className="block space-y-1.5">
                <span className="text-[11px] uppercase tracking-[0.08em]" style={{ color: 'var(--tf-text-3)' }}>
                  Workspace name
                </span>
                <input
                  className="tf-input"
                  value={workspaceForm.name}
                  onChange={(event) => setWorkspaceForm((state) => ({ ...state, name: event.target.value }))}
                  placeholder="e.g. Design System"
                />
              </label>

              <label className="block space-y-1.5">
                <span className="text-[11px] uppercase tracking-[0.08em]" style={{ color: 'var(--tf-text-3)' }}>
                  Description (optional)
                </span>
                <textarea
                  rows={3}
                  className="tf-textarea"
                  value={workspaceForm.description}
                  onChange={(event) => setWorkspaceForm((state) => ({ ...state, description: event.target.value }))}
                  placeholder="Who is this workspace for?"
                />
              </label>

              {fieldError ? <p className="text-xs text-rose-600 dark:text-rose-400">{fieldError}</p> : null}

              <button type="submit" className="tf-primary-btn w-full" disabled={createWorkspace.isPending}>
                {createWorkspace.isPending ? 'Creating...' : 'Create workspace'}
              </button>
            </form>
          </div>

          <div className="rounded-xl border p-7" style={{ borderColor: 'var(--tf-border)', background: 'var(--tf-bg-3)' }}>
            <h2 className="mb-4 font-display text-[30px] font-light leading-[1.2]">Join with workspace code</h2>
            <form
              className="space-y-3"
              onSubmit={async (event) => {
                event.preventDefault()
                if (!workspaceCode.trim()) {
                  notify('Workspace code is required.', 'error')
                  return
                }

                try {
                  await joinWorkspace.mutateAsync(workspaceCode.trim())
                  notify('Joined workspace.', 'success')
                } catch (error) {
                  notify(error instanceof Error ? error.message : 'Failed to join workspace.', 'error')
                }
              }}
            >
              <label className="block space-y-1.5">
                <span className="text-[11px] uppercase tracking-[0.08em]" style={{ color: 'var(--tf-text-3)' }}>
                  Workspace code
                </span>
                <input
                  className="tf-input"
                  value={workspaceCode}
                  onChange={(event) => setWorkspaceCode(event.target.value.toUpperCase())}
                  placeholder="e.g. TF-8K29Q"
                />
              </label>

              <button type="submit" className="tf-primary-btn w-full" disabled={joinWorkspace.isPending}>
                {joinWorkspace.isPending ? 'Joining...' : 'Join workspace'}
              </button>
            </form>
          </div>
        </div>
      </section>
    </main>
  )
}
