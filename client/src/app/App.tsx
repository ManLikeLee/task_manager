import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthPage } from '@/features/auth/AuthPage'
import { useAuthBootstrap } from '@/features/auth/hooks'
import { useAuthStore } from '@/features/auth/store'
import { OnboardingPage } from '@/features/workspaces/OnboardingPage'
import { useWorkspaces } from '@/features/workspaces/hooks'
import { AppShell } from '@/layouts/AppShell'

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
  const needsOnboarding = Boolean(user) && !workspaces.isLoading && !workspaces.isError && (workspaces.data?.length || 0) === 0

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
