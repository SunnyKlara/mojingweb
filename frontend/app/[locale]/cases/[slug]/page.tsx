import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { ArrowLeft } from 'lucide-react'
import { Link } from '@/i18n/routing'
import { NavBar } from '@/components/site/navbar'
import { Footer } from '@/components/site/footer'
import { MDX } from '@/components/mdx'
import { getContent, listAllSlugs, type CaseStudy } from '@/lib/content'
import { Badge } from '@/components/ui/badge'

export const dynamicParams = false

export async function generateStaticParams() {
  return listAllSlugs('cases')
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}): Promise<Metadata> {
  const { locale, slug } = await params
  const item = await getContent<CaseStudy>('cases', locale, slug)
  if (!item) return {}
  return {
    title: item.title,
    description: item.summary,
    openGraph: { title: item.title, description: item.summary, type: 'article' },
  }
}

export default async function CasePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params
  setRequestLocale(locale)
  const t = await getTranslations('casesPage')
  const item = await getContent<CaseStudy>('cases', locale, slug)
  if (!item) notFound()

  return (
    <>
      <NavBar />
      <main className="container-prose py-16 sm:py-20">
        <Link
          href="/cases"
          className="text-muted-foreground hover:text-foreground mb-8 inline-flex items-center gap-1.5 text-sm"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {t('backToList')}
        </Link>

        <header className="mb-10 max-w-3xl">
          <div className="mb-4 flex flex-wrap gap-2">
            {item.industry && <Badge variant="secondary">{item.industry}</Badge>}
            {item.region && <Badge variant="outline">{item.region}</Badge>}
          </div>
          <h1 className="text-3xl font-semibold leading-tight tracking-tight sm:text-5xl">
            {item.title}
          </h1>
          {item.summary && (
            <p className="text-muted-foreground mt-4 text-lg leading-relaxed">{item.summary}</p>
          )}
          <dl className="bg-card mt-6 grid grid-cols-1 gap-3 rounded-xl border p-4 text-sm sm:grid-cols-3">
            {item.client && (
              <div>
                <dt className="text-muted-foreground text-xs uppercase tracking-wider">
                  {t('client')}
                </dt>
                <dd className="mt-1 font-medium">{item.client}</dd>
              </div>
            )}
            {item.industry && (
              <div>
                <dt className="text-muted-foreground text-xs uppercase tracking-wider">
                  {t('industry')}
                </dt>
                <dd className="mt-1 font-medium">{item.industry}</dd>
              </div>
            )}
            {item.region && (
              <div>
                <dt className="text-muted-foreground text-xs uppercase tracking-wider">
                  {t('region')}
                </dt>
                <dd className="mt-1 font-medium">{item.region}</dd>
              </div>
            )}
          </dl>
        </header>

        <article className="prose prose-neutral dark:prose-invert prose-headings:tracking-tight prose-a:text-primary max-w-3xl">
          <MDX source={item.body} />
        </article>
      </main>
      <Footer />
    </>
  )
}
