'use client'
import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2, Package, Search } from 'lucide-react'
import { type Order, type OrderStatus, ORDER_STATUSES } from '@mojing/shared'
import { api, getAccessToken, setAccessToken } from '@/lib/api'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const STATUS_VARIANT: Record<OrderStatus, string> = {
  pending_payment: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
  paid: 'bg-blue-500/15 text-blue-700 dark:text-blue-400',
  shipped: 'bg-purple-500/15 text-purple-700 dark:text-purple-400',
  delivered: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
  cancelled: 'bg-red-500/15 text-red-700 dark:text-red-400',
  refunded: 'bg-gray-500/15 text-gray-700 dark:text-gray-400',
}

function cents(amount: number): string {
  return `$${(amount / 100).toFixed(2)}`
}

export default function AdminOrdersPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all')

  const logout = useCallback(() => {
    setAccessToken(null)
    router.push('/admin/login')
  }, [router])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api<Order[]>('/api/admin/orders', { auth: true })
      setOrders(data)
    } catch {
      logout()
    } finally {
      setLoading(false)
    }
  }, [logout])

  useEffect(() => {
    if (!getAccessToken()) {
      router.push('/admin/login')
      return
    }
    void load()
  }, [router, load])

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return orders.filter((o) => {
      if (statusFilter !== 'all' && o.status !== statusFilter) return false
      if (!q) return true
      return (
        o.orderNo.toLowerCase().includes(q) ||
        o.email.toLowerCase().includes(q) ||
        o.items.some((i) => i.name.toLowerCase().includes(q))
      )
    })
  }, [orders, query, statusFilter])

  return (
    <div className="bg-background text-foreground min-h-screen">
      <header className="border-b">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link
            href="/admin"
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            返回客服后台
          </Link>
          <h1 className="text-lg font-semibold">订单管理</h1>
          <div className="text-muted-foreground text-xs">{orders.length} 条</div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative max-w-sm flex-1">
            <Search className="text-muted-foreground pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
            <Input
              placeholder="搜索订单号 / 邮箱…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setStatusFilter('all')}
              className={cn(
                'rounded-full border px-3 py-1 text-xs transition-colors',
                statusFilter === 'all' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent',
              )}
            >
              全部
            </button>
            {ORDER_STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={cn(
                  'rounded-full border px-3 py-1 text-xs transition-colors',
                  statusFilter === s ? 'bg-primary text-primary-foreground' : 'hover:bg-accent',
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-muted-foreground flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : visible.length === 0 ? (
          <div className="text-muted-foreground rounded-xl border border-dashed p-16 text-center text-sm">
            <Package className="mx-auto mb-2 h-8 w-8 opacity-40" />
            暂无订单
          </div>
        ) : (
          <ul className="grid gap-3">
            {visible.map((o) => (
              <li key={o.orderNo}>
                <Link
                  href={`/admin/orders/${String(o._id)}`}
                  className="bg-card block rounded-xl border p-5 shadow-sm transition-shadow hover:shadow"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-mono text-sm font-semibold">{o.orderNo}</p>
                        <Badge className={cn('font-normal', STATUS_VARIANT[o.status])}>
                          {o.status}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground mt-1 text-xs">
                        {o.email} · {o.shippingAddress.country} ·{' '}
                        {o.createdAt ? new Date(o.createdAt).toLocaleString('zh-CN') : ''}
                      </p>
                    </div>
                    <p className="text-lg font-bold">{cents(o.total)}</p>
                  </div>
                  <div className="text-muted-foreground mt-2 text-xs">
                    {o.items.map((i) => `${i.name} ×${i.quantity}`).join(', ')}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  )
}
