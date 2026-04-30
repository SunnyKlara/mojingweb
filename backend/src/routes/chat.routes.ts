import { Router } from 'express'
import { randomUUID } from 'node:crypto'
import rateLimit from 'express-rate-limit'
import { z } from 'zod'
import { MessageModel } from '../models/Message.model'
import { SessionModel } from '../models/Session.model'
import { validateParams } from '../middleware/validate.middleware'
import { requireAdmin } from '../middleware/auth.middleware'
import { requireVisitorSession } from '../middleware/visitor.middleware'
import { signVisitorSession } from '../services/token.service'
import { audit } from '../services/audit.service'
import { UuidSchema, type IssueSessionResponse } from '@mojing/shared'

export const chatRouter = Router()

const SessionIdParams = z.object({ sessionId: UuidSchema })

/** Rate limit session creation to prevent resource exhaustion. */
const sessionCreateLimiter = rateLimit({
  windowMs: 60_000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many session requests, try again later' },
})

/**
 * Public — issue a signed visitor session token.
 * The visitor calls this on first load; the sessionId is bound server-side via JWT.
 */
chatRouter.post('/session', sessionCreateLimiter, (_req, res) => {
  const sessionId = randomUUID()
  const sessionToken = signVisitorSession(sessionId)
  const response: IssueSessionResponse = { sessionId, sessionToken }
  res.json(response)
})

/**
 * Visitor — history of their OWN session. Requires X-Session-Token header whose
 * payload.sessionId must match :sessionId. Replaces the old admin-only route
 * so the ChatWidget can render past messages without admin credentials.
 */
chatRouter.get(
  '/history/:sessionId',
  validateParams(SessionIdParams),
  requireVisitorSession,
  async (req, res, next) => {
    if (req.visitor?.sessionId !== req.params.sessionId) {
      res.status(403).json({ error: 'sessionId mismatch' })
      return
    }
    try {
      const messages = await MessageModel.find({ sessionId: req.params.sessionId })
        .sort({ createdAt: 1 })
        .lean()
      res.json(messages)
    } catch (err) {
      next(err)
    }
  },
)

/** Admin — list all sessions. */
chatRouter.get('/admin/sessions', requireAdmin, async (_req, res, next) => {
  try {
    const sessions = await SessionModel.find().sort({ lastMessageAt: -1 }).limit(200).lean()
    res.json(sessions)
  } catch (err) {
    next(err)
  }
})

/** Admin — full history for any session. */
chatRouter.get(
  '/admin/history/:sessionId',
  requireAdmin,
  validateParams(SessionIdParams),
  async (req, res, next) => {
    try {
      const messages = await MessageModel.find({ sessionId: req.params.sessionId })
        .sort({ createdAt: 1 })
        .lean()
      res.json(messages)
    } catch (err) {
      next(err)
    }
  },
)

/** Admin — mark session messages as read. */
chatRouter.patch(
  '/admin/read/:sessionId',
  requireAdmin,
  validateParams(SessionIdParams),
  async (req, res, next) => {
    try {
      await MessageModel.updateMany({ sessionId: req.params.sessionId }, { read: true })
      await SessionModel.updateOne({ sessionId: req.params.sessionId }, { unreadCount: 0 })
      audit({
        action: 'chat.read',
        actor: { type: 'admin', id: req.admin!.sub, username: req.admin!.username },
        target: String(req.params.sessionId),
        req,
      })
      res.json({ ok: true })
    } catch (err) {
      next(err)
    }
  },
)
