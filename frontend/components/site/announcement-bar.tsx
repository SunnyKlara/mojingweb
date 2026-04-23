'use client'
import { useState } from 'react'
import { X, ArrowRight } from 'lucide-react'
import { useTranslations } from 'next-intl'

export function AnnouncementBar() {
  const t = useTranslations('announcement')
  const [hidden, setHidden] = useState(false)
  if (hidden) return null

  return (
    <div className="bg-foreground text-background relative z-50 overflow-hidden">
      <div className="container-wide flex h-9 items-center justify-between gap-4 text-[12px] tracking-wide">
        <span className="flex-1 truncate">
          <span className="bg-primary mr-2 inline-block h-1.5 w-1.5 -translate-y-[2px] rounded-full align-middle" />
          {t('message')}
        </span>
        <a
          href="#buy"
          className="hover:text-primary inline-flex shrink-0 items-center gap-1 transition-colors"
        >
          {t('cta')}
          <ArrowRight className="h-3 w-3" />
        </a>
        <button
          aria-label="dismiss"
          onClick={() => setHidden(true)}
          className="hover:text-primary -mr-1 shrink-0 p-1 opacity-70 transition-opacity hover:opacity-100"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}
