'use client'
import { useTranslations } from 'next-intl'
import { Globe } from 'lucide-react'
import { Link } from '@/i18n/routing'

export function Footer() {
  const t = useTranslations('footer')

  const columns = [
    {
      title: t('columns.product'),
      links: [
        { label: t('links.marketExpansion'), href: '#services' },
        { label: t('links.agents'), href: '#services' },
        { label: t('links.supplyChain'), href: '#services' },
      ],
    },
    {
      title: t('columns.company'),
      links: [
        { label: t('links.aboutUs'), href: '#about' },
        { label: t('links.cases'), href: '#cases' },
        { label: t('links.contactUs'), href: '#contact' },
      ],
    },
    {
      title: t('columns.resources'),
      links: [
        { label: t('links.blog'), href: '/blog' },
        { label: t('links.whitepapers'), href: '/resources' },
        { label: t('links.faq'), href: '#faq' },
      ],
    },
    {
      title: t('columns.legal'),
      links: [
        { label: t('links.privacy'), href: '/privacy' },
        { label: t('links.terms'), href: '/terms' },
      ],
    },
  ]

  return (
    <footer className="bg-muted/30 border-t">
      <div className="container-prose py-12">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-6">
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-2">
              <span className="bg-primary text-primary-foreground grid h-8 w-8 place-items-center rounded-lg">
                <Globe className="h-4 w-4" />
              </span>
              <span className="font-semibold">GlobalBridge</span>
            </Link>
            <p className="text-muted-foreground mt-3 max-w-xs text-sm">{t('tagline')}</p>
          </div>
          {columns.map((col) => (
            <div key={col.title}>
              <h4 className="mb-3 text-sm font-semibold">{col.title}</h4>
              <ul className="text-muted-foreground space-y-2 text-sm">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <a href={l.href} className="hover:text-foreground">
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="text-muted-foreground mt-10 flex flex-col items-start justify-between gap-2 border-t pt-6 text-xs sm:flex-row sm:items-center">
          <span>{t('copyright', { year: new Date().getFullYear() })}</span>
          <span>{t('madeWith')}</span>
        </div>
      </div>
    </footer>
  )
}
