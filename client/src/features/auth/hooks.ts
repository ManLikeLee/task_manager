import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as api from '@/features/auth/api'
import { useAuthStore } from '@/features/auth/store'

export const authKeys = {
  me: ['auth', 'me'] as const,
}

export const useAuthBootstrap = () => {
  const hydrateFromStorage = useAuthStore((state) => state.hydrateFromStorage)
  const hydrated = useAuthStore((state) => state.hydrated)
  const accessToken = useAuthStore((state) => state.accessToken)
  const setUser = useAuthStore((state) => state.setUser)

  useEffect(() => {
    hydrateFromStorage()
  }, [hydrateFromStorage])

  const query = useQuery({
    queryKey: authKeys.me,
    queryFn: api.getCurrentUser,
    enabled: hydrated && Boolean(accessToken),
    retry: false,
  })

  useEffect(() => {
    if (query.data?.user) {
      setUser(query.data.user)
    }
  }, [query.data?.user, setUser])

  return {
    hydrated,
    loading: query.isLoading,
  }
}

export const useLogin = () => {
  const setSession = useAuthStore((state) => state.setSession)
  const setPendingVerificationEmail = useAuthStore((state) => state.setPendingVerificationEmail)
  const setAccessToken = useAuthStore((state) => state.setAccessToken)
  const setUser = useAuthStore((state) => state.setUser)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: api.login,
    onSuccess: (data) => {
      if (data.requiresEmailVerification || !data.accessToken) {
        setAccessToken('')
        setUser(null)
        setPendingVerificationEmail(data.email || data.user.email)
        return
      }
      setSession({ accessToken: data.accessToken, user: data.user })
      queryClient.invalidateQueries()
    },
  })
}

export const useRegister = () => {
  const setPendingVerificationEmail = useAuthStore((state) => state.setPendingVerificationEmail)

  return useMutation({
    mutationFn: api.register,
    onSuccess: (data) => {
      setPendingVerificationEmail(data.email || data.user.email)
    },
  })
}

export const useVerifyEmail = () => {
  const setSession = useAuthStore((state) => state.setSession)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: api.verifyEmail,
    onSuccess: (data) => {
      setSession({ accessToken: data.accessToken, user: data.user })
      queryClient.invalidateQueries()
    },
  })
}

export const useResendVerificationCode = () =>
  useMutation({
    mutationFn: api.resendVerificationCode,
  })

export const useLogout = () => {
  const logout = useAuthStore((state) => state.logout)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: api.logout,
    onSettled: () => {
      logout()
      queryClient.clear()
    },
  })
}
