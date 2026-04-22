import fs from 'node:fs/promises'
import path from 'node:path'
import matter from 'gray-matter'
import readingTime from 'reading-time'

export type ContentType = 'blog' | 'cases'

export interface BaseContent {
  slug: string
  locale: string
  type: ContentType
  title: string
  description?: string
  summary?: string
  date: string
  cover?: string
  tags?: string[]
  readingMinutes: number
  body: string
}

export interface BlogPost extends BaseContent {
  type: 'blog'
  author?: string
}

export interface CaseStudy extends BaseContent {
  type: 'cases'
  client?: string
  industry?: string
  region?: string
}

const CONTENT_ROOT = path.join(process.cwd(), 'content')

async function safeReadDir(dir: string): Promise<string[]> {
  try {
    return await fs.readdir(dir)
  } catch {
    return []
  }
}

async function loadFile<T extends BaseContent>(
  type: ContentType,
  locale: string,
  filename: string,
): Promise<T | null> {
  if (!filename.endsWith('.mdx')) return null
  const slug = filename.replace(/\.mdx$/, '')
  const filepath = path.join(CONTENT_ROOT, type, locale, filename)
  const raw = await fs.readFile(filepath, 'utf8')
  const { data, content } = matter(raw)
  const stats = readingTime(content)

  return {
    slug,
    locale,
    type,
    title: String(data.title ?? slug),
    description: data.description,
    summary: data.summary,
    date: data.date ? new Date(data.date).toISOString() : new Date().toISOString(),
    cover: data.cover,
    tags: data.tags,
    readingMinutes: Math.max(1, Math.ceil(stats.minutes)),
    body: content,
    ...data,
  } as unknown as T
}

/** List all entries of a given type & locale, newest first. */
export async function listContent<T extends BaseContent>(
  type: ContentType,
  locale: string,
): Promise<T[]> {
  const dir = path.join(CONTENT_ROOT, type, locale)
  const files = await safeReadDir(dir)
  const entries = await Promise.all(files.map((f) => loadFile<T>(type, locale, f)))
  const nonNull: T[] = entries.filter((e): e is Awaited<T> => e !== null) as T[]
  return nonNull.sort((a, b) => (a.date < b.date ? 1 : -1))
}

export async function getContent<T extends BaseContent>(
  type: ContentType,
  locale: string,
  slug: string,
): Promise<T | null> {
  return loadFile<T>(type, locale, `${slug}.mdx`)
}

/** Return all slugs for a type across all locales — used for generateStaticParams. */
export async function listAllSlugs(type: ContentType): Promise<{ locale: string; slug: string }[]> {
  const locales = await safeReadDir(path.join(CONTENT_ROOT, type))
  const all = await Promise.all(
    locales.map(async (locale) => {
      const files = await safeReadDir(path.join(CONTENT_ROOT, type, locale))
      return files
        .filter((f) => f.endsWith('.mdx'))
        .map((f) => ({ locale, slug: f.replace(/\.mdx$/, '') }))
    }),
  )
  return all.flat()
}
