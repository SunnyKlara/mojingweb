import type { Server as IOServer, Socket, DefaultEventsMap } from 'socket.io'
import jwt from 'jsonwebtoken'
import { env } from '../config/env'
import { logger } from '../config/logger'
import { MessageModel } from '../models/Message.model'
import { notifyNewMessage } from '../services/mailer.service'
import {
  SOCKET_EVENTS,
  VisitorMessagePayloadSchema,
  AdminMessagePayloadSchema,
  UuidSchema,
  type AccessTokenPayload,
} from '@mojing/shared'
import type { SocketData } from './types'

const ADMIN_ROOM = 'admin_room'

type AppSocket = Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, SocketData>

async function handleVisitorMessage(io: IOServer, data: unknown): Promise<void> {
  const parsed = VisitorMessagePayloadSchema.safeParse(data)
  if (!parsed.success) return
  const { sessionId, content, visitorInfo } = parsed.data
  try {
    const msg = await MessageModel.create({ sessionId, sender: 'visitor', content, visitorInfo })
    io.to(ADMIN_ROOM).emit(SOCKET_EVENTS.NEW_MESSAGE, msg)
    io.to(sessionId).emit(SOCKET_EVENTS.MESSAGE, msg)
    await notifyNewMessage({ sessionId, content, visitorInfo })
  } catch (err) {
    logger.error({ err }, 'visitor_message failed')
  }
}

async function handleAdminMessage(io: IOServer, socket: AppSocket, data: unknown): Promise<void> {
  if (!socket.data.admin) return
  const parsed = AdminMessagePayloadSchema.safeParse(data)
  if (!parsed.success) return
  const { sessionId, content } = parsed.data
  try {
    const msg = await MessageModel.create({ sessionId, sender: 'admin', content })
    io.to(sessionId).emit(SOCKET_EVENTS.MESSAGE, msg)
    io.to(ADMIN_ROOM).emit(SOCKET_EVENTS.NEW_MESSAGE, msg)
  } catch (err) {
    logger.error({ err }, 'admin_message failed')
  }
}

export function registerSocketHandlers(io: IOServer): void {
  io.on('connection', (socket: AppSocket) => {
    logger.debug({ id: socket.id }, 'socket connected')

    socket.on(SOCKET_EVENTS.VISITOR_JOIN, (sessionId: unknown) => {
      const parsed = UuidSchema.safeParse(sessionId)
      if (!parsed.success) return
      void socket.join(parsed.data)
    })

    socket.on(SOCKET_EVENTS.ADMIN_JOIN, (token: unknown) => {
      if (typeof token !== 'string') return
      try {
        const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload
        socket.data.admin = payload
        void socket.join(ADMIN_ROOM)
      } catch {
        socket.emit(SOCKET_EVENTS.AUTH_ERROR, 'Invalid token')
      }
    })

    socket.on(SOCKET_EVENTS.VISITOR_MESSAGE, (data: unknown) => {
      void handleVisitorMessage(io, data)
    })

    socket.on(SOCKET_EVENTS.ADMIN_MESSAGE, (data: unknown) => {
      void handleAdminMessage(io, socket, data)
    })

    socket.on('disconnect', () => {
      logger.debug({ id: socket.id }, 'socket disconnected')
    })
  })
}
