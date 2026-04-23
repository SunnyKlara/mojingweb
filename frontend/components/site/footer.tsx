'use client'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/routing'
import { Logo } from '@/components/site/logo'

export function Footer() {
  const t = useTranslations('footer')

  const columns = [
    {
      title: t('columns.product'),
      links: [
        { label: t('links.windchaser'), href: '#buy' },
        { label: t('links.accessories'), href: '#buy' },
        { label: t('links.specs'), href: '#specs' },
      ],
    },
    {
      title: t('columns.learn'),
      links: [
        { label: t('links.gallery'), href: '/cases' },
        { label: t('links.journal'), href: '/blog' },
      ],
    },
    {
      title: t('columns.company'),
      links: [
        { label: t('links.about'), href: '#' },
        { label: t('links.wholesale'), href: '#contact' },
        { label: t('links.support'), href: '#contact' },
        { label: t('links.contact'), href: '#contact' },
      ],
    },
    {
      title: t('columns.legal'),
      links: [
        { label: t('links.privacy'), href: '#' },
        { label: t('links.terms'), href: '#' },
        { label: t('links.warranty'), href: '#' },
      ],
    },
  ]

  return (
    <footer className="bg-background border-t">
      <div className="container-wide py-16">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-6 md:gap-8">
          <div className="col-span-2">
            <Link href="/" aria-label="ModelZone home">
              <Logo />
            </Link>
            <p className="text-muted-foreground mt-4 max-w-xs text-sm">{t('tagline')}</p>
            <p className="text-muted-foreground mt-4 text-[11px] tracking-wide">{t('address')}</p>
          </div>
          {columns.map((col) => (
            <div key={col.title}>
              <h4 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.2em]">
                {col.title}
              </h4>
              <ul className="space-y-3 text-sm">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <a
                      href={l.href}
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="text-muted-foreground mt-14 flex flex-col items-start justify-between gap-2 border-t pt-6 text-[11px] sm:flex-row sm:items-center">
          <span>{t('copyright', { year: new Date().getFullYear() })}</span>
          <div className="flex items-center gap-4 font-mono tracking-wider opacity-70">
            <span>ModelZone · EST. 2024</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
