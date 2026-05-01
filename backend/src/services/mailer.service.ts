import nodemailer, { type Transporter } from 'nodemailer'
import { env } from '../config/env'
import { logger } from '../config/logger'
import type { VisitorInfo } from '@mojing/shared'
import type { OrderDocument } from '../models/Order.model'

let transporter: Transporter | null = null

function getTransporter(): Transporter | null {
  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS) return null
  if (transporter) return transporter
  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT ?? 587,
    secure: (env.SMTP_PORT ?? 587) === 465,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
  })
  return transporter
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    }
    return map[c] ?? c
  })
}

function centsToDollars(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`
}

const SITE_URL = env.FRONTEND_URL

// ---------------------------------------------------------------------------
// Shared email wrapper
// ---------------------------------------------------------------------------

const emailWrapper = (title: string, body: string) => `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/><title>${escapeHtml(title)}</title></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:32px 16px;">
    <div style="background:#ffffff;border-radius:12px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
      <div style="text-align:center;margin-bottom:24px;">
        <h1 style="font-size:20px;color:#111;margin:0;">ModelZone</h1>
      </div>
      ${body}
    </div>
    <p style="text-align:center;color:#999;font-size:12px;margin-top:24px;">
      &copy; ${new Date().getFullYear()} ModelZone · <a href="${SITE_URL}" style="color:#999;">modelzone.cc</a>
    </p>
  </div>
</body>
</html>`

// ---------------------------------------------------------------------------
// Existing notifications
// ---------------------------------------------------------------------------

export async function notifyNewMessage(params: {
  sessionId: string
  content: string
  visitorInfo?: VisitorInfo
}): Promise<void> {
  const tx = getTransporter()
  if (!tx || !env.NOTIFY_EMAIL) {
    logger.debug('SMTP not configured — skipping visitor notification')
    return
  }
  const { sessionId, content, visitorInfo } = params
  const name = visitorInfo?.name || '访客'
  const email = visitorInfo?.email || '未填写'
  try {
    await tx.sendMail({
      from: env.SMTP_FROM || env.SMTP_USER,
      to: env.NOTIFY_EMAIL,
      subject: `新客服消息来自 ${name}`,
      html: `
        <p><strong>会话ID:</strong> ${escapeHtml(sessionId)}</p>
        <p><strong>访客姓名:</strong> ${escapeHtml(name)}</p>
        <p><strong>访客邮箱:</strong> ${escapeHtml(email)}</p>
        <p><strong>消息内容:</strong> ${escapeHtml(content)}</p>
      `,
    })
  } catch (err) {
    logger.error({ err }, 'Failed to send notification email')
  }
}

export async function notifyNewLead(lead: {
  name: string
  email: string
  company?: string
  phone?: string
  message: string
  source?: string
  locale?: string
}): Promise<void> {
  const tx = getTransporter()
  if (!tx || !env.NOTIFY_EMAIL) return
  try {
    await tx.sendMail({
      from: env.SMTP_FROM || env.SMTP_USER,
      to: env.NOTIFY_EMAIL,
      subject: `[Lead] ${lead.name} · ${lead.company || lead.email}`,
      html: `
        <h2>New lead submitted</h2>
        <p><strong>Name:</strong> ${escapeHtml(lead.name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(lead.email)}</p>
        ${lead.company ? `<p><strong>Company:</strong> ${escapeHtml(lead.company)}</p>` : ''}
        ${lead.phone ? `<p><strong>Phone:</strong> ${escapeHtml(lead.phone)}</p>` : ''}
        ${lead.source ? `<p><strong>Source:</strong> ${escapeHtml(lead.source)}</p>` : ''}
        ${lead.locale ? `<p><strong>Locale:</strong> ${escapeHtml(lead.locale)}</p>` : ''}
        <hr/>
        <p>${escapeHtml(lead.message).replace(/\n/g, '<br/>')}</p>
      `,
    })
  } catch (err) {
    logger.error({ err }, 'Failed to send lead notification email')
  }
}

// ---------------------------------------------------------------------------
// FEAT-001: Order confirmation email
// ---------------------------------------------------------------------------

export async function notifyOrderConfirmed(order: OrderDocument): Promise<void> {
  const tx = getTransporter()
  if (!tx) {
    logger.debug('SMTP not configured — skipping order confirmation email')
    return
  }

  const isZh = order.locale === 'zh'
  const subject = isZh
    ? `[ModelZone] 订单确认 — ${order.orderNo}`
    : `[ModelZone] Order Confirmed — ${order.orderNo}`

  const itemsHtml = order.items
    .map(
      (item) => `
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #eee;">
          ${escapeHtml(item.name)}
          <br/><span style="color:#888;font-size:12px;">SKU: ${escapeHtml(item.sku)}</span>
        </td>
        <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:center;">${item.quantity}</td>
        <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right;">${centsToDollars(item.price)}</td>
        <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right;">${centsToDollars(item.price * item.quantity)}</td>
      </tr>`,
    )
    .join('')

  const addr = order.shippingAddress
  const addressHtml = `${escapeHtml(addr.fullName)}<br/>
    ${escapeHtml(addr.line1)}${addr.line2 ? '<br/>' + escapeHtml(addr.line2) : ''}<br/>
    ${escapeHtml(addr.city)}, ${escapeHtml(addr.state)} ${escapeHtml(addr.postalCode)}<br/>
    ${escapeHtml(addr.country)}${addr.phone ? '<br/>' + escapeHtml(addr.phone) : ''}`

  const lookupUrl = `${SITE_URL}/${order.locale}/order-lookup?orderNo=${encodeURIComponent(order.orderNo)}`

  const body = `
    <h2 style="color:#111;margin:0 0 16px;">${isZh ? '感谢您的订单！' : 'Thank you for your order!'}</h2>
    <p style="color:#555;">${isZh ? '您的订单已确认，以下是订单详情：' : 'Your order has been confirmed. Here are the details:'}</p>

    <div style="background:#f9f9f9;border-radius:8px;padding:16px;margin:16px 0;">
      <p style="margin:0;font-size:14px;color:#888;">${isZh ? '订单号' : 'Order No.'}</p>
      <p style="margin:4px 0 0;font-size:18px;font-weight:bold;font-family:monospace;">${escapeHtml(order.orderNo)}</p>
    </div>

    <table style="width:100%;border-collapse:collapse;font-size:14px;">
      <thead>
        <tr style="border-bottom:2px solid #ddd;">
          <th style="text-align:left;padding:8px 0;">${isZh ? '商品' : 'Item'}</th>
          <th style="text-align:center;padding:8px 0;">${isZh ? '数量' : 'Qty'}</th>
          <th style="text-align:right;padding:8px 0;">${isZh ? '单价' : 'Price'}</th>
          <th style="text-align:right;padding:8px 0;">${isZh ? '小计' : 'Total'}</th>
        </tr>
      </thead>
      <tbody>${itemsHtml}</tbody>
    </table>

    <div style="margin-top:16px;font-size:14px;">
      <div style="display:flex;justify-content:space-between;padding:4px 0;">
        <span style="color:#888;">${isZh ? '商品小计' : 'Subtotal'}</span>
        <span>${centsToDollars(order.subtotal)}</span>
      </div>
      <div style="display:flex;justify-content:space-between;padding:4px 0;">
        <span style="color:#888;">${isZh ? '运费' : 'Shipping'}</span>
        <span>${centsToDollars(order.shipping)}</span>
      </div>
      <div style="display:flex;justify-content:space-between;padding:8px 0;border-top:2px solid #ddd;font-weight:bold;font-size:16px;">
        <span>${isZh ? '总计' : 'Total'}</span>
        <span>${centsToDollars(order.total)} USD</span>
      </div>
    </div>

    <h3 style="margin:24px 0 8px;font-size:14px;color:#111;">${isZh ? '收货地址' : 'Shipping Address'}</h3>
    <p style="color:#555;font-size:14px;line-height:1.6;">${addressHtml}</p>

    <p style="color:#555;font-size:14px;margin-top:16px;">
      ${isZh ? '预计配送时间：7-15 个工作日' : 'Estimated delivery: 7-15 business days'}
    </p>

    <div style="text-align:center;margin-top:24px;">
      <a href="${lookupUrl}" style="display:inline-block;background:#111;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-size:14px;">
        ${isZh ? '查询订单状态' : 'Track Your Order'}
      </a>
    </div>

    <p style="color:#999;font-size:12px;margin-top:24px;text-align:center;">
      ${isZh ? '如有问题请联系 support@modelzone.cc' : 'Questions? Contact support@modelzone.cc'}
    </p>`

  try {
    await tx.sendMail({
      from: env.SMTP_FROM || env.SMTP_USER,
      to: order.email,
      subject,
      html: emailWrapper(subject, body),
    })
    logger.info({ orderNo: order.orderNo, email: order.email }, 'Order confirmation email sent')
  } catch (err) {
    logger.error({ err, orderNo: order.orderNo }, 'Failed to send order confirmation email')
  }
}

// ---------------------------------------------------------------------------
// FEAT-002: Shipping notification email
// ---------------------------------------------------------------------------

export async function notifyOrderShipped(order: OrderDocument): Promise<void> {
  const tx = getTransporter()
  if (!tx) {
    logger.debug('SMTP not configured — skipping shipping notification email')
    return
  }

  const isZh = order.locale === 'zh'
  const subject = isZh
    ? `[ModelZone] 您的订单已发货 — ${order.orderNo}`
    : `[ModelZone] Your Order Has Shipped — ${order.orderNo}`

  const f = order.fulfillment
  const trackingHtml = f?.trackingUrl
    ? `<a href="${escapeHtml(f.trackingUrl)}" style="color:#2563eb;text-decoration:underline;">${escapeHtml(f.trackingNo || '')}</a>`
    : escapeHtml(f?.trackingNo || '—')

  const body = `
    <h2 style="color:#111;margin:0 0 16px;">${isZh ? '您的订单已发货！' : 'Your order is on its way!'}</h2>

    <div style="background:#f9f9f9;border-radius:8px;padding:16px;margin:16px 0;">
      <p style="margin:0;font-size:14px;color:#888;">${isZh ? '订单号' : 'Order No.'}</p>
      <p style="margin:4px 0 0;font-size:18px;font-weight:bold;font-family:monospace;">${escapeHtml(order.orderNo)}</p>
    </div>

    <table style="width:100%;font-size:14px;border-collapse:collapse;">
      <tr>
        <td style="padding:8px 0;color:#888;width:120px;">${isZh ? '物流商' : 'Carrier'}</td>
        <td style="padding:8px 0;font-weight:500;">${escapeHtml(f?.carrier || '—')}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;color:#888;">${isZh ? '物流单号' : 'Tracking No.'}</td>
        <td style="padding:8px 0;font-weight:500;">${trackingHtml}</td>
      </tr>
    </table>

    <p style="color:#555;font-size:14px;margin-top:16px;">
      ${isZh ? '预计送达时间：7-15 个工作日（视目的国而定）' : 'Estimated delivery: 7-15 business days (varies by destination)'}
    </p>

    ${
      f?.trackingUrl
        ? `
    <div style="text-align:center;margin-top:24px;">
      <a href="${escapeHtml(f.trackingUrl)}" style="display:inline-block;background:#111;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-size:14px;">
        ${isZh ? '查询物流' : 'Track Shipment'}
      </a>
    </div>`
        : ''
    }

    <p style="color:#999;font-size:12px;margin-top:24px;text-align:center;">
      ${isZh ? '如有问题请联系 support@modelzone.cc' : 'Questions? Contact support@modelzone.cc'}
    </p>`

  try {
    await tx.sendMail({
      from: env.SMTP_FROM || env.SMTP_USER,
      to: order.email,
      subject,
      html: emailWrapper(subject, body),
    })
    logger.info({ orderNo: order.orderNo }, 'Shipping notification email sent')
  } catch (err) {
    logger.error({ err, orderNo: order.orderNo }, 'Failed to send shipping notification email')
  }
}

// ---------------------------------------------------------------------------
// FEAT-003: Refund notification email
// ---------------------------------------------------------------------------

export async function notifyOrderRefunded(
  order: OrderDocument,
  refundAmount: number,
): Promise<void> {
  const tx = getTransporter()
  if (!tx) {
    logger.debug('SMTP not configured — skipping refund notification email')
    return
  }

  const isZh = order.locale === 'zh'
  const subject = isZh
    ? `[ModelZone] 退款已处理 — ${order.orderNo}`
    : `[ModelZone] Refund Processed — ${order.orderNo}`

  const body = `
    <h2 style="color:#111;margin:0 0 16px;">${isZh ? '退款已处理' : 'Your refund has been processed'}</h2>

    <div style="background:#f9f9f9;border-radius:8px;padding:16px;margin:16px 0;">
      <p style="margin:0;font-size:14px;color:#888;">${isZh ? '订单号' : 'Order No.'}</p>
      <p style="margin:4px 0 0;font-size:18px;font-weight:bold;font-family:monospace;">${escapeHtml(order.orderNo)}</p>
    </div>

    <table style="width:100%;font-size:14px;border-collapse:collapse;">
      <tr>
        <td style="padding:8px 0;color:#888;width:120px;">${isZh ? '退款金额' : 'Refund Amount'}</td>
        <td style="padding:8px 0;font-weight:bold;font-size:18px;">${centsToDollars(refundAmount)} USD</td>
      </tr>
      <tr>
        <td style="padding:8px 0;color:#888;">${isZh ? '退款方式' : 'Refund Method'}</td>
        <td style="padding:8px 0;">${isZh ? '原路退回 PayPal' : 'Refunded to your PayPal account'}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;color:#888;">${isZh ? '预计到账' : 'Expected'}</td>
        <td style="padding:8px 0;">${isZh ? '3-5 个工作日' : '3-5 business days'}</td>
      </tr>
    </table>

    <p style="color:#555;font-size:14px;margin-top:16px;">
      ${
        isZh
          ? '退款将退回到您的 PayPal 账户。如果您使用信用卡通过 PayPal 付款，退款将退回到您的信用卡。'
          : 'The refund will be returned to your PayPal account. If you paid via credit card through PayPal, the refund will appear on your card statement.'
      }
    </p>

    <p style="color:#999;font-size:12px;margin-top:24px;text-align:center;">
      ${isZh ? '如有问题请联系 support@modelzone.cc' : 'Questions? Contact support@modelzone.cc'}
    </p>`

  try {
    await tx.sendMail({
      from: env.SMTP_FROM || env.SMTP_USER,
      to: order.email,
      subject,
      html: emailWrapper(subject, body),
    })
    logger.info({ orderNo: order.orderNo }, 'Refund notification email sent')
  } catch (err) {
    logger.error({ err, orderNo: order.orderNo }, 'Failed to send refund notification email')
  }
}
