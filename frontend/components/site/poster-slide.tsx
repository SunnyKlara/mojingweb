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
  maxWidth = 1200,
}: {
  src: string
  alt: string
  /** Max width in px (default 1200). */
  maxWidth?: number
}) {
  return (
    <section className="bg-black py-10 md:py-20">
      <motion.div
        initial={{ opacity: 0, y: 36 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-120px' }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto"
        style={{ maxWidth }}
      >
        <Image
          src={src}
          alt={alt}
          width={2048}
          height={1536}
          sizes="(max-width: 1200px) 100vw, 1200px"
          className="block h-auto w-full"
        />
      </motion.div>
    </section>
  )
}
