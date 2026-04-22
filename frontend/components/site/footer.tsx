import Link from 'next/link'
import { Globe } from 'lucide-react'

const columns = [
  {
    title: '产品',
    links: [
      { label: '海外拓展', href: '#services' },
      { label: '代理商合作', href: '#services' },
      { label: '供应链整合', href: '#services' },
    ],
  },
  {
    title: '公司',
    links: [
      { label: '关于我们', href: '#about' },
      { label: '案例', href: '#cases' },
      { label: '联系我们', href: '#contact' },
    ],
  },
  {
    title: '资源',
    links: [
      { label: '博客', href: '/blog' },
      { label: '白皮书', href: '/resources' },
      { label: 'FAQ', href: '#faq' },
    ],
  },
  {
    title: '法律',
    links: [
      { label: '隐私政策', href: '/privacy' },
      { label: '服务条款', href: '/terms' },
    ],
  },
]

export function Footer() {
  return (
    <footer className="bg-muted/30 border-t">
      <div className="container-prose py-12">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-6">
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-2">
              <span className="bg-primary text-primary-foreground grid h-8 w-8 place-items-center rounded-lg">
                <Globe className="h-4 w-4" />
              </span>
              <span className="font-semibold">GlobalBridge</span>
            </Link>
            <p className="text-muted-foreground mt-3 max-w-xs text-sm">
              专业的 B2B 全球化服务，连接中国企业与世界市场。
            </p>
          </div>
          {columns.map((col) => (
            <div key={col.title}>
              <h4 className="mb-3 text-sm font-semibold">{col.title}</h4>
              <ul className="text-muted-foreground space-y-2 text-sm">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} className="hover:text-foreground">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="text-muted-foreground mt-10 flex flex-col items-start justify-between gap-2 border-t pt-6 text-xs sm:flex-row sm:items-center">
          <span>© {new Date().getFullYear()} GlobalBridge. All rights reserved.</span>
          <span>Made with care for B2B builders.</span>
        </div>
      </div>
    </footer>
  )
}
