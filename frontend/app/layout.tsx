import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from 'sonner'
import { ThemeProvider } from '@/components/theme-provider'
import { cn } from '@/lib/utils'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'GlobalBridge — 连接全球市场，助力企业出海',
    template: '%s · GlobalBridge',
  },
  description: '专业的 B2B 全球化服务机构，为中国企业提供海外市场拓展、代理商合作与供应链整合。',
  keywords: ['企业出海', '海外市场', '代理商', '供应链', 'B2B', 'GlobalBridge'],
  authors: [{ name: 'GlobalBridge' }],
  openGraph: {
    type: 'website',
    locale: 'zh_CN',
    siteName: 'GlobalBridge',
    title: 'GlobalBridge — 连接全球市场',
    description: '专业的 B2B 全球化服务',
  },
  twitter: { card: 'summary_large_image' },
  robots: { index: true, follow: true },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0f1e' },
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className={cn('bg-background min-h-screen font-sans antialiased', inter.variable)}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster richColors position="top-right" closeButton />
        </ThemeProvider>
      </body>
    </html>
  )
}
