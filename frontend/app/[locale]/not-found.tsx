import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="relative grid min-h-screen place-items-center px-4">
      <div className="grid-bg radial-fade absolute inset-0 opacity-60" aria-hidden />
      <div className="relative text-center">
        <p className="text-primary text-[96px] font-bold leading-none tracking-tight sm:text-[128px]">
          404
        </p>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl">
          Page not found / 页面不存在
        </h1>
        <p className="text-muted-foreground mt-3">
          The page you are looking for doesn&apos;t exist or has been moved.
        </p>
        <Button asChild className="mt-8">
          <Link href="/">
            <ArrowLeft />
            Go home
          </Link>
        </Button>
      </div>
    </div>
  )
}
