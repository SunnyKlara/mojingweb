import nodemailer, { type Transporter } from 'nodemailer'
import { env } from '../config/env'
import { logger } from '../config/logger'
import type { VisitorInfo } from '@mojing/shared'

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

/**
 * Notifies NOTIFY_EMAIL when a visitor sends a new message.
 * Silently skips if SMTP is not configured.
 *
 * FIX: aligned field names with VisitorInfo (was reading visitorName/visitorEmail
 * while server passed spread visitorInfo with name/email — always printed 未填写).
 */
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
