'use client'
import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Menu, X } from 'lucide-react'
import { Link } from '@/i18n/routing'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/site/logo'
import { ThemeToggle } from '@/components/theme-toggle'
import { LanguageSwitcher } from '@/components/language-switcher'
import { cn } from '@/lib/utils'

export function NavBar() {
  const t = useTranslations('nav')
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  const links = [
    { href: '#features', label: t('product') },
    { href: '#specs', label: t('specs') },
    { href: '/cases', label: t('gallery') },
    { href: '/blog', label: t('journal') },
    { href: '#contact', label: t('support') },
  ]

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={cn(
        'sticky top-0 z-40 w-full transition-all',
        scrolled
          ? 'bg-background/80 border-b backdrop-blur-xl'
          : 'border-transparent bg-transparent',
      )}
    >
      <div className="container-wide flex h-14 items-center justify-between gap-6">
        <Link href="/" aria-label="ModelZone home" className="shrink-0">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-muted-foreground hover:text-foreground rounded-md px-3 py-1.5 text-[13px] font-medium tracking-wide transition-colors"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-1 md:flex">
          <LanguageSwitcher />
          <ThemeToggle />
          <Button asChild size="sm" className="ml-1 rounded-full px-4">
            <a href="#buy">{t('cta')}</a>
          </Button>
        </div>

        <button
          className="rounded-md p-2 md:hidden"
          onClick={() => setOpen((o) => !o)}
          aria-label={t('toggleMenu')}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="bg-background border-t md:hidden">
          <div className="container-wide flex flex-col py-3">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="text-muted-foreground hover:bg-accent hover:text-foreground rounded-md px-3 py-2 text-sm"
              >
                {l.label}
              </a>
            ))}
            <div className="mt-2 flex items-center gap-2 border-t pt-3">
              <LanguageSwitcher />
              <ThemeToggle />
              <Button asChild size="sm" className="flex-1 rounded-full">
                <a href="#buy" onClick={() => setOpen(false)}>
                  {t('cta')}
                </a>
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
