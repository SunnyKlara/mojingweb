import { Router } from 'express'
import type { Request } from 'express'
import { OrderModel } from '../models/Order.model'
import { PaymentEventModel } from '../models/PaymentEvent.model'
import { ProductModel } from '../models/Product.model'
import { verifyWebhookSignature } from '../services/paypal.service'
import { logger } from '../config/logger'

export const webhookRouter = Router()

/**
 * POST /api/payments/paypal/webhook
 *
 * Receives PayPal webhook events. Uses raw body for signature verification.
 * CSRF-exempt (already in the exemption list).
 *
 * Handled events:
 * - PAYMENT.CAPTURE.COMPLETED  — fallback capture if redirect flow missed
 * - PAYMENT.CAPTURE.REFUNDED   — update order status
 * - CUSTOMER.DISPUTE.CREATED   — log dispute event
 */
webhookRouter.post('/paypal/webhook', async (req, res) => {
  const rawBody =
    (req as Request & { rawBody?: Buffer }).rawBody?.toString('utf-8') ?? JSON.stringify(req.body)

  // 1. Verify webhook signature
  const verified = await verifyWebhookSignature(req.headers, rawBody)
  if (!verified) {
    logger.warn('PayPal webhook signature verification failed')
    res.status(401).json({ error: 'Invalid webhook signature' })
    return
  }

  let event: { event_type: string; resource: Record<string, unknown> }
  try {
    event = JSON.parse(rawBody) as { event_type: string; resource: Record<string, unknown> }
  } catch {
    res.status(400).json({ error: 'Invalid JSON' })
    return
  }

  const eventType = event.event_type
  const resource = event.resource
  logger.info({ eventType }, 'PayPal webhook received')

  try {
    switch (eventType) {
      case 'PAYMENT.CAPTURE.COMPLETED':
        await handleCaptureCompleted(resource, req.ip)
        break
      case 'PAYMENT.CAPTURE.REFUNDED':
        await handleCaptureRefunded(resource, req.ip)
        break
      case 'CUSTOMER.DISPUTE.CREATED':
        await handleDisputeCreated(resource, req.ip)
        break
      default:
        logger.info({ eventType }, 'Unhandled PayPal webhook event type')
    }
  } catch (err) {
    logger.error({ err, eventType }, 'Error processing PayPal webhook')
  }

  // Always return 200 to acknowledge receipt — PayPal retries on non-2xx
  res.status(200).json({ received: true })
})

// ---------------------------------------------------------------------------
// Event handlers
// ---------------------------------------------------------------------------

async function handleCaptureCompleted(
  resource: Record<string, unknown>,
  ip?: string,
): Promise<void> {
  const captureId = resource.id as string | undefined
  if (!captureId) return

  // Idempotent: check if we already processed this capture
  const existing = await PaymentEventModel.findOne({
    providerId: captureId,
    event: 'captured',
  })
  if (existing) {
    logger.info({ captureId }, 'Webhook capture already processed — skipping')
    return
  }

  // Find order by PayPal order ID from the supplementary_data or links
  // The capture resource contains the order reference in supplementary_data
  // or we can look up by the capture ID if already stored
  const order = await OrderModel.findOne({
    'payment.paypalCaptureId': captureId,
  })

  if (order) {
    // Already captured via redirect flow — just log the webhook event
    await PaymentEventModel.create({
      orderId: order._id,
      orderNo: order.orderNo,
      event: 'captured',
      provider: 'paypal',
      providerId: captureId,
      amount: order.total,
      currency: 'USD',
      raw: resource,
      ip,
    })
    logger.info({ orderNo: order.orderNo }, 'Webhook confirmed existing capture')
    return
  }

  // If order not found by captureId, it might not have been captured yet
  // Try to find by the PayPal order ID in the links
  const links = resource.links as Array<{ href: string; rel: string }> | undefined
  const upLink = links?.find((l) => l.rel === 'up')
  if (upLink) {
    const paypalOrderId = upLink.href.split('/').pop()
    if (paypalOrderId) {
      const pendingOrder = await OrderModel.findOne({
        'payment.paypalOrderId': paypalOrderId,
        status: 'pending_payment',
      })
      if (pendingOrder) {
        const amountValue = (resource.amount as { value?: string })?.value
        const amountCents = amountValue ? Math.round(parseFloat(amountValue) * 100) : 0

        // Verify amount
        if (amountCents > 0 && amountCents !== pendingOrder.total) {
          logger.error(
            { expected: pendingOrder.total, received: amountCents },
            'Webhook capture amount mismatch',
          )
          await PaymentEventModel.create({
            orderId: pendingOrder._id,
            orderNo: pendingOrder.orderNo,
            event: 'error',
            provider: 'paypal',
            providerId: captureId,
            amount: amountCents,
            raw: { error: 'amount_mismatch', resource },
            ip,
          })
          return
        }

        // Atomic stock deduction
        for (const item of pendingOrder.items) {
          const result = await ProductModel.findOneAndUpdate(
            {
              _id: item.productId,
              variants: { $elemMatch: { sku: item.sku, stock: { $gte: item.quantity } } },
            },
            { $inc: { 'variants.$.stock': -item.quantity } },
            { new: true },
          )
          if (!result) {
            logger.error(
              { sku: item.sku, orderNo: pendingOrder.orderNo },
              'Webhook: stock deduction failed — manual intervention needed',
            )
          }
        }

        pendingOrder.status = 'paid'
        pendingOrder.payment.paypalCaptureId = captureId
        pendingOrder.payment.paidAt = new Date()
        await pendingOrder.save()

        await PaymentEventModel.create({
          orderId: pendingOrder._id,
          orderNo: pendingOrder.orderNo,
          event: 'captured',
          provider: 'paypal',
          providerId: captureId,
          amount: pendingOrder.total,
          currency: 'USD',
          raw: resource,
          ip,
        })

        logger.info({ orderNo: pendingOrder.orderNo }, 'Webhook captured pending order')
      }
    }
  }
}

