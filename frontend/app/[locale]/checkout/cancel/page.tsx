import { useTranslations } from 'next-intl'
import { setRequestLocale } from 'next-intl/server'
import { XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Link } from '@/i18n/routing'

export default async function CheckoutCancelPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  return <CancelContent />
}

function CancelContent() {
  const t = useTranslations('checkout')
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="mx-auto max-w-md text-center">
        <XCircle className="text-muted-foreground mx-auto mb-4 h-16 w-16" />
        <h1 className="mb-2 text-2xl font-bold">{t('cancelTitle')}</h1>
        <p className="text-muted-foreground mb-6">{t('cancelMessage')}</p>
        <Button asChild size="lg">
          <Link href="/#buy">{t('cancelCta')}</Link>
        </Button>
      </div>
    </div>
  )
}
