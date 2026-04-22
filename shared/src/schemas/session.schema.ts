import { z } from 'zod'
import { SESSION_STATUSES } from '../constants'
import { IsoDateSchema, ObjectIdSchema, UuidSchema } from './common.schema'
import { VisitorInfoSchema } from './message.schema'

/** Chat session (aggregates all messages with same sessionId). */
export const SessionSchema = z.object({
  sessionId: UuidSchema,
  status: z.enum(SESSION_STATUSES).default('open'),
  visitorInfo: VisitorInfoSchema.optional(),
  assignedTo: ObjectIdSchema.optional(),
  lastMessage: z.string().optional(),
  lastMessageAt: IsoDateSchema.optional(),
  unreadCount: z.number().int().min(0).default(0),
  tags: z.array(z.string()).default([]),
  source: z
    .object({
      page: z.string().optional(),
      referrer: z.string().optional(),
      utm: z.record(z.string()).optional(),
    })
    .optional(),
  createdAt: IsoDateSchema.optional(),
  updatedAt: IsoDateSchema.optional(),
})
export type Session = z.infer<typeof SessionSchema>