async function handleCaptureRefunded(
  resource: Record<string, unknown>,
  ip?: string,
): Promise<void> {
  const refundId = resource.id as string | undefined
  if (!refundId) return

  // Idempotent check
  const existing = await PaymentEventModel.findOne({ providerId: refundId, event: 'refunded' })
  if (existing) {
    logger.info({ refundId }, 'Webhook refund already processed — skipping')
    return
  }

  // Find the capture ID from the refund resource links
  const links = resource.links as Array<{ href: string; rel: string }> | undefined
  const upLink = links?.find((l) => l.rel === 'up')
  const captureId = upLink?.href.split('/').pop()

  if (!captureId) {
    logger.warn({ refundId }, 'Webhook refund: cannot determine capture ID')
    return
  }

  const order = await OrderModel.findOne({ 'payment.paypalCaptureId': captureId })
  if (!order) {
    logger.warn({ captureId, refundId }, 'Webhook refund: order not found')
    return
  }

  const amountValue = (resource.amount as { value?: string })?.value
  const amountCents = amountValue ? Math.round(parseFloat(amountValue) * 100) : order.total

  // Update order status if not already refunded
  if (order.status !== 'refunded') {
    order.status = 'refunded'
    await order.save()

    // Restore stock
    for (const item of order.items) {
      await ProductModel.findOneAndUpdate(
        { _id: item.productId, 'variants.sku': item.sku },
        { $inc: { 'variants.$.stock': item.quantity } },
      )
    }
  }

  await PaymentEventModel.create({
    orderId: order._id,
    orderNo: order.orderNo,
    event: 'refunded',
    provider: 'paypal',
    providerId: refundId,
    amount: amountCents,
    currency: 'USD',
    raw: resource,
    ip,
  })

  logger.info({ orderNo: order.orderNo, refundId }, 'Webhook refund processed')
}

async function handleDisputeCreated(resource: Record<string, unknown>, ip?: string): Promise<void> {
  const disputeId = resource.dispute_id as string | undefined
  if (!disputeId) return

  // Idempotent check
  const existing = await PaymentEventModel.findOne({ providerId: disputeId, event: 'disputed' })
  if (existing) return

  // Try to find the order from the disputed transaction
  const disputedTransactions = resource.disputed_transactions as
    | Array<{
        seller_transaction_id?: string
      }>
    | undefined
  const captureId = disputedTransactions?.[0]?.seller_transaction_id

  let order = null
  if (captureId) {
    order = await OrderModel.findOne({ 'payment.paypalCaptureId': captureId })
  }

  if (order) {
    await PaymentEventModel.create({
      orderId: order._id,
      orderNo: order.orderNo,
      event: 'disputed',
      provider: 'paypal',
      providerId: disputeId,
      amount: order.total,
      currency: 'USD',
      raw: resource,
      ip,
    })
    logger.warn({ orderNo: order.orderNo, disputeId }, 'PayPal dispute created')
  } else {
    logger.warn({ disputeId, captureId }, 'PayPal dispute: order not found')
  }
}
