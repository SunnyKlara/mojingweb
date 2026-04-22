'use client'
import { useTranslations } from 'next-intl'
import { Mail, Phone } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function CTA() {
  const t = useTranslations('cta')
  return (
    <section id="contact" className="py-20 sm:py-28">
      <div className="container-prose">
        <div className="from-primary text-primary-foreground relative overflow-hidden rounded-3xl border bg-gradient-to-br to-blue-700 p-10 sm:p-16">
          <div
            className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl"
            aria-hidden
          />
          <div className="relative max-w-xl">
            <p className="text-primary-foreground/75 mb-3 text-sm uppercase tracking-wider">
              {t('eyebrow')}
            </p>
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">{t('title')}</h2>
            <p className="text-primary-foreground/85 mt-4 text-base">{t('description')}</p>
            <div className="mt-8 flex flex-col items-start gap-4 sm:flex-row">
              <Button asChild size="lg" variant="secondary">
                <a href="mailto:contact@globalbridge.example.com">
                  <Mail />
                  {t('email')}
                </a>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="text-primary-foreground hover:text-primary-foreground border-white/30 bg-transparent hover:bg-white/10"
              >
                <a href="tel:+864000000000">
                  <Phone />
                  {t('phone')}
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
