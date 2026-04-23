interface JsonLdProps {
  locale: string
}

/**
 * Injects Organization + WebSite JSON-LD structured data.
 * Rendered server-side inside the page so crawlers pick it up immediately.
 */
export function JsonLd({ locale }: JsonLdProps) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://modelzone.com'

  const data = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${siteUrl}#organization`,
        name: 'ModelZone',
        url: siteUrl,
        logo: `${siteUrl}/logo.png`,
        description:
          'ModelZone designs desktop-scale wind tunnels that make aerodynamics visible for model car collectors, educators, and creators.',
        sameAs: [
          'https://www.instagram.com/modelzone',
          'https://www.youtube.com/@modelzone',
          'https://twitter.com/modelzone',
        ],
        contactPoint: [
          {
            '@type': 'ContactPoint',
            contactType: 'customer service',
            email: 'hello@modelzone.com',
            availableLanguage: ['en', 'zh-CN'],
          },
        ],
      },
      {
        '@type': 'WebSite',
        '@id': `${siteUrl}#website`,
        url: siteUrl,
        name: 'ModelZone',
        inLanguage: locale === 'zh' ? 'zh-CN' : 'en',
        publisher: { '@id': `${siteUrl}#organization` },
      },
      {
        '@type': 'Product',
        '@id': `${siteUrl}#windchaser-64`,
        name: 'Wind Chaser 64',
        description:
          'Desktop wind tunnel engineered for 1:64 scale model cars. Real airflow, transparent fog chamber, CE/FCC/RoHS certified.',
        brand: { '@id': `${siteUrl}#organization` },
        category: 'Desktop Wind Tunnel',
        image: `${siteUrl}/brand/0.png`,
      },
    ],
  }

  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
  )
}
