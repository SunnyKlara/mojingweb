interface JsonLdProps {
  locale: string
}

/**
 * Injects Organization + WebSite JSON-LD structured data.
 * Rendered server-side inside the page so crawlers pick it up immediately.
 */
export function JsonLd({ locale }: JsonLdProps) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://globalbridge.example.com'

  const data = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${siteUrl}#organization`,
        name: 'GlobalBridge',
        url: siteUrl,
        logo: `${siteUrl}/logo.png`,
        sameAs: [
          'https://www.linkedin.com/company/globalbridge',
          'https://twitter.com/globalbridge',
        ],
        contactPoint: [
          {
            '@type': 'ContactPoint',
            contactType: 'customer service',
            email: 'contact@globalbridge.example.com',
            availableLanguage: ['zh-CN', 'en'],
          },
        ],
      },
      {
        '@type': 'WebSite',
        '@id': `${siteUrl}#website`,
        url: siteUrl,
        name: 'GlobalBridge',
        inLanguage: locale === 'zh' ? 'zh-CN' : 'en',
        publisher: { '@id': `${siteUrl}#organization` },
      },
    ],
  }

  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
  )
}
