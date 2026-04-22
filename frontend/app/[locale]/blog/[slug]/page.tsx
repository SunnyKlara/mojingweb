import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { ArrowLeft, CalendarDays, Clock, UserRound } from 'lucide-react'
import { Link } from '@/i18n/routing'
import { NavBar } from '@/components/site/navbar'
import { Footer } from '@/components/site/footer'
import { MDX } from '@/components/mdx'
import { getContent, listAllSlugs, type BlogPost } from '@/lib/content'
import { Badge } from '@/components/ui/badge'

export const dynamicParams = false

export async function generateStaticParams() {
  return listAllSlugs('blog')
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}): Promise<Metadata> {
  const { locale, slug } = await params
  const post = await getContent<BlogPost>('blog', locale, slug)
  if (!post) return {}
  return {
    title: post.title,
    description: post.description,
    openGraph: { title: post.title, description: post.description, type: 'article' },
  }
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params
  setRequestLocale(locale)
  const t = await getTranslations('blog')
  const post = await getContent<BlogPost>('blog', locale, slug)
  if (!post) notFound()
  const dateLocale = locale === 'zh' ? 'zh-CN' : 'en-US'

  return (
    <>
      <NavBar />
      <main className="container-prose py-16 sm:py-20">
        <Link
          href="/blog"
          className="text-muted-foreground hover:text-foreground mb-8 inline-flex items-center gap-1.5 text-sm"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {t('backToList')}
        </Link>

        <header className="mb-10 max-w-3xl">
          <div className="text-muted-foreground mb-4 flex flex-wrap items-center gap-3 text-xs">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5" />
              {new Date(post.date).toLocaleDateString(dateLocale, {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              {t('minRead', { min: post.readingMinutes })}
            </span>
            {post.author && (
              <span className="inline-flex items-center gap-1.5">
                <UserRound className="h-3.5 w-3.5" />
                {post.author}
              </span>
            )}
            {post.tags?.map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
          <h1 className="text-3xl font-semibold leading-tight tracking-tight sm:text-5xl">
            {post.title}
          </h1>
          {post.description && (
            <p className="text-muted-foreground mt-4 text-lg leading-relaxed">{post.description}</p>
          )}
        </header>

        <article className="prose prose-neutral dark:prose-invert prose-headings:tracking-tight prose-a:text-primary max-w-3xl">
          <MDX source={post.body} />
        </article>
      </main>
      <Footer />
    </>
  )
}
