'use client'
import Image from 'next/image'
import { motion } from 'framer-motion'

/**
 * Poster slide: shows a bare marketing image that already carries its own
 * Chinese copy baked in. Subtle entrance animation, constrained width,
 * black stage. Use for images from /brand/ that are fully composed posters.
 */
export function PosterSlide({
  src,
  alt,
  maxWidth = 960,
}: {
  src: string
  alt: string
  /** Max width in px (default 960). */
  maxWidth?: number
}) {
  return (
    <section className="bg-black py-8 md:py-16">
      <motion.div
        initial={{ opacity: 0, y: 36 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-120px' }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto px-4"
        style={{ maxWidth }}
      >
        <Image
          src={src}
          alt={alt}
          width={2048}
          height={1536}
          sizes="(max-width: 960px) 100vw, 960px"
          className="mx-auto block h-auto max-h-[80vh] w-full object-contain"
        />
      </motion.div>
    </section>
  )
}
