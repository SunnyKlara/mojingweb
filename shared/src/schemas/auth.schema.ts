import { z } from 'zod'
import { USER_ROLES } from '../constants'
import { PublicUserSchema } from './user.schema'
import { UuidSchema } from './common.schema'

/** Login request. */
export const LoginRequestSchema = z.object({
  username: z.string().trim().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
})
export type LoginRequest = z.infer<typeof LoginRequestSchema>

/** Login response. Refresh token is delivered via httpOnly cookie, not body. */
export const LoginResponseSchema = z.object({
  accessToken: z.string(),
  user: PublicUserSchema,
})
export type LoginResponse = z.infer<typeof LoginResponseSchema>

/** JWT access-token payload (admin users). */
export const AccessTokenPayloadSchema = z.object({
  sub: z.string(),
  username: z.string(),
  role: z.enum(USER_ROLES),
  iat: z.number().optional(),
  exp: z.number().optional(),
})
export type AccessTokenPayload = z.infer<typeof AccessTokenPayloadSchema>

/** JWT refresh-token payload. */
export const RefreshTokenPayloadSchema = z.object({
  sub: z.string(),
  jti: z.string(),
  iat: z.number().optional(),
  exp: z.number().optional(),
})
export type RefreshTokenPayload = z.infer<typeof RefreshTokenPayloadSchema>

/**
 * JWT visitor-session payload.
 * Issued by the backend on first visit; binds a sessionId to this browser.
 * Prevents sessionId spoofing in both REST and Socket.io.
 */
export const VisitorSessionPayloadSchema = z.object({
  sessionId: UuidSchema,
  iat: z.number().optional(),
  exp: z.number().optional(),
})
export type VisitorSessionPayload = z.infer<typeof VisitorSessionPayloadSchema>

/** Response of POST /api/chat/session — issues a signed visitor session. */
export const IssueSessionResponseSchema = z.object({
  sessionId: UuidSchema,
  sessionToken: z.string(),
})
export type IssueSessionResponse = z.infer<typeof IssueSessionResponseSchema>

/** /auth/me — returns current admin profile. */
export const MeResponseSchema = z.object({
  user: PublicUserSchema,
})
export type MeResponse = z.infer<typeof MeResponseSchema>
