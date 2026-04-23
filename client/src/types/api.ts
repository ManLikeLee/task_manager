export type ApiSuccess<T> = {
  success: true
  data: T
  message: string
}

export type ApiErrorPayload = {
  success: false
  message: string
  code: string
  errors?: string[]
  requestId?: string
}

export class ApiError extends Error {
  status: number
  code?: string
  details?: string[]

  constructor(message: string, status = 500, code?: string, details?: string[]) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
  }
}
