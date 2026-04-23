'use client'
import { useTranslations } from 'next-intl'
import { motion } from 'framer-motion'
import { ShieldCheck, RotateCcw, Wrench } from 'lucide-react'

const ITEMS = [
  { k: 'w1' as const, Icon: ShieldCheck },
  { k: 'w2' as const, Icon: RotateCcw },
  { k: 'w3' as const, Icon: Wrench },
]

export function Warranty() {
  const t = useTranslations('warranty')
  return (
    <section className="bg-background border-y py-24 md:py-32">
      <div className="container-wide">
        <div className="mx-auto mb-14 max-w-3xl text-center">
          <p className="text-muted-foreground mb-4 text-[11px] font-medium uppercase tracking-[0.25em]">
            {t('eyebrow')}
          </p>
          <h2 className="text-display text-3xl font-bold tracking-tight md:text-5xl">
            {t('title')}
          </h2>
        </div>
        <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-3">
          {ITEMS.map(({ k, Icon }, i) => (
            <motion.div
              key={k}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="bg-card flex items-center gap-5 rounded-2xl border p-6 md:p-8"
            >
              <span className="bg-foreground text-background grid h-12 w-12 shrink-0 place-items-center rounded-full">
                <Icon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-display text-2xl font-bold">{t(`items.${k}.k`)}</p>
                <p className="text-muted-foreground text-sm">{t(`items.${k}.v`)}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
