'use client'
import { useEffect } from 'react'
import { AlertTriangle, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { captureException } from '@/lib/sentry'

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    captureException(error)
  }, [error])

  return (
    <div className="relative grid min-h-screen place-items-center px-4">
      <div className="grid-bg radial-fade absolute inset-0 opacity-60" aria-hidden />
      <div className="relative max-w-md text-center">
        <div className="bg-destructive/15 text-destructive mx-auto grid h-12 w-12 place-items-center rounded-full">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight">Something went wrong</h1>
        <p className="text-muted-foreground mt-3 text-sm">
          {error.message || 'An unexpected error occurred.'}
        </p>
        {error.digest && (
          <p className="text-muted-foreground mt-1 font-mono text-[11px]">ref: {error.digest}</p>
        )}
        <div className="mt-8 flex items-center justify-center gap-3">
          <Button onClick={reset}>
            <RotateCcw />
            Try again
          </Button>
          <Button variant="outline" asChild>
            <a href="/">Go home</a>
          </Button>
        </div>
      </div>
    </div>
  )
}
