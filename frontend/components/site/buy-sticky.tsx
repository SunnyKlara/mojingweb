'use client'
import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { ArrowRight } from 'lucide-react'

/**
 * Sticky bottom buy bar — Taobao 商品详情页底部 "立即购买" 栏.
 * Appears after user scrolls past first fold.
 */
export function BuySticky() {
  const [show, setShow] = useState(false)
  const t = useTranslations('nav')

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 480)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div
      className={`pointer-events-none fixed inset-x-0 bottom-0 z-40 transition-all duration-500 ${
        show ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
      }`}
    >
      <div className="container-wide pb-4">
        <div className="bg-foreground text-background pointer-events-auto mx-auto flex max-w-[900px] items-center justify-between gap-4 rounded-full border border-white/10 px-6 py-3 shadow-2xl backdrop-blur">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-[0.25em] opacity-60">
              Wind Chaser 64 · 1:64 模型风洞
            </p>
            <p className="truncate text-[13px] font-medium">180 天质保 · 7 天无理由 · 全球配送</p>
          </div>
          <a
            href="#contact"
            className="bg-background text-foreground hover:bg-background/90 inline-flex shrink-0 items-center gap-1.5 rounded-full px-5 py-2 text-sm font-semibold transition-colors"
          >
            {t('cta')}
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    </div>
  )
}
