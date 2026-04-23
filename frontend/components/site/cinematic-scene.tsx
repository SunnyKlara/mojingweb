'use client'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

/**
 * Cinematic scene: one full-bleed image slide with optional text overlay.
 * Images that already carry Chinese copy can be shown bare (showText = false),
 * while clean product shots support centered / cornered overlay text.
 */
export function CinematicScene({
  src,
  alt,
  height = 'h-screen',
  position = 'center',
  children,
  priority,
}: {
  src: string
  alt: string
  height?: string
  position?: 'center' | 'bottom-left' | 'top-left'
  children?: React.ReactNode
  priority?: boolean
}) {
  const posClass =
    position === 'center'
      ? 'items-center justify-center text-center'
      : position === 'top-left'
        ? 'items-start justify-start text-left pt-20 md:pt-28'
        : 'items-end justify-start text-left pb-16 md:pb-24'

  return (
    <section
      className={cn(
        'relative isolate flex w-full overflow-hidden bg-black text-white',
        posClass,
        height,
      )}
    >
      <Image src={src} alt={alt} fill priority={priority} sizes="100vw" className="object-cover" />
      {children ? (
        <>
          <div aria-hidden className="absolute inset-0 bg-black/30" />
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 max-w-4xl px-6"
          >
            {children}
          </motion.div>
        </>
      ) : null}
    </section>
  )
}
