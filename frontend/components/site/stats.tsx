'use client'
import { useTranslations } from 'next-intl'
import { motion } from 'framer-motion'

const stats = [
  { key: 'clients', value: '500+' },
  { key: 'countries', value: '30+' },
  { key: 'years', value: '8' },
  { key: 'satisfaction', value: '98%' },
] as const

export function Stats() {
  const t = useTranslations('stats')
  return (
    <section className="from-primary text-primary-foreground border-y bg-gradient-to-br to-blue-700 py-16">
      <div className="container-prose">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {stats.map((s, i) => (
            <motion.div
              key={s.key}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: i * 0.06 }}
              className="text-center"
            >
              <div className="text-3xl font-bold tracking-tight sm:text-5xl">{s.value}</div>
              <div className="text-primary-foreground/75 mt-1 text-sm">{t(s.key)}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
