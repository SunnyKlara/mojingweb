import { Router } from 'express'
import mongoose from 'mongoose'
import { requireAdmin } from '../middleware/auth.middleware'
import { MessageModel } from '../models/Message.model'
import { SessionModel } from '../models/Session.model'
import { LeadModel } from '../models/Lead.model'
import { UserModel } from '../models/User.model'

export const healthRouter = Router()

/** Liveness probe — always cheap, no DB call. */
healthRouter.get('/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() })
})

/**
 * Readiness — used by Railway / K8s to decide whether to send traffic.
 * Verifies mongo connectivity with an actual ping.
 */
healthRouter.get('/ready', async (_req, res) => {
  const mongoConnected = mongoose.connection.readyState === mongoose.ConnectionStates.connected
  let mongoPing = false
  if (mongoConnected && mongoose.connection.db) {
    try {
      await mongoose.connection.db.admin().ping()
      mongoPing = true
    } catch {
      mongoPing = false
    }
  }
  const ready = mongoConnected && mongoPing
  res.status(ready ? 200 : 503).json({
    status: ready ? 'ready' : 'not_ready',
    checks: { mongoConnected, mongoPing },
    uptime: process.uptime(),
  })
})

/** Admin-only operational metrics. */
healthRouter.get('/metrics', requireAdmin, async (_req, res, next) => {
  try {
    const [messages, sessions, leads, users] = await Promise.all([
      MessageModel.estimatedDocumentCount(),
      SessionModel.estimatedDocumentCount(),
      LeadModel.estimatedDocumentCount(),
      UserModel.estimatedDocumentCount(),
    ])
    const mem = process.memoryUsage()
    res.json({
      uptime: process.uptime(),
      node: process.version,
      platform: process.platform,
      memoryMB: {
        rss: Math.round(mem.rss / 1024 / 1024),
        heapUsed: Math.round(mem.heapUsed / 1024 / 1024),
        heapTotal: Math.round(mem.heapTotal / 1024 / 1024),
      },
      counts: { messages, sessions, leads, users },
    })
  } catch (err) {
    next(err)
  }
})
