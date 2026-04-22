import type { AccessTokenPayload, VisitorSessionPayload } from '@mojing/shared'

/** Per-socket data we attach after authentication. */
export interface SocketData {
  admin?: AccessTokenPayload
  visitor?: VisitorSessionPayload
}
