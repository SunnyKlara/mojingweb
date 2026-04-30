import { Router } from 'express'
import { z } from 'zod'
import {
  ObjectIdSchema,
  ShipOrderRequestSchema,
  RefundOrderRequestSchema,
  ORDER_STATUSES,
  type ShipOrderRequest,
  type RefundOrderRequest,
} from '@mojing/shared'
import { OrderModel } from '../models/Order.model'
import { PaymentEventModel } from '../models/PaymentEvent.model'
import { ProductModel } from '../models/Product.model'
import { requireAdmin } from '../middleware/auth.middleware'
import { validateBody, validateParams } from '../middleware/validate.middleware'
import { audit } from '../services/audit.service'
import { refundPayPalCapture } from '../services/paypal.service'
import { logger } from '../config/logger'

export const adminOrderRouter = Router()

const IdParams = z.object({ id: ObjectIdSchema })

// ---------------------------------------------------------------------------
// GET /api/admin/orders — List orders
// ---------------------------------------------------------------------------

adminOrderRouter.get('/', requireAdmin, async (req, res, next) => {
  try {
    const { status, limit = '100' } = req.query as { status?: string; limit?: string }
    const filter: Record<string, unknown> = {}
    if (
      status &&
      typeof status === 'string' &&
      (ORDER_STATUSES as readonly string[]).includes(status)
    ) {
      filter.status = status
    }
    const orders = await OrderModel.find(filter)
      .sort({ createdAt: -1 })
      .limit(Math.min(500, Number(limit) || 100))
      .lean()
    res.json(orders)
  } catch (err) {
    next(err)
  }
})

// ---------------------------------------------------------------------------
// GET /api/admin/orders/:id — Order detail + payment events
// ---------------------------------------------------------------------------

adminOrderRouter.get('/:id', requireAdmin, validateParams(IdParams), async (req, res, next) => {
  try {
    const order = await OrderModel.findById(req.params.id).lean()
    if (!order) {
      res.status(404).json({ error: 'Order not found' })
      return
    }
    const events = await PaymentEventModel.find({ orderId: order._id })
      .sort({ createdAt: 1 })
      .lean()
    res.json({ order, events })
  } catch (err) {
    next(err)
  }
})

// ---------------------------------------------------------------------------
// PATCH /api/admin/orders/:id/ship — Mark as shipped
// ---------------------------------------------------------------------------

adminOrderRouter.patch(
  '/:id/ship',
  requireAdmin,
  validateParams(IdParams),
  validateBody(ShipOrderRequestSchema),
  async (req, res, next) => {
    const body = req.body as ShipOrderRequest
    try {
      const order = await OrderModel.findById(req.params.id)
      if (!order) {
        res.status(404).json({ error: 'Order not found' })
        return
      }
      if (order.status !== 'paid') {
        res.status(409).json({ error: `Cannot ship order with status: ${order.status}` })
        return
      }

      order.status = 'shipped'
      order.fulfillment = {
        carrier: body.carrier,
        trackingNo: body.trackingNo,
        trackingUrl: body.trackingUrl,
        shippedAt: new Date(),
      }
      await order.save()

      audit({
        action: 'order.ship',
        actor: { type: 'admin', id: req.admin!.sub, username: req.admin!.username },
        target: String(order._id),
        meta: { trackingNo: body.trackingNo },
        req,
      })

      // TODO: send shipping notification email (P8)

      logger.info({ orderNo: order.orderNo, trackingNo: body.trackingNo }, 'Order shipped')
      res.json(order)
    } catch (err) {
      next(err)
    }
  },
)

// ---------------------------------------------------------------------------
// PATCH /api/admin/orders/:id/refund — Refund via PayPal
// ---------------------------------------------------------------------------

adminOrderRouter.patch(
  '/:id/refund',
  requireAdmin,
  validateParams(IdParams),
  validateBody(RefundOrderRequestSchema),
  async (req, res, next) => {
    const body = req.body as RefundOrderRequest
    try {
      const order = await OrderModel.findById(req.params.id)
      if (!order) {
        res.status(404).json({ error: 'Order not found' })
        return
      }
      if (!['paid', 'shipped', 'delivered'].includes(order.status)) {
        res.status(409).json({ error: `Cannot refund order with status: ${order.status}` })
        return
      }
      if (!order.payment.paypalCaptureId) {
        res.status(409).json({ error: 'No PayPal capture ID — cannot refund' })
        return
      }
      if (body.amount > order.total) {
        res.status(400).json({ error: 'Refund amount exceeds order total' })
        return
      }

      // Call PayPal refund API
      const refund = await refundPayPalCapture(
        order.payment.paypalCaptureId,
        body.amount,
        body.reason ?? `Refund for order ${order.orderNo}`,
      )

      // Update order status
      order.status = 'refunded'
      await order.save()

      // Restore stock
      for (const item of order.items) {
        await ProductModel.findOneAndUpdate(
          { _id: item.productId, 'variants.sku': item.sku },
          { $inc: { 'variants.$.stock': item.quantity } },
        )
      }

      // Record payment event
      await PaymentEventModel.create({
        orderId: order._id,
        orderNo: order.orderNo,
        event: 'refunded',
        provider: 'paypal',
        providerId: refund.refundId,
        amount: body.amount,
        currency: 'USD',
        raw: refund.raw,
        ip: req.ip,
      })

      audit({
        action: 'order.refund',
        actor: { type: 'admin', id: req.admin!.sub, username: req.admin!.username },
        target: String(order._id),
        meta: { refundId: refund.refundId, amount: body.amount },
        req,
      })

      // TODO: send refund notification email (P8)

      logger.info({ orderNo: order.orderNo, refundId: refund.refundId }, 'Order refunded')
      res.json(order)
    } catch (err) {
      next(err)
    }
  },
)
