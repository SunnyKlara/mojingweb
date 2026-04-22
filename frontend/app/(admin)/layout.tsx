import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from 'sonner'
import { ThemeProvider } from '@/components/theme-provider'
import { cn } from '@/lib/utils'
import '../globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Admin Console · GlobalBridge',
  robots: { index: false, follow: false },
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
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
