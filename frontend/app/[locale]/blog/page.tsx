import { getTranslations, setRequestLocale } from 'next-intl/server'
import { CalendarDays, Clock } from 'lucide-react'
import { Link } from '@/i18n/routing'
import { NavBar } from '@/components/site/navbar'
import { Footer } from '@/components/site/footer'
import { listContent, type BlogPost } from '@/lib/content'
import { Badge } from '@/components/ui/badge'

export default async function BlogListPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('blog')
  const posts = await listContent<BlogPost>('blog', locale)
  const dateLocale = locale === 'zh' ? 'zh-CN' : 'en-US'

  return (
    <>
      <NavBar />
      <main className="container-prose py-16 sm:py-24">
        <header className="mb-14 max-w-2xl">
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">{t('title')}</h1>
          <p className="text-muted-foreground mt-4 text-base sm:text-lg">{t('subtitle')}</p>
        </header>

        <div className="grid gap-4">
          {posts.map((p) => (
            <Link
              key={p.slug}
              href={`/blog/${p.slug}`}
              className="bg-card hover:border-primary/40 group rounded-2xl border p-6 transition-all hover:shadow-md"
            >
              <div className="text-muted-foreground flex flex-wrap items-center gap-3 text-xs">
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {new Date(p.date).toLocaleDateString(dateLocale, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  {t('minRead', { min: p.readingMinutes })}
                </span>
                {p.tags?.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
              <h2 className="group-hover:text-primary mt-3 text-xl font-semibold transition-colors sm:text-2xl">
                {p.title}
              </h2>
              {p.description && (
                <p className="text-muted-foreground mt-2 leading-relaxed">{p.description}</p>
              )}
            </Link>
          ))}
        </div>
      </main>
      <Footer />
    </>
  )
}
