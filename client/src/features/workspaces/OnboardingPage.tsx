import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/toast'
import { useCreateWorkspace, useJoinWorkspace } from '@/features/workspaces/hooks'

export const OnboardingPage = () => {
  const [workspaceForm, setWorkspaceForm] = useState({ name: '', description: '' })
  const [workspaceCode, setWorkspaceCode] = useState('')
  const [fieldError, setFieldError] = useState('')
  const { notify } = useToast()
  const createWorkspace = useCreateWorkspace()
  const joinWorkspace = useJoinWorkspace()

  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <section className="hidden border-r border-[rgb(var(--border))] bg-[rgb(var(--surface-muted))] p-12 lg:flex lg:flex-col lg:justify-between">
        <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[rgb(var(--text-muted))]">TaskForce</div>
        <div className="space-y-4">
          <h1 className="font-display max-w-lg text-5xl font-semibold leading-[1.05]">Set up your workspace.</h1>
          <p className="max-w-md text-base text-[rgb(var(--text-muted))]">
            Create a new workspace or join an existing one with a workspace code to start collaborating in TaskForce.
          </p>
        </div>
        <p className="text-xs text-[rgb(var(--text-muted))]">Workspace-code onboarding enabled</p>
      </section>

      <section className="flex items-center justify-center p-6 lg:p-10">
        <div className="w-full max-w-xl space-y-4">
          <Card className="surface-elevated p-7">
            <h2 className="mb-4 font-display text-2xl font-semibold">Create workspace</h2>
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
                <Input
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
                  className="tf-input"
                  value={workspaceForm.description}
                  onChange={(event) => setWorkspaceForm((state) => ({ ...state, description: event.target.value }))}
                  placeholder="Who is this workspace for?"
                />
              </label>

              {fieldError ? <p className="text-xs text-rose-600 dark:text-rose-400">{fieldError}</p> : null}

              <Button className="w-full" loading={createWorkspace.isPending}>
                Create workspace
              </Button>
            </form>
          </Card>

          <Card className="surface-elevated p-7">
            <h2 className="mb-4 font-display text-2xl font-semibold">Join with workspace code</h2>
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
                <Input value={workspaceCode} onChange={(event) => setWorkspaceCode(event.target.value.toUpperCase())} placeholder="e.g. TF-8K29Q" />
              </label>

              <Button className="w-full" loading={joinWorkspace.isPending}>
                Join workspace
              </Button>
            </form>
          </Card>
        </div>
      </section>
    </main>
  )
}
