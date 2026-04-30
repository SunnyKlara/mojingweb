import { z } from 'zod'
import { ORDER_STATUSES, PAYMENT_METHODS } from '../constants'
import { IsoDateSchema, ObjectIdSchema, EmailSchema } from './common.schema'
import { ShippingAddressSchema } from './shipping.schema'

/** Frozen item snapshot stored inside an order. */
export const OrderItemSchema = z.object({
  productId: ObjectIdSchema,
  sku: z.string(),
  name: z.string(),
  price: z.number().int().positive(), // cents
  quantity: z.number().int().positive(),
  image: z.string(),
})
export type OrderItem = z.infer<typeof OrderItemSchema>

/** Fulfillment info (carrier + tracking). */
export const FulfillmentSchema = z.object({
  carrier: z.string().trim().max(100).optional(),
  trackingNo: z.string().trim().max(100).optional(),
  shippedAt: IsoDateSchema.optional(),
  trackingUrl: z.string().url().optional(),
})
export type Fulfillment = z.infer<typeof FulfillmentSchema>

/** Full order document. */
export const OrderSchema = z.object({
  _id: ObjectIdSchema.optional(),
  orderNo: z.string(),
  email: EmailSchema,
  status: z.enum(ORDER_STATUSES).default('pending_payment'),
  items: z.array(OrderItemSchema).min(1),
  subtotal: z.number().int().min(0),
  shipping: z.number().int().min(0),
  total: z.number().int().positive(),
  currency: z.literal('USD').default('USD'),
  shippingAddress: ShippingAddressSchema,
  payment: z.object({
    method: z.enum(PAYMENT_METHODS),
    paypalOrderId: z.string().optional(),
    paypalCaptureId: z.string().optional(),
    paidAt: IsoDateSchema.optional(),
  }),
  fulfillment: FulfillmentSchema.optional(),
  locale: z.enum(['en', 'zh']).default('en'),
  ip: z.string().optional(),
  userAgent: z.string().optional(),
  notes: z.string().max(2000).optional(),
  createdAt: IsoDateSchema.optional(),
  updatedAt: IsoDateSchema.optional(),
})
export type Order = z.infer<typeof OrderSchema>

/** Public: create order request from checkout page. */
export const CreateOrderRequestSchema = z.object({
  email: EmailSchema,
  locale: z.enum(['en', 'zh']).default('en'),
  items: z
    .array(
      z.object({
        sku: z.string().trim().min(1),
        quantity: z.number().int().positive().max(10),
      }),
    )
    .min(1)
    .max(5),
  shippingAddress: ShippingAddressSchema,
})
export type CreateOrderRequest = z.infer<typeof CreateOrderRequestSchema>

/** Public: create order response. */
export const CreateOrderResponseSchema = z.object({
  orderNo: z.string(),
  total: z.number(),
  currency: z.string(),
  approveUrl: z.string().url(),
})
export type CreateOrderResponse = z.infer<typeof CreateOrderResponseSchema>

/** Public: order lookup request (query params). */
export const OrderLookupSchema = z.object({
  email: EmailSchema,
  orderNo: z.string().trim().min(1),
})
export type OrderLookup = z.infer<typeof OrderLookupSchema>

/** Admin: ship order request. */
export const ShipOrderRequestSchema = z.object({
  carrier: z.string().trim().min(1).max(100),
  trackingNo: z.string().trim().min(1).max(100),
  trackingUrl: z.string().url().optional(),
})
export type ShipOrderRequest = z.infer<typeof ShipOrderRequestSchema>

/** Admin: refund order request. */
export const RefundOrderRequestSchema = z.object({
  amount: z.number().int().positive(), // cents — must be <= order total
  reason: z.string().trim().max(500).optional(),
})
export type RefundOrderRequest = z.infer<typeof RefundOrderRequestSchema>

/** PayPal capture request from frontend success page. */
export const CapturePaymentRequestSchema = z.object({
  paypalOrderId: z.string().trim().min(1),
})
export type CapturePaymentRequest = z.infer<typeof CapturePaymentRequestSchema>
