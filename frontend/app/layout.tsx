import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '企业官网',
  description: '专业企业服务',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh">
      <body className="bg-white text-gray-800">{children}</body>
    </html>
  )
}
