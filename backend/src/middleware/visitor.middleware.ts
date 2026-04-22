import type { NextFunction, Request, Response } from 'express'
import { verifyVisitorSession } from '../services/token.service'

/**
 * Accepts a visitor session token from either:
 *   - `X-Session-Token` header (preferred for REST)
 *   - `?sessionToken=` query string (fallback for EventSource / links)
 *
 * On success, attaches `req.visitor` with the decoded payload.
 * Does NOT verify that the URL's :sessionId matches the token — the route
 * handler should compare `req.visitor.sessionId` with `req.params.sessionId`.
 */
export function requireVisitorSession(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers['x-session-token']
  const headerToken = Array.isArray(header) ? header[0] : header
  const queryToken = typeof req.query.sessionToken === 'string' ? req.query.sessionToken : undefined
  const token = headerToken ?? queryToken
  if (!token) {
    res.status(401).json({ error: 'Missing visitor session token' })
    return
  }
  try {
    req.visitor = verifyVisitorSession(token)
    next()
  } catch {
    res.status(401).json({ error: 'Invalid visitor session token' })
  }
}
