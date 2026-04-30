'use client'
import { useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { Loader2, Lock, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { api } from '@/lib/api'
import type { CreateOrderResponse } from '@mojing/shared'

const COUNTRIES = [
  { code: 'US', name: 'United States' },
  { code: 'CA', name: 'Canada' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'IT', name: 'Italy' },
  { code: 'ES', name: 'Spain' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'JP', name: 'Japan' },
  { code: 'KR', name: 'South Korea' },
  { code: 'AU', name: 'Australia' },
  { code: 'NZ', name: 'New Zealand' },
  { code: 'SG', name: 'Singapore' },
]

// Shipping rates in cents — must match backend/src/config/shipping.ts
const SHIPPING_RATES: Record<string, number> = {
  US: 4500,
  CA: 5000,
  GB: 5500,
  DE: 5500,
  FR: 5500,
  IT: 5500,
  ES: 5500,
  NL: 5500,
  JP: 4000,
  KR: 4000,
  AU: 6000,
  NZ: 6500,
  SG: 3500,
  DEFAULT: 6500,
}

function cents(amount: number): string {
  return `$${(amount / 100).toFixed(2)}`
}

interface AddressForm {
  fullName: string
  email: string
  line1: string
  line2: string
  city: string
  state: string
  postalCode: string
  country: string
  phone: string
}

const initialAddress: AddressForm = {
  fullName: '',
  email: '',
  line1: '',
  line2: '',
  city: '',
  state: '',
  postalCode: '',
  country: '',
  phone: '',
}

export default function CheckoutPage() {
  const t = useTranslations('checkout')
  const locale = useLocale()
  const searchParams = useSearchParams()

  const sku = searchParams.get('sku') || 'WC64-BLK'
  const quantity = Math.min(10, Math.max(1, Number(searchParams.get('qty')) || 1))

  // Hardcoded for V1 single product — will be fetched from API in V2
  const product = {
    name: locale === 'zh' ? '追风者 64' : 'Wind Chaser 64',
    variantName:
      sku === 'WC64-WHT'
        ? locale === 'zh'
          ? '皓月白'
          : 'Lunar White'
        : locale === 'zh'
          ? '曜石黑'
          : 'Obsidian Black',
    price: 29900,
    image: sku === 'WC64-WHT' ? '/brand/product-white.jpg' : '/brand/product-black.jpg',
  }

  const [address, setAddress] = useState<AddressForm>(initialAddress)
  const [loading, setLoading] = useState(false)

  const update =
    (key: keyof AddressForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setAddress((prev) => ({ ...prev, [key]: e.target.value }))
    }

  const subtotal = product.price * quantity
  const shippingRate = SHIPPING_RATES[address.country] ?? SHIPPING_RATES['DEFAULT']!
  const shipping = address.country ? shippingRate : 0
  const total = subtotal + shipping

  const canSubmit =
    address.fullName &&
    address.email &&
    address.line1 &&
    address.city &&
    address.state &&
    address.postalCode &&
    address.country &&
    !loading

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    setLoading(true)
    try {
      const res = await api<CreateOrderResponse>('/api/orders', {
        method: 'POST',
        body: JSON.stringify({
          email: address.email,
          locale,
          items: [{ sku, quantity }],
          shippingAddress: {
            fullName: address.fullName,
            line1: address.line1,
            line2: address.line2 || undefined,
            city: address.city,
            state: address.state,
            postalCode: address.postalCode,
            country: address.country,
            phone: address.phone || undefined,
          },
        }),
      })
      // Redirect to PayPal
      window.location.href = res.approveUrl
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Checkout failed')
      setLoading(false)
    }
  }

  return (
    <div className="bg-background text-foreground min-h-screen">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="mb-8 text-2xl font-bold">{t('title')}</h1>

        <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-[1fr_380px]">
          {/* Left: Shipping form */}
          <div className="space-y-6">
            <div>
              <h2 className="mb-4 text-lg font-semibold">{t('shippingInfo')}</h2>
              <div className="grid gap-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-1.5">
                    <Label htmlFor="fullName">{t('fullName')} *</Label>
                    <Input
                      id="fullName"
                      required
                      autoComplete="name"
                      placeholder={t('fullNamePlaceholder')}
                      value={address.fullName}
                      onChange={update('fullName')}
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="email">{t('email')} *</Label>
                    <Input
                      id="email"
                      type="email"
                      required
                      autoComplete="email"
                      placeholder={t('emailPlaceholder')}
                      value={address.email}
                      onChange={update('email')}
                    />
                    <p className="text-muted-foreground text-xs">{t('emailHint')}</p>
                  </div>
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="line1">{t('address')} *</Label>
                  <Input
                    id="line1"
                    required
                    autoComplete="address-line1"
                    placeholder={t('addressPlaceholder')}
                    value={address.line1}
                    onChange={update('line1')}
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="line2">{t('addressLine2')}</Label>
                  <Input
                    id="line2"
                    autoComplete="address-line2"
                    value={address.line2}
                    onChange={update('line2')}
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-1.5">
                    <Label htmlFor="city">{t('city')} *</Label>
                    <Input
                      id="city"
                      required
                      autoComplete="address-level2"
                      placeholder={t('cityPlaceholder')}
                      value={address.city}
                      onChange={update('city')}
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="state">{t('state')} *</Label>
                    <Input
                      id="state"
                      required
                      autoComplete="address-level1"
                      placeholder={t('statePlaceholder')}
                      value={address.state}
                      onChange={update('state')}
                    />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="grid gap-1.5">
                    <Label htmlFor="postalCode">{t('postalCode')} *</Label>
                    <Input
                      id="postalCode"
                      required
                      autoComplete="postal-code"
                      placeholder={t('postalCodePlaceholder')}
                      value={address.postalCode}
                      onChange={update('postalCode')}
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="country">{t('country')} *</Label>
                    <select
                      id="country"
                      required
                      value={address.country}
                      onChange={update('country')}
                      autoComplete="country"
                      className="bg-background border-input flex h-10 w-full rounded-md border px-3 py-2 text-sm"
                    >
                      <option value="">{t('selectCountry')}</option>
                      {COUNTRIES.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="phone">{t('phone')}</Label>
                    <Input
                      id="phone"
                      autoComplete="tel"
                      placeholder={t('phonePlaceholder')}
                      value={address.phone}
                      onChange={update('phone')}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Order summary */}
          <div className="lg:sticky lg:top-8 lg:self-start">
            <div className="bg-card rounded-xl border p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold">{t('orderSummary')}</h2>
              <div className="flex gap-4">
                <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-black">
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{product.name}</p>
                  <p className="text-muted-foreground text-sm">{product.variantName}</p>
                  <p className="text-muted-foreground text-sm">
                    {t('qty')}: {quantity}
                  </p>
                </div>
                <p className="font-semibold">{cents(product.price * quantity)}</p>
              </div>

              <div className="mt-6 space-y-2 border-t pt-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('subtotal')}</span>
                  <span>{cents(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('shipping')}</span>
                  <span>{address.country ? cents(shipping) : '—'}</span>
                </div>
                <div className="flex justify-between border-t pt-2 text-base font-bold">
                  <span>{t('total')}</span>
                  <span>{address.country ? cents(total) : '—'}</span>
                </div>
              </div>

              <Button type="submit" size="lg" disabled={!canSubmit} className="mt-6 w-full">
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> {t('processing')}
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4" /> {t('payWithPaypal')}{' '}
                    {address.country ? `— ${cents(total)}` : ''}
                  </>
                )}
              </Button>

              <p className="text-muted-foreground mt-3 flex items-center justify-center gap-1.5 text-xs">
                <ShieldCheck className="h-3.5 w-3.5" />
                {t('secureCheckout')}
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
