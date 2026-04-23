import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthPage } from '@/features/auth/AuthPage'
import { useAuthBootstrap } from '@/features/auth/hooks'
import { useAuthStore } from '@/features/auth/store'
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

  if (!hydrated || loading) {
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
          <Route path="/*" element={<AppShell />} />
          <Route path="/auth" element={<Navigate to="/" replace />} />
        </>
      )}
    </Routes>
  )
}
