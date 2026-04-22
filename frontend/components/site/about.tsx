'use client'
import { useTranslations } from 'next-intl'
import { Check } from 'lucide-react'
import { Section } from './section'

export function About() {
  const t = useTranslations('about')
  const bullets = ['b1', 'b2', 'b3', 'b4', 'b5', 'b6'] as const

  return (
    <Section id="about" eyebrow={t('eyebrow')} title={t('title')}>
      <div className="grid gap-12 md:grid-cols-2 md:gap-16">
        <div>
          <p className="text-muted-foreground leading-relaxed">{t('paragraph1')}</p>
          <p className="text-muted-foreground mt-4 leading-relaxed">{t('paragraph2')}</p>
        </div>
        <div className="bg-card rounded-2xl border p-6">
          <ul className="grid gap-3">
            {bullets.map((key) => (
              <li key={key} className="flex items-start gap-3">
                <span className="bg-primary/15 text-primary mt-0.5 grid h-5 w-5 flex-shrink-0 place-items-center rounded-full">
                  <Check className="h-3 w-3" />
                </span>
                <span className="text-foreground text-sm">{t(`bullets.${key}`)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Section>
  )
}
