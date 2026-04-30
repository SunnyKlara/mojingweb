import { randomBytes } from 'node:crypto'
import type { NextFunction, Request, Response } from 'express'
import { env, isProd } from '../config/env'

/**
 * Double-submit cookie CSRF protection.
 *
 * Strategy: On every response we set a `mojing_csrf` cookie (readable by JS,
 * NOT httpOnly). State-changing requests (POST/PUT/PATCH/DELETE) must echo
 * the cookie value back in the `X-CSRF-Token` header. Because a cross-origin
 * attacker cannot read our cookie (SameSite + CORS), they cannot forge the
 * header.
 *
 * This is the OWASP-recommended "Double Submit Cookie" pattern and works well
 * with SPA frontends that already manage their own fetch headers.
 */

const CSRF_COOKIE = 'mojing_csrf'
const CSRF_HEADER = 'x-csrf-token'
const TOKEN_BYTES = 32
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])

/** Set (or refresh) the CSRF cookie on every response. */
export function csrfCookieSetter(_req: Request, res: Response, next: NextFunction): void {
  // Only set if not already present — avoids regenerating on every request.
  const cookies: Record<string, string | undefined> = _req.cookies ?? {}
  const existing = cookies[CSRF_COOKIE]
  if (!existing) {
    const token = randomBytes(TOKEN_BYTES).toString('hex')
    res.cookie(CSRF_COOKIE, token, {
      httpOnly: false, // JS must be able to read it
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      path: '/',
      maxAge: 24 * 60 * 60 * 1000, // 24h
    })
  }
  next()
}

/**
 * Validate CSRF token on state-changing requests.
 * Skips safe methods (GET, HEAD, OPTIONS).
 * Skips requests that use Bearer auth (API-key style, not cookie-based).
 * Disabled in test environment (supertest doesn't use a browser).
 */
export function csrfProtection(req: Request, res: Response, next: NextFunction): void {
  if (env.NODE_ENV === 'test') return next()
  if (SAFE_METHODS.has(req.method)) return next()

  // Requests authenticated via Bearer token (admin API calls) are not
  // vulnerable to CSRF because the token is not auto-attached by the browser.
  // However, the refresh endpoint uses cookies, so it MUST be protected.
  const hasBearer = req.headers.authorization?.startsWith('Bearer ')
  const isRefreshEndpoint = req.path === '/api/auth/refresh'
  if (hasBearer && !isRefreshEndpoint) return next()

  const cookies: Record<string, string | undefined> = req.cookies ?? {}
  const cookieToken = cookies[CSRF_COOKIE]
  const headerToken = req.headers[CSRF_HEADER]

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    res.status(403).json({ error: 'CSRF token mismatch' })
    return
  }
  next()
}
