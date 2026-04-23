'use client'
import { useTranslations } from 'next-intl'
import Image from 'next/image'

const ROWS = [
  'brand',
  'size',
  'weight',
  'chamber',
  'oil',
  'voltage',
  'material',
  'power',
  'made',
  'cert',
] as const

export function SpecsTable() {
  const t = useTranslations('specsTable')
  return (
    <section id="specs" className="bg-secondary/30 py-24 md:py-32">
      <div className="container-wide grid gap-12 md:grid-cols-[1.2fr_1fr] md:gap-16">
        <div>
          <p className="text-muted-foreground mb-4 text-[11px] font-medium uppercase tracking-[0.25em]">
            {t('eyebrow')}
          </p>
          <h2 className="text-display text-3xl font-bold leading-tight md:text-5xl">
            {t('title')}
          </h2>
          <div className="relative mt-10 hidden aspect-[5/4] overflow-hidden rounded-2xl md:block">
            <Image
              src="/brand/11.png"
              alt={t('title')}
              fill
              sizes="(max-width:768px) 100vw, 40vw"
              className="object-cover"
            />
          </div>
        </div>
        <div>
          <dl className="divide-border divide-y">
            {ROWS.map((r) => (
              <div
                key={r}
                className="grid grid-cols-[120px_1fr] gap-4 py-4 md:grid-cols-[160px_1fr]"
              >
                <dt className="text-muted-foreground text-sm">{t(`rows.${r}.k`)}</dt>
                <dd className="nums text-sm font-medium md:text-[15px]">{t(`rows.${r}.v`)}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  )
}
