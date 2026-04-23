'use client'
import { useState, type FormEvent } from 'react'
import { useTranslations } from 'next-intl'
import { ArrowRight, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function Newsletter() {
  const t = useTranslations('newsletter')
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    // Hook this up to the backend /api/leads endpoint with a "newsletter" source tag.
    if (!email) return
    setSent(true)
  }

  return (
    <section className="bg-foreground text-background relative isolate overflow-hidden">
      {/* Subtle grid overlay */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            'linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />
      <div className="container-wide relative py-24 md:py-32">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-4 inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.3em] opacity-60">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#E1251B]" />
            {t('eyebrow')}
          </p>
          <h2 className="text-display text-4xl font-bold tracking-tight md:text-6xl">
            {t('title')}
          </h2>
          <p className="mt-5 text-base opacity-70 md:text-lg">{t('description')}</p>

          <form
            onSubmit={onSubmit}
            className="mx-auto mt-10 flex max-w-md gap-2"
            aria-live="polite"
          >
            <Input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('placeholder')}
              aria-label={t('placeholder')}
              className="bg-background/10 placeholder:text-background/40 h-11 rounded-full border-white/20 text-white"
            />
            <Button
              type="submit"
              size="lg"
              disabled={sent}
              className="bg-background text-foreground hover:bg-background/90 rounded-full"
            >
              {sent ? <Check /> : <ArrowRight />}
              {sent ? 'Done' : t('cta')}
            </Button>
          </form>

          <p className="mt-4 text-[11px] opacity-50">{t('consent')}</p>
        </div>
      </div>
    </section>
  )
}
