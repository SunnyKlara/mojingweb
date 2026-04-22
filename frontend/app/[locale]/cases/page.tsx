import { getTranslations, setRequestLocale } from 'next-intl/server'
import { ArrowRight } from 'lucide-react'
import { Link } from '@/i18n/routing'
import { NavBar } from '@/components/site/navbar'
import { Footer } from '@/components/site/footer'
import { listContent, type CaseStudy } from '@/lib/content'
import { Badge } from '@/components/ui/badge'

export default async function CasesListPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('casesPage')
  const cases = await listContent<CaseStudy>('cases', locale)

  return (
    <>
      <NavBar />
      <main className="container-prose py-16 sm:py-24">
        <header className="mb-14 max-w-2xl">
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">{t('title')}</h1>
          <p className="text-muted-foreground mt-4 text-base sm:text-lg">{t('subtitle')}</p>
        </header>

        <div className="grid gap-4 sm:grid-cols-2">
          {cases.map((c) => (
            <Link
              key={c.slug}
              href={`/cases/${c.slug}`}
              className="bg-card hover:border-primary/40 group flex flex-col gap-4 rounded-2xl border p-6 transition-all hover:shadow-md"
            >
              <div className="flex flex-wrap gap-2">
                {c.industry && <Badge variant="secondary">{c.industry}</Badge>}
                {c.region && <Badge variant="outline">{c.region}</Badge>}
              </div>
              <h2 className="group-hover:text-primary text-xl font-semibold transition-colors">
                {c.title}
              </h2>
              {c.summary && <p className="text-muted-foreground leading-relaxed">{c.summary}</p>}
              <span className="text-primary mt-auto inline-flex items-center gap-1 text-sm">
                {t('viewCase')}
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          ))}
        </div>
      </main>
      <Footer />
    </>
  )
}
