import type { MetadataRoute } from 'next'
import { routing } from '@/i18n/routing'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://globalbridge.example.com'
  const now = new Date()

  return routing.locales.map((locale) => ({
    url: locale === routing.defaultLocale ? `${base}/` : `${base}/${locale}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: locale === routing.defaultLocale ? 1 : 0.8,
    alternates: {
      languages: Object.fromEntries(
        routing.locales.map((l) => [l, l === routing.defaultLocale ? `${base}/` : `${base}/${l}`]),
      ),
    },
  }))
}
