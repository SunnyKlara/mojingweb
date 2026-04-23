'use client'
import { useTranslations } from 'next-intl'

/** Black band with 4 big specs — sits directly under the hero for impact. */
export function SpecStrip() {
  const t = useTranslations('specStrip')
  const keys = ['outer', 'inner', 'power', 'oil'] as const
  return (
    <section className="bg-foreground text-background">
      <div className="container-wide grid grid-cols-2 gap-y-10 py-14 md:grid-cols-4 md:py-16">
        {keys.map((k) => (
          <div
            key={k}
            className="px-4 text-center md:border-l md:border-white/10 md:first:border-l-0"
          >
            <p className="text-display nums text-2xl font-bold md:text-3xl">
              {t(`items.${k}.value`)}
              <span className="ml-1 text-base font-normal opacity-60">{t(`items.${k}.unit`)}</span>
            </p>
            <p className="mt-2 text-[11px] uppercase tracking-[0.2em] opacity-50">
              {t(`items.${k}.label`)}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
