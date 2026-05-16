import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/toast'
import { useAuthStore } from '@/features/auth/store'
import { useResendVerificationCode, useVerifyEmail } from '@/features/auth/hooks'
import { usePageTitle } from '@/hooks/usePageTitle'

const RESEND_COOLDOWN_SECONDS = 30

export const VerifyEmailPage = () => {
  const navigate = useNavigate()
  const { notify } = useToast()
  const user = useAuthStore((state) => state.user)
  const pendingVerificationEmail = useAuthStore(
    (state) => state.pendingVerificationEmail,
  )
  const clearPendingVerificationEmail = useAuthStore(
    (state) => state.clearPendingVerificationEmail,
  )
  const [email, setEmail] = useState(pendingVerificationEmail)
  const [code, setCode] = useState('')
  const [cooldown, setCooldown] = useState(0)
  const verifyEmail = useVerifyEmail()
  const resendVerificationCode = useResendVerificationCode()
  usePageTitle('Verify Email')

  useEffect(() => {
    setEmail(pendingVerificationEmail)
  }, [pendingVerificationEmail])

  useEffect(() => {
    if (!cooldown) return
    const timeout = window.setTimeout(() => setCooldown((current) => Math.max(0, current - 1)), 1000)
    return () => window.clearTimeout(timeout)
  }, [cooldown])

  if (user?.emailVerified) {
    return <Navigate to="/" replace />
  }

  if (!pendingVerificationEmail && !email) {
    return <Navigate to="/auth" replace />
  }

  const normalizedCode = code.replace(/\D/g, '').slice(0, 6)

  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <section className="hidden border-r border-[rgb(var(--border))] bg-[rgb(var(--surface-muted))] p-12 lg:flex lg:flex-col lg:justify-between">
        <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[rgb(var(--text-muted))]">TaskForce</div>
        <div className="space-y-4">
          <h1 className="font-display max-w-lg text-5xl font-semibold leading-[1.05]">Verify your email.</h1>
          <p className="max-w-md text-base text-[rgb(var(--text-muted))]">
            Enter the 6-digit code we sent to continue into your workspace.
          </p>
        </div>
        <p className="text-xs text-[rgb(var(--text-muted))]">Security step required</p>
      </section>

      <section className="flex items-center justify-center p-6 lg:p-10">
        <Card className="surface-elevated w-full max-w-md p-7">
          <div className="mb-6 space-y-2">
            <h2 className="font-display text-2xl font-semibold">Email verification</h2>
            <p className="text-sm" style={{ color: 'var(--tf-text-2)' }}>
              We sent a verification code to your email.
            </p>
          </div>

          <form
            className="space-y-4"
            onSubmit={async (event) => {
              event.preventDefault()

              if (!email.trim()) {
                notify('Email is required.', 'error')
                return
              }
              if (normalizedCode.length !== 6) {
                notify('Enter the 6-digit verification code.', 'error')
                return
              }

              try {
                await verifyEmail.mutateAsync({ email: email.trim().toLowerCase(), code: normalizedCode })
                clearPendingVerificationEmail()
                notify('Email verified successfully.', 'success')
                navigate('/', { replace: true })
              } catch (error) {
                notify(error instanceof Error ? error.message : 'Verification failed.', 'error')
              }
            }}
          >
            <div className="space-y-1">
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Verification code</label>
              <Input
                inputMode="numeric"
                value={normalizedCode}
                onChange={(event) => setCode(event.target.value)}
                placeholder="123456"
                maxLength={6}
              />
            </div>

            <Button className="w-full" loading={verifyEmail.isPending}>
              Verify email
            </Button>
          </form>

          <div className="mt-3 flex items-center justify-between gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={cooldown > 0 || resendVerificationCode.isPending}
              onClick={async () => {
                try {
                  const response = await resendVerificationCode.mutateAsync({ email: email.trim().toLowerCase() })
                  setCooldown(RESEND_COOLDOWN_SECONDS)
                  if (response.emailDelivery?.mode === 'dev_console') {
                    notify('Email not configured. Verification code logged in server console.', 'success')
                  } else {
                    notify('If your email is eligible, a new code has been sent.', 'success')
                  }
                } catch (error) {
                  notify(error instanceof Error ? error.message : 'Could not resend code.', 'error')
                }
              }}
            >
              {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
            </Button>

            <Link
              to="/auth"
              className="text-xs"
              style={{ color: 'var(--tf-text-2)' }}
              onClick={() => {
                clearPendingVerificationEmail()
              }}
            >
              Back to login
            </Link>
          </div>
        </Card>
      </section>
    </main>
  )
}
