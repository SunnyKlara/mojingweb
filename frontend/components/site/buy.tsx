'use client'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import { useLocale, useTranslations } from 'next-intl'
import { ArrowRight, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Link } from '@/i18n/routing'
import { cn } from '@/lib/utils'
import { api } from '@/lib/api'
import type { Product } from '@mojing/shared'

/** Fallback data used while API loads or if it fails. */
const FALLBACK_VARIANTS = [
  {
    sku: 'WC64-BLK',
    name: { zh: '曜石黑', en: 'Obsidian Black' },
    color: '#1a1a1a',
    image: '/brand/product-black.jpg',
    stock: -1,
  },
  {
    sku: 'WC64-WHT',
    name: { zh: '皓月白', en: 'Lunar White' },
    color: '#e8e8e8',
    image: '/brand/product-white.jpg',
    stock: -1,
  },
]

const FALLBACK_PRICE = 29900

const COLOR_MAP: Record<string, string> = {
  'WC64-BLK': '#1a1a1a',
  'WC64-WHT': '#e8e8e8',
}

/** Single-product spotlight + colour picker + Buy Now CTA. */
export function Buy() {
  const t = useTranslations('hero')
  const nav = useTranslations('nav')
  const locale = useLocale() as 'zh' | 'en'
  const [selected, setSelected] = useState(0)
  const [product, setProduct] = useState<Product | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const data = await api<Product>('/api/products/wind-chaser-64')
        if (!cancelled) setProduct(data)
      } catch {
        // Silently fall back to hardcoded data
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [])

  const price = product?.price ?? FALLBACK_PRICE
  const variants = product
    ? product.variants.map((v) => ({
        sku: v.sku,
        name: v.name,
        color: COLOR_MAP[v.sku] ?? '#888',
        image: v.image,
        stock: v.stock,
      }))
    : FALLBACK_VARIANTS

  const variant = variants[selected] ?? variants[0]!
  const outOfStock = variant.stock === 0

  return (
    <section id="buy" className="bg-foreground text-background py-24 md:py-32">
      <div className="container-wide">
        <div className="grid items-center gap-12 md:grid-cols-[1fr_1.1fr] md:gap-16">
          {/* Product image — swaps with variant */}
          <div className="relative aspect-square overflow-hidden rounded-3xl bg-black md:aspect-[4/5]">
            <Image
              key={variant.sku}
              src={variant.image}
              alt={`Wind Chaser 64 — ${variant.name[locale]}`}
              fill
              sizes="(max-width:768px) 100vw, 45vw"
              className="object-cover transition-opacity duration-300"
            />
          </div>

          <div>
            <p className="mb-4 inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.3em] opacity-60">
              <span className="inline-block h-2 w-2 rounded-full bg-[#E1251B]" />
              Wind Chaser 64 · 1:64
            </p>
            <h2 className="text-display text-4xl font-bold leading-[0.95] sm:text-5xl md:text-6xl">
              {t('titleLine1')}
              <br />
              {t('titleLine2')}
            </h2>
            <p className="mt-6 max-w-lg text-base opacity-70 md:text-lg">{t('description')}</p>

            {/* Price */}
            <p className="mt-8 text-3xl font-bold">${(price / 100).toFixed(2)}</p>

            {/* Stock status */}
            {product && (
              <p
                className={cn('mt-2 text-sm font-medium', {
                  'text-emerald-400': variant.stock > 10,
                  'text-amber-400': variant.stock > 0 && variant.stock <= 10,
                  'text-red-400': variant.stock === 0,
                })}
              >
                {variant.stock > 10
                  ? locale === 'zh'
                    ? '有货'
                    : 'In Stock'
                  : variant.stock > 0
                    ? locale === 'zh'
                      ? `仅剩 ${variant.stock} 件`
                      : `Low Stock — only ${variant.stock} left`
                    : locale === 'zh'
                      ? '缺货'
                      : 'Out of Stock'}
              </p>
            )}

            {/* Colour picker */}
            <div className="mt-6 flex items-center gap-3">
              {variants.map((v, i) => (
                <button
                  key={v.sku}
                  onClick={() => setSelected(i)}
                  className={cn(
                    'relative h-10 w-10 rounded-full border-2 transition-all',
                    selected === i
                      ? 'border-background scale-110 ring-2 ring-white/40'
                      : 'border-transparent opacity-60 hover:opacity-100',
                  )}
                  style={{ backgroundColor: v.color }}
                  aria-label={v.name[locale]}
                  title={v.name[locale]}
                >
                  {selected === i && (
                    <Check
                      className={cn(
                        'absolute inset-0 m-auto h-4 w-4',
                        v.sku === 'WC64-BLK' ? 'text-white' : 'text-black',
                      )}
                    />
                  )}
                </button>
              ))}
              <span className="ml-2 text-sm opacity-70">{variant.name[locale]}</span>
            </div>

            {/* CTA buttons */}
            <div className="mt-8 flex flex-wrap gap-3">
              <Button
                asChild={!outOfStock}
                size="xl"
                disabled={outOfStock}
                className="bg-background text-foreground hover:bg-background/90 rounded-full font-semibold"
              >
                {outOfStock ? (
                  <span>{locale === 'zh' ? '暂时缺货' : 'Out of Stock'}</span>
                ) : (
                  <Link href={`/checkout?sku=${variant.sku}`}>
                    {nav('cta')} — ${(price / 100).toFixed(2)}
                    <ArrowRight />
                  </Link>
                )}
              </Button>
              <Button
                asChild
                size="xl"
                variant="ghost"
                className="hover:bg-background/10 rounded-full text-white hover:text-white"
              >
                <a href="#specs">{nav('specs')}</a>
              </Button>
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3 text-[12px] opacity-60">
              <span>CE · FCC · RoHS</span>
              <span>·</span>
              <span>180 天质保</span>
              <span>·</span>
              <span>7 天无理由退货</span>
              <span>·</span>
              <span>全球配送</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
