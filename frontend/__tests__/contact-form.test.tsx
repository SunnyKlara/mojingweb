import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the api module before importing the component.
const apiMock = vi.fn()
vi.mock('@/lib/api', () => ({
  api: (...args: unknown[]) => apiMock(...args),
  getAccessToken: () => null,
  setAccessToken: vi.fn(),
}))

// Mock sonner toasts — we just want to assert they were invoked.
const toastSuccess = vi.fn()
const toastError = vi.fn()
vi.mock('sonner', () => ({
  toast: { success: (m: string) => toastSuccess(m), error: (m: string) => toastError(m) },
}))

import { ContactForm } from '@/components/site/contact-form'

describe('<ContactForm />', () => {
  beforeEach(() => {
    apiMock.mockReset()
    toastSuccess.mockReset()
    toastError.mockReset()
  })

  it('renders required fields', () => {
    render(<ContactForm />)
    expect(screen.getByLabelText(/name/i)).toBeRequired()
    expect(screen.getByLabelText(/email/i)).toBeRequired()
    expect(screen.getByLabelText(/message/i)).toBeRequired()
  })

  it('submits payload and shows success toast', async () => {
    apiMock.mockResolvedValueOnce({ ok: true, id: 'abc' })
    render(<ContactForm />)

    await userEvent.type(screen.getByLabelText(/name/i), 'Alice')
    await userEvent.type(screen.getByLabelText(/email/i), 'a@b.com')
    await userEvent.type(screen.getByLabelText(/message/i), 'Hello there')
    await userEvent.click(screen.getByRole('button', { name: /submit/i }))

    await waitFor(() => expect(apiMock).toHaveBeenCalledTimes(1))
    const [url, options] = apiMock.mock.calls[0] as [string, { body: string }]
    expect(url).toBe('/api/leads')
    const body = JSON.parse(options.body) as Record<string, string>
    expect(body).toMatchObject({ name: 'Alice', email: 'a@b.com', message: 'Hello there' })
    expect(toastSuccess).toHaveBeenCalled()
  })

  it('shows error toast on failure', async () => {
    apiMock.mockRejectedValueOnce(new Error('boom'))
    render(<ContactForm />)

    await userEvent.type(screen.getByLabelText(/name/i), 'Bob')
    await userEvent.type(screen.getByLabelText(/email/i), 'b@c.com')
    await userEvent.type(screen.getByLabelText(/message/i), 'x')
    await userEvent.click(screen.getByRole('button', { name: /submit/i }))

    await waitFor(() => expect(toastError).toHaveBeenCalledWith('boom'))
  })
})
