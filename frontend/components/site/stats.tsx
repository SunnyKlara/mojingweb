'use client'
import { motion } from 'framer-motion'

const stats = [
  { value: '500+', label: '合作企业' },
  { value: '30+', label: '覆盖国家' },
  { value: '8年', label: '行业经验' },
  { value: '98%', label: '客户满意度' },
]

export function Stats() {
  return (
    <section className="from-primary text-primary-foreground border-y bg-gradient-to-br to-blue-700 py-16">
      <div className="container-prose">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: i * 0.06 }}
              className="text-center"
            >
              <div className="text-3xl font-bold tracking-tight sm:text-5xl">{s.value}</div>
              <div className="text-primary-foreground/75 mt-1 text-sm">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
