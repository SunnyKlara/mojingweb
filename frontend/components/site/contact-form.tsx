'use client'
import { useState, type FormEvent } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { Loader2, Send } from 'lucide-react'
import { toast } from 'sonner'
import * as Sentry from '@sentry/nextjs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { BACKEND_URL } from '@/lib/api'

const WEB3FORMS_ACCESS_KEY =
  process.env.NEXT_PUBLIC_WEB3FORMS_KEY || '8c39082d-f552-47ad-a587-8473346f770d'
const WEB3FORMS_ENDPOINT = 'https://api.web3forms.com/submit'
const PRIMARY_TIMEOUT_MS = 5000

interface FormState {
  name: string
  email: string
  company: string
  phone: string
  message: string
  /** Honeypot — kept hidden via CSS, real users leave it empty. */
  website: string
}

const initial: FormState = {
  name: '',
  email: '',
  company: '',
  phone: '',
  message: '',
  website: '',
}

/**
 * 4xx from our backend = user input problem (validation, rate-limit).
 * Surface it to the user, do NOT fall back to Web3Forms with the same
 * (invalid) data — the fallback would mask the real error.
 */
class LeadClientError extends Error {}

/**
 * 5xx / network / timeout from our backend = infrastructure problem.
 * Acceptable to fall back to Web3Forms so the lead is still captured.
 */
class LeadServerError extends Error {}

async function submitToOwnBackend(payload: Record<string, unknown>): Promise<void> {
  // Read CSRF double-submit cookie for state-changing request.
  let csrfToken: string | undefined
  if (typeof document !== 'undefined') {
    const match = document.cookie.match(/(?:^|;\s*)mojing_csrf=([^;]+)/)
    if (match?.[1]) csrfToken = decodeURIComponent(match[1])
  }

  let res: Response
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (csrfToken) headers['X-CSRF-Token'] = csrfToken

    res = await fetch(`${BACKEND_URL}/api/leads`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      credentials: 'include',
      signal: AbortSignal.timeout(PRIMARY_TIMEOUT_MS),
    })
  } catch (err) {
    // Network error, DNS failure, or AbortSignal timeout.
    throw new LeadServerError(err instanceof Error ? err.message : 'Network error')
  }
  if (res.ok) return
  const body = (await res.json().catch(() => ({}))) as { error?: string }
  if (res.status >= 400 && res.status < 500) {
    throw new LeadClientError(body.error || `Request rejected (${res.status})`)
  }
  throw new LeadServerError(body.error || `Backend ${res.status}`)
}

async function submitToWeb3Forms(state: FormState, locale: string): Promise<void> {
  const res = await fetch(WEB3FORMS_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      access_key: WEB3FORMS_ACCESS_KEY,
      subject: `ModelZone · New inquiry from ${state.name || 'anonymous'}`,
      from_name: state.name,
      name: state.name,
      email: state.email,
      company: state.company,
      phone: state.phone,
      message: state.message,
      source: typeof window !== 'undefined' ? window.location.pathname : 'home',
      locale,
      botcheck: '',
    }),
  })
  const data = (await res.json().catch(() => ({}))) as { success?: boolean; message?: string }
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Submission failed')
  }
}

export function ContactForm() {
  const t = useTranslations('form')
  const locale = useLocale()
  const [state, setState] = useState<FormState>(initial)
  const [loading, setLoading] = useState(false)

  const update =
    (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setState((s) => ({ ...s, [key]: e.target.value }))
    }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (loading) return
    // Honeypot: if bots fill the hidden `website` field, silently drop.
    if (state.website) return
    setLoading(true)
    try {
      const payload = {
        name: state.name,
        email: state.email,
        company: state.company || undefined,
        phone: state.phone || undefined,
        message: state.message,
        source: typeof window !== 'undefined' ? window.location.pathname : 'home',
        locale,
        website: state.website, // honeypot — server rejects if non-empty
      }
      try {
        await submitToOwnBackend(payload)
      } catch (err) {
        if (err instanceof LeadClientError) {
          // User-facing problem. Surface it, do not fall back.
          throw err
        }
        // Infra problem. Log + fall back to Web3Forms.
        Sentry.captureMessage('contact-form: primary backend failed, using Web3Forms', {
          level: 'warning',
          extra: { reason: err instanceof Error ? err.message : String(err) },
        })
        await submitToWeb3Forms(state, locale)
      }
      toast.success(t('success'))
      setState(initial)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('failure'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="lead-name">
            {t('name')} <span className="text-destructive">*</span>
          </Label>
          <Input
            id="lead-name"
            required
            autoComplete="name"
            placeholder={t('namePlaceholder')}
            value={state.name}
            onChange={update('name')}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="lead-email">
            {t('email')} <span className="text-destructive">*</span>
          </Label>
          <Input
            id="lead-email"
            required
            type="email"
            autoComplete="email"
            placeholder={t('emailPlaceholder')}
            value={state.email}
            onChange={update('email')}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="lead-company">{t('company')}</Label>
          <Input
            id="lead-company"
            autoComplete="organization"
            placeholder={t('companyPlaceholder')}
            value={state.company}
            onChange={update('company')}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="lead-phone">{t('phone')}</Label>
          <Input
            id="lead-phone"
            autoComplete="tel"
            placeholder={t('phonePlaceholder')}
            value={state.phone}
            onChange={update('phone')}
          />
        </div>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="lead-message">
          {t('message')} <span className="text-destructive">*</span>
        </Label>
        <textarea
          id="lead-message"
          required
          rows={4}
          placeholder={t('messagePlaceholder')}
          value={state.message}
          onChange={update('message')}
          className="bg-background border-input placeholder:text-muted-foreground focus-visible:ring-ring flex w-full rounded-md border px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>
      {/* Honeypot — hidden visually */}
      <div aria-hidden className="hidden">
        <label>
          Website
          <input
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={state.website}
            onChange={update('website')}
          />
        </label>
      </div>
      <Button type="submit" size="lg" disabled={loading} className="w-fit">
        {loading ? <Loader2 className="animate-spin" /> : <Send />}
        {loading ? t('submitting') : t('submit')}
      </Button>
    </form>
  )
}
