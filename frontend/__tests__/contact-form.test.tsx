import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'

/**
 * Contact form currently submits directly to Web3Forms (prototype carry-over,
 * see LAUNCH-SUMMARY.md §4). These tests assert that behavior.
 *
 * TODO(week2-backend-deploy): once the backend ships and `/api/leads` is live,
 * migrate the form to call the own API (see PROMPT §6 bullet 6) and update the
 * `.todo` assertion below to a real test.
 */

const fetchMock = vi.fn()
global.fetch = fetchMock as unknown as typeof fetch

// Mock sonner toasts — we just want to assert they were invoked.
const toastSuccess = vi.fn()
const toastError = vi.fn()
vi.mock('sonner', () => ({
  toast: { success: (m: string) => toastSuccess(m), error: (m: string) => toastError(m) },
}))

// next-intl t() mock — return the key so assertions can use it directly.
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => 'en',
}))

import { ContactForm } from '@/components/site/contact-form'

describe('<ContactForm />', () => {
  beforeEach(() => {
    fetchMock.mockReset()
    toastSuccess.mockReset()
    toastError.mockReset()
  })

  it('renders required fields', () => {
    render(<ContactForm />)
    expect(screen.getByLabelText(/name/i)).toBeRequired()
    expect(screen.getByLabelText(/email/i)).toBeRequired()
    expect(screen.getByLabelText(/message/i)).toBeRequired()
  })

  it('submits to Web3Forms and shows success toast', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, message: 'Email sent successfully!' }),
    })
    render(<ContactForm />)

    await userEvent.type(screen.getByLabelText(/name/i), 'Alice')
    await userEvent.type(screen.getByLabelText(/email/i), 'a@b.com')
    await userEvent.type(screen.getByLabelText(/message/i), 'Hello there')
    await userEvent.click(screen.getByRole('button', { name: /submit/i }))

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))
    const [url, options] = fetchMock.mock.calls[0] as [string, { method: string; body: string }]
    expect(url).toBe('https://api.web3forms.com/submit')
    expect(options.method).toBe('POST')
    const body = JSON.parse(options.body) as Record<string, string>
    expect(body).toMatchObject({ name: 'Alice', email: 'a@b.com', message: 'Hello there' })
    expect(body.access_key).toBeTruthy()
    await waitFor(() => expect(toastSuccess).toHaveBeenCalled())
  })

  it('shows error toast on Web3Forms failure', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ success: false, message: 'Invalid access key' }),
    })
    render(<ContactForm />)

    await userEvent.type(screen.getByLabelText(/name/i), 'Bob')
    await userEvent.type(screen.getByLabelText(/email/i), 'b@c.com')
    await userEvent.type(screen.getByLabelText(/message/i), 'x')
    await userEvent.click(screen.getByRole('button', { name: /submit/i }))

    await waitFor(() => expect(toastError).toHaveBeenCalledWith('Invalid access key'))
  })

  it.todo('week2: after /api/leads migration, submits to own backend instead of Web3Forms')
})
