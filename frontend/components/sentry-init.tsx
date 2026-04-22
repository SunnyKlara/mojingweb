'use client'
import { useEffect } from 'react'
import { initClientSentry } from '@/lib/sentry'

/** Zero-UI component — side-effect only: initializes Sentry on the client if configured. */
export function SentryInit() {
  useEffect(() => {
    initClientSentry()
  }, [])
  return null
}
