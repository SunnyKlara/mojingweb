'use client'
import { motion } from 'framer-motion'

/**
 * Horizontal band of huge numbers on a muted stage.
 * Each number = real Wind Chaser 64 specification.
 */
const STATS = [
  { value: '1:64', unit: '', label: '专为车模比例' },
  { value: '134', unit: 'mm', label: '腔内长度' },
  { value: '30', unit: 'ml', label: '烟油仓容量' },
  { value: '476', unit: 'g', label: '整机重量' },
]

export function StatBand() {
  return (
    <section className="bg-[#0e0e0e] py-24 text-white md:py-32">
      <div className="container-wide">
        <div className="grid grid-cols-2 gap-y-12 md:grid-cols-4 md:gap-y-0">
          {STATS.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.6, delay: i * 0.08 }}
              className="px-4 text-center md:border-l md:border-white/10 md:first:border-l-0"
            >
              <p className="text-display nums text-5xl font-bold leading-none md:text-7xl">
                {s.value}
                {s.unit ? (
                  <span className="ml-1 align-top text-lg font-normal opacity-60 md:text-2xl">
                    {s.unit}
                  </span>
                ) : null}
              </p>
              <p className="mt-4 text-xs tracking-[0.2em] opacity-50">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
