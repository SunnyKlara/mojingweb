'use client'
import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Loader2, Send, Undo2 } from 'lucide-react'
import { toast } from 'sonner'
import type { Order, PaymentEvent } from '@mojing/shared'
import { api, getAccessToken, setAccessToken } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

function cents(amount: number): string {
  return `$${(amount / 100).toFixed(2)}`
}

const STATUS_COLORS: Record<string, string> = {
  pending_payment: 'bg-amber-500/15 text-amber-700',
  paid: 'bg-blue-500/15 text-blue-700',
  shipped: 'bg-purple-500/15 text-purple-700',
  delivered: 'bg-emerald-500/15 text-emerald-700',
  cancelled: 'bg-red-500/15 text-red-700',
  refunded: 'bg-gray-500/15 text-gray-700',
}

export default function AdminOrderDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [order, setOrder] = useState<Order | null>(null)
  const [events, setEvents] = useState<PaymentEvent[]>([])
  const [loading, setLoading] = useState(true)

  // Ship form
  const [shipForm, setShipForm] = useState({ carrier: '', trackingNo: '', trackingUrl: '' })
  const [shipping, setShipping] = useState(false)

  // Refund
  const [refunding, setRefunding] = useState(false)

  const logout = useCallback(() => {
    setAccessToken(null)
    router.push('/admin/login')
  }, [router])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api<{ order: Order; events: PaymentEvent[] }>(`/api/admin/orders/${id}`, {
        auth: true,
      })
      setOrder(data.order)
      setEvents(data.events)
    } catch {
      logout()
    } finally {
      setLoading(false)
    }
  }, [id, logout])

  useEffect(() => {
    if (!getAccessToken()) {
      router.push('/admin/login')
      return
    }
    void load()
  }, [router, load])

  const handleShip = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!shipForm.carrier || !shipForm.trackingNo) return
    setShipping(true)
    try {
      const updated = await api<Order>(`/api/admin/orders/${id}/ship`, {
        method: 'PATCH',
        auth: true,
        body: JSON.stringify({
          carrier: shipForm.carrier,
          trackingNo: shipForm.trackingNo,
          trackingUrl: shipForm.trackingUrl || undefined,
        }),
      })
      setOrder(updated)
      toast.success('已标记发货')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '操作失败')
    } finally {
      setShipping(false)
    }
  }

  const handleRefund = async () => {
    if (!order || !confirm(`确认退款 ${cents(order.total)} 吗？`)) return
    setRefunding(true)
    try {
      const updated = await api<Order>(`/api/admin/orders/${id}/refund`, {
        method: 'PATCH',
        auth: true,
        body: JSON.stringify({ amount: order.total }),
      })
      setOrder(updated)
      toast.success('退款成功')
      void load() // reload events
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '退款失败')
    } finally {
      setRefunding(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">订单不存在</p>
      </div>
    )
  }

  return (
    <div className="bg-background text-foreground min-h-screen">
      <header className="border-b">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <Link
            href="/admin/orders"
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            返回订单列表
          </Link>
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-semibold">{order.orderNo}</span>
            <Badge className={cn('font-normal', STATUS_COLORS[order.status] ?? '')}>
              {order.status}
            </Badge>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-8">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Order info */}
          <div className="bg-card rounded-xl border p-5">
            <h2 className="mb-3 font-semibold">订单信息</h2>
            <div className="space-y-2 text-sm">
              <p>邮箱: {order.email}</p>
              <p>语言: {order.locale}</p>
              <p>
                创建时间:{' '}
                {order.createdAt ? new Date(order.createdAt).toLocaleString('zh-CN') : '-'}
              </p>
              {order.payment.paidAt && (
                <p>付款时间: {new Date(order.payment.paidAt).toLocaleString('zh-CN')}</p>
              )}
            </div>

            <h3 className="mb-2 mt-4 text-sm font-semibold">商品</h3>
            {order.items.map((item, i) => (
              <div key={i} className="flex justify-between py-1 text-sm">
                <span>
                  {item.name} × {item.quantity}
                </span>
                <span>{cents(item.price * item.quantity)}</span>
              </div>
            ))}
            <div className="mt-2 space-y-1 border-t pt-2 text-sm">
              <div className="flex justify-between">
                <span>小计</span>
                <span>{cents(order.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>运费</span>
                <span>{cents(order.shipping)}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>合计</span>
                <span>{cents(order.total)}</span>
              </div>
            </div>
          </div>

          {/* Shipping address */}
          <div className="bg-card rounded-xl border p-5">
            <h2 className="mb-3 font-semibold">收货地址</h2>
            <div className="space-y-1 text-sm">
              <p>{order.shippingAddress.fullName}</p>
              <p>{order.shippingAddress.line1}</p>
              {order.shippingAddress.line2 && <p>{order.shippingAddress.line2}</p>}
              <p>
                {order.shippingAddress.city}, {order.shippingAddress.state}{' '}
                {order.shippingAddress.postalCode}
              </p>
              <p>{order.shippingAddress.country}</p>
              {order.shippingAddress.phone && <p>电话: {order.shippingAddress.phone}</p>}
            </div>

            {/* Fulfillment info */}
            {order.fulfillment?.trackingNo && (
              <div className="mt-4 border-t pt-3">
                <h3 className="mb-2 text-sm font-semibold">物流信息</h3>
                <div className="space-y-1 text-sm">
                  <p>物流商: {order.fulfillment.carrier}</p>
                  <p>单号: {order.fulfillment.trackingNo}</p>
                  {order.fulfillment.shippedAt && (
                    <p>发货时间: {new Date(order.fulfillment.shippedAt).toLocaleString('zh-CN')}</p>
                  )}
                  {order.fulfillment.trackingUrl && (
                    <a
                      href={order.fulfillment.trackingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary text-xs hover:underline"
                    >
                      查看物流 →
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        {order.status === 'paid' && (
          <div className="bg-card mt-6 rounded-xl border p-5">
            <h2 className="mb-3 font-semibold">发货操作</h2>
            <form onSubmit={handleShip} className="grid gap-3 sm:grid-cols-3">
              <div className="grid gap-1.5">
                <Label htmlFor="carrier">物流商 *</Label>
                <Input
                  id="carrier"
                  required
                  placeholder="云途 / 4PX / DHL"
                  value={shipForm.carrier}
                  onChange={(e) => setShipForm((f) => ({ ...f, carrier: e.target.value }))}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="trackingNo">物流单号 *</Label>
                <Input
                  id="trackingNo"
                  required
                  placeholder="YT2026042900001"
                  value={shipForm.trackingNo}
                  onChange={(e) => setShipForm((f) => ({ ...f, trackingNo: e.target.value }))}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="trackingUrl">查询链接</Label>
                <Input
                  id="trackingUrl"
                  placeholder="https://..."
                  value={shipForm.trackingUrl}
                  onChange={(e) => setShipForm((f) => ({ ...f, trackingUrl: e.target.value }))}
                />
              </div>
              <div className="sm:col-span-3">
                <Button type="submit" disabled={shipping}>
                  {shipping ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  确认发货
                </Button>
              </div>
            </form>
          </div>
        )}

        {['paid', 'shipped', 'delivered'].includes(order.status) && (
          <div className="mt-4 flex justify-end">
            <Button variant="destructive" onClick={handleRefund} disabled={refunding}>
              {refunding ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Undo2 className="h-4 w-4" />
              )}
              退款 {cents(order.total)}
            </Button>
          </div>
        )}

        {/* Payment events timeline */}
        {events.length > 0 && (
          <div className="bg-card mt-6 rounded-xl border p-5">
            <h2 className="mb-3 font-semibold">支付事件</h2>
            <div className="space-y-2">
              {events.map((ev, i) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <Badge variant="outline" className="font-mono text-xs">
                    {ev.event}
                  </Badge>
                  <span className="text-muted-foreground">{cents(ev.amount)}</span>
                  <span className="text-muted-foreground text-xs">{ev.providerId}</span>
                  <span className="text-muted-foreground ml-auto text-xs">
                    {ev.createdAt ? new Date(ev.createdAt).toLocaleString('zh-CN') : ''}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
