'use client'
import { useTranslations } from 'next-intl'

/** Three-quote grid on a muted band. Brand voice, no fake outlet logos. */
export function Press() {
  const t = useTranslations('press')
  const quotes = ['q1', 'q2', 'q3'] as const
  return (
    <section className="bg-secondary/20 border-y py-24 md:py-28">
      <div className="container-wide">
        <div className="mx-auto mb-12 max-w-3xl text-center">
          <p className="text-muted-foreground mb-4 text-[11px] font-medium uppercase tracking-[0.25em]">
            {t('eyebrow')}
          </p>
          <h2 className="text-display text-3xl font-bold tracking-tight md:text-5xl">
            {t('title')}
          </h2>
        </div>
        <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-3">
          {quotes.map((q, i) => (
            <blockquote
              key={q}
              className="bg-card flex flex-col justify-between rounded-2xl border p-8"
            >
              <p className="text-display text-lg font-semibold leading-relaxed md:text-xl">
                “{t(`quotes.${q}`)}”
              </p>
              <span className="text-muted-foreground mt-6 font-mono text-xs tracking-wider">
                0{i + 1}
              </span>
            </blockquote>
          ))}
        </div>
      </div>
    </section>
  )
}
