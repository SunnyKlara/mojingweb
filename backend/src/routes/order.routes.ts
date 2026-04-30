import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import {
  CreateOrderRequestSchema,
  CapturePaymentRequestSchema,
  OrderLookupSchema,
  type CreateOrderRequest,
  type CapturePaymentRequest,
} from '@mojing/shared'
import { ProductModel } from '../models/Product.model'
import { OrderModel } from '../models/Order.model'
import { PaymentEventModel } from '../models/PaymentEvent.model'
import { validateBody } from '../middleware/validate.middleware'
import { audit } from '../services/audit.service'
import { generateOrderNo } from '../lib/order-no'
import { getShippingRate } from '../config/shipping'
import { env } from '../config/env'
import { logger } from '../config/logger'
import { createPayPalOrder, capturePayPalOrder, centsToDollars } from '../services/paypal.service'

export const orderRouter = Router()

const orderCreateLimiter = rateLimit({
  windowMs: 60_000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many order attempts, please try again later' },
})

const orderLookupLimiter = rateLimit({
  windowMs: 60_000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many lookup attempts' },
})

// ---------------------------------------------------------------------------
// POST /api/orders — Create order + PayPal checkout
// ---------------------------------------------------------------------------

orderRouter.post(
  '/',
  orderCreateLimiter,
  validateBody(CreateOrderRequestSchema),
  async (req, res, next) => {
    const body = req.body as CreateOrderRequest
    try {
      // 1. Resolve SKUs → products + validate stock
      const skus = body.items.map((i) => i.sku)
      const products = await ProductModel.find({
        status: 'active',
        'variants.sku': { $in: skus },
      }).lean()

      // Build a sku → { product, variant } lookup
      const skuMap = new Map<
        string,
        {
          product: (typeof products)[number]
          variant: (typeof products)[number]['variants'][number]
        }
      >()
      for (const p of products) {
        for (const v of p.variants) {
          if (skus.includes(v.sku)) skuMap.set(v.sku, { product: p, variant: v })
        }
      }

      // Validate all SKUs exist
      for (const item of body.items) {
        const entry = skuMap.get(item.sku)
        if (!entry) {
          res.status(400).json({ error: `Product not found for SKU: ${item.sku}` })
          return
        }
        if (entry.variant.stock < item.quantity) {
          res.status(409).json({ error: `Insufficient stock for ${item.sku}` })
          return
        }
      }

      // 2. Build order items (frozen snapshot)
      const locale = body.locale || 'en'
      const orderItems = body.items.map((item) => {
        const { product, variant } = skuMap.get(item.sku)!
        const name =
          locale === 'zh'
            ? `${product.name.zh} - ${variant.name.zh}`
            : `${product.name.en} - ${variant.name.en}`
        return {
          productId: product._id,
          sku: variant.sku,
          name,
          price: product.price,
          quantity: item.quantity,
          image: variant.image,
        }
      })

      // 3. Calculate totals
      const subtotal = orderItems.reduce((sum, i) => sum + i.price * i.quantity, 0)
      const shipping = getShippingRate(body.shippingAddress.country)
      const total = subtotal + shipping

      // 4. Generate order number (retry on collision)
      let orderNo = generateOrderNo()
      let retries = 3
      while (retries > 0) {
        const exists = await OrderModel.exists({ orderNo })
        if (!exists) break
        orderNo = generateOrderNo()
        retries--
      }

      // 5. Create PayPal order
      const frontendUrl = env.FRONTEND_URL
      const paypal = await createPayPalOrder({
        orderNo,
        description: orderItems.map((i) => `${i.name} x${i.quantity}`).join(', '),
        items: orderItems.map((i) => ({
          name: i.name,
          sku: i.sku,
          unitAmount: i.price,
          quantity: i.quantity,
        })),
        subtotal,
        shipping,
        total,
        shippingAddress: body.shippingAddress,
        returnUrl: `${frontendUrl}/${locale}/checkout/success`,
        cancelUrl: `${frontendUrl}/${locale}/checkout/cancel`,
      })

      // 6. Create order document
      const order = await OrderModel.create({
        orderNo,
        email: body.email,
        status: 'pending_payment',
        items: orderItems,
        subtotal,
        shipping,
        total,
        currency: 'USD',
        shippingAddress: body.shippingAddress,
        payment: {
          method: 'paypal',
          paypalOrderId: paypal.paypalOrderId,
        },
        locale,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      })

      // 7. Record payment event
      await PaymentEventModel.create({
        orderId: order._id,
        orderNo,
        event: 'created',
        provider: 'paypal',
        providerId: paypal.paypalOrderId,
        amount: total,
        currency: 'USD',
        raw: { paypalOrderId: paypal.paypalOrderId, approveUrl: paypal.approveUrl },
        ip: req.ip,
      })

      audit({
        action: 'order.create',
        actor: { type: 'visitor' },
        target: String(order._id),
        req,
      })

      res.status(201).json({
        orderNo,
        total,
        currency: 'USD',
        approveUrl: paypal.approveUrl,
      })
    } catch (err) {
      next(err)
    }
  },
)

