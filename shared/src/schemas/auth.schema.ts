import { z } from 'zod'
import { USER_ROLES } from '../constants'
import { PublicUserSchema } from './user.schema'

/** Login request. */
export const LoginRequestSchema = z.object({
  username: z.string().trim().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
})
export type LoginRequest = z.infer<typeof LoginRequestSchema>

/** Login response. */
export const LoginResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string().optional(),
  user: PublicUserSchema,
})
export type LoginResponse = z.infer<typeof LoginResponseSchema>

/** JWT access-token payload. */
export const AccessTokenPayloadSchema = z.object({
  sub: z.string(), // user id
  username: z.string(),
  role: z.enum(USER_ROLES),
  iat: z.number().optional(),
  exp: z.number().optional(),
})
export type AccessTokenPayload = z.infer<typeof AccessTokenPayloadSchema>
