import { VISITOR_SESSION_KEY, type IssueSessionResponse } from '@mojing/shared'
import { api } from './api'

const TOKEN_KEY = `${VISITOR_SESSION_KEY}:token`

interface StoredSession {
  sessionId: string
  sessionToken: string
}

function readStored(): StoredSession | null {
  if (typeof window === 'undefined') return null
  const sessionId = window.localStorage.getItem(VISITOR_SESSION_KEY)
  const sessionToken = window.localStorage.getItem(TOKEN_KEY)
  if (!sessionId || !sessionToken) return null
  return { sessionId, sessionToken }
}

function writeStored(value: StoredSession): void {
  window.localStorage.setItem(VISITOR_SESSION_KEY, value.sessionId)
  window.localStorage.setItem(TOKEN_KEY, value.sessionToken)
}

/**
 * Returns the visitor's signed session, issuing one from the backend on first call.
 * The sessionToken binds sessionId to this browser, preventing spoofing.
 */
export async function ensureVisitorSession(): Promise<StoredSession> {
  const existing = readStored()
  if (existing) return existing
  const issued = await api<IssueSessionResponse>('/api/chat/session', { method: 'POST' })
  const stored: StoredSession = { sessionId: issued.sessionId, sessionToken: issued.sessionToken }
  writeStored(stored)
  return stored
}

export function clearVisitorSession(): void {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(VISITOR_SESSION_KEY)
  window.localStorage.removeItem(TOKEN_KEY)
}
