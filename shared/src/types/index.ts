/**
 * Re-exports of derived types for consumers that only need types, no runtime.
 * Runtime schemas live under `@mojing/shared/schemas`.
 */
export type {
  Message,
  VisitorInfo,
  VisitorMessagePayload,
  AdminMessagePayload,
} from '../schemas/message.schema'
export type { Session } from '../schemas/session.schema'
export type { User, PublicUser } from '../schemas/user.schema'
export type { LoginRequest, LoginResponse, AccessTokenPayload } from '../schemas/auth.schema'
export type { Pagination, ApiError } from '../schemas/common.schema'
