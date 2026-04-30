/**
 * Re-exports of derived types for consumers that only need types, no runtime.
 * Runtime schemas live under `@mojing/shared/schemas`.
 */
export type {
  Message,
  VisitorInfo,
  VisitorMessagePayload,
  AdminMessagePayload,
} from '../schemas/message.schema'
export type { Session } from '../schemas/session.schema'
export type { User, PublicUser } from '../schemas/user.schema'
export type {
  LoginRequest,
  LoginResponse,
  AccessTokenPayload,
  RefreshTokenPayload,
  VisitorSessionPayload,
  IssueSessionResponse,
  MeResponse,
} from '../schemas/auth.schema'
export type { Pagination, ApiError } from '../schemas/common.schema'

// Commerce types (see docs/COMMERCE-SPEC.md)
export type {
  LocaleString,
  ProductVariant,
  Product,
  CreateProductRequest,
  UpdateProductRequest,
} from '../schemas/product.schema'
export type { ShippingAddress } from '../schemas/shipping.schema'
export type {
  OrderItem,
  Fulfillment,
  Order,
  CreateOrderRequest,
  CreateOrderResponse,
  OrderLookup,
  ShipOrderRequest,
  RefundOrderRequest,
  CapturePaymentRequest,
} from '../schemas/order.schema'
export type { PaymentEvent } from '../schemas/payment.schema'
