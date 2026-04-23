'use client'
import { motion } from 'framer-motion'

/**
 * Pure typography slide — big Chinese headline on black.
 * Used between photo slides as a "breath" of pure text.
 */
export function MegaType({
  eyebrow,
  zh,
  en,
  children,
}: {
  eyebrow?: string
  zh: string
  en?: string
  children?: React.ReactNode
}) {
  return (
    <section className="relative overflow-hidden bg-black py-32 text-white md:py-48">
      <div className="container-wide">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-120px' }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto max-w-5xl text-center"
        >
          {eyebrow ? (
            <p className="mb-8 inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.3em] opacity-60">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#E1251B]" />
              {eyebrow}
            </p>
          ) : null}
          <h2 className="text-display text-4xl font-bold leading-[1.05] sm:text-6xl md:text-7xl lg:text-[88px]">
            {zh}
          </h2>
          {en ? (
            <p className="text-muted-foreground mt-8 font-mono text-sm tracking-[0.15em] opacity-50">
              {en}
            </p>
          ) : null}
          {children}
        </motion.div>
      </div>
    </section>
  )
}
