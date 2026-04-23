'use client'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'

type Row = {
  ns: 'feature1' | 'feature2' | 'feature3' | 'feature4'
  /** Either a photo or an abstract visual. */
  visual:
    | { kind: 'photo'; src: string; bg: 'light' | 'dark' }
    | { kind: 'abstract'; variant: 'flow' | 'grid' }
}

const ROWS: Row[] = [
  { ns: 'feature1', visual: { kind: 'photo', src: '/brand/product-scene.png', bg: 'dark' } },
  { ns: 'feature2', visual: { kind: 'abstract', variant: 'flow' } },
  { ns: 'feature3', visual: { kind: 'photo', src: '/brand/product-white.jpg', bg: 'light' } },
  { ns: 'feature4', visual: { kind: 'abstract', variant: 'grid' } },
]

export function Features() {
  return (
    <section id="features" className="bg-background">
      {ROWS.map((row, i) => (
        <FeatureRow key={row.ns} row={row} reversed={i % 2 === 1} />
      ))}
    </section>
  )
}

function FeatureRow({ row, reversed }: { row: Row; reversed: boolean }) {
  const t = useTranslations(row.ns)
  return (
    <motion.article
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="border-b last:border-b-0"
    >
      <div className="container-wide grid items-center gap-10 py-20 md:grid-cols-2 md:gap-16 md:py-28 lg:gap-24">
        <div className={reversed ? 'md:order-2' : ''}>
          <p className="text-muted-foreground mb-4 text-[11px] font-medium uppercase tracking-[0.25em]">
            {t('eyebrow')}
          </p>
          <h3 className="text-display text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">
            {t('title')}
          </h3>
          <p className="text-muted-foreground mt-6 max-w-xl text-base leading-relaxed md:text-lg">
            {t('body')}
          </p>
          <span className="bg-foreground text-background mt-8 inline-block rounded-full px-3 py-1 text-[11px] font-medium tracking-widest">
            {t('tag')}
          </span>
        </div>
        <div className={reversed ? 'md:order-1' : ''}>
          <FeatureVisual visual={row.visual} alt={t('title')} />
        </div>
      </div>
    </motion.article>
  )
}

function FeatureVisual({ visual, alt }: { visual: Row['visual']; alt: string }) {
  if (visual.kind === 'photo') {
    return (
      <div
        className={`relative aspect-[4/3] overflow-hidden rounded-2xl ${
          visual.bg === 'dark' ? 'bg-zinc-950' : 'bg-zinc-100'
        }`}
      >
        <Image
          src={visual.src}
          alt={alt}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className={visual.bg === 'light' ? 'object-cover' : 'object-cover'}
        />
      </div>
    )
  }

  // Abstract fallback — cinematic airflow or engineered grid, no Chinese artefacts.
  return (
    <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-900 to-black">
      {visual.variant === 'flow' ? (
        <svg viewBox="0 0 400 300" className="absolute inset-0 h-full w-full">
          <defs>
            <linearGradient id="f-fade" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="white" stopOpacity="0" />
              <stop offset="40%" stopColor="white" stopOpacity="0.5" />
              <stop offset="100%" stopColor="white" stopOpacity="0" />
            </linearGradient>
          </defs>
          {Array.from({ length: 22 }).map((_, i) => {
            const y = 20 + i * 12
            const curve = 6 + (i % 4) * 4
            return (
              <path
                key={i}
                d={`M 0 ${y} Q 200 ${y - curve} 400 ${y}`}
                stroke="url(#f-fade)"
                strokeWidth={i % 4 === 0 ? 1.4 : 0.8}
                fill="none"
                opacity={0.35 + (i % 3) * 0.15}
              />
            )
          })}
          {/* Subtle car outline hint in the middle */}
          <g transform="translate(200 170)" opacity="0.6">
            <path
              d="M-40 0 Q -32 -16 -10 -18 L 14 -18 Q 36 -16 42 0 Z"
              fill="white"
              fillOpacity="0.08"
              stroke="white"
              strokeOpacity="0.2"
            />
          </g>
        </svg>
      ) : (
        <svg viewBox="0 0 400 300" className="absolute inset-0 h-full w-full">
          <defs>
            <pattern id="g" width="24" height="24" patternUnits="userSpaceOnUse">
              <path d="M24 0 H0 V24" fill="none" stroke="white" strokeOpacity="0.08" />
            </pattern>
          </defs>
          <rect width="400" height="300" fill="url(#g)" />
          {/* Measurement callouts */}
          <g stroke="white" strokeOpacity="0.3" strokeWidth="1" fill="none">
            <line x1="80" y1="150" x2="320" y2="150" />
            <line x1="80" y1="140" x2="80" y2="160" />
            <line x1="320" y1="140" x2="320" y2="160" />
          </g>
          <text
            x="200"
            y="140"
            textAnchor="middle"
            className="font-mono"
            fill="white"
            fillOpacity="0.7"
            fontSize="11"
            letterSpacing="3"
          >
            134mm
          </text>
          <g stroke="white" strokeOpacity="0.3" strokeWidth="1" fill="none">
            <line x1="80" y1="80" x2="80" y2="220" />
            <line x1="70" y1="80" x2="90" y2="80" />
            <line x1="70" y1="220" x2="90" y2="220" />
          </g>
          <text
            x="54"
            y="155"
            textAnchor="middle"
            className="font-mono"
            fill="white"
            fillOpacity="0.7"
            fontSize="10"
            letterSpacing="2"
            transform="rotate(-90 54 155)"
          >
            54mm
          </text>
        </svg>
      )}
    </div>
  )
}
