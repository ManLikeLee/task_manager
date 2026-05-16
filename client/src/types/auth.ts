export type User = {
  id: string
  name: string
  username: string
  email: string
  emailVerified: boolean
  emailVerifiedAt: string | null
  createdAt: string
  updatedAt: string
}

export type EmailDelivery = {
  delivered: boolean
  mode: 'provider' | 'dev_console'
  provider?: 'smtp'
  reason?: string
  message?: string
} | null

export type LoginPayload = {
  email: string
  password: string
}

export type RegisterPayload = {
  name: string
  username: string
  email: string
  password: string
}

export type LoginResponse = {
  accessToken?: string
  user: User
  requiresEmailVerification?: boolean
  email?: string
  emailDelivery?: EmailDelivery
  devMode?: boolean
}

export type VerifyEmailPayload = {
  email: string
  code: string
}
