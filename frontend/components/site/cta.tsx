'use client'
import { useLocale } from 'next-intl'
import { Mail, MapPin, ArrowRight } from 'lucide-react'
import { ContactForm } from './contact-form'

const COPY = {
  en: {
    eyebrow: 'Contact',
    title: 'Talk to us about Wind Chaser 64.',
    description:
      'Wholesale, press, technical questions, or just to say hi — we reply within one business day.',
    hours: 'Mon–Fri · 9:00–18:00 (GMT+8)',
    location: 'Dongguan, Guangdong · China',
  },
  zh: {
    eyebrow: '联系模境',
    title: '聊聊 Wind Chaser 64。',
    description: '批发、媒体、技术咨询，或者只是想打个招呼——一个工作日内回复。',
    hours: '周一至周五 · 9:00–18:00 (GMT+8)',
    location: '中国 · 广东东莞',
  },
}

export function CTA() {
  const locale = useLocale() as 'en' | 'zh'
  const t = COPY[locale] ?? COPY.en

  return (
    <section id="contact" className="bg-secondary/30 py-24 md:py-32">
      <div className="container-wide">
        <div className="bg-card overflow-hidden rounded-3xl border shadow-sm">
          <div className="grid md:grid-cols-[1.1fr_1fr]">
            {/* Left info panel */}
            <div className="bg-foreground text-background relative overflow-hidden p-10 md:p-14">
              <div className="relative">
                <p className="mb-4 inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.3em] opacity-60">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#E1251B]" />
                  {t.eyebrow}
                </p>
                <h2 className="text-display text-4xl font-bold leading-tight md:text-5xl">
                  {t.title}
                </h2>
                <p className="mt-5 max-w-md text-base opacity-70">{t.description}</p>

                <ul className="mt-10 space-y-4 text-sm">
                  <li className="flex items-center gap-3">
                    <span className="bg-background/10 grid h-8 w-8 place-items-center rounded-full">
                      <Mail className="h-4 w-4" />
                    </span>
                    <a
                      href="mailto:hello@modelzone.com"
                      className="transition-opacity hover:opacity-80"
                    >
                      hello@modelzone.com
                    </a>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="bg-background/10 grid h-8 w-8 place-items-center rounded-full">
                      <MapPin className="h-4 w-4" />
                    </span>
                    <span className="opacity-80">{t.location}</span>
                  </li>
                  <li className="flex items-center gap-3 opacity-60">
                    <span className="bg-background/10 grid h-8 w-8 place-items-center rounded-full">
                      <ArrowRight className="h-4 w-4" />
                    </span>
                    <span className="text-xs tracking-wide">{t.hours}</span>
                  </li>
                </ul>
              </div>
            </div>
            {/* Form */}
            <div className="p-8 md:p-14">
              <ContactForm />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
