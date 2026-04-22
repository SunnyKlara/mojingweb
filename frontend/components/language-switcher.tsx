'use client'
import { useLocale } from 'next-intl'
import { Languages } from 'lucide-react'
import { usePathname, useRouter, type routing } from '@/i18n/routing'
import { Button } from '@/components/ui/button'

export function LanguageSwitcher() {
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()

  const nextLocale = locale === 'zh' ? 'en' : 'zh'

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Switch language"
      onClick={() =>
        router.replace(pathname, { locale: nextLocale as (typeof routing.locales)[number] })
      }
      className="relative"
    >
      <Languages className="h-4 w-4" />
      <span className="text-muted-foreground absolute -bottom-1 right-0 text-[9px] font-semibold uppercase">
        {locale}
      </span>
    </Button>
  )
}
