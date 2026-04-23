'use client'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { Package } from 'lucide-react'

const ITEMS = ['i1', 'i2', 'i3', 'i4', 'i5', 'i6', 'i7'] as const

export function PackageContents() {
  const t = useTranslations('package')
  return (
    <section className="bg-background py-24 md:py-32">
      <div className="container-wide grid items-center gap-12 md:grid-cols-2 md:gap-16">
        <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-black">
          <Image
            src="/brand/10.png"
            alt={t('title')}
            fill
            sizes="(max-width:768px) 100vw, 50vw"
            className="object-cover"
          />
        </div>
        <div>
          <p className="text-muted-foreground mb-4 text-[11px] font-medium uppercase tracking-[0.25em]">
            {t('eyebrow')}
          </p>
          <h2 className="text-display text-3xl font-bold leading-tight md:text-5xl">
            {t('title')}
          </h2>
          <ul className="mt-10 grid gap-3">
            {ITEMS.map((i, idx) => (
              <li
                key={i}
                className="border-border/70 flex items-center gap-4 border-b pb-3 text-[15px]"
              >
                <span className="bg-muted text-muted-foreground grid h-8 w-8 place-items-center rounded-full font-mono text-xs">
                  {String(idx + 1).padStart(2, '0')}
                </span>
                <span>{t(`items.${i}`)}</span>
              </li>
            ))}
          </ul>
          <p className="text-muted-foreground mt-8 inline-flex items-center gap-2 text-xs">
            <Package className="h-4 w-4" />
            ModelZone 模境 · Wind Chaser 64
          </p>
        </div>
      </div>
    </section>
  )
}
