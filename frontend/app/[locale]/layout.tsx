import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { notFound } from 'next/navigation'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server'
import { Toaster } from 'sonner'
import { ThemeProvider } from '@/components/theme-provider'
import { routing } from '@/i18n/routing'
import { cn } from '@/lib/utils'
import '../globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'meta' })
  return {
    title: {
      default: t('title'),
      template: t('titleTemplate'),
    },
    description: t('description'),
    openGraph: {
      type: 'website',
      locale: locale === 'zh' ? 'zh_CN' : 'en_US',
      siteName: t('siteName'),
      title: t('title'),
      description: t('description'),
    },
    twitter: { card: 'summary_large_image' },
    robots: { index: true, follow: true },
    alternates: {
      languages: {
        zh: '/zh',
        en: '/en',
        'x-default': '/',
      },
    },
  }
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0f1e' },
  ],
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) notFound()
  setRequestLocale(locale)
  const messages = await getMessages()

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={cn('bg-background min-h-screen font-sans antialiased', inter.variable)}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <Toaster richColors position="top-right" closeButton />
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
