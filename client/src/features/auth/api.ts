import { apiRequest } from '@/lib/api'
import type { LoginPayload, LoginResponse, RegisterPayload, User } from '@/types/auth'

export const login = (payload: LoginPayload) =>
  apiRequest<LoginResponse>('/api/auth/login', {
    method: 'POST',
    body: payload,
    auth: false,
  })

export const register = (payload: RegisterPayload) =>
  apiRequest<{ user: User }>('/api/auth/register', {
    method: 'POST',
    body: payload,
    auth: false,
  })

export const getCurrentUser = () => apiRequest<{ user: User }>('/api/auth/me')

export const logout = () =>
  apiRequest<void>('/api/auth/logout', {
    method: 'POST',
  })
