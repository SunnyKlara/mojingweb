'use client'
import { useTranslations } from 'next-intl'
import { motion } from 'framer-motion'
import { Quote } from 'lucide-react'
import { Section } from './section'

const KEYS = ['manufacturing', 'saas', 'consumer'] as const

export function Cases() {
  const t = useTranslations('cases')
  return (
    <Section
      id="cases"
      eyebrow={t('eyebrow')}
      title={t('title')}
      description={t('description')}
      centered
    >
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {KEYS.map((key, i) => (
          <motion.div
            key={key}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.3, delay: i * 0.06 }}
            className="bg-card hover:border-primary/40 group relative overflow-hidden rounded-2xl border p-6 transition-all hover:shadow-md"
          >
            <Quote className="text-primary/10 absolute right-6 top-6 h-10 w-10" />
            <div className="relative">
              <div className="text-primary mb-2 text-xs uppercase tracking-wider">
                {t(`items.${key}.industry`)}
              </div>
              <div className="mb-4 text-lg font-semibold">{t(`items.${key}.name`)}</div>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {t(`items.${key}.result`)}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </Section>
  )
}
