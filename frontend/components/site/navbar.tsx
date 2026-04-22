'use client'
import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Menu, X, Globe } from 'lucide-react'
import { Link } from '@/i18n/routing'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import { LanguageSwitcher } from '@/components/language-switcher'
import { cn } from '@/lib/utils'

export function NavBar() {
  const t = useTranslations('nav')
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  const links = [
    { href: '#about', label: t('about') },
    { href: '#services', label: t('services') },
    { href: '#cases', label: t('cases') },
    { href: '#faq', label: t('faq') },
    { href: '#contact', label: t('contact') },
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
          ? 'bg-background/75 border-b backdrop-blur-xl'
          : 'bg-background/0 border-transparent',
      )}
    >
      <div className="container-prose flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="bg-primary text-primary-foreground grid h-8 w-8 place-items-center rounded-lg">
            <Globe className="h-4 w-4" />
          </span>
          <span className="text-base font-semibold tracking-tight">GlobalBridge</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-muted-foreground hover:bg-accent hover:text-foreground rounded-md px-3 py-1.5 text-sm transition-colors"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-1 md:flex">
          <LanguageSwitcher />
          <ThemeToggle />
          <Button asChild size="sm" className="ml-1">
            <a href="#contact">{t('cta')}</a>
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
          <div className="container-prose flex flex-col py-3">
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
              <Button asChild size="sm" className="flex-1">
                <a href="#contact" onClick={() => setOpen(false)}>
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
