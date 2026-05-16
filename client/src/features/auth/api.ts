import { apiRequest } from '@/lib/api'
import type { EmailDelivery, LoginPayload, LoginResponse, RegisterPayload, User, VerifyEmailPayload } from '@/types/auth'

export const login = (payload: LoginPayload) =>
  apiRequest<LoginResponse>('/api/auth/login', {
    method: 'POST',
    body: payload,
    auth: false,
  })

export const register = (payload: RegisterPayload) =>
  apiRequest<{ user: User; requiresEmailVerification: boolean; email: string; emailDelivery?: EmailDelivery; devMode?: boolean }>('/api/auth/register', {
    method: 'POST',
    body: payload,
    auth: false,
  })

export const verifyEmail = (payload: VerifyEmailPayload) =>
  apiRequest<{ accessToken: string; user: User; verified: boolean }>('/api/auth/verify-email', {
    method: 'POST',
    body: payload,
    auth: false,
  })

export const resendVerificationCode = (payload: { email: string }) =>
  apiRequest<{ sent: boolean; emailDelivery?: EmailDelivery; devMode?: boolean }>('/api/auth/resend-verification-code', {
    method: 'POST',
    body: payload,
    auth: false,
  })

export const getCurrentUser = () => apiRequest<{ user: User }>('/api/auth/me')

export const logout = () =>
  apiRequest<void>('/api/auth/logout', {
    method: 'POST',
  })
