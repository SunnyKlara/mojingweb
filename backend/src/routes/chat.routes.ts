import { Router } from 'express'
import { z } from 'zod'
import { MessageModel } from '../models/Message.model'
import { validateParams } from '../middleware/validate.middleware'
import { UuidSchema } from '@mojing/shared'

export const chatRouter = Router()

const SessionIdParams = z.object({ sessionId: UuidSchema })

/** Visitor/admin — history of a single session. */
chatRouter.get('/history/:sessionId', validateParams(SessionIdParams), async (req, res, next) => {
  try {
    const messages = await MessageModel.find({ sessionId: req.params.sessionId })
      .sort({ createdAt: 1 })
      .lean()
    res.json(messages)
  } catch (err) {
    next(err)
  }
})

/** Admin — list all sessions aggregated from messages. */
chatRouter.get('/sessions', async (_req, res, next) => {
  try {
    const sessions = await MessageModel.aggregate([
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: '$sessionId',
          lastMessage: { $first: '$content' },
          visitorInfo: { $first: '$visitorInfo' },
          unread: { $sum: { $cond: [{ $eq: ['$read', false] }, 1, 0] } },
          updatedAt: { $first: '$createdAt' },
        },
      },
      { $sort: { updatedAt: -1 } },
    ])
    res.json(sessions)
  } catch (err) {
    next(err)
  }
})

/** Admin — mark session messages as read. */
chatRouter.patch('/read/:sessionId', validateParams(SessionIdParams), async (req, res, next) => {
  try {
    await MessageModel.updateMany({ sessionId: req.params.sessionId }, { read: true })
    res.json({ ok: true })
  } catch (err) {
    next(err)
  }
})
