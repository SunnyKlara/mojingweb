'use client'

import * as Sentry from '@sentry/nextjs'
import NextError from 'next/error'
import { useEffect } from 'react'

/**
 * App Router global error boundary.
 * Renders when the root layout itself throws (otherwise per-locale error.tsx
 * handles it). We report the exception to Sentry before falling back to
 * Next's default error page.
 */
export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string }
}): JSX.Element {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html>
      <body>
        <NextError statusCode={0} />
      </body>
    </html>
  )
}
