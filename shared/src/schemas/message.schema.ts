import { z } from 'zod'
import { MESSAGE_MAX_LENGTH, MESSAGE_SENDERS } from '../constants'
import { IsoDateSchema, ObjectIdSchema, UuidSchema } from './common.schema'

/** Visitor contact info attached to a session. */
export const VisitorInfoSchema = z.object({
  name: z.string().trim().max(100).optional(),
  email: z.string().trim().toLowerCase().email().optional().or(z.literal('')),
})
export type VisitorInfo = z.infer<typeof VisitorInfoSchema>

/** A single chat message. */
export const MessageSchema = z.object({
  _id: ObjectIdSchema.optional(),
  sessionId: UuidSchema,
  sender: z.enum(MESSAGE_SENDERS),
  content: z.string().min(1).max(MESSAGE_MAX_LENGTH),
  visitorInfo: VisitorInfoSchema.optional(),
  read: z.boolean().default(false),
  createdAt: IsoDateSchema.optional(),
  updatedAt: IsoDateSchema.optional(),
})
export type Message = z.infer<typeof MessageSchema>

/** Payload for a visitor sending a message via socket. */
export const VisitorMessagePayloadSchema = z.object({
  sessionId: UuidSchema,
  content: z.string().trim().min(1).max(MESSAGE_MAX_LENGTH),
  visitorInfo: VisitorInfoSchema.optional(),
})
export type VisitorMessagePayload = z.infer<typeof VisitorMessagePayloadSchema>

/** Payload for an admin sending a reply via socket. */
export const AdminMessagePayloadSchema = z.object({
  sessionId: UuidSchema,
  content: z.string().trim().min(1).max(MESSAGE_MAX_LENGTH),
})
export type AdminMessagePayload = z.infer<typeof AdminMessagePayloadSchema>
