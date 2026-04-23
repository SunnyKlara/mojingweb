'use client'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

/** Single-product spotlight + buy card, replaces editions / pricing plans. */
export function Buy() {
  const t = useTranslations('hero')
  const nav = useTranslations('nav')

  return (
    <section id="buy" className="bg-foreground text-background py-24 md:py-32">
      <div className="container-wide">
        <div className="grid items-center gap-12 md:grid-cols-[1fr_1.1fr] md:gap-16">
          <div className="relative aspect-square overflow-hidden rounded-3xl bg-black md:aspect-[4/5]">
            <Image
              src="/brand/0.png"
              alt="Wind Chaser 64"
              fill
              sizes="(max-width:768px) 100vw, 45vw"
              className="object-cover"
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

            <div className="mt-10 flex flex-wrap gap-3">
              <Button
                asChild
                size="xl"
                className="bg-background text-foreground hover:bg-background/90 rounded-full font-semibold"
              >
                <a href="#contact">
                  {nav('cta')}
                  <ArrowRight />
                </a>
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
