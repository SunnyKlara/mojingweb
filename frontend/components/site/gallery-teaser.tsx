'use client'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'

/**
 * Gallery — 3 real clean product shots + 3 placeholder tiles waiting for
 * community photography. Intentionally leaves room for user-supplied content
 * so the grid never looks broken while the real assets are being sourced.
 */
type Tile =
  | { kind: 'photo'; src: string; alt: string }
  | { kind: 'placeholder'; label: string; tone: string }

const TILES: Tile[] = [
  { kind: 'photo', src: '/brand/product-scene.png', alt: 'Wind Chaser 64 on a collector desk' },
  { kind: 'photo', src: '/brand/product-black.jpg', alt: 'Wind Chaser 64 matte black' },
  { kind: 'photo', src: '/brand/product-white.jpg', alt: 'Wind Chaser 64 with accessories' },
  { kind: 'placeholder', label: 'Your build · 1:64', tone: 'from-zinc-900 to-zinc-800' },
  { kind: 'placeholder', label: 'Classroom demo', tone: 'from-zinc-800 to-zinc-700' },
  { kind: 'placeholder', label: 'Studio shoot', tone: 'from-zinc-900 to-zinc-950' },
]

export function GalleryTeaser() {
  const t = useTranslations('gallery')
  return (
    <section className="bg-background py-24 md:py-32">
      <div className="container-wide">
        <div className="mb-12 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
          <div className="max-w-xl">
            <p className="text-muted-foreground mb-4 text-[11px] font-medium uppercase tracking-[0.25em]">
              {t('eyebrow')}
            </p>
            <h2 className="text-display text-3xl font-bold tracking-tight md:text-5xl">
              {t('title')}
            </h2>
          </div>
          <p className="text-muted-foreground max-w-sm">{t('description')}</p>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
          {TILES.map((tile, i) => (
            <motion.figure
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.5, delay: i * 0.05 }}
              className={`group relative aspect-square overflow-hidden rounded-xl ${
                tile.kind === 'photo'
                  ? 'bg-zinc-100 dark:bg-zinc-900'
                  : `bg-gradient-to-br ${tile.tone}`
              }`}
            >
              {tile.kind === 'photo' ? (
                <Image
                  src={tile.src}
                  alt={tile.alt}
                  fill
                  sizes="(max-width:768px) 50vw, 33vw"
                  className="object-contain p-4 transition-transform duration-700 group-hover:scale-[1.03]"
                />
              ) : (
                <div className="relative flex h-full w-full items-center justify-center text-white/30">
                  <Plus className="h-10 w-10 stroke-[1.5]" />
                  <span className="absolute bottom-4 left-4 font-mono text-[10px] uppercase tracking-[0.2em]">
                    {tile.label}
                  </span>
                </div>
              )}
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  )
}
