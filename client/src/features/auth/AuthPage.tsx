import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { SegmentedTabs } from '@/components/ui/tabs'
import { useToast } from '@/components/ui/toast'
import { useLogin, useRegister } from '@/features/auth/hooks'
import { useAuthStore } from '@/features/auth/store'

const authItems = [
  { value: 'login', label: 'Login' },
  { value: 'register', label: 'Register' },
]

export const AuthPage = () => {
  const user = useAuthStore((state) => state.user)
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [form, setForm] = useState({ name: '', username: '', email: '', password: '' })
  const [fieldError, setFieldError] = useState('')
  const login = useLogin()
  const register = useRegister()
  const { notify } = useToast()

  if (user) {
    return <Navigate to="/" replace />
  }

  const onSubmit: React.FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault()

    if (!form.email || !form.password || (mode === 'register' && (!form.name || !form.username))) {
      setFieldError('Please complete all required fields.')
      notify('Please complete all required fields.', 'error')
      return
    }

    if (mode === 'register') {
      const normalizedUsername = form.username.trim().toLowerCase()
      const usernameRegex = /^[a-z0-9_-]{3,30}$/
      if (!usernameRegex.test(normalizedUsername)) {
        const message = 'Username must be 3-30 chars and contain only lowercase letters, numbers, _ or -.'
        setFieldError(message)
        notify(message, 'error')
        return
      }
    }

    setFieldError('')

    try {
      if (mode === 'login') {
        await login.mutateAsync({ email: form.email.trim(), password: form.password })
        notify('Welcome back.', 'success')
      } else {
        await register.mutateAsync({
          name: form.name.trim(),
          username: form.username.trim().toLowerCase(),
          email: form.email.trim(),
          password: form.password,
        })
        notify('Account created. Please log in.', 'success')
        setMode('login')
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Authentication failed.'
      notify(message, 'error')
    }
  }

  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <section className="hidden border-r border-[rgb(var(--border))] bg-[rgb(var(--surface-muted))] p-12 lg:flex lg:flex-col lg:justify-between">
        <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[rgb(var(--text-muted))]">TaskForce</div>
        <div className="space-y-4">
          <h1 className="font-display max-w-lg text-5xl font-semibold leading-[1.05]">Move work with clarity.</h1>
          <p className="max-w-md text-base text-[rgb(var(--text-muted))]">
            A clean workspace for planning projects, managing task flow, and keeping teams aligned without noise.
          </p>
        </div>
        <p className="text-xs text-[rgb(var(--text-muted))]">Express + Prisma API connected</p>
      </section>

      <section className="flex items-center justify-center p-6 lg:p-10">
        <Card className="surface-elevated w-full max-w-md p-7">
          <div className="mb-6 space-y-4">
            <h2 className="font-display text-2xl font-semibold">{mode === 'login' ? 'Sign in' : 'Create account'}</h2>
            <SegmentedTabs items={authItems} value={mode} onChange={(value) => setMode(value as 'login' | 'register')} />
          </div>

          <form className="space-y-4" onSubmit={onSubmit}>
            {mode === 'register' ? (
              <>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Name</label>
                  <Input value={form.name} onChange={(event) => setForm((state) => ({ ...state, name: event.target.value }))} />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Username</label>
                  <Input
                    value={form.username}
                    placeholder="e.g. jordan_hayes"
                    onChange={(event) => setForm((state) => ({ ...state, username: event.target.value }))}
                  />
                </div>
              </>
            ) : null}
            <div className="space-y-1">
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                value={form.email}
                onChange={(event) => setForm((state) => ({ ...state, email: event.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Password</label>
              <Input
                type="password"
                value={form.password}
                onChange={(event) => setForm((state) => ({ ...state, password: event.target.value }))}
              />
              {fieldError ? <p className="text-xs text-rose-600 dark:text-rose-400">{fieldError}</p> : null}
            </div>
            <Button className="w-full" loading={login.isPending || register.isPending}>
              {mode === 'login' ? 'Continue' : 'Create account'}
            </Button>
          </form>
        </Card>
      </section>
    </main>
  )
}
