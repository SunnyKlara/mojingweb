import { randomUUID } from 'node:crypto'
import jwt, { type SignOptions } from 'jsonwebtoken'
import { env } from '../config/env'
import type { AccessTokenPayload, RefreshTokenPayload, VisitorSessionPayload } from '@mojing/shared'

type AccessClaims = Omit<AccessTokenPayload, 'iat' | 'exp'>
type RefreshClaims = Omit<RefreshTokenPayload, 'iat' | 'exp'>

export function signAccessToken(claims: AccessClaims): string {
  return jwt.sign(claims, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_TTL,
  } as SignOptions)
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload
}

export function signRefreshToken(
  sub: string,
  jti: string = randomUUID(),
): {
  token: string
  jti: string
} {
  const claims: RefreshClaims = { sub, jti }
  const token = jwt.sign(claims, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_TTL,
  } as SignOptions)
  return { token, jti }
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as RefreshTokenPayload
}

export function signVisitorSession(sessionId: string): string {
  const claims: Omit<VisitorSessionPayload, 'iat' | 'exp'> = { sessionId }
  return jwt.sign(claims, env.JWT_ACCESS_SECRET, { expiresIn: '30d' } as SignOptions)
}

export function verifyVisitorSession(token: string): VisitorSessionPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as VisitorSessionPayload
}
