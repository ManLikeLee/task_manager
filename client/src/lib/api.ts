import { useAuthStore } from '@/features/auth/store'
import type { ApiErrorPayload, ApiSuccess } from '@/types/api'
import { ApiError } from '@/types/api'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  body?: unknown
  signal?: AbortSignal
  auth?: boolean
}

const parseResponse = async <T>(response: Response): Promise<T> => {
  const text = await response.text()
  let parsed: ApiSuccess<T> | ApiErrorPayload | null = null

  if (text) {
    try {
      parsed = JSON.parse(text) as ApiSuccess<T> | ApiErrorPayload
    } catch {
      throw new ApiError(
        response.ok
          ? 'Server returned a non-JSON response.'
          : (text.includes('<!DOCTYPE') || text.includes('<html')
              ? 'API is unreachable or misconfigured. Please ensure backend server is running.'
              : `Request failed with status ${response.status}`),
        response.status,
      )
    }
  }

  if (!response.ok) {
    const errorPayload = parsed as ApiErrorPayload | null
    throw new ApiError(
      errorPayload?.message || `Request failed with status ${response.status}`,
      response.status,
      errorPayload?.code,
      errorPayload?.errors,
    )
  }

  if (!parsed || !('success' in parsed) || !parsed.success) {
    throw new ApiError('Unexpected server response.', response.status)
  }

  return parsed.data
}

const rawRequest = async <T>(path: string, options: RequestOptions = {}) => {
  const authState = useAuthStore.getState()
  const headers = new Headers({
    'Content-Type': 'application/json',
  })

  if (options.auth !== false && authState.accessToken) {
    headers.set('Authorization', `Bearer ${authState.accessToken}`)
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method || 'GET',
    headers,
    credentials: 'include',
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    signal: options.signal,
  })

  return parseResponse<T>(response)
}

const refreshSession = async () => {
  const data = await rawRequest<{ accessToken: string }>('/api/auth/refresh', {
    method: 'POST',
    auth: false,
  })

  useAuthStore.getState().setAccessToken(data.accessToken)
}

export const apiRequest = async <T>(path: string, options: RequestOptions = {}) => {
  try {
    return await rawRequest<T>(path, options)
  } catch (error) {
    if (error instanceof ApiError && error.status === 401 && options.auth !== false) {
      try {
        await refreshSession()
        return await rawRequest<T>(path, options)
      } catch {
        useAuthStore.getState().logout()
        throw error
      }
    }

    throw error
  }
}
