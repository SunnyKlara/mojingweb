/**
 * Thin fetch wrapper with automatic access-token refresh.
 * Access token is held in memory; refresh token lives in httpOnly cookie.
 */
import { ADMIN_TOKEN_KEY } from '@mojing/shared'

export const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000'

let accessToken: string | null = null
let refreshPromise: Promise<string | null> | null = null

function readInitialToken(): string | null {
  if (typeof window === 'undefined') return null
  return window.localStorage.getItem(ADMIN_TOKEN_KEY)
}

export function getAccessToken(): string | null {
  if (accessToken) return accessToken
  accessToken = readInitialToken()
  return accessToken
}

export function setAccessToken(token: string | null): void {
  accessToken = token
  if (typeof window === 'undefined') return
  if (token) window.localStorage.setItem(ADMIN_TOKEN_KEY, token)
  else window.localStorage.removeItem(ADMIN_TOKEN_KEY)
}

async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise
  refreshPromise = (async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      })
      if (!res.ok) return null
      const data = (await res.json()) as { accessToken: string }
      setAccessToken(data.accessToken)
      return data.accessToken
    } catch {
      return null
    } finally {
      refreshPromise = null
    }
  })()
  return refreshPromise
}

export interface ApiOptions extends RequestInit {
  auth?: boolean
  sessionToken?: string
}

/**
 * Fetch against the backend. When `auth: true`, automatically attaches the
 * admin access token, transparently refreshes on 401, and retries once.
 */
export async function api<T = unknown>(path: string, options: ApiOptions = {}): Promise<T> {
  const { auth, sessionToken, headers, ...rest } = options
  const makeHeaders = (token?: string | null): HeadersInit => {
    const h = new Headers(headers)
    if (auth && token) h.set('Authorization', `Bearer ${token}`)
    if (sessionToken) h.set('X-Session-Token', sessionToken)
    if (rest.body && !h.has('Content-Type')) h.set('Content-Type', 'application/json')
    return h
  }

  const doFetch = (token?: string | null) =>
    fetch(`${BACKEND_URL}${path}`, {
      ...rest,
      headers: makeHeaders(token),
      credentials: 'include',
    })

  let res = await doFetch(auth ? getAccessToken() : undefined)
  if (auth && res.status === 401) {
    const newToken = await refreshAccessToken()
    if (newToken) res = await doFetch(newToken)
  }

  if (!res.ok) {
    let errorBody: unknown
    try {
      errorBody = await res.json()
    } catch {
      errorBody = { error: res.statusText }
    }
    const message =
      typeof errorBody === 'object' && errorBody && 'error' in errorBody
        ? String((errorBody as { error: unknown }).error)
        : 'Request failed'
    throw new Error(message)
  }

  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}
