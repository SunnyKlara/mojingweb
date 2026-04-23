'use client'
import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { Wind } from 'lucide-react'

/**
 * Three-card showcase emphasizing what ModelZone looks like in motion.
 * Uses the "speed" red theme for this section (performance chapter).
 */
export function InAction() {
  const t = useTranslations('inAction')
  const caps = ['c1', 'c2', 'c3'] as const

  return (
    <section id="in-action" className="theme-speed bg-background py-24 md:py-32">
      <div className="container-wide">
        <div className="mx-auto mb-14 max-w-3xl text-center">
          <p className="text-primary mb-3 text-[11px] font-medium uppercase tracking-[0.2em]">
            {t('eyebrow')}
          </p>
          <h2 className="text-display text-4xl font-bold tracking-tight md:text-6xl">
            {t('title')}
          </h2>
          <p className="text-muted-foreground mt-5 text-base md:text-lg">{t('description')}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {caps.map((k, i) => (
            <motion.div
              key={k}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.6, delay: i * 0.08 }}
              className="group relative aspect-[4/5] overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-900 to-zinc-800 text-white"
            >
              {/* Smoke streamlines */}
              <div aria-hidden className="absolute inset-0 opacity-40">
                {Array.from({ length: 8 }).map((_, j) => (
                  <motion.div
                    key={j}
                    className="absolute h-[1px] w-full bg-gradient-to-r from-transparent via-white/80 to-transparent"
                    style={{ top: `${15 + j * 10}%` }}
                    initial={{ x: '-100%' }}
                    animate={{ x: '100%' }}
                    transition={{
                      duration: 4 + (j % 3),
                      repeat: Infinity,
                      ease: 'linear',
                      delay: j * 0.3,
                    }}
                  />
                ))}
              </div>
              {/* Glow */}
              <div
                aria-hidden
                className="bg-primary/20 absolute -right-16 -top-16 h-48 w-48 rounded-full blur-3xl transition-transform duration-700 group-hover:scale-150"
              />
              {/* Icon + caption */}
              <div className="relative flex h-full flex-col justify-between p-6">
                <div className="bg-primary grid h-10 w-10 place-items-center rounded-full text-white">
                  <Wind className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-mono text-xs text-white/40">0{i + 1}</p>
                  <p className="mt-2 text-lg font-medium leading-snug">{t(`captions.${k}`)}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
