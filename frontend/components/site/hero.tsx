'use client'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'

/**
 * Hero = the /brand/1.png marketing poster rendered full-bleed.
 * The image already carries its own typography ("WindCheaser 64 模型风洞 · 定义 气动美学").
 * We add nothing on top except a subtle floating CTA pill near the bottom.
 */
export function Hero() {
  return (
    <section className="relative w-full overflow-hidden bg-black">
      <div className="relative w-full">
        <Image
          src="/brand/1.png"
          alt="Wind Chaser 64 · 模型风洞 · 定义 气动美学"
          width={2048}
          height={1536}
          priority
          sizes="100vw"
          className="block h-auto w-full"
        />
        {/* Floating CTA pill bottom-center */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.1, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-x-0 bottom-6 flex justify-center md:bottom-12"
        >
          <a
            href="#buy"
            className="inline-flex items-center gap-2 rounded-full bg-white/95 px-6 py-3 text-sm font-semibold text-black shadow-2xl backdrop-blur transition-colors hover:bg-white md:px-7 md:py-3.5 md:text-base"
          >
            立即购买 · Wind Chaser 64
            <ArrowRight className="h-4 w-4" />
          </a>
        </motion.div>
      </div>
    </section>
  )
}
