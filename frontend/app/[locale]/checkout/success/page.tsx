'use client'
import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useSearchParams } from 'next/navigation'
import { CheckCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import { Link } from '@/i18n/routing'

interface CaptureResult {
  orderNo: string
  status: string
  total: number
  currency: string
}

export default function CheckoutSuccessPage() {
  const t = useTranslations('checkout')
  const searchParams = useSearchParams()
  const [result, setResult] = useState<CaptureResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = searchParams.get('token')
    if (!token) {
      setError('Missing payment token')
      setLoading(false)
      return
    }

    let cancelled = false

    async function capturePayment() {
      try {
        // Try to capture the payment
        const data = await api<CaptureResult>('/api/orders/payments/paypal/capture', {
          method: 'POST',
          body: JSON.stringify({ paypalOrderId: token }),
        })
        if (!cancelled) setResult(data)
      } catch (err) {
        // If capture fails (e.g. already captured, page refresh), the order
        // might already be paid. The error is not critical — show a generic
        // success with the token as reference, or try to look up the order.
        const msg = err instanceof Error ? err.message : 'Capture failed'
        if (msg.includes('ALREADY_CAPTURED') || msg.includes('already')) {
          // Order was already captured on a previous load — treat as success
          if (!cancelled) {
            setResult({
              orderNo: '',
              status: 'paid',
              total: 0,
              currency: 'USD',
            })
          }
        } else {
          if (!cancelled) setError(msg)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void capturePayment()
    return () => {
      cancelled = true
    }
  }, [searchParams])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="text-center">
          <p className="text-destructive mb-4 text-lg font-semibold">{error}</p>
          <Button asChild>
            <Link href="/">{t('cancelCta')}</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="mx-auto max-w-md text-center">
        <CheckCircle className="mx-auto mb-4 h-16 w-16 text-emerald-500" />
        <h1 className="mb-2 text-2xl font-bold">{t('successTitle')}</h1>
        <p className="text-muted-foreground mb-6">
          {result?.orderNo
            ? t('successMessage', { orderNo: result.orderNo })
            : t('successMessage', { orderNo: '' }).replace('  ', ' ')}
        </p>

        {result?.orderNo && (
          <div className="bg-card mb-6 rounded-xl border p-4 text-left">
            <div className="flex justify-between py-1">
              <span className="text-muted-foreground text-sm">{t('successOrderNo')}</span>
              <span className="font-mono font-semibold">{result.orderNo}</span>
            </div>
            {result.total > 0 && (
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground text-sm">{t('successTotal')}</span>
                <span className="font-semibold">
                  ${(result.total / 100).toFixed(2)} {result.currency}
                </span>
              </div>
            )}
          </div>
        )}

        <Button asChild size="lg">
          <Link href="/">{t('successCta')}</Link>
        </Button>
      </div>
    </div>
  )
}
