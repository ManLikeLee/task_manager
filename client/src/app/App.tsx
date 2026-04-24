import { useEffect, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthPage } from '@/features/auth/AuthPage'
import { useAuthBootstrap } from '@/features/auth/hooks'
import { useAuthStore } from '@/features/auth/store'
import { OnboardingPage } from '@/features/workspaces/OnboardingPage'
import { useWorkspaces } from '@/features/workspaces/hooks'
import {
  clearWorkspaceOnboardingSkipped,
  hasSkippedWorkspaceOnboarding,
  onboardingSkipEventName,
} from '@/features/workspaces/onboardingSkip'
import { AppShell } from '@/layouts/AppShell'
import { usePageTitle } from '@/hooks/usePageTitle'

const FullscreenLoader = () => (
  <main className="flex min-h-screen items-center justify-center bg-[rgb(var(--bg))]">
    <div className="rounded-lg border bg-[rgb(var(--surface))] px-5 py-3 text-sm text-[rgb(var(--text-muted))]">
      Loading workspace...
    </div>
  </main>
)

export const App = () => {
  const { hydrated, loading } = useAuthBootstrap()
  const user = useAuthStore((state) => state.user)
  const workspaces = useWorkspaces(Boolean(user))
  const workspaceCount = workspaces.data?.length || 0
  const [skippedOnboarding, setSkippedOnboarding] = useState(() =>
    hasSkippedWorkspaceOnboarding(user?.id),
  )
  const needsOnboarding =
    Boolean(user) &&
    !workspaces.isLoading &&
    !workspaces.isError &&
    workspaceCount === 0 &&
    !skippedOnboarding
  const appTitle = !hydrated || loading || (Boolean(user) && workspaces.isLoading)
    ? user
      ? 'Loading Workspace'
      : null
    : !user
      ? 'Login'
      : needsOnboarding
        ? 'Create Workspace'
        : null
  usePageTitle(appTitle)

  useEffect(() => {
    setSkippedOnboarding(hasSkippedWorkspaceOnboarding(user?.id))
  }, [user?.id])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const syncSkipState = () => setSkippedOnboarding(hasSkippedWorkspaceOnboarding(user?.id))
    window.addEventListener(onboardingSkipEventName, syncSkipState)
    window.addEventListener('storage', syncSkipState)
    return () => {
      window.removeEventListener(onboardingSkipEventName, syncSkipState)
      window.removeEventListener('storage', syncSkipState)
    }
  }, [user?.id])

  useEffect(() => {
    if (user?.id && workspaceCount > 0) {
      clearWorkspaceOnboardingSkipped(user.id)
      setSkippedOnboarding(false)
    }
  }, [user?.id, workspaceCount])

  if (!hydrated || loading || (Boolean(user) && workspaces.isLoading)) {
    return <FullscreenLoader />
  }

  return (
    <Routes>
      {!user ? (
        <>
          <Route path="/auth" element={<AuthPage />} />
          <Route path="*" element={<Navigate to="/auth" replace />} />
        </>
      ) : (
        <>
          {needsOnboarding ? (
            <>
              <Route path="/onboarding" element={<OnboardingPage />} />
              <Route path="*" element={<Navigate to="/onboarding" replace />} />
            </>
          ) : (
            <>
              <Route path="/*" element={<AppShell />} />
              <Route path="/onboarding" element={<Navigate to="/" replace />} />
            </>
          )}
          <Route path="/auth" element={<Navigate to="/" replace />} />
        </>
      )}
    </Routes>
  )
}
