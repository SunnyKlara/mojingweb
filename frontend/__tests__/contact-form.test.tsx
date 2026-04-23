import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'

/**
 * Contact form posts primary to `${BACKEND_URL}/api/leads` and only falls back
 * to Web3Forms on 5xx / network / timeout (see `ADR-0011` consequences and
 * `components/site/contact-form.tsx` for the full rule set).
 *
 * Tests mock `global.fetch` with per-call decisions routed by URL.
 */

const fetchMock = vi.fn()
global.fetch = fetchMock as unknown as typeof fetch

const toastSuccess = vi.fn()
const toastError = vi.fn()
vi.mock('sonner', () => ({
  toast: { success: (m: string) => toastSuccess(m), error: (m: string) => toastError(m) },
}))

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => 'en',
}))

// Capture Sentry fallback warnings without depending on the full SDK.
const sentryCaptureMessage = vi.fn()
vi.mock('@sentry/nextjs', () => ({
  captureMessage: (...args: unknown[]) => sentryCaptureMessage(...args),
}))

import { ContactForm } from '@/components/site/contact-form'

async function fillAndSubmit(): Promise<void> {
  await userEvent.type(screen.getByLabelText(/name/i), 'Alice')
  await userEvent.type(screen.getByLabelText(/email/i), 'a@b.com')
  await userEvent.type(screen.getByLabelText(/message/i), 'Hello there')
  await userEvent.click(screen.getByRole('button', { name: /submit/i }))
}

function jsonResponse(
  status: number,
  body: unknown,
): { ok: boolean; status: number; json: () => Promise<unknown> } {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  }
}

describe('<ContactForm />', () => {
  beforeEach(() => {
    fetchMock.mockReset()
    toastSuccess.mockReset()
    toastError.mockReset()
    sentryCaptureMessage.mockReset()
  })

  it('renders required fields', () => {
    render(<ContactForm />)
    expect(screen.getByLabelText(/name/i)).toBeRequired()
    expect(screen.getByLabelText(/email/i)).toBeRequired()
    expect(screen.getByLabelText(/message/i)).toBeRequired()
  })

  it('submits to /api/leads and shows success (no Web3Forms call)', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(201, { ok: true, id: 'xyz' }))
    render(<ContactForm />)
    await fillAndSubmit()

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))
    const [url, options] = fetchMock.mock.calls[0] as [string, { method: string; body: string }]
    expect(url).toMatch(/\/api\/leads$/)
    expect(options.method).toBe('POST')
    const body = JSON.parse(options.body) as Record<string, unknown>
    expect(body).toMatchObject({
      name: 'Alice',
      email: 'a@b.com',
      message: 'Hello there',
      locale: 'en',
    })
    await waitFor(() => expect(toastSuccess).toHaveBeenCalled())
    expect(toastError).not.toHaveBeenCalled()
    // No fallback to Web3Forms — exactly one fetch.
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('does NOT fall back to Web3Forms on 4xx (user-facing error)', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(429, { error: 'Too many submissions, please try again later' }),
    )
    render(<ContactForm />)
    await fillAndSubmit()

    await waitFor(() => expect(toastError).toHaveBeenCalled())
    // Critical: only the primary was hit. No Web3Forms fallback for user errors.
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(sentryCaptureMessage).not.toHaveBeenCalled()
  })

  it('falls back to Web3Forms on 5xx and reports the fallback to Sentry', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(502, { error: 'Bad gateway' })) // primary
      .mockResolvedValueOnce(jsonResponse(200, { success: true, message: 'Email sent' })) // fallback
    render(<ContactForm />)
    await fillAndSubmit()

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))
    const [firstUrl] = fetchMock.mock.calls[0] as [string]
    const [secondUrl] = fetchMock.mock.calls[1] as [string]
    expect(firstUrl).toMatch(/\/api\/leads$/)
    expect(secondUrl).toBe('https://api.web3forms.com/submit')
    await waitFor(() => expect(toastSuccess).toHaveBeenCalled())
    expect(sentryCaptureMessage).toHaveBeenCalledTimes(1)
    const [msg, ctx] = sentryCaptureMessage.mock.calls[0] as [string, { level: string }]
    expect(msg).toMatch(/primary backend failed/i)
    expect(ctx.level).toBe('warning')
  })

  it('falls back on network error (fetch rejection)', async () => {
    fetchMock
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValueOnce(jsonResponse(200, { success: true }))
    render(<ContactForm />)
    await fillAndSubmit()

    await waitFor(() => expect(toastSuccess).toHaveBeenCalled())
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(sentryCaptureMessage).toHaveBeenCalled()
  })

  it('shows error when both primary and Web3Forms fail', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(503, { error: 'Down' })) // primary
      .mockResolvedValueOnce(jsonResponse(500, { success: false, message: 'Web3Forms down' }))
    render(<ContactForm />)
    await fillAndSubmit()

    await waitFor(() => expect(toastError).toHaveBeenCalledWith('Web3Forms down'))
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })
})
