'use client'
import { useTranslations } from 'next-intl'
import { Mail, Phone } from 'lucide-react'
import { ContactForm } from './contact-form'

export function CTA() {
  const t = useTranslations('cta')
  return (
    <section id="contact" className="py-20 sm:py-28">
      <div className="container-prose">
        <div className="bg-card overflow-hidden rounded-3xl border shadow-sm">
          <div className="grid md:grid-cols-2">
            <div className="from-primary text-primary-foreground relative overflow-hidden bg-gradient-to-br to-blue-700 p-10 sm:p-12">
              <div
                className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl"
                aria-hidden
              />
              <div className="relative">
                <p className="text-primary-foreground/75 mb-3 text-sm uppercase tracking-wider">
                  {t('eyebrow')}
                </p>
                <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">{t('title')}</h2>
                <p className="text-primary-foreground/85 mt-4 text-base">{t('description')}</p>
                <div className="text-primary-foreground/90 mt-8 space-y-3 text-sm">
                  <a
                    href="mailto:contact@globalbridge.example.com"
                    className="hover:text-primary-foreground flex items-center gap-2"
                  >
                    <Mail className="h-4 w-4" />
                    contact@globalbridge.example.com
                  </a>
                  <a
                    href="tel:+864000000000"
                    className="hover:text-primary-foreground flex items-center gap-2"
                  >
                    <Phone className="h-4 w-4" />
                    {t('phone')}
                  </a>
                </div>
              </div>
            </div>
            <div className="p-8 sm:p-12">
              <ContactForm />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
