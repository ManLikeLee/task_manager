export type User = {
  id: string
  name: string
  email: string
  createdAt: string
  updatedAt: string
}

export type LoginPayload = {
  email: string
  password: string
}

export type RegisterPayload = {
  name: string
  email: string
  password: string
}

export type LoginResponse = {
  accessToken: string
  user: User
}
