import { OrderModel } from '../models/Order.model'
import { env } from '../config/env'
import { logger } from '../config/logger'

const INTERVAL_MS = 5 * 60 * 1000 // Run every 5 minutes

/**
 * Cancel orders that have been in pending_payment for longer than ORDER_EXPIRY_MINUTES.
 * No stock restoration needed — stock is only deducted after capture.
 */
async function cleanupExpiredOrders(): Promise<void> {
  const cutoff = new Date(Date.now() - env.ORDER_EXPIRY_MINUTES * 60 * 1000)
  try {
    const result = await OrderModel.updateMany(
      { status: 'pending_payment', createdAt: { $lt: cutoff } },
      { $set: { status: 'cancelled' } },
    )
    if (result.modifiedCount > 0) {
      logger.info({ count: result.modifiedCount }, 'Expired orders cancelled')
    }
  } catch (err) {
    logger.error({ err }, 'Order cleanup failed')
  }
}

let timer: ReturnType<typeof setInterval> | null = null

export function startOrderCleanup(): void {
  if (timer) return
  // Run once immediately, then on interval
  void cleanupExpiredOrders()
  timer = setInterval(() => void cleanupExpiredOrders(), INTERVAL_MS)
  logger.info(
    { intervalMs: INTERVAL_MS, expiryMinutes: env.ORDER_EXPIRY_MINUTES },
    'Order cleanup scheduler started',
  )
}

export function stopOrderCleanup(): void {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}
