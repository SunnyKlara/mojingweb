'use client'
import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { ExternalLink, Loader2, Package, Search } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { api } from '@/lib/api'

interface OrderLookupResult {
  orderNo: string
  status: string
  items: { name: string; sku: string; price: number; quantity: number; image: string }[]
  subtotal: number
  shipping: number
  total: number
  currency: string
  shippingCountry: string
  payment: { method: string; paidAt?: string }
  fulfillment?: {
    carrier?: string
    trackingNo?: string
    shippedAt?: string
    trackingUrl?: string
  }
  createdAt: string
}

const STATUS_COLORS: Record<string, string> = {
  pending_payment: 'bg-amber-500/15 text-amber-700',
  paid: 'bg-blue-500/15 text-blue-700',
  shipped: 'bg-purple-500/15 text-purple-700',
  delivered: 'bg-emerald-500/15 text-emerald-700',
  cancelled: 'bg-red-500/15 text-red-700',
  refunded: 'bg-gray-500/15 text-gray-700',
}

function cents(amount: number): string {
  return `$${(amount / 100).toFixed(2)}`
}

export default function OrderLookupPage() {
  const t = useTranslations('checkout')
  const [email, setEmail] = useState('')
  const [orderNo, setOrderNo] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<OrderLookupResult | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !orderNo) return
    setLoading(true)
    setResult(null)
    try {
      const data = await api<OrderLookupResult>(
        `/api/orders/lookup?email=${encodeURIComponent(email)}&orderNo=${encodeURIComponent(orderNo)}`,
      )
      setResult(data)
    } catch {
      toast.error(t('lookupNotFound'))
    } finally {
      setLoading(false)
    }
  }

  const statusKey =
    `status${(result?.status ?? '').replace(/_([a-z])/g, (_, c: string) => c.toUpperCase()).replace(/^./, (c) => c.toUpperCase())}` as keyof typeof t

  return (
    <div className="bg-background text-foreground min-h-screen">
      <div className="mx-auto max-w-lg px-4 py-12 sm:px-6">
        <div className="mb-8 text-center">
          <Package className="text-muted-foreground mx-auto mb-3 h-10 w-10" />
          <h1 className="text-2xl font-bold">{t('lookupTitle')}</h1>
          <p className="text-muted-foreground mt-2 text-sm">{t('lookupDescription')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-1.5">
            <Label htmlFor="lookup-email">{t('email')}</Label>
            <Input
              id="lookup-email"
              type="email"
              required
              placeholder={t('emailPlaceholder')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="lookup-order">{t('lookupOrderNo')}</Label>
            <Input
              id="lookup-order"
              required
              placeholder={t('lookupOrderNoPlaceholder')}
              value={orderNo}
              onChange={(e) => setOrderNo(e.target.value)}
            />
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            {t('lookupSubmit')}
          </Button>
        </form>

        {result && (
          <div className="bg-card mt-8 rounded-xl border p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <span className="font-mono text-sm font-semibold">{result.orderNo}</span>
              <Badge className={STATUS_COLORS[result.status] ?? ''}>{t(statusKey)}</Badge>
            </div>

            {result.items.map((item, i) => (
              <div key={i} className="flex items-center gap-3 py-2">
                <div className="flex-1">
                  <p className="text-sm font-medium">{item.name}</p>
                  <p className="text-muted-foreground text-xs">
                    {item.sku} · {t('qty')}: {item.quantity}
                  </p>
                </div>
                <span className="text-sm font-semibold">{cents(item.price * item.quantity)}</span>
              </div>
            ))}

            <div className="mt-3 space-y-1 border-t pt-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('subtotal')}</span>
                <span>{cents(result.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('shipping')}</span>
                <span>{cents(result.shipping)}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>{t('total')}</span>
                <span>{cents(result.total)}</span>
              </div>
            </div>

            {result.fulfillment?.trackingNo && (
              <div className="mt-4 rounded-lg border p-3">
                <p className="mb-2 text-sm font-semibold">{t('trackingInfo')}</p>
                <div className="text-muted-foreground space-y-1 text-xs">
                  {result.fulfillment.carrier && (
                    <p>
                      {t('carrier')}: {result.fulfillment.carrier}
                    </p>
                  )}
                  <p>
                    {t('trackingNo')}: {result.fulfillment.trackingNo}
                  </p>
                  {result.fulfillment.trackingUrl && (
                    <a
                      href={result.fulfillment.trackingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary mt-1 inline-flex items-center gap-1 text-xs hover:underline"
                    >
                      {t('trackOrder')} <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
