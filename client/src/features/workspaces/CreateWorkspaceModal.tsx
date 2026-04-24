import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'

export const CreateWorkspaceModal = ({
  open,
  onClose,
  onCreate,
}: {
  open: boolean
  onClose: () => void
  onCreate: (payload: { name: string; description?: string | null }) => Promise<void>
}) => {
  const [form, setForm] = useState({ name: '', description: '' })
  const [saving, setSaving] = useState(false)

  return (
    <Modal open={open} onClose={onClose} title="Create workspace">
      <form
        className="space-y-3"
        onSubmit={async (event) => {
          event.preventDefault()
          if (!form.name.trim()) return

          setSaving(true)
          try {
            await onCreate({
              name: form.name.trim(),
              description: form.description.trim() || null,
            })
            setForm({ name: '', description: '' })
            onClose()
          } finally {
            setSaving(false)
          }
        }}
      >
        <label className="block space-y-1.5">
          <span className="text-[11px] uppercase tracking-[0.08em]" style={{ color: 'var(--tf-text-3)' }}>
            Workspace name
          </span>
          <Input
            value={form.name}
            maxLength={120}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            placeholder="e.g. Product Studio"
            required
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-[11px] uppercase tracking-[0.08em]" style={{ color: 'var(--tf-text-3)' }}>
            Description (optional)
          </span>
          <Input
            value={form.description}
            maxLength={240}
            onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
            placeholder="Short context for this workspace"
          />
        </label>
        <div className="flex items-center justify-end gap-2 pt-1">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            Create workspace
          </Button>
        </div>
      </form>
    </Modal>
  )
}
