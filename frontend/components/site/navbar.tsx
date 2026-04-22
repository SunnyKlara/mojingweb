'use client'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Menu, X, Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import { cn } from '@/lib/utils'

const links = [
  { href: '#about', label: '关于我们' },
  { href: '#services', label: '服务' },
  { href: '#cases', label: '案例' },
  { href: '#faq', label: 'FAQ' },
  { href: '#contact', label: '联系' },
]

export function NavBar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

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
            <Link
              key={l.href}
              href={l.href}
              className="text-muted-foreground hover:bg-accent hover:text-foreground rounded-md px-3 py-1.5 text-sm transition-colors"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <ThemeToggle />
          <Button asChild size="sm">
            <Link href="#contact">免费咨询</Link>
          </Button>
        </div>

        <button
          className="rounded-md p-2 md:hidden"
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="bg-background border-t md:hidden">
          <div className="container-prose flex flex-col py-3">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="text-muted-foreground hover:bg-accent hover:text-foreground rounded-md px-3 py-2 text-sm"
              >
                {l.label}
              </Link>
            ))}
            <div className="mt-2 flex items-center gap-2 border-t pt-3">
              <ThemeToggle />
              <Button asChild size="sm" className="flex-1">
                <Link href="#contact" onClick={() => setOpen(false)}>
                  免费咨询
                </Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
