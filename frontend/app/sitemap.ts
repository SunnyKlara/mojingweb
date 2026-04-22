import type { MetadataRoute } from 'next'
import { routing } from '@/i18n/routing'
import { listContent, type BlogPost, type CaseStudy } from '@/lib/content'

function localized(base: string, locale: string, path: string): string {
  const prefix = locale === routing.defaultLocale ? '' : `/${locale}`
  return `${base}${prefix}${path}`
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://globalbridge.example.com'
  const now = new Date()
  const entries: MetadataRoute.Sitemap = []

  for (const locale of routing.locales) {
    // Home, blog list, cases list
    for (const p of ['/', '/blog', '/cases']) {
      entries.push({
        url: localized(base, locale, p === '/' ? '' : p),
        lastModified: now,
        changeFrequency: 'weekly',
        priority: p === '/' ? 1 : 0.7,
      })
    }
    // Content entries
    const posts = await listContent<BlogPost>('blog', locale)
    for (const p of posts) {
      entries.push({
        url: localized(base, locale, `/blog/${p.slug}`),
        lastModified: new Date(p.date),
        changeFrequency: 'monthly',
        priority: 0.6,
      })
    }
    const cases = await listContent<CaseStudy>('cases', locale)
    for (const c of cases) {
      entries.push({
        url: localized(base, locale, `/cases/${c.slug}`),
        lastModified: new Date(c.date),
        changeFrequency: 'monthly',
        priority: 0.6,
      })
    }
  }

  return entries
}
