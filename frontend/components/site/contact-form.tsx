'use client'
import { useState, type FormEvent } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { Loader2, Send } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

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
    setLoading(true)
    try {
      await api('/api/leads', {
        method: 'POST',
        body: JSON.stringify({
          ...state,
          source: typeof window !== 'undefined' ? window.location.pathname : 'home',
          locale,
        }),
      })
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