// ---------------------------------------------------------------------------
// POST /api/payments/paypal/capture — Capture after buyer approves
// ---------------------------------------------------------------------------

orderRouter.post(
  '/payments/paypal/capture',
  validateBody(CapturePaymentRequestSchema),
  async (req, res, next) => {
    const { paypalOrderId } = req.body as CapturePaymentRequest
    try {
      // 1. Find the order
      const order = await OrderModel.findOne({ 'payment.paypalOrderId': paypalOrderId })
      if (!order) {
        res.status(404).json({ error: 'Order not found' })
        return
      }

      // Idempotent: if already paid, return success
      if (order.status === 'paid') {
        res.json({
          orderNo: order.orderNo,
          status: order.status,
          total: order.total,
          currency: order.currency,
        })
        return
      }

      if (order.status !== 'pending_payment') {
        res.status(409).json({ error: `Order status is ${order.status}, cannot capture` })
        return
      }

      // 2. Capture via PayPal
      const capture = await capturePayPalOrder(paypalOrderId)

      // 3. CRITICAL: verify amount matches
      if (capture.amount !== order.total) {
        logger.error(
          { expected: order.total, received: capture.amount, orderNo: order.orderNo },
          'PayPal capture amount mismatch!',
        )
        await PaymentEventModel.create({
          orderId: order._id,
          orderNo: order.orderNo,
          event: 'error',
          provider: 'paypal',
          providerId: paypalOrderId,
          amount: capture.amount,
          raw: { error: 'amount_mismatch', expected: order.total, received: capture.amount },
          ip: req.ip,
        })
        res.status(409).json({ error: 'Payment amount mismatch' })
        return
      }

      // 4. Atomic stock deduction
      for (const item of order.items) {
        const result = await ProductModel.findOneAndUpdate(
          {
            _id: item.productId,
            variants: { $elemMatch: { sku: item.sku, stock: { $gte: item.quantity } } },
          },
          { $inc: { 'variants.$.stock': -item.quantity } },
          { new: true },
        )
        if (!result) {
          // Stock insufficient after payment — rare but possible.
          // Log and continue (don't fail the capture — money is already taken).
          logger.error(
            { sku: item.sku, quantity: item.quantity, orderNo: order.orderNo },
            'Stock deduction failed after capture — manual intervention needed',
          )
        }
      }

      // 5. Update order
      order.status = 'paid'
      order.payment.paypalCaptureId = capture.captureId
      order.payment.paidAt = new Date()
      await order.save()

      // 6. Record payment event
      await PaymentEventModel.create({
        orderId: order._id,
        orderNo: order.orderNo,
        event: 'captured',
        provider: 'paypal',
        providerId: capture.captureId,
        amount: capture.amount,
        currency: 'USD',
        raw: capture.raw,
        ip: req.ip,
      })

      audit({
        action: 'order.paid',
        actor: { type: 'visitor' },
        target: String(order._id),
        meta: { captureId: capture.captureId },
        req,
      })

      // 7. TODO: send confirmation email (P8)

      logger.info(
        { orderNo: order.orderNo, total: centsToDollars(order.total) },
        'Order payment captured',
      )

      res.json({
        orderNo: order.orderNo,
        status: order.status,
        total: order.total,
        currency: order.currency,
      })
    } catch (err) {
      next(err)
    }
  },
)

// ---------------------------------------------------------------------------
// GET /api/orders/lookup — Guest order lookup
// ---------------------------------------------------------------------------

orderRouter.get('/lookup', orderLookupLimiter, async (req, res, next) => {
  try {
    const parsed = OrderLookupSchema.safeParse(req.query)
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid query', details: parsed.error.flatten() })
      return
    }
    const { email, orderNo } = parsed.data

    const order = await OrderModel.findOne({ email, orderNo }).lean()
    if (!order) {
      res.status(404).json({ error: 'Order not found' })
      return
    }

    // Return sanitised view (no full address, no internal IDs)
    res.json({
      orderNo: order.orderNo,
      status: order.status,
      items: order.items.map((i) => ({
        name: i.name,
        sku: i.sku,
        price: i.price,
        quantity: i.quantity,
        image: i.image,
      })),
      subtotal: order.subtotal,
      shipping: order.shipping,
      total: order.total,
      currency: order.currency,
      shippingCountry: order.shippingAddress.country,
      payment: {
        method: order.payment.method,
        paidAt: order.payment.paidAt,
      },
      fulfillment: order.fulfillment
        ? {
            carrier: order.fulfillment.carrier,
            trackingNo: order.fulfillment.trackingNo,
            shippedAt: order.fulfillment.shippedAt,
            trackingUrl: order.fulfillment.trackingUrl,
          }
        : undefined,
      createdAt: order.createdAt,
    })
  } catch (err) {
    next(err)
  }
})
